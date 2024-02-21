using Microsoft.Research.SEAL;
using System.Numerics;


namespace FHE.src.modules.microsoftseal
{
    /// <summary>
    /// CKKS 암호화 스키마를 사용하여 다양한 암호화 연산을 수행하는 클래스입니다.
    /// </summary>
    /// <typeparam name="T">암호화 및 복호화될 데이터의 타입 (double 또는 Complex).</typeparam>
    internal class CKKSSeal<T> : AbstractSeal<T>
    {
        private readonly CKKSEncoder encoder;
        private readonly double encoderScale;


        /// <summary>
        /// 기본 생성자. 새로운 키를 생성하고 SEAL 컨텍스트를 초기화합니다.
        /// </summary>
        public CKKSSeal() : base(
              context: CeateContext(out SEALContext sealContext, out int maxMultiplyCount, out double scale),
              publicKey: CreateKeys(sealContext, out PublicKey publicKey, out SecretKey secretKey),
              secretKey: secretKey,
              maxMultiplyCount: maxMultiplyCount)
        {
            encoder = new CKKSEncoder(context);
            encoderScale = scale;
        }


        /// <summary>
        /// 클라우드 전용 생성자. 기존 SEAL 컨텍스트와 공개 키를 사용하여 인스턴스를 초기화합니다.
        /// </summary>
        /// <param name="context">SEALContext 객체입니다.</param>
        /// <param name="publicKey">공개 키 객체입니다.</param>
        /// <param name="maxMultiplyCount">최대 곱셈 횟수입니다.</param>
        public CKKSSeal(SEALContext context, PublicKey publicKey, int maxMultiplyCount, double scale) : base(context, publicKey, null, maxMultiplyCount)
        {
            encoder = new CKKSEncoder(context);
            encoderScale = scale;
        }


        /// <summary>
        /// CKKS 스키마를 위한 SEAL 컨텍스트를 생성합니다.
        /// </summary>
        /// <param name="sealContext">생성된 SEAL 컨텍스트가 반환됩니다.</param>
        /// <param name="maxMultiplyCount">최대 곱셈 연산 횟수가 반환됩니다.</param>
        /// <param name="scale">CKKS 스키마의 스케일 값이 반환됩니다.</param>
        /// <returns>초기화된 SEALContext 객체입니다.</returns>
        private static SEALContext CeateContext(out SEALContext sealContext, out int maxMultiplyCount, out double scale)
        {
            EncryptionParameters parms = new EncryptionParameters(SchemeType.CKKS);
            InitializeCoeffModulusAndScale(parms.PolyModulusDegree = 1 << 14, 23, out List<int> coeffModulusBits, out scale);
            maxMultiplyCount = coeffModulusBits.Count - 2;
            parms.CoeffModulus = CoeffModulus.Create(parms.PolyModulusDegree, coeffModulusBits);
            return sealContext = new SEALContext(parms);
        }


        /// <summary>
        /// CKKS 스키마에 필요한 계수 모듈러스 및 스케일을 초기화합니다.
        /// </summary>
        /// <param name="polyModulusDegree">다항식 모듈러스의 정도입니다.</param>
        /// <param name="precision">사용할 정밀도입니다.</param>
        /// <param name="coeffModulusBits">계수 모듈러스 비트가 저장될 리스트입니다.</param>
        /// <param name="scale">스케일 값입니다.</param>
        private static void InitializeCoeffModulusAndScale(ulong polyModulusDegree, int precision, out List<int> coeffModulusBits, out double scale)
        {
            int maxBitCount = CoeffModulus.MaxBitCount(polyModulusDegree, SecLevelType.TC128);
            int middleBitCount = maxBitCount / precision;
            coeffModulusBits = Enumerable.Repeat(precision, middleBitCount).ToList();
            scale = Math.Pow(2.0, precision);
        }


        /// <summary>
        /// 공개 키 및 비밀 키를 생성합니다.
        /// </summary>
        /// <param name="sealContext">사용할 SEAL 컨텍스트입니다.</param>
        /// <param name="publicKey">생성된 공개 키가 반환됩니다.</param>
        /// <param name="secretKey">생성된 비밀 키가 반환됩니다.</param>
        /// <returns>생성된 공개 키 객체입니다.</returns>
        private static PublicKey CreateKeys(SEALContext sealContext, out PublicKey publicKey, out SecretKey secretKey)
        {
            KeyGenerator keyGen = new KeyGenerator(sealContext);
            keyGen.CreatePublicKey(out publicKey);
            secretKey = keyGen.SecretKey;
            return publicKey;
        }


        /// <summary>
        /// 주어진 값을 암호화합니다.
        /// </summary>
        /// <param name="value">암호화할 값입니다.</param>
        /// <returns>암호화된 데이터를 나타내는 Ciphertext 객체입니다.</returns>
        public override Ciphertext Encrypt(T value)
        {
            Plaintext plain = new Plaintext();
            switch (value)
            {
                case double doubleValue:
                    encoder.Encode(doubleValue, context.FirstParmsId, encoderScale, plain);
                    break;
                case Complex complexValue:
                    encoder.Encode(complexValue, context.FirstParmsId, encoderScale, plain);
                    break;
                default:
                    throw new InvalidOperationException("Unsupported type for encryption.");
            }

            Ciphertext encrypted = new Ciphertext();
            encryptor.Encrypt(plain, encrypted);
            return encrypted;
        }


        /// <summary>
        /// 암호화된 데이터를 복호화합니다.
        /// </summary>
        /// <param name="encrypted">복호화할 암호문입니다.</param>
        /// <returns>복호화된 데이터입니다.</returns>
        public override T Decrypt(Ciphertext encrypted)
        {
            if (decryptor == null) throw new InvalidOperationException("Decryptor is not initialized.");
            Plaintext plain = new Plaintext();
            decryptor.Decrypt(encrypted, plain);

            switch (typeof(T))
            {
                case Type when typeof(T) == typeof(double):
                    List<double> doubleResult = new List<double>();
                    encoder.Decode(plain, doubleResult);
                    return (T)(object)doubleResult[0];

                case Type when typeof(T) == typeof(Complex):
                    List<Complex> complexResult = new List<Complex>();
                    encoder.Decode(plain, complexResult);
                    return (T)(object)complexResult[0];

                default:
                    throw new InvalidOperationException("Unsupported type for decryption.");
            }
        }


        /// <summary>
        /// 두 암호문을 곱합니다.
        /// </summary>
        /// <param name="encrypted1">첫 번째 암호문입니다.</param>
        /// <param name="encrypted2">두 번째 암호문입니다.</param>
        /// <returns>곱셈 연산 결과를 나타내는 암호문입니다.</returns>
        public override Ciphertext Multiply(Ciphertext encrypted1, Ciphertext encrypted2)
        {
            Ciphertext result = new Ciphertext();
            evaluator.Multiply(encrypted1, encrypted2, result);
            return result;
        }


        /// <summary>
        /// 암호화된 데이터와 평문 값을 곱합니다.
        /// </summary>
        /// <param name="encrypted">암호화된 데이터입니다.</param>
        /// <param name="value">곱할 평문 값입니다.</param>
        /// <returns>곱셈 연산 결과를 나타내는 암호문입니다.</returns>
        public override Ciphertext Multiply(Ciphertext encrypted, T value)
        {
            Plaintext plainValue = new Plaintext();
            switch (value)
            {
                case double doubleValue:
                    encoder.Encode(doubleValue, encrypted.ParmsId, encrypted.Scale, plainValue);
                    break;
                case Complex complexValue:
                    encoder.Encode(complexValue, encrypted.ParmsId, encrypted.Scale, plainValue);
                    break;
                default:
                    throw new InvalidOperationException("Unsupported type for encryption.");
            }

            Ciphertext result = new Ciphertext();
            evaluator.MultiplyPlain(encrypted, plainValue, result);
            return result;
        }

        public override Ciphertext Power(Ciphertext encrypted, int n)
        {
            Ciphertext result = encrypted;
            for (int i = 0; i < n - 1; i++) result = Multiply(result, encrypted);
            return result;
        }


        /// <summary>
        /// 두 암호문을 더합니다.
        /// </summary>
        /// <param name="encrypted1">첫 번째 암호문입니다.</param>
        /// <param name="encrypted2">두 번째 암호문입니다.</param>
        /// <returns>덧셈 연산 결과를 나타내는 암호문입니다.</returns>
        public override Ciphertext Sum(Ciphertext encrypted1, Ciphertext encrypted2)
        {
            Ciphertext result = new Ciphertext();
            evaluator.Add(encrypted1, encrypted2, result);
            return result;
        }


        /// <summary>
        /// 암호화된 데이터와 평문 값을 더합니다.
        /// </summary>
        /// <param name="encrypted">암호화된 데이터입니다.</param>
        /// <param name="value">더할 평문 값입니다.</param>
        /// <returns>덧셈 연산 결과를 나타내는 암호문입니다.</returns>
        public override Ciphertext Sum(Ciphertext encrypted, T value)
        {
            Plaintext plainValue = new Plaintext();
            switch (value)
            {
                case double doubleValue:
                    encoder.Encode(doubleValue, encrypted.ParmsId, encrypted.Scale, plainValue);
                    break;
                case Complex complexValue:
                    encoder.Encode(complexValue, encrypted.ParmsId, encrypted.Scale, plainValue);
                    break;
                default:
                    throw new InvalidOperationException("Unsupported type for encryption.");
            }

            Ciphertext result = new Ciphertext();
            evaluator.AddPlain(encrypted, plainValue, result);
            return result;
        }


        /// <summary>
        /// 암호화된 데이터의 부호를 반전합니다.
        /// </summary>
        /// <param name="encrypted">부호를 반전할 암호문입니다.</param>
        /// <returns>부호가 반전된 암호문입니다.</returns>
        public override Ciphertext Negate(Ciphertext encrypted)
        {
            Ciphertext result = new Ciphertext();
            evaluator.Negate(encrypted, result);
            return result;
        }

        public double GetScale() => encoderScale;
    }
}