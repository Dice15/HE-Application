import { CKKSSealBuilder } from "@/core/modules/homomorphic-encryption/ckks";
import { NodeSealProvider } from "@/core/modules/homomorphic-encryption/node-seal";
import LinearRegressionService from "@/services/kidneyDiseasePrediction/LinearRegressionService";
import { Db } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-auth";


interface IKidneyDiseasePredictionControllerParams {
    serializedPatientInfo: string | undefined;
    chunkSizePerPatientData: string | undefined;
    predictModel: ("linear" | "logistic") | undefined;
}

export default class KidneyDiseasePredictionController {
    private constructor() { }


    public static async handlePredictKidneyDisease(request: NextApiRequest, response: NextApiResponse, session: Session, db: Db) {
        try {
            const { serializedPatientInfo, chunkSizePerPatientData, predictModel } = request.body as IKidneyDiseasePredictionControllerParams;

            if (!serializedPatientInfo || !chunkSizePerPatientData || !predictModel) {
                response.status(400).json({ msg: "Missing required body data." });
                return;
            }

            const serializedPublickey = await db.collection("publickey")
                .find({ id: session.user.id })
                .toArray()
                .then((chunks) => {
                    chunks.sort((a, b) => a.index - b.index);
                    return chunks.map(chunk => chunk.chunk).join('');
                });
            console.log('serializedPublickey', serializedPublickey.length)

            const serializedRelinKeys = await db.collection("relinkeys")
                .find({ id: session.user.id })
                .toArray()
                .then((chunks) => {
                    chunks.sort((a, b) => a.index - b.index);
                    return chunks.map(chunk => chunk.chunk).join('');
                });
            console.log('serializedRelinKeys', serializedRelinKeys.length)

            const serializedGaloisKey = await db.collection("galoiskey")
                .find({ id: session.user.id })
                .toArray()
                .then((chunks) => {
                    chunks.sort((a, b) => a.index - b.index);
                    return chunks.map(chunk => chunk.chunk).join('');
                });
            console.log('serializedGaloisKey', serializedGaloisKey.length)

            if (serializedPublickey.length === 0 || serializedRelinKeys.length === 0 || serializedGaloisKey.length === 0) {
                response.status(502).json({ msg: "Missing Key." });
                return;
            }

            switch (predictModel) {
                case "linear": {
                    const ckksSeal = new CKKSSealBuilder(await NodeSealProvider.getSeal(), Math.pow(2, 12), 2, Math.pow(2, 20))
                        .deserializePublicKey(serializedPublickey)
                        .deserializeRelinKeys(serializedRelinKeys)
                        .deserializeGaloisKey(serializedGaloisKey)
                        .build();

                    const prediction = LinearRegressionService.predictKidneyDisease(
                        ckksSeal,
                        ckksSeal.deserializeCipherText(serializedPatientInfo),
                        parseInt(chunkSizePerPatientData)
                    );

                    response.status(200).json({
                        msg: "정상적으로 처리되었습니다.",
                        data: {
                            prediction: ckksSeal.serializeCipherText(prediction),
                        }
                    });
                    break;
                }
                case "logistic": {
                    const ckksSeal = new CKKSSealBuilder(await NodeSealProvider.getSeal(), Math.pow(2, 15), 15, Math.pow(2, 40))
                        .deserializePublicKey(serializedPublickey)
                        .deserializeRelinKeys(serializedRelinKeys)
                        .deserializeGaloisKey(serializedGaloisKey)
                        .build();

                    const prediction = LinearRegressionService.predictKidneyDisease(
                        ckksSeal,
                        ckksSeal.deserializeCipherText(serializedPatientInfo),
                        parseInt(chunkSizePerPatientData)
                    );

                    response.status(200).json({
                        msg: "정상적으로 처리되었습니다.",
                        data: {
                            prediction: ckksSeal.serializeCipherText(prediction),
                        }
                    });
                    break;
                }
                default: {
                    response.status(500).end("지원하지 않는 모델입니다.");
                }
            }
        }
        catch (error) {
            console.error(error);
            response.status(500).end(`${error}`);
        }
    }
}