using Microsoft.Research.SEAL;
using System.Numerics;

using FHE.src.clients;
using FHE.src.modules.fouriertransform;
using FHE.src.modules.microsoftseal;
using FHE.src.modules.utility;


namespace FHE.src.clouds
{
    /// <summary>
    /// 클라우드 기반의 푸리에 변환 서비스를 제공하는 클래스입니다.
    /// 이 클래스는 클라이언트로부터 받은 암호화된 데이터에 대해 푸리에 변환(FFT/DFT)을 수행하고,
    /// 필요에 따라 클라이언트에게 재암호화를 요청합니다.
    /// </summary>
    public partial class FourierTransformService : Form
    {
        public enum Model { EncryptFFT, EncryptDFT };

        private readonly AbstractSeal<Complex> cloudSeal;
        private readonly FourierTransformApplication client;
        private readonly IFourierTransform<Ciphertext> fourierTransform;
        private readonly bool minimalLog;

        /// <summary>
        /// 클라우드 서비스의 생성자입니다. 클라이언트와 연동하여 암호화된 데이터에 푸리에 변환을 수행합니다.
        /// </summary>
        /// <param name="client">클라이언트 애플리케이션 인스턴스입니다.</param>
        /// <param name="context">SEAL 컨텍스트입니다.</param>
        /// <param name="publicKey">공개 키입니다.</param>
        /// <param name="model">사용할 모델(FFT/DFT)입니다.</param>
        public FourierTransformService(FourierTransformApplication client, SEALContext context, PublicKey publicKey, int maxMultiplyCount, Model model, bool minimalLog)
        {
            InitializeComponent();
            this.client = client;
            this.cloudSeal = new CKKSSeal<Complex>(context, publicKey, maxMultiplyCount);
            this.minimalLog = minimalLog;

            switch (model)
            {
                case Model.EncryptFFT:
                    this.fourierTransform = new EncryptFastFourierTransform(cloudSeal, ReEncryptValue);
                    break;
                case Model.EncryptDFT:
                    this.fourierTransform = new EncryptDiscreteFourierTransform(cloudSeal, ReEncryptValue);
                    break;
                default:
                    throw new ArgumentException("Invalid model");
            }
        }


        /// <summary>
        /// 클라이언트 또는 다른 클라우드로부터 Transform 요청을 처리하는 메서드입니다.
        /// </summary>
        /// <param name="vector">변환할 암호화된 벡터입니다.</param>
        /// <returns>변환된 암호화된 벡터를 반환합니다.</returns>
        public List<Ciphertext> TransformAPI(List<Ciphertext> vector)
        {
            UIHelper.UpdateTextln(richTextBox_log, "Requested transform encrypted vector (Client -> Cloud)", textColor: Color.Green);
            var result = fourierTransform.Transform(vector);
            UIHelper.UpdateTextln(richTextBox_log, "Complete transform encrypted vector (Cloud)", textColor: Color.Blue);
            UIHelper.UpdateTextln(richTextBox_log, "Return transformed encrypted vector (Client <- Cloud)", textColor: Color.Green);
            return result;
        }


        /// <summary>
        /// 클라이언트 또는 다른 클라우드로부터 Inverse Transform 요청을 처리하는 메서드입니다.
        /// </summary>
        /// <param name="vector">역변환할 암호화된 벡터입니다.</param>
        /// <returns>역변환된 암호화된 벡터를 반환합니다.</returns>
        public List<Ciphertext> InverseTransformAPI(List<Ciphertext> vector)
        {
            UIHelper.UpdateTextln(richTextBox_log, "Requested inverse transform encrypted vector (Client -> Cloud)", textColor: Color.Green);
            var result = fourierTransform.InverseTransform(vector);
            UIHelper.UpdateTextln(richTextBox_log, "Complete inverse transform encrypted vector (Cloud)", textColor: Color.Blue);
            UIHelper.UpdateTextln(richTextBox_log, "Return inverse transformed encrypted vector (Client <- Cloud)", textColor: Color.Green);
            return result;
        }


        /// <summary>
        /// 클라이언트에게 암호화된 복소수의 재암호화를 요청하는 메서드입니다.
        /// </summary>
        /// <param name="encryptedComplex">재암호화할 암호화된 복소수입니다.</param>
        /// <returns>재암호화된 복소수를 반환합니다.</returns>
        public Ciphertext ReEncryptValue(Ciphertext encryptedComplex)
        {
            if (minimalLog) return client.ReEncryptValueAPI(encryptedComplex);

            UIHelper.UpdateTextln(richTextBox_log, "Request reencrypt complex (Client <- Cloud)", textColor: Color.Green);
            var result = client.ReEncryptValueAPI(encryptedComplex);
            UIHelper.UpdateTextln(richTextBox_log, "Response reencrypted complex (Client -> Cloud)", textColor: Color.Green);
            return result;
        }
    }
}
