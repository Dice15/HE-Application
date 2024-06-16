import { CKKSSealBuilder } from "@/core/modules/homomorphic-encryption/ckks";
import { NodeSealProvider } from "@/core/modules/homomorphic-encryption/node-seal";
import LinearRegressionService from "@/services/kidneyDiseasePrediction/LinearRegressionService";
import LogisticRegressionService from "@/services/kidneyDiseasePrediction/LogisticRegressionService";
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

            console.log(chunkSizePerPatientData, predictModel)

            const serializedPublickey = await db.collection("publickey")
                .find({ id: session.user.id })
                .toArray()
                .then((chunks) => {
                    chunks.sort((a, b) => a.index - b.index);
                    return this.mergeUint8Arrays(chunks.map(chunk => this.base64ToUint8Array(chunk.chunk)));
                });
            console.log('serializedPublickey', serializedPublickey.length)

            const serializedRelinKeys = await db.collection("relinkeys")
                .find({ id: session.user.id })
                .toArray()
                .then((chunks) => {
                    chunks.sort((a, b) => a.index - b.index);
                    return this.mergeUint8Arrays(chunks.map(chunk => this.base64ToUint8Array(chunk.chunk)));
                });
            console.log('serializedRelinKeys', serializedRelinKeys.length)


            const serializedGaloisKey = await db.collection("galoiskey")
                .find({ id: session.user.id })
                .toArray()
                .then((chunks) => {
                    chunks.sort((a, b) => a.index - b.index);
                    return this.mergeUint8Arrays(chunks.map(chunk => this.base64ToUint8Array(chunk.chunk)));
                });
            console.log('serializedGaloisKeys', serializedGaloisKey.length)

            if (serializedPublickey.length === 0 || serializedRelinKeys.length === 0 || serializedGaloisKey.length === 0) {
                response.status(502).json({ msg: "Missing Key." });
                return;
            }

            switch (predictModel) {
                case "linear": {
                    const ckksSeal = await NodeSealProvider.getSeal().then((nodeSeal) => {
                        return new CKKSSealBuilder(nodeSeal, nodeSeal.SecurityLevel.tc128)
                            .setCoeffModulus(Math.pow(2, 14), [60, 60, 60, 60])
                            .setScale(Math.pow(2, 60))
                            .setRotationSteps([1, 2, 4, 8, 16])
                            .deserializePublicKey(serializedPublickey)
                            .deserializeRelinKeys(serializedRelinKeys)
                            .deserializeGaloisKey(serializedGaloisKey)
                            .build();
                    });

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
                    const ckksSeal = await NodeSealProvider.getSeal().then((nodeSeal) => {
                        return new CKKSSealBuilder(nodeSeal, nodeSeal.SecurityLevel.tc128)
                            .setCoeffModulus(Math.pow(2, 15), [60, 60, 60, 60, 60, 60, 60, 60, 60])
                            .setScale(Math.pow(2, 60))
                            .setRotationSteps([1, 2, 4, 8, 16])
                            .deserializePublicKey(serializedPublickey)
                            .deserializeRelinKeys(serializedRelinKeys)
                            .deserializeGaloisKey(serializedGaloisKey)
                            .build();
                    });

                    const prediction = LogisticRegressionService.predictKidneyDisease(
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


    private static base64ToUint8Array(base64: string): Uint8Array {
        const binaryString = atob(base64);
        const length = binaryString.length;
        const bytes = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }


    private static mergeUint8Arrays(arrays: Uint8Array[]): Uint8Array {
        const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
        const mergedArray = new Uint8Array(totalLength);

        let offset = 0;
        for (const arr of arrays) {
            mergedArray.set(arr, offset);
            offset += arr.length;
        }
        return mergedArray;
    }
}