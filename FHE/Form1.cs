using System.Data;
using System.Reflection;
using Microsoft.Research.SEAL;
using System.Numerics;
using System;
using System.Text;

using FHE.src.modules.microsoftseal;
using FHE.src.modules.fouriertransform;
using System.Collections.Generic;
using Microsoft.VisualBasic.Logging;
using System.Reflection.Metadata;

namespace FHE
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }


        /// <summary>
        /// ���ڿ� ������ ���ڸ� ������ ����Ʈ�� ��ȯ�մϴ�.
        /// �� ����Ʈ�� Ǫ���� ��ȯ�� ���˴ϴ�.
        /// </summary>
        /// <param name="number">��ȯ�� ���ڸ� ��Ÿ���� ���ڿ��Դϴ�.</param>
        /// <returns>���� ����Ʈ�� ��ȯ�� �����Դϴ�.</returns>
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
        /// ���Ҽ� ���͸� ���ڷ� ��Ÿ���� ���ڿ��� ��ȯ�մϴ�.
        /// ��ȯ �������� ������ ĳ���� ó���մϴ�.
        /// </summary>
        /// <param name="vector">��ȯ�� ���Ҽ� �����Դϴ�.</param>
        /// <returns>���Ҽ� ���͸� ��Ÿ���� ���� ���ڿ��Դϴ�.</returns>
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
                if (i == vector.Count - 1 && vector[i] == 0) continue; // ���ڸ� 0 ����
                result.Append(vector[i].ToString());
            }

            return result.Length > 0 ? result.ToString() : "0";
        }


        private void Form1_Load(object sender, EventArgs e)
        {
            // Client
            string num1 = "12";
            string num2 = "14";

            List<short> realVector1 = new List<short>();
            List<short> imagVector1 = new List<short>();
            List<short> realVector2 = new List<short>();
            List<short> imagVector2 = new List<short>();

            // ���Ҽ��� �Ǽ� �κа� ��� �κ��� �и��Ͽ� ����
            for (int i = num1.Length - 1; i >= 0; i--)
            {
                realVector1.Add((short)(num1[i] - '0'));
                imagVector1.Add(0);
            }
            for (int i = num2.Length - 1; i >= 0; i--)
            {
                realVector2.Add((short)(num2[i] - '0'));
                imagVector2.Add(0);
            }

            int vectorLength = 1 << (int)Math.Ceiling(Math.Log2(Math.Max(num1.Length, num2.Length)) + 1);
            while (realVector1.Count < vectorLength)
            {
                realVector1.Add(0);
                imagVector1.Add(0);
            }
            while (realVector2.Count < vectorLength)
            {
                realVector2.Add(0);
                imagVector2.Add(0);
            }

            AbstractSeal<short> clientBfv = new BFVSeal<short>();
            List<Ciphertext> encryptedRealVector1 = new List<Ciphertext>();
            List<Ciphertext> encryptedImagVector1 = new List<Ciphertext>();
            List<Ciphertext> encryptedRealVector2 = new List<Ciphertext>();
            List<Ciphertext> encryptedImagVector2 = new List<Ciphertext>();

            // �Ǽ� �κа� ��� �κ��� ���� ��ȣȭ
            for (int i = 0; i < realVector1.Count; i++)
            {
                encryptedRealVector1.Add(clientBfv.Encrypt(realVector1[i]));
                encryptedImagVector1.Add(clientBfv.Encrypt(imagVector1[i]));
            }
            for (int i = 0; i < realVector2.Count; i++)
            {
                encryptedRealVector2.Add(clientBfv.Encrypt(realVector2[i]));
                encryptedImagVector2.Add(clientBfv.Encrypt(imagVector2[i]));
            }




            // Cloud
            FastFourierTransform fft = new FastFourierTransform(clientBfv);


            (var transformedEncryptedRealVector1, var transformedEncryptedImagVector1) = fft.Transform(encryptedRealVector1, encryptedImagVector1);
            (var transformedEncryptedRealVector2, var transformedEncryptedImagVector2) = fft.Transform(encryptedRealVector2, encryptedImagVector2);


            var productTransformedEncryptedRealVector = new List<Ciphertext>();
            var productTransformedEncryptedImagVector = new List<Ciphertext>();

            for (int i = 0; i < vectorLength; i++)
            {
                var realPart = clientBfv.Multiply(transformedEncryptedRealVector1[i], transformedEncryptedRealVector2[i]); // ac
                var temp = clientBfv.Multiply(transformedEncryptedImagVector1[i], transformedEncryptedImagVector2[i]); // bd
                realPart = clientBfv.Sum(realPart, clientBfv.Negate(temp));

                var imagPart = clientBfv.Multiply(transformedEncryptedRealVector1[i], transformedEncryptedImagVector2[i]); // ad
                temp = clientBfv.Multiply(transformedEncryptedImagVector1[i], transformedEncryptedRealVector2[i]); // bc
                imagPart = clientBfv.Sum(imagPart, temp);

                productTransformedEncryptedRealVector.Add(realPart);
                productTransformedEncryptedImagVector.Add(imagPart);
            }


            (var realVector3, var imagVector3) = fft.InverseTransform(productTransformedEncryptedRealVector, productTransformedEncryptedImagVector);




            // Ŭ���̾�Ʈ ��
            // FFT ����ȯ ����� ��ȣȭ�ϰ� ����ȭ
            List<long> longVector3 = new List<long>();
            for (int i = 0; i < vectorLength; i++)
            {
                longVector3.Add((long)Math.Round((double)clientBfv.Decrypt(realVector3[i]) / (double)vectorLength)); // ����ȭ �� �ݿø��Ͽ� long���� ��ȯ
            }

            // ����� ���ڿ��� ��ȯ
            string num3 = ComplexVectorToString(longVector3);

            // ��� ���
            MessageBox.Show(num3);
        }
    }
}













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
