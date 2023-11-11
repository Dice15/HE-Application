using Microsoft.Research.SEAL;


namespace FHE.src.modules.microsoftseal
{
    /// <summary>
    /// AbstractSeal 클래스는 암호화 스키마의 공통 기능을 제공하는 추상 클래스입니다.
    /// 이 클래스를 상속받아 다양한 암호화 스키마를 구현할 수 있습니다. 암호화, 복호화,
    /// 기본적인 수학 연산 등의 기능을 포함합니다.
    /// </summary>
    /// <typeparam name="T">암호화 및 복호화할 데이터의 타입입니다.</typeparam>
    internal abstract class AbstractSeal<T>
    {
        protected readonly SEALContext context;
        protected readonly Encryptor encryptor;
        protected readonly Evaluator evaluator;
        protected readonly Decryptor? decryptor;
        protected readonly PublicKey publicKey;
        protected readonly SecretKey? secretKey;


        /// <summary>
        /// AbstractSeal 클래스의 생성자는 SEALContext, PublicKey 및 SecretKey를 사용하여
        /// 암호화, 복호화, 및 수학 연산을 위한 필수 구성 요소를 초기화합니다.
        /// SecretKey는 클라우드 환경에서는 null일 수 있습니다.
        /// </summary>
        /// <param name="context">암호화 작업에 사용할 SEALContext입니다.</param>
        /// <param name="publicKey">암호화 작업에 사용할 PublicKey입니다.</param>
        /// <param name="secretKey">복호화 작업에 사용할 SecretKey입니다. 클라우드 환경에서는 null일 수 있습니다.</param>
        protected AbstractSeal(SEALContext context, PublicKey publicKey, SecretKey? secretKey)
        {
            this.context = context;
            this.publicKey = publicKey;
            this.secretKey = secretKey;
            this.encryptor = new Encryptor(context, publicKey);
            this.evaluator = new Evaluator(context);
            this.decryptor = secretKey != null ? new Decryptor(context, secretKey) : null;
        }


        /// <summary>
        /// Encrypt 메서드는 주어진 값을 암호화하여 Ciphertext 객체로 반환합니다.
        /// </summary>
        /// <param name="value">암호화할 값입니다.</param>
        /// <returns>암호화된 데이터를 나타내는 Ciphertext 객체입니다.</returns>
        public abstract Ciphertext Encrypt(T value);


        /// <summary>
        /// Decrypt 메서드는 주어진 암호화된 데이터를 복호화하여 원래의 데이터 타입으로 반환합니다.
        /// </summary>
        /// <param name="encrypted">복호화할 암호화된 데이터입니다.</param>
        /// <returns>복호화된 데이터입니다.</returns>
        public abstract T Decrypt(Ciphertext encrypted);


        /// <summary>
        /// GetContext 메서드는 현재 인스턴스에서 사용되는 SEALContext를 반환합니다.
        /// 이 SEALContext는 암호화 매개변수와 다른 중요한 설정 정보를 포함합니다.
        /// </summary>
        /// <returns>현재 인스턴스에서 사용되는 SEALContext 객체입니다.</returns>
        public SEALContext GetContext()
        {
            return this.context;
        }


        /// <summary>
        /// GetPublicKey 메서드는 현재 인스턴스에서 사용되는 공개 키를 반환합니다.
        /// </summary>
        /// <returns>현재 인스턴스에서 사용되는 PublicKey 객체입니다.</returns>
        public PublicKey GetPublicKey()
        {
            return this.publicKey;
        }


        /// <summary>
        /// GetSecretKey 메서드는 현재 인스턴스에서 사용되는 비밀 키를 반환합니다.
        /// </summary>
        /// <returns>현재 인스턴스에서 사용되는 SecretKey 객체입니다.</returns>
        public SecretKey GetSecretKey()
        {
            if (secretKey == null)
            {
                throw new InvalidOperationException("secretKey is not initialized.");
            }

            return this.secretKey;
        }


        /// <summary>
        /// 두 암호화된 값을 더하는 메서드입니다. 
        /// 이 메서드는 두 Ciphertext 객체를 매개변수로 받아, 그들을 더한 후 새로운 Ciphertext 객체를 반환합니다.
        /// </summary>
        /// <param name="encrypted1">첫 번째 암호화된 값입니다.</param>
        /// <param name="encrypted2">두 번째 암호화된 값입니다.</param>
        /// <returns>두 값의 합을 나타내는 새로운 암호화된 Ciphertext 객체입니다.</returns>
        public Ciphertext Sum(Ciphertext encrypted1, Ciphertext encrypted2)
        {
            Ciphertext result = new Ciphertext();
            evaluator.Add(encrypted1, encrypted2, result);
            return result;
        }


        /// <summary>
        /// 암호화된 값과 평문 값을 더하는 메서드입니다.
        /// 이 메서드는 암호화된 값(Ciphertext)과 평문 값(T 타입)을 받아 더한 후, 그 결과를 암호화된 형태로 반환합니다.
        /// </summary>
        /// <param name="encrypted">암호화된 값입니다.</param>
        /// <param name="value">평문 값입니다.</param>
        /// <returns>덧셈 결과를 나타내는 암호화된 Ciphertext 객체입니다.</returns>
        public Ciphertext Sum(Ciphertext encrypted, T value)
        {
            Ciphertext result = Encrypt(value);
            evaluator.Add(encrypted, result, result);
            return result;
        }


        /// <summary>
        /// 두 암호화된 값을 곱하는 메서드입니다.
        /// 이 메서드는 두 Ciphertext 객체를 매개변수로 받아, 그들을 곱한 후 새로운 Ciphertext 객체를 반환합니다.
        /// </summary>
        /// <param name="encrypted1">첫 번째 암호화된 값입니다.</param>
        /// <param name="encrypted2">두 번째 암호화된 값입니다.</param>
        /// <returns>두 값의 곱을 나타내는 새로운 암호화된 Ciphertext 객체입니다.</returns>
        public Ciphertext Multiply(Ciphertext encrypted1, Ciphertext encrypted2)
        {
            Ciphertext result = new Ciphertext();
            evaluator.Multiply(encrypted1, encrypted2, result);
            return result;
        }


        /// <summary>
        /// 암호화된 값과 평문 값을 곱하는 메서드입니다.
        /// 이 메서드는 암호화된 값(Ciphertext)과 평문 값(T 타입)을 받아 곱한 후, 그 결과를 암호화된 형태로 반환합니다.
        /// </summary>
        /// <param name="value">평문 값입니다.</param>
        /// <param name="encrypted">암호화된 값입니다.</param>
        /// <returns>곱셈 결과를 나타내는 암호화된 Ciphertext 객체입니다.</returns>
        public Ciphertext Multiply(Ciphertext encrypted, T value)
        {
            Ciphertext result = Encrypt(value);
            evaluator.Multiply(encrypted, result, result);
            return result;
        }


        /// <summary>
        /// 암호화된 데이터의 부호를 변경하는 메서드입니다.
        /// 이 메서드는 주어진 암호화된 데이터의 부호를 바꾼 후,
        /// 그 결과를 새로운 Ciphertext 객체로 반환합니다.
        /// </summary>
        /// <param name="encrypted">부호를 변경할 암호화된 데이터입니다.</param>
        /// <returns>부호가 변경된 암호화된 Ciphertext 객체입니다.</returns>
        public Ciphertext Negate(Ciphertext encrypted)
        {
            Ciphertext result = new Ciphertext();
            evaluator.Negate(encrypted, result);
            return result;
        }
    }
}