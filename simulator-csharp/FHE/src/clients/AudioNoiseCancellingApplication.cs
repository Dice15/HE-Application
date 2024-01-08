using System.Data;
using Microsoft.Research.SEAL;
using System.Numerics;
using System.Diagnostics;

using FHE.src.clouds;
using FHE.src.modules.microsoftseal;
using FHE.src.modules.utility;


namespace FHE.src.clients
{
    public partial class AudioNoiseCancellingApplication : Form
    {
        private readonly AbstractSeal<Complex> clientSeal;
        private Form? cloud;


        /// <summary>
        /// 생성자입니다. 클라이언트 SEAL 인스턴스를 초기화하고 UI 컴포넌트를 설정합니다.
        /// </summary>
        public AudioNoiseCancellingApplication()
        {
            InitializeComponent();
            this.clientSeal = new CKKSSeal<Complex>();
            radioButton_encryptFFT.Checked = true;
        }



        /// <summary>
        /// 클라우드에서 클라이언트로 재암호화를 요청할 때 사용하는 API입니다.
        /// 주어진 암호화된 복소수를 복호화한 후 다시 암호화하여 재암호화된 복소수를 반환합니다.
        /// </summary>
        /// <param name="encryptedComplex">재암호화할 암호화된 복소수입니다.</param>
        /// <returns>클라이언트에 의해 재암호화된 복소수입니다.</returns>
        public Ciphertext ReEncryptValueAPI(Ciphertext encryptedComplex)
        {
            // 복호화한 후 다시 암호화하여 재암호화된 결과를 반환합니다.
            return clientSeal.Encrypt(clientSeal.Decrypt(encryptedComplex));
        }


        private async Task AudioNoiseCancelling(bool minimalLog = true)
        {
            await Task.Run(() =>
            {
                // 클라우드 폼이 보여지고 있으면 닫음
                if (cloud != null && cloud.Visible)
                {
                    cloud.Close();
                }


                // Stopwatch 시작
                var stopwatch = Stopwatch.StartNew();


                // 클라우드 생성
                cloud = new AudioNoiseCancellingService(
                    this,
                    clientSeal.GetContext(),
                    clientSeal.GetPublicKey(),
                    clientSeal.GetMaxMultiplyCount(),
                    (clientSeal as CKKSSeal<Complex>).GetScale(),
                    radioButton_encryptFFT.Checked ? AudioNoiseCancellingService.Model.EncryptFFT : AudioNoiseCancellingService.Model.EncryptDFT,
                    minimalLog);
                UIHelper.UpdateTextln(richTextBox_log, "Complete create cloud (Client)", UIHelper.TextBoxUpdateType.Overwrite, textColor: Color.Blue);


                // cloud가 생성되었는지 확인 및 안전한 타입 캐스팅
                if (cloud is AudioNoiseCancellingService fourierTransformService)
                {
                    // 클라우드 폼의 설정(위치, 종료 버튼 비활성화) 및 실행
                    var clientFormLocation = this.Location;
                    var clientFormSize = this.Size;
                    cloud.StartPosition = FormStartPosition.Manual;
                    cloud.Location = new Point(clientFormLocation.X + clientFormSize.Width, clientFormLocation.Y);
                    cloud.ControlBox = false;
                    Task.Run(() => cloud.ShowDialog());


                    // 가상의 오디오 데이터 생성
                    Random rnd = new Random();
                    var audio = Enumerable.Range(0, 256).Select(x => (float)(rnd.NextDouble() * 2.0 - 1.0)).ToArray();
                    float maxVal = audio.Max();
                    float minVal = audio.Min();

                    // 최댓값과 최솟값이 동일한 경우(즉, 모든 샘플 값이 0인 경우) 정규화를 수행하지 않음
                    if (maxVal > minVal)
                    {
                        audio = audio.Select(val => (val - minVal) / (maxVal - minVal)).ToArray();
                    }
                    UIHelper.UpdateTextln(richTextBox_log, "Complete read audio file (Client)", textColor: Color.Blue);

                    // 부동소수 배열을 복소수 벡터로 변환
                    int vectorLength = 1 << (int)Math.Ceiling(Math.Log2(audio.Length));
                    UIHelper.UpdateTextln(richTextBox_log, vectorLength.ToString(), textColor: Color.Blue);
                    var complexVector = floatArrayToComplexVector(audio, vectorLength);
                    UIHelper.UpdateTextln(richTextBox_log, "Complete convert float array to complex vector (Client)", textColor: Color.Blue);


                    // 복소수 벡터 암호화
                    var encryptedVector = EncryptComplexVector(complexVector);
                    UIHelper.UpdateTextln(richTextBox_log, "Complete encrypt vector (Client)", textColor: Color.Blue);


                    // 클라우드에 암호화된 복소수 벡터에 대한 변환 요청
                    UIHelper.UpdateTextln(richTextBox_log, "Request transform encrypted vector (Client -> Cloud)", textColor: Color.Green);
                    var transformedEncryptedVector = fourierTransformService.NoiseCancellingAPI(encryptedVector, clientSeal.Encrypt(new Complex(0.01, 0)));
                    UIHelper.UpdateTextln(richTextBox_log, "Response transform encrypted vector (Client <- Cloud)", textColor: Color.Green);


                    // 암호화된 벡터 복호화
                    var decryptedComplexVector = DecryptComplexVector(transformedEncryptedVector);
                    UIHelper.UpdateTextln(richTextBox_log, "Complete decrypt encrypted vector (Client)", textColor: Color.Blue);


                    // 복소수 벡터 정규화
                    var normalizedComplexVector = NormalizeComplexVector(decryptedComplexVector);
                    UIHelper.UpdateTextln(richTextBox_log, "Complete normalize complex vector (Client)", textColor: Color.Blue);
                    UIHelper.UpdateTextln(richTextBox_log, "   Vector<Complex> {");
                    UIHelper.UpdateTextln(richTextBox_log, String.Join(Environment.NewLine, normalizedComplexVector.Select(c => $"      Complex{{ real: {c.Real,8:0.0000}, imag: {c.Imaginary,8:0.0000} }}")));
                    UIHelper.UpdateTextln(richTextBox_log, "   }");


                    // 복소수 벡터를 실수 배열로 변환 및 복원
                    var audio_noise_cancelling = ComplexVectorToFloatArray(normalizedComplexVector);
                    if (maxVal > minVal)
                    {
                        audio_noise_cancelling = audio_noise_cancelling.Select(val => val * (maxVal - minVal) + minVal).ToArray();// LINQ를 사용한 복원
                    }
                    UIHelper.UpdateTextln(richTextBox_log, "Complete noise cancelling (Client)", textColor: Color.Blue);


                    // Stopwatch 정지 및 소요 시간 계산
                    stopwatch.Stop();
                    UIHelper.UpdateTextln(richTextBox_log, $"{Environment.NewLine}Total time: {stopwatch.ElapsedMilliseconds} ms", textColor: Color.Red);

                    // cloud 종료 버튼 활성화
                    cloud.ControlBox = true;
                }
            });
        }


        private List<Complex> floatArrayToComplexVector(float[] floatArr, int vectorLength)
        {
            return floatArr.Concat(Enumerable.Repeat(0.0f, Math.Max(0, vectorLength - floatArr.Length))).Select(real => new Complex(real, 0.0)).ToList();
        }

        private float[] ComplexVectorToFloatArray(List<Complex> vector)
        {
            return vector.Select(complex => (float)complex.Real).ToArray();
        }


        /// <summary>
        /// 복소수 벡터를 암호화합니다.
        /// </summary>
        /// <param name="complexVector">암호화할 복소수 벡터입니다.</param>
        /// <returns>암호화된 복소수 벡터입니다.</returns>
        private List<Ciphertext> EncryptComplexVector(List<Complex> complexVector)
        {
            return complexVector.Select(clientSeal.Encrypt).ToList();
        }


        /// <summary>
        /// 암호화된 복소수 벡터를 복호화합니다.
        /// </summary>
        /// <param name="encryptedComplexVector">복호화할 암호화된 복소수 벡터입니다.</param>
        /// <returns>복호화된 복소수 벡터입니다.</returns>
        private List<Complex> DecryptComplexVector(List<Ciphertext> encryptedComplexVector)
        {
            return encryptedComplexVector.Select(clientSeal.Decrypt).ToList();
        }

        /// <summary>
        /// 복소수 벡터를 정규화합니다.
        /// </summary>
        /// <param name="complexVector">정규화할 복소수 벡터입니다.</param>
        /// <returns>정규화된 복소수 벡터입니다.</returns>
        private List<Complex> NormalizeComplexVector(List<Complex> complexVector)
        {
            return complexVector.Select(x => new Complex(x.Real / complexVector.Count, x.Imaginary / complexVector.Count)).ToList();
        }

        private async void button_cancelling_Click(object sender, EventArgs e)
        {
            if (sender is Button btn)
            {
                btn.Enabled = false;
                var dialogResult = MessageBox.Show("클라우드 로그를 간소화 하시겠습니까? ", "로그 간소화", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
                await AudioNoiseCancelling(minimalLog: dialogResult == DialogResult.Yes);
                btn.Enabled = true;
            }
        }
    }
}
