import { CKKSSeal } from "@/core/modules/node-ckks/CKKSSeal";
import { CipherText } from "node-seal/implementation/cipher-text";


export default class FastKidneyDiseasePredictionService {
    private constructor() { }


    public static predictKidneyDisease(ckksSeal: CKKSSeal, encryptedPatientsData: CipherText, chunkSizePerPatientData: number): CipherText {
        const slotCount = ckksSeal.getSlotCount();
        const intercept = this.getModelIntercept();
        const coefficients = this.getModelCoefficients();


        /**
         * Encrypt linear regression model parameters:
         * 
         * intercept (intercept of the linear regression model)
         * coefficients (coefficients of the linear regression model)
         */
        const encryptedIntercept = ckksSeal.encrypt(Array.from(
            { length: slotCount },
            () => intercept)
        );
        const encryptedCoefficients = ckksSeal.encrypt(Array.from(
            { length: slotCount / chunkSizePerPatientData },
            () => coefficients.concat(new Array(chunkSizePerPatientData - coefficients.length).fill(0))).flat()
        );


        /**
         * Compute the linear regression formula:
         * predict = (coefficient * patientsData).sum + intercept
         */
        const mul_coef_pat = ckksSeal.multiply(encryptedCoefficients, encryptedPatientsData);
        const sum_feature = ckksSeal.sumElements(mul_coef_pat, chunkSizePerPatientData);
        const result = ckksSeal.add(sum_feature, encryptedIntercept);

        mul_coef_pat.delete();
        sum_feature.delete();


        /**
         * Clear resources and return
         */
        encryptedIntercept.delete();
        encryptedCoefficients.delete();

        return result;
    }


    private static getModelIntercept(): number {
        return -0.9187316984291245;
    }


    private static getModelCoefficients(): number[] {
        return [
            -0.048679266632216, -0.320403544732430, 0.729050323269200,
            -0.367482996543020, -0.052605427622177, 0.052538820178293,
            -0.116129053176325, 0.081432102516962, 0.044370466546876,
            -0.254182963093594, 0.128986738493353, 0.242814750966399,
            0.707590579406548, -0.138404721177172, 0.870227239358290,
            -0.007279127153422, 0.039198895907087, -0.010319417466081,
            -0.058067090087025, -0.046350509373686, 0.053633228194063,
            -0.050534520076565, -0.062903240930798, 0.076360701482898
        ]
    }
}