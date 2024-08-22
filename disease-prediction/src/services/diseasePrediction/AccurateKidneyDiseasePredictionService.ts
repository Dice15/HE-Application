import { CKKSSeal } from "@/core/modules/node-ckks/CKKSSeal";
import { CipherText } from "node-seal/implementation/cipher-text";
import { PlainText } from "node-seal/implementation/plain-text";


export default class AccurateKidneyDiseasePredictionService {
    private constructor() { }


    public static predictKidneyDisease(ckksSeal: CKKSSeal, encryptedPatientsData: CipherText, chunkSizePerPatientData: number): CipherText {
        const slotCount = ckksSeal.getSlotCount();
        const intercept = this.getModelIntercept();
        const coefficients = this.getModelCoefficients();
        const polyCoefficients = this.getPolynomialCoefficients();


        /**
         * Encrypt logistic regression model parameters:
         * 
         * intercept (intercept of the logistic regression model)
         * coefficients (coefficients of the logistic regression model)
         * polyCoefficients (polynomial approximation of the sigmoid function)
         */
        const encodedIntercept = ckksSeal.encode(Array.from(
            { length: slotCount },
            () => intercept)
        );
        const encodedCoefficients = ckksSeal.encode(Array.from(
            { length: slotCount / chunkSizePerPatientData },
            () => coefficients.concat(new Array(chunkSizePerPatientData - coefficients.length).fill(0))).flat()
        );
        const encodedPolyCoefficients = polyCoefficients.map((polyCoefficient) => ckksSeal.encode(Array.from(
            { length: slotCount },
            () => polyCoefficient)
        ));


        /**
         * Compute logit using the logistic regression formula:
         * logit = (coefficient * patientsData).sum + intercept
         */
        const mul_coef_pat = ckksSeal.multiplyPlain(encryptedPatientsData, encodedCoefficients);
        const sum_feature = ckksSeal.sumElements(mul_coef_pat, chunkSizePerPatientData);
        const encryptedLogit = ckksSeal.addPlain(sum_feature, encodedIntercept);

        mul_coef_pat.delete();
        sum_feature.delete();


        /**
         * Polynomial approximation of the sigmoid function using the encrypted logit:
         * approximated_poly = a + bx + cx^2 + dx^3 + ex^4 + ex^5 + fx^6 + gx^7 + hx^8 + ix^9
         * 
         * To simplify, split into even and odd terms:
         * even_term = a + cx^2 + ex^4 + fx^6 + hx^8
         * odd_term = x(b + dx^2 + ex^4 + gx^6 + ix^8)
         */
        const encryptedX: CipherText[] = Array.from({ length: 9 });
        encryptedX[1] = encryptedLogit;
        encryptedX[2] = ckksSeal.multiply(encryptedX[1], encryptedX[1]);
        encryptedX[4] = ckksSeal.multiply(encryptedX[2], encryptedX[2]);
        encryptedX[6] = ckksSeal.multiply(encryptedX[4], encryptedX[2]);
        encryptedX[8] = ckksSeal.multiply(encryptedX[4], encryptedX[4]);

        const calcTerm = (term: CipherText, coef: PlainText, x: CipherText) => {
            const mul_coef_x = ckksSeal.multiplyPlain(x, coef);
            const acc_term = ckksSeal.add(mul_coef_x, term);
            term.move(acc_term);

            mul_coef_x.delete();
            acc_term.delete();
        }

        const evenTerm = ckksSeal.encryptPlain(encodedPolyCoefficients[0]);
        const oddTerm = ckksSeal.encryptPlain(encodedPolyCoefficients[1]);

        for (let i = 2; i <= 8; i += 2) {
            calcTerm(evenTerm, encodedPolyCoefficients[i], encryptedX[i]);
            calcTerm(oddTerm, encodedPolyCoefficients[i + 1], encryptedX[i]);
        }
        const mul_term_x = ckksSeal.multiply(oddTerm, encryptedX[1]);
        oddTerm.move(mul_term_x);
        mul_term_x.delete();

        const result = ckksSeal.add(evenTerm, oddTerm);


        /**
         * Clear resources and return
         */
        encodedIntercept.delete();
        encodedCoefficients.delete();
        encodedPolyCoefficients.forEach((coef) => coef?.delete());
        encryptedX.forEach((x) => x?.delete());
        encryptedLogit.delete();
        evenTerm.delete();
        oddTerm.delete();

        return result;
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
            0.4920606670473685,
            0.23447399924078643, 0.00977937740579908, -0.011521697188317602,
            -0.0016615546346409064, 0.00018619150355179287, 6.59963413276544e-05,
            6.576185348908745e-06, 2.94134295931785e-07, 5.060488695969559e-09
        ];
    }
}