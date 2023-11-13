using Microsoft.Research.SEAL;
using System.Numerics;
using FHE.src.modules.microsoftseal;


namespace FHE.src.modules.fouriertransform
{
    /// <summary>
    /// 클라우드 환경에서 암호화된 데이터에 대한 푸리에 변환(Fast Fourier Transform, FFT)을 수행하는 클래스입니다.
    /// 이 클래스는 암호화된 벡터에 대해 FFT를 수행하고, 필요시 클라이언트에게 재암호화를 요청합니다.
    /// </summary>
    internal class EncryptFastFourierTransform : IFourierTransform<Ciphertext>
    {
        private readonly AbstractSeal<Complex> cloudSeal;
        private readonly Func<Ciphertext, Ciphertext> ReEncryptComplexFunction;


        /// <summary>
        /// 생성자. 클라우드 SEAL 인스턴스와 재암호화 함수를 초기화합니다.
        /// </summary>
        /// <param name="cloudSeal">클라우드에서 사용할 SEAL 인스턴스입니다.</param>
        /// <param name="reEncryptComplexFunction">재암호화를 수행할 함수입니다.</param>
        public EncryptFastFourierTransform(AbstractSeal<Complex> cloudSeal, Func<Ciphertext, Ciphertext> reEncryptComplexFunction)
        {
            this.cloudSeal = cloudSeal;
            this.ReEncryptComplexFunction = reEncryptComplexFunction;
        }


        /// <summary>
        /// 주어진 암호화된 벡터에 대해 FFT를 수행합니다.
        /// </summary>
        /// <param name="encryptedVector">FFT를 수행할 암호화된 벡터입니다.</param>
        /// <returns>FFT가 적용된 암호화된 벡터를 반환합니다.</returns>
        public List<Ciphertext> Transform(List<Ciphertext> encryptedVector)
        {
            // FFT의 기본 파라미터 설정
            int vectorSize = encryptedVector.Count;
            var transformedEncryptedVector = new List<Ciphertext>();

            // 벡터의 초기 순서를 변경합니다.
            InitializeTransformedVectors(encryptedVector, transformedEncryptedVector, vectorSize);

            // FFT 알고리즘을 적용합니다.
            for (int segmentSize = 2; segmentSize <= vectorSize; segmentSize <<= 1)
            {
                int halfSegmentSize = segmentSize / 2;
                for (int j = 0; j < vectorSize; j += segmentSize)
                {
                    for (int k = 0; k < halfSegmentSize; k++)
                    {
                        double angle = -2.0 * Math.PI * k / segmentSize;
                        PerformComplexOperation(transformedEncryptedVector, j, k, halfSegmentSize, new Complex(Math.Cos(angle), Math.Sin(angle)));
                    }
                }
            }

            return transformedEncryptedVector;
        }


        /// <summary>
        /// 주어진 FFT 적용된 암호화된 벡터에 대해 역 FFT를 수행합니다.
        /// </summary>
        /// <param name="transformedEncryptedVector">역 FFT를 수행할 FFT 적용된 암호화된 벡터입니다.</param>
        /// <returns>역 FFT가 적용된 암호화된 벡터를 반환합니다. 정규화 생략</returns>
        public List<Ciphertext> InverseTransform(List<Ciphertext> transformedEncryptedVector)
        {
            // 역 FFT의 기본 파라미터 설정
            int vectorSize = transformedEncryptedVector.Count;
            var reversedTransformedEncryptedVector = new List<Ciphertext>(transformedEncryptedVector);
            reversedTransformedEncryptedVector.Reverse(1, vectorSize - 1);

            // 역 FFT 알고리즘을 적용합니다.
            return Transform(reversedTransformedEncryptedVector);
        }


        /// <summary>
        /// FFT를 위해 벡터의 순서를 재배열합니다.
        /// </summary>
        /// <param name="encryptedVector">재배열할 암호화된 벡터입니다.</param>
        /// <param name="transformedEncryptedVector">재배열된 결과를 저장할 벡터입니다.</param>
        /// <param name="vectorSize">벡터의 크기입니다.</param>
        private void InitializeTransformedVectors(List<Ciphertext> encryptedVector, List<Ciphertext> transformedEncryptedVector, int vectorSize)
        {
            // 중첩 루프를 사용하여 벡터의 순서를 재배열합니다.
            for (int i = 0; i < vectorSize; i++)
            {
                int divisionSize = vectorSize, index = i, reorderedIndex = 0;
                while ((divisionSize >>= 1) > 0)
                {
                    if ((index & 1) != 0) reorderedIndex += divisionSize;
                    index >>= 1;
                }
                transformedEncryptedVector.Add(encryptedVector[reorderedIndex + index]);
            }
        }


        /// <summary>
        /// FFT의 주요 연산을 수행하는 메서드입니다.
        /// 이 메서드는 주어진 암호화된 벡터에 대해 복소수 곱셈을 적용합니다.
        /// </summary>
        /// <param name="transformedEncryptedVector">FFT가 적용될 암호화된 벡터입니다.</param>
        /// <param name="j">처리할 벡터의 시작 인덱스입니다.</param>
        /// <param name="k">처리할 벡터의 끝 인덱스입니다.</param>
        /// <param name="halfSegmentSize">벡터의 절반 크기입니다.</param>
        /// <param name="twiddle">변환에 사용될 복소수입니다.</param>
        private void PerformComplexOperation(List<Ciphertext> transformedEncryptedVector, int j, int k, int halfSegmentSize, Complex twiddle)
        {
            // FFT의 복소수 곱셈 연산을 수행합니다.
            var even = transformedEncryptedVector[j + k];
            var odd = transformedEncryptedVector[j + k + halfSegmentSize];
            var evenTemp = cloudSeal.Multiply(even, new Complex(1, 0));
            var oddTemp = cloudSeal.Multiply(odd, twiddle);

            // 결과를 재암호화하여 최종 벡터에 저장합니다.
            transformedEncryptedVector[j + k] = ReEncryptComplexFunction(cloudSeal.Sum(evenTemp, oddTemp));
            transformedEncryptedVector[j + k + halfSegmentSize] = ReEncryptComplexFunction(cloudSeal.Sum(evenTemp, cloudSeal.Negate(oddTemp)));
        }
    }
}