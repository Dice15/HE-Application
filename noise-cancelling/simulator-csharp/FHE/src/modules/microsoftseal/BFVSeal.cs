using Microsoft.Research.SEAL;


namespace FHE.src.modules.microsoftseal
{
    /// <summary>
    /// BFV 암호화 체계를 사용하여 짧은 정수(short) 데이터를 암호화 및 복호화하는 클래스입니다.
    /// 이 클래스는 다수의 암호 연산 메서드들을 오버라이드하며, Microsoft SEAL 라이브러리를 사용합니다.
    /// </summary>
    internal class BFVSeal : AbstractSeal<short>
    {
        private readonly BatchEncoder encoder;


        /// <summary>
        /// 기본 생성자입니다. SEAL 컨텍스트를 초기화하고, 공개 및 비밀 키를 생성합니다.
        /// </summary>
        public BFVSeal() : base(
            context: CeateContext(out SEALContext sealContext, out int maxMultiplyCount),
            publicKey: CreateKeys(sealContext, out PublicKey publicKey, out SecretKey secretKey),
            secretKey: secretKey,
            maxMultiplyCount: maxMultiplyCount)
        {
            encoder = new BatchEncoder(context);
        }


        /// <summary>
        /// 클라우드 환경을 위한 생성자입니다. 기존 SEAL 컨텍스트와 공개 키를 받아 초기화합니다.
        /// </summary>
        /// <param name="context">기존 SEAL 컨텍스트입니다.</param>
        /// <param name="publicKey">사용할 공개 키입니다.</param>
        public BFVSeal(SEALContext context, PublicKey publicKey, int maxMultiplyCount) : base(context, publicKey, null, maxMultiplyCount)
        {
            encoder = new BatchEncoder(context);
        }


        /// <summary>
        /// SEAL 컨텍스트를 초기화합니다. BFV 암호화 체계에 필요한 매개변수를 설정합니다.
        /// </summary>
        /// <returns>초기화된 SEALContext 객체입니다.</returns>
        private static SEALContext CeateContext(out SEALContext sealContext, out int maxMultiplyCount)
        {
            EncryptionParameters parms = new EncryptionParameters(SchemeType.BFV);
            maxMultiplyCount = int.MaxValue;
            parms.PolyModulusDegree = 1 << 15; // 32768
            parms.CoeffModulus = CoeffModulus.BFVDefault(parms.PolyModulusDegree);
            parms.PlainModulus = new Modulus((2 * parms.PolyModulusDegree) + 1);
            return sealContext = new SEALContext(parms);
        }


        /// <summary>
        /// 공개 키와 비밀 키를 생성합니다.
        /// </summary>
        /// <param name="secretKey">생성된 비밀 키가 반환됩니다.</param>
        /// <returns>생성된 공개 키입니다.</returns>
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
        /// <param name="value">암호화할 값입니다. 이 값은 short 타입입니다.</param>
        /// <returns>암호화된 결과를 나타내는 Ciphertext 객체입니다.</returns>
        public override Ciphertext Encrypt(short value)
        {
            Plaintext plain = new Plaintext();
            encoder.Encode(new long[] { Convert.ToInt64(value) }, plain);
            Ciphertext encrypted = new Ciphertext();
            encryptor.Encrypt(plain, encrypted);
            return encrypted;
        }


        /// <summary>
        /// 암호화된 값을 복호화합니다.
        /// </summary>
        /// <param name="encrypted">복호화할 암호화된 데이터입니다.</param>
        /// <returns>복호화된 short 값입니다.</returns>
        public override short Decrypt(Ciphertext encrypted)
        {
            if (decryptor == null) { throw new InvalidOperationException("Decryptor is not initialized."); }

            Plaintext plain = new Plaintext();
            decryptor.Decrypt(encrypted, plain);

            List<long> decodedValues = new List<long>();
            encoder.Decode(plain, decodedValues);

            return (short)decodedValues[0];
        }


        /// <summary>
        /// 두 암호화된 값을 더합니다.
        /// </summary>
        /// <param name="encrypted1">첫 번째 암호화된 값입니다.</param>
        /// <param name="encrypted2">두 번째 암호화된 값입니다.</param>
        /// <returns>더하기 연산 결과를 나타내는 Ciphertext 객체입니다.</returns>
        public override Ciphertext Sum(Ciphertext encrypted1, Ciphertext encrypted2)
        {
            Ciphertext result = new Ciphertext();
            evaluator.Add(encrypted1, encrypted2, result);
            return result;
        }


        /// <summary>
        /// 암호화된 값에 평문 값을 더합니다.
        /// </summary>
        /// <param name="encrypted">암호화된 값입니다.</param>
        /// <param name="value">더할 평문 값입니다.</param>
        /// <returns>더하기 연산 결과를 나타내는 Ciphertext 객체입니다.</returns>
        public override Ciphertext Sum(Ciphertext encrypted, short value)
        {
            Plaintext plain = new Plaintext();
            encoder.Encode(new long[] { Convert.ToInt64(value) }, plain);
            Ciphertext result = new Ciphertext();
            evaluator.AddPlain(encrypted, plain, result);
            return result;
        }


        /// <summary>
        /// 두 암호화된 값을 곱합니다.
        /// </summary>
        /// <param name="encrypted1">첫 번째 암호화된 값입니다.</param>
        /// <param name="encrypted2">두 번째 암호화된 값입니다.</param>
        /// <returns>곱셈 연산 결과를 나타내는 Ciphertext 객체입니다.</returns>
        public override Ciphertext Multiply(Ciphertext encrypted1, Ciphertext encrypted2)
        {
            Ciphertext result = new Ciphertext();
            evaluator.Multiply(encrypted1, encrypted2, result);
            return result;
        }


        /// <summary>
        /// 암호화된 값에 평문 값을 곱합니다.
        /// </summary>
        /// <param name="encrypted">암호화된 값입니다.</param>
        /// <param name="value">곱할 평문 값입니다.</param>
        /// <returns>곱셈 연산 결과를 나타내는 Ciphertext 객체입니다.</returns>
        public override Ciphertext Multiply(Ciphertext encrypted, short value)
        {
            Plaintext plain = new Plaintext();
            encoder.Encode(new long[] { Convert.ToInt64(value) }, plain);
            Ciphertext result = new Ciphertext();
            evaluator.MultiplyPlain(encrypted, plain, result);
            return result;
        }


        public override Ciphertext Power(Ciphertext encrypted, int n)
        {
            Ciphertext result = encrypted;
            for (int i = 0; i < n; i++)
            {
                evaluator.Multiply(result, encrypted, result);
            }
            return result;
        }


        /// <summary>
        /// 암호화된 값의 부호를 반전합니다.
        /// </summary>
        /// <param name="encrypted">부호를 반전할 암호화된 값입니다.</param>
        /// <returns>부호가 반전된 결과를 나타내는 Ciphertext 객체입니다.</returns>
        public override Ciphertext Negate(Ciphertext encrypted)
        {
            Ciphertext result = new Ciphertext();
            evaluator.Negate(encrypted, result);
            return result;
        }
    }
}