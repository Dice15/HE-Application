

namespace FHE.src.modules.fouriertransform
{
    /// <summary>
    /// 푸리에 변환(Fourier Transform)을 위한 인터페이스입니다.
    /// 이 인터페이스는 데이터의 변환과 역변환을 위한 메서드를 정의합니다.
    /// T는 데이터의 타입을 나타내며, 이 타입에 따라 변환의 구체적인 동작이 결정됩니다.
    /// </summary>
    /// <typeparam name="T">변환될 데이터의 타입을 나타냅니다.</typeparam>
    internal interface IFourierTransform<T>
    {
        /// <summary>
        /// 주어진 데이터에 대해 푸리에 변환을 수행합니다.
        /// </summary>
        /// <param name="vector">변환될 데이터를 포함하는 리스트입니다.
        /// 이 리스트는 T 타입의 요소들로 구성됩니다.</param>
        /// <returns>푸리에 변환된 데이터를 포함하는 리스트를 반환합니다.
        /// 반환되는 리스트 역시 T 타입의 요소들로 구성됩니다.</returns>
        List<T> Transform(List<T> vector);


        /// <summary>
        /// 푸리에 변환된 데이터에 대해 역변환을 수행합니다.
        /// </summary>
        /// <param name="transformedVector">역변환될 데이터를 포함하는 리스트입니다.
        /// 이 리스트는 푸리에 변환을 거친 데이터를 포함하며, T 타입의 요소들로 구성됩니다.</param>
        /// <returns>역푸리에 변환된 데이터를 포함하는 리스트를 반환합니다.
        /// 반환되는 리스트 역시 T 타입의 요소들로 구성됩니다.</returns>
        List<T> InverseTransform(List<T> transformedVector);
    }
}
