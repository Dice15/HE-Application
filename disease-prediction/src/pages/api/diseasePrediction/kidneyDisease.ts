import { CKKSSeal, CKKSSealBuilder } from '@/core/modules/homomorphic-encryption/ckks';
import { NodeSealProvider } from '@/core/modules/homomorphic-encryption/node-seal';
import { NextApiRequest, NextApiResponse } from 'next';
import { CipherText } from 'node-seal/implementation/cipher-text';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb'
        }
    }
};


const MRLmodel = {
    features: ['age', 'bp', 'sg', 'al', 'su', 'rbc', 'pc', 'pcc', 'ba', 'bgr', 'bu', 'sc', 'sod', 'pot', 'hemo', 'pcv', 'wc', 'rc', 'htn', 'dm', 'cad', 'appet', 'pe', 'ane'],
    intercept: -0.9187316984291245,
    coefficients: {
        age: -0.048679266632216,
        bp: -0.320403544732430,
        sg: 0.729050323269200,
        al: -0.367482996543020,
        su: -0.052605427622177,
        rbc: 0.052538820178293,
        pc: -0.116129053176325,
        pcc: 0.081432102516962,
        ba: 0.044370466546876,
        bgr: -0.254182963093594,
        bu: 0.128986738493353,
        sc: 0.242814750966399,
        sod: 0.707590579406548,
        pot: -0.138404721177172,
        hemo: 0.870227239358290,
        pcv: -0.007279127153422,
        wc: 0.039198895907087,
        rc: -0.010319417466081,
        htn: -0.058067090087025,
        dm: -0.046350509373686,
        cad: 0.053633228194063,
        appet: -0.050534520076565,
        pe: -0.062903240930798,
        ane: 0.076360701482898
    } as Record<string, number>,
}

const featureCoefficients: Record<string, number> = {
    age: -0.048679266632216,
    bp: -0.320403544732430,
    sg: 0.729050323269200,
    al: -0.367482996543020,
    su: -0.052605427622177,
    rbc: 0.052538820178293,
    pc: -0.116129053176325,
    pcc: 0.081432102516962,
    ba: 0.044370466546876,
    bgr: -0.254182963093594,
    bu: 0.128986738493353,
    sc: 0.242814750966399,
    sod: 0.707590579406548,
    pot: -0.138404721177172,
    hemo: 0.870227239358290,
    pcv: -0.007279127153422,
    wc: 0.039198895907087,
    rc: -0.010319417466081,
    htn: -0.058067090087025,
    dm: -0.046350509373686,
    cad: 0.053633228194063,
    appet: -0.050534520076565,
    pe: -0.062903240930798,
    ane: 0.076360701482898
};

function predictKidneyDisease(ckksSeal: CKKSSeal, inputs: CipherText): CipherText {
    const scaleConst = ckksSeal.encrypt([1]);
    const intercept = ckksSeal.encrypt([MRLmodel.intercept]);
    const coefficients = ckksSeal.encrypt(MRLmodel.features.map(key => MRLmodel.coefficients[key]));
    return ckksSeal.add(ckksSeal.sum(ckksSeal.multiply(coefficients, inputs)), ckksSeal.multiply(scaleConst, intercept));
}


export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    const { serializedPatientInfo, serializedPublickey, serializedRelinKeys, serializedGaloisKey } = request.body;

    try {
        const nodeSeal = await NodeSealProvider.getSeal();
        const ckksSeal = new CKKSSealBuilder()
            .deserializePublicKey(serializedPublickey)
            .deserializeRelinKeys(serializedRelinKeys)
            .deserializeGaloisKey(serializedGaloisKey)
            .build(nodeSeal);
        const patientInfo = ckksSeal.deserializeCipherText(serializedPatientInfo as string);
        const prediction = predictKidneyDisease(ckksSeal, patientInfo);
 
        response.status(200).json({ message: "정상적으로 처리되었습니다.", prediction: ckksSeal.serializeCipherText(prediction) });
    }
    catch (e) {
        response.status(502).json({ message: e, prediction: null });
    }
}