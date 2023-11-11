using Microsoft.Research.SEAL;
using System.Numerics;
using FHE.src.modules.microsoftseal;


namespace FHE.src.modules.fouriertransform
{
    internal class FastFourierTransform
    {
        private readonly AbstractSeal<short> Seal;

        public FastFourierTransform(AbstractSeal<short> seal)
        {
            Seal = seal;
        }

        public (List<Ciphertext>, List<Ciphertext>) Transform(List<Ciphertext> encryptedRealVector, List<Ciphertext> encryptedImagVector)
        {
            int size = encryptedRealVector.Count;
            var transformedRealVector = new List<Ciphertext>();
            var transformedImagVector = new List<Ciphertext>();

            InitializeTransformedVectors(encryptedRealVector, encryptedImagVector, transformedRealVector, transformedImagVector, size);

            for (int segmentSize = 2; segmentSize <= size; segmentSize <<= 1)
            {
                int halfSegmentSize = segmentSize / 2;
                for (int j = 0; j < size; j += segmentSize)
                {
                    for (int k = 0; k < halfSegmentSize; k++)
                    {
                        double angle = -2.0 * Math.PI * k / segmentSize;
                        PerformComplexOperation(transformedRealVector, transformedImagVector, j, k, halfSegmentSize, (short)Math.Cos(angle), (short)Math.Sin(angle));
                    }
                }
            }

            return (transformedRealVector, transformedImagVector);
        }

        public (List<Ciphertext>, List<Ciphertext>) InverseTransform(List<Ciphertext> transformedRealVector, List<Ciphertext> transformedImagVector)
        {
            int size = transformedRealVector.Count;

            // 순서 뒤집기
            var reversedRealVector = new List<Ciphertext>(transformedRealVector);
            var reversedImagVector = new List<Ciphertext>(transformedImagVector);
            reversedRealVector.Reverse(1, size - 1);
            reversedImagVector.Reverse(1, size - 1);

            // FFT 변환 수행            
            return Transform(reversedRealVector, reversedImagVector);  // 결과 정규화 생략하고 리턴. 클라이언트측에서 복호화후 나누기 연산으로 결과 정규화
        }


        private void InitializeTransformedVectors(List<Ciphertext> encryptedRealVector, List<Ciphertext> encryptedImagVector, List<Ciphertext> transformedRealVector, List<Ciphertext> transformedImagVector, int size)
        {
            for (int i = 0; i < size; i++)
            {
                int divisionSize = size, index = i, reorderedIndex = 0;
                while ((divisionSize >>= 1) > 0)
                {
                    if ((index & 1) != 0) reorderedIndex += divisionSize;
                    index >>= 1;
                }
                transformedRealVector.Add(encryptedRealVector[reorderedIndex + index]);
                transformedImagVector.Add(encryptedImagVector[reorderedIndex + index]);
            }
        }

        private void PerformComplexOperation(List<Ciphertext> transformedRealVector, List<Ciphertext> transformedImagVector, int j, int k, int halfSegmentSize, short twiddleReal, short twiddleImag)
        {
            var evenReal = transformedRealVector[j + k];
            var evenImag = transformedImagVector[j + k];
            var oddReal = transformedRealVector[j + k + halfSegmentSize];
            var oddImag = transformedImagVector[j + k + halfSegmentSize];

            // Calculate twiddle factor multiplied by odd component
            var oddRealTwiddle = Seal.Multiply(oddReal, twiddleReal);   // ac
            var oddImagTwiddle = Seal.Multiply(oddImag, twiddleImag);   // bd
            var tempRealImag = Seal.Multiply(oddReal, twiddleImag);     // ad
            var tempImagReal = Seal.Multiply(oddImag, twiddleReal);     // bc
          

            // Perform complex multiplication: (a + bi)(c + di) = (ac - bd) + (bc + ad)i
            var realPart = Seal.Sum(oddRealTwiddle, Seal.Negate(oddImagTwiddle));   // ac - bd
            var imagPart = Seal.Sum(tempRealImag, tempImagReal);                    // ad + bc


            // Update vectors with the complex addition results
            transformedRealVector[j + k] = Seal.Sum(evenReal, realPart);
            transformedImagVector[j + k] = Seal.Sum(evenImag, imagPart);
            transformedRealVector[j + k + halfSegmentSize] = Seal.Sum(evenReal, Seal.Negate(realPart));
            transformedImagVector[j + k + halfSegmentSize] = Seal.Sum(evenImag, Seal.Negate(imagPart));
        }
    }




    /// <summary>
    /// FastFourierTransform 클래스는 암호화된 데이터에 대한 고속 푸리에 변환(Fast Fourier Transform, FFT)과
    /// 그 역변환을 계산합니다. 이 클래스는 암호화된 복소수 벡터에 대한 FFT와 역 FFT 연산을 수행할 수 있습니다.
    /// </summary>
   /* internal class FastFourierTransform //: IFourierTransform
    {
        private delegate Ciphertext EncryptDelegate(Complex value);
        private delegate Ciphertext SumDelegate(Ciphertext encrypted1, Ciphertext encrypted2);
        private delegate Ciphertext MultiplyDelegate(Ciphertext encrypted1, Ciphertext encrypted2);
        private delegate Ciphertext NegateDelegate(Ciphertext encrypted);

        private readonly EncryptDelegate Encrypt;
        private readonly SumDelegate Sum;
        private readonly MultiplyDelegate Multiply;
        private readonly NegateDelegate Negate;

        private AbstractSeal<Complex> Seal;


        /// <summary>
        /// FastFourierTransform 클래스의 생성자입니다.
        /// 이 생성자는 AbstractSeal 인스턴스를 받아, 해당 인스턴스의 연산을 FFT 계산에 사용합니다.
        /// </summary>
        /// <param name="seal">FFT 계산에 사용할 AbstractSeal 인스턴스입니다.</param>
        public FastFourierTransform(AbstractSeal<Complex> seal)
        {
            Seal = seal;
            Encrypt = (value) => seal.Encrypt(value);
            Sum = (encrypted1, encrypted2) => seal.Sum(encrypted1, encrypted2);
            Multiply = (encrypted1, encrypted2) => seal.Multiply(encrypted1, encrypted2);
            Negate = (encrypted) => seal.Negate(encrypted);
        }


        /// <summary>
        /// 주어진 암호화된 복소수 벡터에 대한 FFT를 계산합니다.
        /// </summary>
        /// <param name="encryptedComplexVector">변환할 암호화된 복소수 벡터입니다.</param>
        /// <returns>FFT 변환된 암호화된 복소수 벡터를 반환합니다.</returns>
        public List<Ciphertext> Transform(List<Ciphertext> encryptedComplexVector)
        {
            int size = encryptedComplexVector.Count;
            List<Ciphertext> transformedComplexVector = new List<Ciphertext>(new Ciphertext[size]);


            // 인덱스를 재배열하여 비트 역순 순서로 정렬합니다.
            for (int i = 0; i < size; i++)
            {
                int divisionSize = size, index = i, reorderedIndex = 0;
                while ((divisionSize >>= 1) > 0)
                {
                    if ((index & 1) != 0) reorderedIndex += divisionSize;
                    index >>= 1;
                }
                transformedComplexVector[reorderedIndex + index] = encryptedComplexVector[i];
            }


            // FFT 알고리즘을 사용하여 복소수 벡터를 변환합니다.
            for (int segmentSize = 2; segmentSize <= size; segmentSize <<= 1)
            {
                int halfSegmentSize = segmentSize / 2;
                for (int j = 0; j < size; j += segmentSize)
                {
                    for (int k = 0; k < halfSegmentSize; k++)
                    {
                        double angle = -2.0 * Math.PI / segmentSize;
                        Complex twiddleFactor = Complex.FromPolarCoordinates(1.0, angle * k);

                        Ciphertext evenComponent = transformedComplexVector[j + k];
                        Ciphertext oddComponent = Seal.Multiply(transformedComplexVector[j + k + halfSegmentSize], Seal.Encrypt(twiddleFactor));

                        transformedComplexVector[j + k] = Seal.Sum(evenComponent, oddComponent);
                        transformedComplexVector[j + k + halfSegmentSize] = Seal.Sum(evenComponent, Seal.Negate(oddComponent));
                    }
                }
            }

            return transformedComplexVector;
        }


        /// <summary>
        /// 주어진 FFT 변환된 암호화된 복소수 벡터에 대한 역 FFT(Inverse FFT)를 계산합니다.
        /// </summary>
        /// <param name="transformedEncryptedComplexVector">역변환할 FFT 변환된 암호화된 복소수 벡터입니다.</param>
        /// <returns>역 FFT 변환된 암호화된 복소수 벡터를 반환합니다.</returns>
        public List<Ciphertext> InverseTransform(List<Ciphertext> transformedEncryptedComplexVector)
        {
            List<Ciphertext> copiedVector = new List<Ciphertext>(transformedEncryptedComplexVector);
            copiedVector.Reverse(1, copiedVector.Count - 1);

            List<Ciphertext> inverseTransformedVector = Transform(copiedVector);
            int size = inverseTransformedVector.Count;

            Complex inverseSize = new Complex(1.0 / size, 0);

            for (int i = 0; i < size; i++)
            {
                inverseTransformedVector[i] = MultiplyWithValue(inverseTransformedVector[i], inverseSize);
            }

            return inverseTransformedVector;
        }
    }*/
}