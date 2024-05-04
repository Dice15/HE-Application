import { BFVSealBuilder } from '@/core/modules/homomorphic-encryption/bfv';
import { NodeSealProvider } from '@/core/modules/homomorphic-encryption/node-seal';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    const { patient_sequence, serialized_publickey } = request.body;

    try {
        const node_seal = await NodeSealProvider.getSeal();
        const bfv_seal = new BFVSealBuilder().deserializePublicKey(serialized_publickey).build(node_seal);
        console.log(3333);
        const patient_seq = bfv_seal.deserializeCipherText(patient_sequence as string);
        console.log(3333);
        const reference_seq = bfv_seal.encrypt([0, 0, 5, 0, 6, 0, 0, 7]);
        console.log(4444);
        response.status(200).json({ message: "정상적으로 처리되었습니다.", predictionList: [bfv_seal.subtract(patient_seq, reference_seq).save()] });
    }
    catch (e) {
        response.status(502).json({ message: e, itemList: [] });
    }
}