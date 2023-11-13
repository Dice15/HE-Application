using System.Data;
using Microsoft.Research.SEAL;
using System.Numerics;
using System.Diagnostics;

using FHE.src.clouds;
using FHE.src.modules.microsoftseal;
using FHE.src.modules.utility;


namespace FHE.src.clients
{
    /// <summary>
    /// 푸리에 변환을 수행하는 클라이언트 애플리케이션의 메인 클래스입니다.
    /// 이 클래스는 사용자 인터페이스를 제공하고, 클라우드 서비스와의 연동을 통해
    /// 암호화된 데이터에 대한 고급 수치 연산을 수행합니다.
    /// </summary>
    public partial class FourierTransformApplication : Form
    {
        private readonly AbstractSeal<Complex> clientSeal;
        private Form? cloud;


        /// <summary>
        /// 생성자입니다. 클라이언트 SEAL 인스턴스를 초기화하고 UI 컴포넌트를 설정합니다.
        /// </summary>
        public FourierTransformApplication()
        {
            InitializeComponent();
            this.clientSeal = new CKKSSeal<Complex>();
            radioButton_encryptFFT.Checked = true;
            textBox_Integer1.Text = "369";
            textBox_Integer2.Text = "114";
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


        /// <summary>
        /// 곱셈 연산을 수행하는 비동기 메서드입니다.
        /// 클라우드 서비스와 연결하여 복잡한 계산을 수행하고 결과를 화면에 표시합니다.
        /// </summary>
        private async Task Multiply(bool minimalLog = true)
        {
            await Task.Run(() =>
            {
                // 클라우드 폼이 보여지고 있으면 닫음
                if (cloud != null && cloud.Visible)
                {
                    cloud.Close();
                }


                // 결과 텍스트박스 초기화
                textBox_result.Text = "";


                // Stopwatch 시작
                var stopwatch = Stopwatch.StartNew();


                // 클라우드 생성
                cloud = new FourierTransformService(
                    this,
                    clientSeal.GetContext(),
                    clientSeal.GetPublicKey(),
                    clientSeal.GetMaxMultiplyCount(),
                    radioButton_encryptFFT.Checked ? FourierTransformService.Model.EncryptFFT : FourierTransformService.Model.EncryptDFT,
                    minimalLog);
                UIHelper.UpdateTextln(richTextBox_log, "Complete create cloud (Client)", UIHelper.TextBoxUpdateType.Overwrite, textColor: Color.Blue);


                // cloud가 생성되었는지 확인 및 안전한 타입 캐스팅
                if (cloud is FourierTransformService fourierTransformService)
                {
                    // 클라우드 폼의 설정(위치, 종료 버튼 비활성화) 및 실행
                    var clientFormLocation = this.Location;
                    var clientFormSize = this.Size;
                    cloud.StartPosition = FormStartPosition.Manual;
                    cloud.Location = new Point(clientFormLocation.X + clientFormSize.Width, clientFormLocation.Y);
                    cloud.ControlBox = false; 
                    Task.Run(() => cloud.ShowDialog());


                    // 문자열을 복소수 벡터로 변환
                    int vectorLength = 1 << (int)Math.Ceiling(Math.Log2(Math.Max(textBox_Integer1.Text.Length, textBox_Integer2.Text.Length)) + 1);
                    var complexVector1 = StringToComplexVector(textBox_Integer1.Text, vectorLength);
                    var complexVector2 = StringToComplexVector(textBox_Integer2.Text, vectorLength);
                    UIHelper.UpdateTextln(richTextBox_log, "Complete convert string to complex vector (Client)", textColor: Color.Blue);


                    // 복소수 벡터 암호화
                    var encryptedVector1 = EncryptComplexVector(complexVector1);
                    var encryptedVector2 = EncryptComplexVector(complexVector2);
                    UIHelper.UpdateTextln(richTextBox_log, "Complete encrypt vector (Client)", textColor: Color.Blue);


                    // 클라우드에 암호화된 복소수 벡터에 대한 변환 요청
                    UIHelper.UpdateTextln(richTextBox_log, "Request transform encrypted vector (Client -> Cloud)", textColor: Color.Green);
                    var transformedEncryptedVector1 = fourierTransformService.TransformAPI(encryptedVector1);
                    var transformedEncryptedVector2 = fourierTransformService.TransformAPI(encryptedVector2);
                    UIHelper.UpdateTextln(richTextBox_log, "Response transform encrypted vector (Client <- Cloud)", textColor: Color.Green);


                    // 변환된 암호화된 복소수 벡터 복호화
                    var transformedVector1 = DecryptComplexVector(transformedEncryptedVector1);
                    var transformedVector2 = DecryptComplexVector(transformedEncryptedVector2);
                    UIHelper.UpdateTextln(richTextBox_log, "Complete decrypt transformed encrypted vector", textColor: Color.Blue);


                    // 변환된 벡터의 곱셈 연산
                    var productTransformedVector = MultiplyComplexVectors(transformedVector1, transformedVector2);
                    UIHelper.UpdateTextln(richTextBox_log, "Complete product transformed vector", textColor: Color.Blue);


                    // 연산 결과 암호화
                    var productTransformedEncryptedVector = EncryptComplexVector(productTransformedVector);
                    UIHelper.UpdateTextln(richTextBox_log, "Complete encrypt producted transformed vector", textColor: Color.Blue);


                    // 클라우드에 역변환 요청
                    UIHelper.UpdateTextln(richTextBox_log, "Request transform encrypted vector (Client -> Cloud)", textColor: Color.Green);
                    var encryptedVector3 = fourierTransformService.InverseTransformAPI(productTransformedEncryptedVector);
                    UIHelper.UpdateTextln(richTextBox_log, "Response inverse transform encrypted vector (Client <- Cloud)", textColor: Color.Green);


                    // 암호화된 벡터 복호화
                    var complexVector3 = DecryptComplexVector(encryptedVector3);
                    UIHelper.UpdateTextln(richTextBox_log, "Complete decrypt encrypted vector (Client)", textColor: Color.Blue);


                    // 복소수 벡터 정규화
                    var normalizedComplexVector = NormalizeComplexVector(complexVector3);
                    UIHelper.UpdateTextln(richTextBox_log, "Complete normalize complex vector (Client)", textColor: Color.Blue);
                    UIHelper.UpdateTextln(richTextBox_log, "   Vector<Complex> {");
                    UIHelper.UpdateTextln(richTextBox_log, String.Join(Environment.NewLine, normalizedComplexVector.Select(c => $"      Complex{{ real: {c.Real,8:0.0000}, imag: {c.Imaginary,8:0.0000} }}")));
                    UIHelper.UpdateTextln(richTextBox_log, "   }");


                    // 복소수 벡터를 문자열로 변환
                    textBox_result.Text = ComplexVectorToString(normalizedComplexVector);
                    UIHelper.UpdateTextln(richTextBox_log, "Complete multiply (Client)", textColor: Color.Blue);


                    // Stopwatch 정지 및 소요 시간 계산
                    stopwatch.Stop();
                    UIHelper.UpdateTextln(richTextBox_log, $"{Environment.NewLine}Total time: {stopwatch.ElapsedMilliseconds} ms", textColor: Color.Red);


                    // cloud 종료 버튼 활성화
                    cloud.ControlBox = true;
                }
            });
        }


        /// <summary>
        /// 문자열을 복소수 벡터로 변환합니다.
        /// </summary>
        /// <param name="number">변환할 문자열입니다.</param>
        /// <param name="vectorLength">벡터의 길이입니다.</param>
        /// <returns>복소수 벡터입니다.</returns>
        private List<Complex> StringToComplexVector(string number, int vectorLength)
        {
            var integerVector = number.Reverse().Where(char.IsDigit).Select(digit => (double)(digit - '0')).ToList();
            var complexVector = integerVector.Concat(Enumerable.Repeat(0.0, vectorLength - integerVector.Count)).ToList();
            return complexVector.Select(real => new Complex(real, 0.0)).ToList();
        }


        /// <summary>
        /// 복소수 벡터를 문자열로 변환합니다.
        /// </summary>
        /// <param name="vector">변환할 복소수 벡터입니다.</param>
        /// <returns>변환된 문자열입니다.</returns>
        private string ComplexVectorToString(List<Complex> vector)
        {
            if (vector == null || vector.Count == 0) return "0";

            List<long> realVector = vector.Select(x => Convert.ToInt64(Math.Round(x.Real))).Append(0).ToList();

            for (int i = 0; i < realVector.Count - 1; i++)
            {
                realVector[i + 1] += realVector[i] / 10;
                realVector[i] %= 10;
            }

            return string.Concat(realVector.AsEnumerable().Reverse().SkipWhile(x => x == 0).Select(x => x.ToString())) ?? "0";
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
        /// 두 복소수 벡터를 곱합니다.
        /// </summary>
        /// <param name="complexVector1">첫 번째 복소수 벡터입니다.</param>
        /// <param name="complexVector2">두 번째 복소수 벡터입니다.</param>
        /// <returns>곱셈 결과 복소수 벡터입니다.</returns>
        private List<Complex> MultiplyComplexVectors(List<Complex> complexVector1, List<Complex> complexVector2)
        {
            return complexVector1.Zip(complexVector2, (c1, c2) => c1 * c2).ToList();
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


        /// <summary>
        /// 곱셈 버튼 클릭 이벤트 처리입니다.
        /// </summary>
        private async void button_multiply_Click(object sender, EventArgs e)
        {
            if (sender is Button btn)
            {
                btn.Enabled = false;
                var dialogResult = MessageBox.Show("클라우드 로그를 간소화 하시겠습니까? ", "로그 간소화", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
                await Multiply(minimalLog: dialogResult == DialogResult.Yes);
                btn.Enabled = true;
            }
        }


        /// <summary>
        /// 결과 복사 버튼 클릭 이벤트 처리입니다.
        /// </summary>
        private void button_copy_Click(object sender, EventArgs e)
        {
            if (!string.IsNullOrEmpty(textBox_result.Text))
            {
                Clipboard.SetText(textBox_result.Text);
                MessageBox.Show("결과 복사 완료", "알림", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            else
            {
                MessageBox.Show("복사할 텍스트가 없습니다.", "경고", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }
    }
}