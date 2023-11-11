using Microsoft.Research.SEAL;
using System.Numerics;
using System.Text;


namespace FHE.src.modules.fouriertransform
{
  /*  /// <summary>
    /// FourierTransformApplication 클래스는 푸리에 변환을 활용하여 다항식의 곱셈을 수행합니다.
    /// 이 클래스는 IFourierTransform 인터페이스를 사용하여 다양한 푸리에 변환 구현을 지원합니다.
    /// </summary>
    internal class FourierTransformApplication
    {
        /// <summary>
        /// 두 다항식의 곱을 계산하는 메서드입니다.
        /// </summary>
        /// <param name="encryptedVector1">첫 번째 다항식의 계수 벡터입니다.</param>
        /// <param name="encryptedVector2">두 번째 다항식의 계수 벡터입니다.</param>
        /// <returns>곱셈 결과로 얻어진 다항식의 계수 벡터를 반환합니다.</returns>
        public List<long> MultiplyPolynomials(List<Ciphertext> encryptedVector1, List<Ciphertext> encryptedVector2)
        {
            int requiredSize = 1 << (int)Math.Ceiling(Math.Log2(Math.Max(encryptedVector1.Count, encryptedVector2.Count)) + 1);
            List<Complex> complexPoly1 = new List<Complex>(new Complex[requiredSize]);
            List<Complex> complexPoly2 = new List<Complex>(new Complex[requiredSize]);

            for (int i = 0; i < encryptedVector1.Count; i++)
                complexPoly1[i] = new Complex(encryptedVector1[i], 0);

            for (int i = 0; i < encryptedVector2.Count; i++)
                complexPoly2[i] = new Complex(encryptedVector2[i], 0);

            List<Complex> transformedPoly1 = fourierTransform.Transform(complexPoly1);
            List<Complex> transformedPoly2 = fourierTransform.Transform(complexPoly2);

            List<Complex> productPoly = new List<Complex>(new Complex[requiredSize]);
            for (int i = 0; i < requiredSize; i++)
                productPoly[i] = transformedPoly1[i] * transformedPoly2[i];

            List<Complex> resultPoly = fourierTransform.InverseTransform(productPoly);
            List<long> finalResult = new List<long>();
            for (int i = 0; i < requiredSize; i++)
                finalResult.Add((long)Math.Round(resultPoly[i].Real));

            return finalResult;
        }

        /// <summary>
        /// 두 큰 수를 곱하는 메서드입니다. 숫자는 문자열로 표현됩니다.
        /// 이 메서드는 문자열을 숫자의 리스트로 변환하고, 리스트를 곱한 후 결과를 문자열로 다시 변환합니다.
        /// </summary>
        /// <param name="number1">첫 번째 숫자를 나타내는 문자열입니다.</param>
        /// <param name="number2">두 번째 숫자를 나타내는 문자열입니다.</param>
        /// <returns>곱셈 결과로 얻어진 숫자를 나타내는 문자열을 반환합니다.</returns>
        public string Multiply(string number1, string number2)
        {
            List<long> longPoly1 = StringToLongList(number1);
            List<long> longPoly2 = StringToLongList(number2);

            List<long> product = MultiplyPolynomials(longPoly1, longPoly2);

            return ComplexVectorToString(product);
        }

        /// <summary>
        /// 문자열 형식의 숫자를 숫자의 리스트로 변환합니다.
        /// 이 리스트는 푸리에 변환에 사용됩니다.
        /// </summary>
        /// <param name="number">변환할 숫자를 나타내는 문자열입니다.</param>
        /// <returns>숫자 리스트로 변환된 숫자입니다.</returns>
        private List<long> StringToLongList(string number)
        {
            List<long> result = new List<long>();
            for (int i = number.Length - 1; i >= 0; i--)
            {
                if (char.IsDigit(number[i]))
                {
                    result.Add(number[i] - '0');
                }
            }
            return result;
        }

        /// <summary>
        /// 복소수 벡터를 숫자로 나타내는 문자열로 변환합니다.
        /// 변환 과정에서 숫자의 캐리를 처리합니다.
        /// </summary>
        /// <param name="vector">변환할 복소수 벡터입니다.</param>
        /// <returns>복소수 벡터를 나타내는 숫자 문자열입니다.</returns>
        private string ComplexVectorToString(List<long> vector)
        {
            vector.Add(0);
            for (int i = 0; i < vector.Count - 1; i++)
            {
                vector[i + 1] += vector[i] / 10;
                vector[i] %= 10;
            }

            StringBuilder result = new StringBuilder();
            for (int i = vector.Count - 1; i >= 0; i--)
            {
                if (i == vector.Count - 1 && vector[i] == 0) continue; // 앞자리 0 제거
                result.Append(vector[i].ToString());
            }

            return result.Length > 0 ? result.ToString() : "0";
        }
    }*/
}
