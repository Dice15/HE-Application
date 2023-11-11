using Microsoft.Research.SEAL;
using System.Numerics;

namespace FHE.src.modules.fouriertransform
{
    /// <summary>
    /// IFourierTransform 인터페이스는 푸리에 변환과 그 역변환을 위한 메서드를 정의합니다.
    /// 이 인터페이스를 구현함으로써, 암호화된 데이터에 대한 다양한 종류의 푸리에 변환 알고리즘(예: FFT)을 일관된 방식으로 사용할 수 있습니다.
    /// </summary>
    internal interface IFourierTransform
    {
        /// <summary>
        /// 주어진 암호화된 복소수 벡터에 대한 푸리에 변환을 수행합니다.
        /// 이 메서드는 푸리에 변환의 구체적인 구현(예: FFT)에 따라 암호화된 복소수 벡터를 주파수 영역으로 변환합니다.
        /// </summary>
        /// <param name="encryptedComplexVector">변환할 암호화된 복소수 벡터입니다. 시간 영역의 데이터를 나타냅니다.</param>
        /// <returns>변환된 암호화된 복소수 벡터를 반환합니다. 이 벡터는 주파수 영역의 데이터를 나타냅니다.</returns>
        List<Ciphertext> Transform(List<Ciphertext> encryptedComplexVector);

        /// <summary>
        /// 주어진 변환된 암호화된 복소수 벡터에 대한 역 푸리에 변환을 수행합니다.
        /// 이 메서드는 변환된 암호화된 복소수 벡터를 원래의 시간 영역 데이터로 역변환합니다.
        /// </summary>
        /// <param name="transformedEncryptedComplexVector">역변환할 변환된 암호화된 복소수 벡터입니다. 주파수 영역의 데이터를 나타냅니다.</param>
        /// <returns>역변환된 암호화된 복소수 벡터를 반환합니다. 이 벡터는 원래의 시간 영역 데이터를 나타냅니다.</returns>
        List<Ciphertext> InverseTransform(List<Ciphertext> transformedEncryptedComplexVector);
    }

}
