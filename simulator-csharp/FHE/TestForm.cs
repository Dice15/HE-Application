using System.Data;
using Microsoft.Research.SEAL;
using System.Numerics;

using FHE.src.modules.fouriertransform;
using FHE.src.modules.microsoftseal;
using FHE.src.modules.utility;


namespace FHE
{

    public partial class TestForm : Form
    {
        public enum TransformType { Forward, Inverse }


        private AbstractSeal<Complex> clientSeal;
        private int maxMultiplyCount;
        private EncryptFastFourierTransform fft;

        public TestForm()
        {
            InitializeComponent();
            clientSeal = new CKKSSeal<Complex>();
            maxMultiplyCount = clientSeal.GetMaxMultiplyCount();
           // fft = new EncryptFastFourierTransform(clientSeal);
            textBox1.Text = "369";
            textBox2.Text = "114";
            textBox3.Text = $"maxMultiplyCount: {maxMultiplyCount}" + Environment.NewLine;
        }


        private void Form1_Load(object sender, EventArgs e) { }


        private async void button1_Click(object sender, EventArgs e)
        {



            string num1 = textBox1.Text;
            string num2 = textBox2.Text;

            await Task.Run(() =>
            {
                // Client
                UIHelper.UpdateTextln(textBox3, "Client ---------------------------------", UIHelper.TextBoxUpdateType.Overwrite);
                int vectorLength = 1 << (int)Math.Ceiling(Math.Log2(Math.Max(num1.Length, num2.Length)) + 1);
                var complexVector1 = StringToComplexVector(num1, vectorLength);
                var complexVector2 = StringToComplexVector(num2, vectorLength);

                var encryptedVector1 = EncryptVector(clientSeal, complexVector1);
                var encryptedVector2 = EncryptVector(clientSeal, complexVector2);
                UIHelper.UpdateTextln(textBox3, "Complete encrypt vector");
                UIHelper.AppendNewLine(textBox3);



                // Cloud
                UIHelper.UpdateTextln(textBox3, "Cloud ---------------------------------");
                var transformedEncryptedVector1 = FourierTransform(fft, TransformType.Forward, encryptedVector1);
                var transformedEncryptedVector2 = FourierTransform(fft, TransformType.Forward, encryptedVector2);
                UIHelper.UpdateTextln(textBox3, "Complete transform vector");

                var transformedVector1 = DecryptVector(clientSeal, transformedEncryptedVector1);
                var transformedVector2 = DecryptVector(clientSeal, transformedEncryptedVector2);
                UIHelper.UpdateTextln(textBox3, "Complete decrypt transformed vector");
                UIHelper.UpdateTextln(textBox3, String.Join(Environment.NewLine, transformedVector1));
                UIHelper.AppendNewLine(textBox3);
                UIHelper.UpdateTextln(textBox3, String.Join(Environment.NewLine, transformedVector2));
                UIHelper.AppendNewLine(textBox3);

                var productTransformedVector = MultiplyComplexVectors(transformedVector1, transformedVector2);
                UIHelper.UpdateTextln(textBox3, "Complete product transformed vector");

                var productTransformedEncryptedVector = EncryptVector(clientSeal, productTransformedVector);
                UIHelper.UpdateTextln(textBox3, "Complete encrypt product transformed vector");

                var encryptedVector3 = FourierTransform(fft, TransformType.Inverse, productTransformedEncryptedVector);
                UIHelper.UpdateTextln(textBox3, "Complete inverse transform vector");
                UIHelper.AppendNewLine(textBox3);



                // Client
                UIHelper.UpdateTextln(textBox3, "Client ---------------------------------");
                var complexVector3 = DecryptVector(clientSeal, encryptedVector3);
                UIHelper.UpdateTextln(textBox3, "Complete decrypt vector");
                UIHelper.UpdateTextln(textBox3, String.Join(Environment.NewLine, complexVector3));
                UIHelper.AppendNewLine(textBox3);

                var normalizedVector3 = NormalizeComplexVector(complexVector3);
                UIHelper.UpdateTextln(textBox3, "Complete normalize");
                UIHelper.UpdateTextln(textBox3, String.Join(Environment.NewLine, normalizedVector3));
                UIHelper.AppendNewLine(textBox3);

                string resultString = VectorToString(normalizedVector3);
                UIHelper.UpdateTextln(textBox3, $"Result: {resultString}");
            });
        }



        public List<Complex> StringToComplexVector(string number, int vectorLength)
        {
            var integerVector = number.Reverse().Where(char.IsDigit).Select(digit => (double)(digit - '0')).ToList();
            var complexVector = integerVector.Concat(Enumerable.Repeat(0.0, vectorLength - integerVector.Count)).ToList();
            return complexVector.Select(real => new Complex(real, 0.0)).ToList();
        }

        private string VectorToString(List<Complex> vector)
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


        private List<Ciphertext> EncryptVector(AbstractSeal<Complex> seal, List<Complex> vector)
        {
            return vector.Select(seal.Encrypt).ToList();
        }


        private List<Complex> DecryptVector(AbstractSeal<Complex> seal, List<Ciphertext> encryptedVector)
        {
            return encryptedVector.Select(seal.Decrypt).ToList();
        }


        private List<Ciphertext> FourierTransform(EncryptFastFourierTransform fft, TransformType transformType, List<Ciphertext> encryptedVector)
        {
            return transformType == TransformType.Inverse ? fft.InverseTransform(encryptedVector) : fft.Transform(encryptedVector);
        }

        private List<Complex> MultiplyComplexVectors(List<Complex> vector1, List<Complex> vector2)
        {
            return vector1.Zip(vector2, (c1, c2) => c1 * c2).ToList();
        }

        private List<Complex> NormalizeComplexVector(List<Complex> vector)
        {
            return vector.Select(x => new Complex(x.Real / vector.Count, x.Imaginary / vector.Count)).ToList();
        }
    }
}





/* await Task.Run(() =>
 {
     Complex temp = new Complex(1, 2);
     var etemp = clientSeal.Encrypt(temp);

     UIHelper.UpdateTextBox(textBox3, $"{0}: {clientSeal.Decrypt(etemp)}", UIHelper.TextBoxUpdateType.Overwrite);

     for (int i = 1; i <= 1; i++)
     {
         etemp = clientSeal.Sum(etemp, new Complex(1, 2));
         UIHelper.UpdateTextBox(textBox3, $"{i}: {clientSeal.Decrypt(etemp)}");
     }

     for (int i = 1; i <= 1; i++)
     {
         etemp = clientSeal.Multiply(etemp, new Complex(2, 4));
         UIHelper.UpdateTextBox(textBox3, $"{i}: {clientSeal.Decrypt(etemp)}");
     }

     for (int i = 1; i <= 1; i++)
     {
         etemp = clientSeal.Sum(etemp, new Complex(1, 2));
         UIHelper.UpdateTextBox(textBox3, $"{i}: {clientSeal.Decrypt(etemp)}");
     }
 });
 return;*/



/* // Client
 string num1 = "2";
 string num2 = "3";


 List<Complex> complexVector1 = new List<Complex>();
 List<Complex> complexVector2 = new List<Complex>();


 for (int i = num1.Length - 1; i >= 0; i--) complexVector1.Add(new Complex(num1[i] - '0', 0));
 for (int i = num2.Length - 1; i >= 0; i--) complexVector2.Add(new Complex(num2[i] - '0', 0));


 int vectorLength = 1 << ((int)Math.Ceiling(Math.Log2(Math.Max(num1.Length, num2.Length))) + 1);
 while (complexVector1.Count < vectorLength) complexVector1.Add(new Complex(0, 0));
 while (complexVector2.Count < vectorLength) complexVector2.Add(new Complex(0, 0));


 AbstractSeal<Complex> clientCkks = new CKKSSeal<Complex>();
 List<Ciphertext> encryptedComplexVector1 = new List<Ciphertext>();
 List<Ciphertext> encryptedComplexVector2 = new List<Ciphertext>();


 for (int i = 0; i < complexVector1.Count; i++) encryptedComplexVector1.Add(clientCkks.Encrypt(complexVector1[i]));
 for (int i = 0; i < complexVector2.Count; i++) encryptedComplexVector2.Add(clientCkks.Encrypt(complexVector2[i]));




 // Cloud
 //  var sealContext = clientCkks.GetContext();
 //  var publicKey = clientCkks.GetPublicKey();
 //  var encrypted1 = encryptedComplexVector1;
 //  var encrypted2 = encryptedComplexVector2;
 //  var encryptedLength = Math.Max(encrypted1.Count, encrypted2.Count);


 //  AbstractSeal<Complex> cloudCkks = new CKKSSeal<Complex>(sealContext, publicKey);


 FastFourierTransform fft = new FastFourierTransform(clientCkks);
 List<Ciphertext> transformedEncryptedVector1 = fft.Transform(encryptedComplexVector1);
 /*      List<Ciphertext> transformedEncryptedVector2 = fft.Transform(encrypted2);


       List<Ciphertext> productTransformedEncryptedVector = new List<Ciphertext>(new Ciphertext[encryptedLength]);
       for (int i = 0; i < encryptedLength; i++) productTransformedEncryptedVector[i] = cloudCkks.Multiply(transformedEncryptedVector1[i], transformedEncryptedVector2[i]);


       List<Ciphertext> encrypted3 = fft.InverseTransform(productTransformedEncryptedVector);




       // Client
       var encryptedComplexVector3 = encrypted3;


       List<long> longVector3 = new List<long>();
       for (int i = 0; i < vectorLength; i++) longVector3.Add((long)Math.Round(clientCkks.Decrypt(encryptedComplexVector3[i]).Real));


       string num3 = ComplexVectorToString(longVector3);
       MessageBox.Show(num3);*/



/*     AbstractSeal<double> dSeal = new CKKSSeal<double>();
     MessageBox.Show(dSeal.Decrypt(dSeal.Sum(dSeal.Encrypt(3.44), dSeal.Encrypt(4.33))).ToString());
     MessageBox.Show(dSeal.Decrypt(dSeal.Multiply(dSeal.Encrypt(3.44), dSeal.Encrypt(4.33))).ToString());


     AbstractSeal<Complex> cSeal = new CKKSSeal<Complex>();
     MessageBox.Show(cSeal.Decrypt(cSeal.Sum(cSeal.Encrypt(new Complex(3.44, 0)), cSeal.Encrypt(new Complex(4.33, 0)))).ToString());
     MessageBox.Show(cSeal.Decrypt(cSeal.Multiply(cSeal.Encrypt(new Complex(3.44, 0)), cSeal.Encrypt(new Complex(Math.Cos(-2.0 * Math.Acos(-1) / 2 * 0), Math.Sin(-2.0 * Math.Acos(-1) / 2 * 0))))).ToString());
     MessageBox.Show(cSeal.Decrypt(cSeal.Multiply(cSeal.Encrypt(new Complex(3.44, 0)), cSeal.Encrypt(new Complex(4.33, 0)))).ToString());




     AbstractSeal<List<double>> dlSeal = new CKKSSeal<List<double>>();
     MessageBox.Show(string.Join(", ", dlSeal.Decrypt(dlSeal.Sum(dlSeal.Encrypt(new List<double> { 3.44, 10.11 }), dlSeal.Encrypt(new List<double> { 4.33, 10.09 }))).GetRange(0, 2)));
     MessageBox.Show(string.Join(", ", dlSeal.Decrypt(dlSeal.Multiply(dlSeal.Encrypt(new List<double> { 3.44, 10.11 }), dlSeal.Encrypt(new List<double> { 4.33, 10.09 }))).GetRange(0, 2)));*/



/* ISeal<double> dSeal = new CKKSSeal<double>();
 MessageBox.Show(dSeal.Decrypt(dSeal.Add(dSeal.Encrypt(3.44), dSeal.Encrypt(4.33))).ToString());
 MessageBox.Show(dSeal.Decrypt(dSeal.Multiply(dSeal.Encrypt(3.44), dSeal.Encrypt(4.33))).ToString());


 ISeal<Complex> cSeal = new CKKSSeal<Complex>();
 MessageBox.Show(cSeal.Decrypt(cSeal.Add(cSeal.Encrypt(new Complex(3.44, 0)), cSeal.Encrypt(new Complex(4.33, 0)))).ToString());
 MessageBox.Show(cSeal.Decrypt(cSeal.Multiply(cSeal.Encrypt(new Complex(3.44, 0)), cSeal.Encrypt(new Complex(4.33, 0)))).ToString());*/


//ISeal<List<double>> dlSeal = new CKKSSeal<List<double>>();
//MessageBox.Show(string.Join(", ", dlSeal.Decrypt(dlSeal.Add(dlSeal.Encrypt(new List<double> { 3.44, 10.11 }), dlSeal.Encrypt(new List<double> { 4.33, 10.09 }))).GetRange(0, 2)));
//MessageBox.Show(string.Join(", ", dlSeal.Decrypt(dlSeal.Multiply(dlSeal.Encrypt(new List<double> { 3.44, 10.11 }), dlSeal.Encrypt(new List<double> { 4.33, 10.09 }))).GetRange(0, 2)));

//  ISeal<short> sSeal = new BFVSeal<short>();
//  MessageBox.Show(sSeal.Decrypt(sSeal.Add(sSeal.Encrypt(3), sSeal.Encrypt(4))).ToString());
//  MessageBox.Show(sSeal.Decrypt(sSeal.Multiply(sSeal.Encrypt(3), sSeal.Encrypt(4))).ToString());


//ISeal<List<short>> slSeal = new BFVSeal<List<short>>();
// MessageBox.Show(string.Join(", ", slSeal.Decrypt(slSeal.Add(slSeal.Encrypt(new List<short> { 1, 2 }), slSeal.Encrypt(new List<short> { 4, 8 }))).GetRange(0, 2)));
// MessageBox.Show(string.Join(", ", slSeal.Decrypt(slSeal.Multiply(slSeal.Encrypt(new List<short> { 1, 2 }), slSeal.Encrypt(new List<short> { 4, 8 }))).GetRange(0, 2)));
