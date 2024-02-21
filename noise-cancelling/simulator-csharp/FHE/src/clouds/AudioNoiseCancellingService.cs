using Microsoft.Research.SEAL;
using System.Numerics;

using FHE.src.clients;
using FHE.src.modules.fouriertransform;
using FHE.src.modules.microsoftseal;
using FHE.src.modules.utility;

namespace FHE.src.clouds
{
    public partial class AudioNoiseCancellingService : Form
    {
        public enum Model { EncryptFFT, EncryptDFT };

        private readonly AbstractSeal<Complex> cloudSeal;
        private readonly AudioNoiseCancellingApplication client;
        private readonly IFourierTransform<Ciphertext> fourierTransform;
        private readonly bool minimalLog;


        public AudioNoiseCancellingService(AudioNoiseCancellingApplication client, SEALContext context, PublicKey publicKey, int maxMultiplyCount, double scale, Model model, bool minimalLog)
        {
            InitializeComponent();
            this.client = client;
            this.cloudSeal = new CKKSSeal<Complex>(context, publicKey, maxMultiplyCount, scale);
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


        public List<Ciphertext> NoiseCancellingAPI(List<Ciphertext> ciphertextVector, Ciphertext threshold)
        {
            UIHelper.UpdateTextln(richTextBox_log, "Requested NoiseCancelling (Client -> Cloud)", textColor: Color.Green);

            var transformedEncryptedVector = fourierTransform.Transform(ciphertextVector);
            UIHelper.UpdateTextln(richTextBox_log, "Complete transform encrypted vector (Cloud)", textColor: Color.Blue);

            var encryptedOne = cloudSeal.Encrypt(new Complex(1, 0));
            var encryptedZero = cloudSeal.Encrypt(new Complex(0, 0));
            for (int i = 0; i < transformedEncryptedVector.Count; i++)
            {
                var magnitude = Abs(transformedEncryptedVector[i]);
                var scaledMagnitude = ReEncryptValue(cloudSeal.Multiply(magnitude, threshold));
                var scale = Min(encryptedOne, Max(encryptedZero, scaledMagnitude));
                transformedEncryptedVector[i] = cloudSeal.Multiply(transformedEncryptedVector[i], scale);
                UIHelper.UpdateTextln(richTextBox_log, $"Complete rescaling data[{i}]", textColor: Color.Blue);
            }


            var inverseTransformedEncryptedVector = fourierTransform.InverseTransform(ciphertextVector);
            UIHelper.UpdateTextln(richTextBox_log, "Complete inverse transform encrypted vector (Cloud)", textColor: Color.Blue);

            return inverseTransformedEncryptedVector;
        }

        private Ciphertext Sgn(Ciphertext x, int n = 1, int d = 14)
        {
            var defaultConst = cloudSeal.Encrypt(new Complex(1, 0));
            switch (n)
            {
                case 1:
                    {
                        var scaleConst2 = cloudSeal.Power(defaultConst, 2);
                        for (int i = 0; i < d; i++)
                        {
                            x = ReEncryptValue(cloudSeal.Sum(
                                    cloudSeal.Multiply(cloudSeal.Power(x, 3), new Complex(-1.0 / 2.0, 0)),
                                    cloudSeal.Multiply(cloudSeal.Multiply(x, scaleConst2), new Complex(3.0 / 2.0, 0))
                                ));
                        }
                    }
                    break;
                case 2:
                    {
                        var (scaleConst2, scaleConst4) = (cloudSeal.Power(defaultConst, 2), cloudSeal.Power(defaultConst, 4));
                        for (int i = 0; i < d; i++)
                        {
                            x = ReEncryptValue(cloudSeal.Sum(
                                    cloudSeal.Sum(
                                        cloudSeal.Multiply(cloudSeal.Power(x, 5), new Complex(3.0 / 8.0, 0)),
                                        cloudSeal.Multiply(cloudSeal.Multiply(cloudSeal.Power(x, 3), scaleConst2), new Complex(-10.0 / 8.0, 0))
                                    ),
                                    cloudSeal.Multiply(cloudSeal.Multiply(x, scaleConst4), new Complex(15.0 / 8.0, 0))
                                ));
                        }
                    }
                    break;
                case 3:
                    {
                        var (scaleConst2, scaleConst4, scaleConst6) = (cloudSeal.Power(defaultConst, 2), cloudSeal.Power(defaultConst, 4), cloudSeal.Power(defaultConst, 6));
                        for (int i = 0; i < d; i++)
                        {
                            x = ReEncryptValue(cloudSeal.Sum(
                                    cloudSeal.Sum(
                                        cloudSeal.Multiply(cloudSeal.Power(x, 7), new Complex(-5.0 / 16.0, 0)),
                                        cloudSeal.Multiply(cloudSeal.Multiply(cloudSeal.Power(x, 5), scaleConst2), new Complex(21.0 / 16.0, 0))
                                    ),
                                    cloudSeal.Sum(
                                        cloudSeal.Multiply(cloudSeal.Multiply(cloudSeal.Power(x, 3), scaleConst4), new Complex(-35.0 / 16.0, 0)),
                                        cloudSeal.Multiply(cloudSeal.Multiply(x, scaleConst6), new Complex(35.0 / 16.0, 0))
                                    )
                                ));
                        }
                    }
                    break;
            };
            return x;
        }

        private Ciphertext Abs(Ciphertext x, int n = 1, int d = 14)
        {
            return ReEncryptValue(cloudSeal.Multiply(x, Sgn(x, n, d)));
        }

        private Ciphertext Max(Ciphertext a, Ciphertext b, int n = 1, int d = 14)
        {
            var fst = cloudSeal.Sum(a, b);
            var snd = cloudSeal.Sum(a, cloudSeal.Negate(b));
            return ReEncryptValue(cloudSeal.Multiply(cloudSeal.Sum(fst, Abs(snd)), new Complex(0.5, 0)));
        }

        private Ciphertext Min(Ciphertext a, Ciphertext b, int n = 1, int d = 14)
        {
            var fst = cloudSeal.Sum(a, b);
            var snd = cloudSeal.Sum(a, cloudSeal.Negate(b));
            return ReEncryptValue(cloudSeal.Multiply(cloudSeal.Sum(fst, cloudSeal.Negate(Abs(snd))), new Complex(0.5, 0)));
        }

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
