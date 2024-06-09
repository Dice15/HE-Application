import { CKKSSeal } from "@/core/modules/homomorphic-encryption/ckks";
import { CipherText } from "node-seal/implementation/cipher-text";


export default class LogisticRegressionService {
    private constructor() { }


    public static predictKidneyDisease(ckksSeal: CKKSSeal, encryptedPatientsData: CipherText, chunkSizePerPatientData: number): CipherText {
        const slotCount = ckksSeal.getSlotCount();
        const intercept = this.getModelIntercept();
        const coefficients = this.getModelCoefficients();
        const polyCoefficients = this.getPolynomialCoefficients();

        // encrypt
        const encryptedIntercept = ckksSeal.encrypt(Array.from(
            { length: slotCount },
            () => intercept)
        );
        const encryptedCoefficients = ckksSeal.encrypt(Array.from(
            { length: slotCount / chunkSizePerPatientData },
            () => coefficients.concat(new Array(chunkSizePerPatientData - coefficients.length).fill(0))).flat()
        );
        const encryptedPolyCoefficients = polyCoefficients.map((polyCoefficient) => {
            return ckksSeal.encrypt(Array.from(
                { length: slotCount },
                () => polyCoefficient)
            );
        });
        const scaleCorrection = ckksSeal.encrypt(Array.from(
            { length: slotCount },
            () => 1)
        );

        // predict
        const encryptedLogit = ckksSeal.add(
            ckksSeal.sumElements(
                ckksSeal.multiply(encryptedCoefficients, encryptedPatientsData),
                chunkSizePerPatientData
            ),
            ckksSeal.multiply(encryptedIntercept, scaleCorrection)
        );

        let encryptedPredict = encryptedPolyCoefficients[0];
        let x = encryptedLogit.clone();
        let s = ckksSeal.multiply(scaleCorrection, scaleCorrection);

        for (let i = 1; i < encryptedPolyCoefficients.length; i++) {
            encryptedPredict = ckksSeal.add(
                ckksSeal.multiply(encryptedPredict, s),
                ckksSeal.multiply(encryptedPolyCoefficients[i], x)
            );
            x = ckksSeal.multiply(x, encryptedLogit);
        }

        return encryptedPredict;
    }


    private static getModelIntercept(): number {
        return -6.101711893520583;
    }


    private static getModelCoefficients(): number[] {
        return [
            0.01398650051838336, -0.6379353108266522, 3.562272326247278,
            -1.9544926946125556, -0.6843705470264562, 0.830985171352115,
            0.7262640836058694, -0.4044769693302832, -0.2783682924461222,
            -0.7189052471230606, -0.29513629565758825, -0.3512919472396584,
            0.3697299205833782, -0.016786620746445595, 2.005126114129826,
            1.758379181897018, -0.18823475550963797, 0.9647352024226244,
            -1.5522091477930857, -1.7939936284665887, -0.17095878760707586,
            -1.4704821576186111, -1.1343610664244765, -0.4749832639383366
        ]
    }


    private static getPolynomialCoefficients(): number[] {
        return [
            0.499864725820677, 0.19685858137950013, 2.092693273351213e-05,
            -0.005438054295619339, -5.269859640507143e-07, 7.488592485058805e-05,
            3.7518182187062745e-09, -3.568664944112792e-07
            // 0.499509755651757, 0.196809345741200, 0.000058588762850,
            // -0.005439803888197, -0.000001517035421, 0.000074967999198,
            // 0.000000009991278, -0.000000357551295
        ];
    }
}