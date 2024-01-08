using Microsoft.Research.SEAL;


namespace FHE.src.modules.microsoftseal
{
    /// <summary>
    /// Microsoft SEAL 라이브러리를 사용하여 암호화 작업을 추상화하는 기본 클래스입니다.
    /// 이 클래스는 다양한 유형의 데이터에 대한 암호화 및 복호화, 그리고 암호문 연산을 수행합니다.
    /// </summary>
    /// <typeparam name="T">암호화 및 복호화될 데이터의 유형입니다.</typeparam>
    internal abstract class AbstractSeal<T>
    {
        protected readonly SEALContext context;
        protected readonly Encryptor encryptor;
        protected readonly Evaluator evaluator;
        protected readonly Decryptor? decryptor;
        protected readonly PublicKey publicKey; // 공개 키
        protected readonly SecretKey? secretKey; // 비밀 키
        private readonly int maxMultiplyCount;


        /// <summary>
        /// AbstractSeal 클래스의 생성자입니다.
        /// </summary>
        /// <param name="context">SEAL 컨텍스트입니다.</param>
        /// <param name="publicKey">사용할 공개 키입니다.</param>
        /// <param name="secretKey">사용할 비밀 키입니다. 비밀 키가 없는 경우 null이 될 수 있습니다.</param>
        /// <param name="maxMultiplyCount">최대 곱셈 횟수입니다.</param>
        protected AbstractSeal(SEALContext context, PublicKey publicKey, SecretKey? secretKey, int maxMultiplyCount)
        {
            this.context = context;
            this.publicKey = publicKey;
            this.secretKey = secretKey;
            this.encryptor = new Encryptor(context, publicKey);
            this.evaluator = new Evaluator(context);
            this.decryptor = secretKey != null ? new Decryptor(context, secretKey) : null;
            this.maxMultiplyCount = maxMultiplyCount;
        }


        /// <summary>
        /// 주어진 값을 암호화합니다.
        /// </summary>
        /// <param name="value">암호화할 값입니다.</param>
        /// <returns>암호화된 데이터를 나타내는 Ciphertext 객체입니다.</returns>
        public abstract Ciphertext Encrypt(T value);


        /// <summary>
        /// 암호화된 데이터를 복호화합니다.
        /// </summary>
        /// <param name="encrypted">복호화할 암호문입니다.</param>
        /// <returns>복호화된 데이터입니다.</returns>
        public abstract T Decrypt(Ciphertext encrypted);


        /// <summary>
        /// 두 암호문을 더합니다.
        /// </summary>
        /// <param name="encrypted1">첫 번째 암호문입니다.</param>
        /// <param name="encrypted2">두 번째 암호문입니다.</param>
        /// <returns>덧셈 연산 결과를 나타내는 암호문입니다.</returns>
        public abstract Ciphertext Sum(Ciphertext encrypted1, Ciphertext encrypted2);


        /// <summary>
        /// 암호화된 데이터와 평문 값을 더합니다.
        /// </summary>
        /// <param name="encrypted">암호화된 데이터입니다.</param>
        /// <param name="value">더할 평문 값입니다.</param>
        /// <returns>덧셈 연산 결과를 나타내는 암호문입니다.</returns>
        public abstract Ciphertext Sum(Ciphertext encrypted, T value);


        /// <summary>
        /// 두 암호문을 곱합니다.
        /// </summary>
        /// <param name="encrypted1">첫 번째 암호문입니다.</param>
        /// <param name="encrypted2">두 번째 암호문입니다.</param>
        /// <returns>곱셈 연산 결과를 나타내는 암호문입니다.</returns>
        public abstract Ciphertext Multiply(Ciphertext encrypted1, Ciphertext encrypted2);


        /// <summary>
        /// 암호화된 데이터와 평문 값을 곱합니다.
        /// </summary>
        /// <param name="encrypted">암호화된 데이터입니다.</param>
        /// <param name="value">곱할 평문 값입니다.</param>
        /// <returns>곱셈 연산 결과를 나타내는 암호문입니다.</returns>
        public abstract Ciphertext Multiply(Ciphertext encrypted, T value);

        public abstract Ciphertext Power(Ciphertext encrypted, int n);


        /// <summary>
        /// 암호화된 데이터의 부호를 반전합니다.
        /// </summary>
        /// <param name="encrypted">부호를 반전할 암호문입니다.</param>
        /// <returns>부호가 반전된 암호문입니다.</returns>
        public abstract Ciphertext Negate(Ciphertext encrypted);


        /// <summary>
        /// 사용 중인 SEALContext 객체를 가져옵니다.
        /// </summary>
        /// <returns>SEALContext 객체입니다.</returns>
        public SEALContext GetContext() => this.context;


        /// <summary>
        /// 사용 중인 공개 키를 가져옵니다.
        /// </summary>
        /// <returns>공개 키 객체입니다.</returns>
        public PublicKey GetPublicKey() => this.publicKey;


        /// <summary>
        /// 사용 중인 비밀 키를 가져옵니다.
        /// </summary>
        /// <returns>비밀 키 객체입니다.</returns>
        public SecretKey GetSecretKey() => secretKey ?? throw new InvalidOperationException("secretKey is not initialized.");


        /// <summary>
        /// 최대 곱셈 횟수를 가져옵니다.
        /// </summary>
        /// <returns>최대 곱셈 횟수입니다.</returns>
        public int GetMaxMultiplyCount() => maxMultiplyCount;
    }
}