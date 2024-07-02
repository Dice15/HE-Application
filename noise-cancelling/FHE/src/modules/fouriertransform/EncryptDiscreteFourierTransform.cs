using Microsoft.Research.SEAL;
using System.Numerics;
using FHE.src.modules.microsoftseal;


namespace FHE.src.modules.fouriertransform
{
    /// <summary>
    /// 클라우드 환경에서 암호화된 데이터에 대한 이산 푸리에 변환(Discrete Fourier Transform, DFT)을 수행하는 클래스입니다.
    /// 이 클래스는 암호화된 벡터에 대해 DFT 및 역 DFT를 수행하고, 필요시 클라이언트에게 재암호화를 요청합니다.
    /// </summary>
    internal class EncryptDiscreteFourierTransform : IFourierTransform<Ciphertext>
    {
        private readonly AbstractSeal<Complex> cloudSeal;
        private readonly Func<Ciphertext, Ciphertext> ReEncryptComplexFunction;


        /// <summary>
        /// 생성자. 클라우드 SEAL 인스턴스와 재암호화 함수를 초기화합니다.
        /// </summary>
        /// <param name="cloudSeal">클라우드에서 사용할 SEAL 인스턴스입니다.</param>
        /// <param name="reEncryptComplexFunction">재암호화를 수행할 함수입니다.</param>
        public EncryptDiscreteFourierTransform(AbstractSeal<Complex> cloudSeal, Func<Ciphertext, Ciphertext> reEncryptComplexFunction)
        {
            this.cloudSeal = cloudSeal;
            this.ReEncryptComplexFunction = reEncryptComplexFunction;
        }


        /// <summary>
        /// 주어진 암호화된 벡터에 대해 DFT를 수행합니다.
        /// </summary>
        /// <param name="encryptedVector">DFT를 수행할 암호화된 벡터입니다.</param>
        /// <returns>DFT가 적용된 암호화된 벡터를 반환합니다.</returns>
        public List<Ciphertext> Transform(List<Ciphertext> encryptedVector)
        {
            return PerformFourierTransform(encryptedVector, inverse: false);
        }


        /// <summary>
        /// 주어진 DFT 적용된 암호화된 벡터에 대해 역 DFT를 수행합니다.
        /// </summary>
        /// <param name="transformedEncryptedVector">역 DFT를 수행할 DFT 적용된 암호화된 벡터입니다.</param>
        /// <returns>역 DFT가 적용된 암호화된 벡터를 반환합니다.</returns>
        public List<Ciphertext> InverseTransform(List<Ciphertext> transformedEncryptedVector)
        {
            return PerformFourierTransform(transformedEncryptedVector, inverse: true);
        }


        /// <summary>
        /// DFT 및 역 DFT 연산을 수행합니다.
        /// </summary>
        /// <param name="encryptedVector">변환할 암호화된 벡터입니다.</param>
        /// <param name="inverse">역변환 여부를 지정합니다.</param>
        /// <returns>변환된 암호화된 벡터를 반환합니다.</returns>
        private List<Ciphertext> PerformFourierTransform(List<Ciphertext> encryptedVector, bool inverse)
        {
            int vectorSize = encryptedVector.Count;
            var transformedEncryptedVector = new List<Ciphertext>(vectorSize);

            for (int k = 0; k < vectorSize; k++)
            {
                var sum = PerformComplexSum(encryptedVector, k, vectorSize, inverse);
                transformedEncryptedVector.Add(sum);
            }

            return transformedEncryptedVector;
        }


        /// <summary>
        /// 복소수 합 연산을 수행합니다.
        /// </summary>
        /// <param name="encryptedVector">계산할 암호화된 벡터입니다.</param>
        /// <param name="k">현재 인덱스입니다.</param>
        /// <param name="vectorSize">벡터의 크기입니다.</param>
        /// <param name="inverse">역변환 여부를 지정합니다.</param>
        /// <returns>계산된 복소수 합을 반환합니다.</returns>
        private Ciphertext PerformComplexSum(List<Ciphertext> encryptedVector, int k, int vectorSize, bool inverse)
        {
            var sum = new Ciphertext();
            double angleFactor = inverse ? 2.0 : -2.0;

            for (int n = 0; n < vectorSize; n++)
            {
                double angle = angleFactor * Math.PI * k * n / vectorSize;
                sum = PerformComplexOperation(encryptedVector, sum, n, new Complex(Math.Cos(angle), Math.Sin(angle)));
            }

            return sum;
        }


        /// <summary>
        /// 복소수 연산을 수행합니다.
        /// </summary>
        /// <param name="encryptedVector">계산할 암호화된 벡터입니다.</param>
        /// <param name="sum">현재까지의 합산 결과입니다.</param>
        /// <param name="n">현재 처리중인 요소의 인덱스입니다.</param>
        /// <param name="twiddle">변환에 사용될 복소수입니다.</param>
        /// <returns>계산된 결과를 반환합니다.</returns>
        private Ciphertext PerformComplexOperation(List<Ciphertext> encryptedVector, Ciphertext sum, int n, Complex twiddle)
        {
            var result = cloudSeal.Multiply(encryptedVector[n], twiddle);

            if (n != 0)
            {
                var tempSum = cloudSeal.Multiply(sum, new Complex(1, 0));
                result = cloudSeal.Sum(tempSum, result);
            }

            return ReEncryptComplexFunction(result);
        }
    }
}
