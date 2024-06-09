import { CKKSSeal } from "@/core/modules/homomorphic-encryption/ckks";
import { CipherText } from "node-seal/implementation/cipher-text";


export default class LinearRegressionService {
    private constructor() { }


    public static predictKidneyDisease(ckksSeal: CKKSSeal, encryptedPatientsData: CipherText, chunkSizePerPatientData: number): CipherText {
        const slotCount = ckksSeal.getSlotCount();
        const intercept = this.getModelIntercept();
        const coefficients = this.getModelCoefficients();

        // encrypt
        const encryptedIntercept = ckksSeal.encrypt(Array.from(
            { length: slotCount },
            () => intercept)
        );
        const encryptedCoefficients = ckksSeal.encrypt(Array.from(
            { length: slotCount / chunkSizePerPatientData },
            () => coefficients.concat(new Array(chunkSizePerPatientData - coefficients.length).fill(0))).flat()
        );
        const scaleCorrection = ckksSeal.encrypt(Array.from(
            { length: slotCount },
            () => 1)
        );

        // predict
        return ckksSeal.add(
            ckksSeal.sumElements(
                ckksSeal.multiply(encryptedCoefficients, encryptedPatientsData),
                chunkSizePerPatientData
            ),
            ckksSeal.multiply(scaleCorrection, encryptedIntercept)
        );
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


// const MRLmodel = {
//     features: ['age', 'bp', 'sg', 'al', 'su', 'rbc', 'pc', 'pcc', 'ba', 'bgr', 'bu', 'sc', 'sod', 'pot', 'hemo', 'pcv', 'wc', 'rc', 'htn', 'dm', 'cad', 'appet', 'pe', 'ane'],

//     intercept: -0.9187316984291245,
//     coefficients: {
//         age: -0.048679266632216,
//         bp: -0.320403544732430,
//         sg: 0.729050323269200,
//         al: -0.367482996543020,
//         su: -0.052605427622177,
//         rbc: 0.052538820178293,
//         pc: -0.116129053176325,
//         pcc: 0.081432102516962,
//         ba: 0.044370466546876,
//         bgr: -0.254182963093594,
//         bu: 0.128986738493353,
//         sc: 0.242814750966399,
//         sod: 0.707590579406548,
//         pot: -0.138404721177172,
//         hemo: 0.870227239358290,
//         pcv: -0.007279127153422,
//         wc: 0.039198895907087,
//         rc: -0.010319417466081,
//         htn: -0.058067090087025,
//         dm: -0.046350509373686,
//         cad: 0.053633228194063,
//         appet: -0.050534520076565,
//         pe: -0.062903240930798,
//         ane: 0.076360701482898
//     } as Record<string, number>,
// }


