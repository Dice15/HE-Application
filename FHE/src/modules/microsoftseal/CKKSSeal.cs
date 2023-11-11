using Microsoft.Research.SEAL;
using System.Numerics;

namespace FHE.src.modules.microsoftseal
{
    /// <summary>
    /// CKKSSeal 클래스는 CKKS(Cheon-Kim-Kim-Song) 암호화 스키마를 사용하여 실수 및 복소수 데이터를
    /// 암호화 및 복호화합니다. 이 클래스는 또한 실수 및 복소수 리스트에 대한 암호화와 복호화를 지원합니다.
    /// </summary>
    /// <typeparam name="T">암호화하거나 복호화할 데이터의 타입입니다.</typeparam>
    internal class CKKSSeal<T> : AbstractSeal<T>
    {
        private readonly CKKSEncoder encoder;


        /// <summary>
        /// 기본 생성자는 CKKS(Cheon-Kim-Kim-Song) 암호화 스키마를 초기화합니다.
        /// 이 생성자는 클라이언트 측에서 사용되며, 새로운 키와 SEALContext를 생성합니다.
        /// 지원되는 데이터 타입은 double, Complex, List<double>, List<Complex>입니다.
        /// 이 생성자는 암호화 및 복호화에 필요한 모든 구성 요소를 초기화합니다.
        /// </summary>
        public CKKSSeal() : base(
            InitializeContext(),
            InitializePublicKey(out SecretKey secretKey),
            secretKey)
        {
            ValidateType(); // 지원되는 타입 확인
            encoder = new CKKSEncoder(context); // 인코더 생성
        }


        /// <summary>
        /// 이 생성자는 클라우드 환경에서 사용됩니다.
        /// 클라이언트로부터 받은 PublicKey와 SEALContext를 사용하여 인스턴스를 초기화합니다.
        /// </summary>
        /// <param name="context">사용할 SEALContext입니다.</param>
        /// <param name="publicKey">사용할 PublicKey입니다.</param>
        public CKKSSeal(SEALContext context, PublicKey publicKey) : base(context, publicKey, null)
        {
            ValidateType(); // 지원되는 타입 확인
            encoder = new CKKSEncoder(context); // 인코더 생성
        }


        /// <summary>
        /// ValidateType 메서드는 CKKSSeal 클래스가 지원하는 타입을 확인합니다.
        /// 지원되지 않는 타입이 사용될 경우 예외를 발생시킵니다.
        /// </summary>
        private static void ValidateType()
        {
            if (!(typeof(T) == typeof(double)
                || typeof(T) == typeof(Complex)
                || typeof(T) == typeof(List<double>)
                || typeof(T) == typeof(List<Complex>)))
            {
                throw new ArgumentException("CKKSSeal supports only double, Complex, List<double>, and List<Complex> types.");
            }
        }


        /// <summary>
        /// InitializeContext 메서드는 CKKS 암호화 스키마에 사용될 SEALContext를 초기화합니다.
        /// 이 메서드는 암호화 매개변수를 설정하고, SEALContext 객체를 생성하여 반환합니다.
        /// </summary>
        /// <returns>초기화된 SEALContext 객체입니다.</returns>
        private static SEALContext InitializeContext()
        {
            EncryptionParameters parms = new EncryptionParameters(SchemeType.CKKS);
            parms.PolyModulusDegree = 8192;
            parms.CoeffModulus = CoeffModulus.Create(8192, new int[] { 60, 40, 60 });
            return new SEALContext(parms);
        }


        /// <summary>
        /// InitializePublicKey 메서드는 암호화에 사용될 공개 키와 비밀 키를 생성합니다.
        /// 이 메서드는 SEALContext를 사용하여 KeyGenerator를 초기화하고, 공개 키와 비밀 키를 생성합니다.
        /// 생성된 공개 키는 반환되며, 비밀 키는 out 매개변수를 통해 반환됩니다.
        /// </summary>
        /// <param name="secretKey">생성된 비밀 키입니다. (out 매개변수)</param>
        /// <returns>생성된 공개 키입니다.</returns>
        private static PublicKey InitializePublicKey(out SecretKey secretKey)
        {
            SEALContext context = InitializeContext();
            KeyGenerator keyGen = new KeyGenerator(context);
            secretKey = keyGen.SecretKey;
            PublicKey publicKey = new PublicKey();
            keyGen.CreatePublicKey(out publicKey);
            return publicKey;
        }


        /// <summary>
        /// Encrypt 메서드는 주어진 값을 암호화합니다.
        /// 지원되는 타입에 따라 암호화 방식이 달라집니다.
        /// </summary>
        /// <param name="value">암호화할 값입니다.</param>
        /// <returns>암호화된 데이터를 나타내는 Ciphertext 객체입니다.</returns>
        public override Ciphertext Encrypt(T value)
        {
            Plaintext plain = new Plaintext();
            switch (value)
            {
                case double doubleValue:
                    encoder.Encode(doubleValue, context.FirstParmsId, scale: Math.Pow(2.0, 40), destination: plain);
                    break;
                case Complex complexValue:
                    encoder.Encode(complexValue, context.FirstParmsId, scale: Math.Pow(2.0, 40), destination: plain);
                    break;
                case List<double> doubleListValue:
                    encoder.Encode(doubleListValue, context.FirstParmsId, scale: Math.Pow(2.0, 40), destination: plain);
                    break;
                case List<Complex> complexListValue:
                    encoder.Encode(complexListValue, context.FirstParmsId, scale: Math.Pow(2.0, 40), destination: plain);
                    break;
                default:
                    throw new ArgumentException("Unsupported type for encryption");
            }
            Ciphertext encrypted = new Ciphertext();
            encryptor.Encrypt(plain, encrypted);
            return encrypted;
        }


        /// <summary>
        /// Decrypt 메서드는 주어진 암호화된 데이터를 복호화합니다.
        /// 복호화된 데이터의 타입은 제네릭 타입 T에 의해 결정됩니다.
        /// </summary>
        /// <param name="encrypted">복호화할 암호화된 데이터입니다.</param>
        /// <returns>복호화된 데이터입니다.</returns>
        public override T Decrypt(Ciphertext encrypted)
        {
            if (decryptor == null)
            {
                throw new InvalidOperationException("Decryptor is not initialized.");
            }

            Plaintext plain = new Plaintext();
            decryptor.Decrypt(encrypted, plain);

            switch (typeof(T))
            {
                case Type t when t == typeof(double):
                    List<double> doubleResult = new List<double>();
                    encoder.Decode(plain, doubleResult);
                    return (T)(object)doubleResult[0];

                case Type t when t == typeof(Complex):
                    List<Complex> complexResult = new List<Complex>();
                    encoder.Decode(plain, complexResult);
                    return (T)(object)complexResult[0];

                case Type t when t == typeof(List<double>):
                    List<double> doubleListResult = new List<double>();
                    encoder.Decode(plain, doubleListResult);
                    return (T)(object)doubleListResult;

                case Type t when t == typeof(List<Complex>):
                    List<Complex> complexListResult = new List<Complex>();
                    encoder.Decode(plain, complexListResult);
                    return (T)(object)complexListResult;

                default:
                    throw new ArgumentException("Unsupported type for decryption");
            }
        }
    }
}