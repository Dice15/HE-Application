using Microsoft.Research.SEAL;


namespace FHE.src.modules.microsoftseal
{
    /// <summary>
    /// BFVSeal 클래스는 BFV(Brakerski/Fan-Vercauteren) 암호화 스키마를 사용하여
    /// 정수 및 정수 리스트를 암호화 및 복호화합니다. 이 클래스는 정수 연산을
    /// 암호화된 상태에서 수행할 수 있게 합니다.
    /// </summary>
    /// <typeparam name="T">암호화하거나 복호화할 데이터의 타입입니다.</typeparam>
    internal class BFVSeal<T> : AbstractSeal<T>
    {
        private readonly BatchEncoder encoder;


        /// <summary>
        /// 기본 생성자는 BFV(Brakerski/Fan-Vercauteren) 암호화 스키마를 초기화합니다.
        /// 이 생성자는 클라이언트 측에서 사용되며, 새로운 키와 SEALContext를 생성합니다.
        /// 지원되는 데이터 타입은 sbyte, byte, short, List<sbyte>, List<byte>, List<short>입니다.
        /// 이 생성자는 암호화 및 복호화에 필요한 모든 구성 요소를 초기화합니다.
        /// </summary>
        public BFVSeal() : base(
            InitializeContext(),
            InitializePublicKey(out SecretKey secretKey),
            secretKey)
        {
            ValidateType();
            encoder = new BatchEncoder(context);
        }


        /// <summary>
        /// 클라우드용 생성자는 외부에서 제공받은 SEALContext와 PublicKey를 사용하여
        /// 인스턴스를 초기화합니다. 이 생성자는 클라우드 환경에서 사용됩니다.
        /// </summary>
        /// <param name="context">사용할 SEALContext 객체입니다.</param>
        /// <param name="publicKey">암호화에 사용할 PublicKey 객체입니다.</param>
        public BFVSeal(SEALContext context, PublicKey publicKey) : base(context, publicKey, null)
        {
            ValidateType();
            encoder = new BatchEncoder(context);
        }


        /// <summary>
        /// ValidateType 메서드는 클래스가 지원하는 타입을 확인합니다.
        /// 지원되지 않는 타입이 사용될 경우 예외를 발생시킵니다.
        /// </summary>
        private static void ValidateType()
        {
            if (!(typeof(T) == typeof(sbyte)
                || typeof(T) == typeof(byte)
                || typeof(T) == typeof(short)
                || typeof(T) == typeof(List<sbyte>)
                || typeof(T) == typeof(List<byte>)
                || typeof(T) == typeof(List<short>)))
            {
                throw new ArgumentException("BFVSeal supports only sbyte, byte, short, List<sbyte>, List<byte>,and List<short> types.");
            }
        }


        /// <summary>
        /// InitializeContext 메서드는 BFV 암호화 스키마에 사용될 SEALContext를 초기화합니다.
        /// 이 메서드는 암호화 매개변수를 설정하고, SEALContext 객체를 생성하여 반환합니다.
        /// </summary>
        /// <returns>초기화된 SEALContext 객체입니다.</returns>
        private static SEALContext InitializeContext()
        {
            EncryptionParameters parms = new EncryptionParameters(SchemeType.BFV);
            parms.PolyModulusDegree = 1 << 15; // 32768
            parms.CoeffModulus = CoeffModulus.BFVDefault(parms.PolyModulusDegree);
            parms.PlainModulus = new Modulus((2 * parms.PolyModulusDegree) + 1);
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
                case List<sbyte> sbyteListValue:
                    encoder.Encode(sbyteListValue.Select(x => (long)x), plain);
                    break;
                case List<byte> byteListValue:
                    encoder.Encode(byteListValue.Select(x => (long)x), plain);
                    break;
                case List<short> shortListValue:
                    encoder.Encode(shortListValue.Select(x => (long)x), plain);
                    break;
                default:
                    encoder.Encode(new long[] { Convert.ToInt64(value) }, plain);
                    break;
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

            List<long> decodedValues = new List<long>();
            encoder.Decode(plain, decodedValues);

            switch (typeof(T))
            {
                case Type t when t == typeof(List<sbyte>):
                    return (T)(object)(decodedValues.Select(x => (sbyte)x).ToList());
                case Type t when t == typeof(List<byte>):
                    return (T)(object)(decodedValues.Select(x => (byte)x).ToList());
                case Type t when t == typeof(List<short>):
                    return (T)(object)(decodedValues.Select(x => (short)x).ToList());
                default:
                    return (T)Convert.ChangeType(decodedValues[0], typeof(T));
            }
        }
    }
}