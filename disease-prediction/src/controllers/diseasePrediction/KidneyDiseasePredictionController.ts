import { CKKSSealBuilder } from "@/core/modules/homomorphic-encryption/ckks";
import { NodeSealProvider } from "@/core/modules/homomorphic-encryption/node-seal";
import CkksKeyManagementService from "@/services/ckksKeyManager/CkksKeyManagementService";
import AccurateKidneyDiseasePredictionService from "@/services/diseasePrediction/AccurateKidneyDiseasePredictionService";
import FastKidneyDiseasePredictionService from "@/services/diseasePrediction/FastKidneyDiseasePredictionService";
import { NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-auth";


interface IKidneyDiseasePredictionControllerParams {
    serializedPatientInfo: string | undefined;
    chunkSizePerPatientData: string | undefined;
    predictModel: ("linear" | "logistic") | undefined;
}


export default class KidneyDiseasePredictionController {
    private constructor() { }


    public static async handlePredictKidneyDisease(request: NextApiRequest, response: NextApiResponse, session: Session): Promise<void> {
        try {
            const { serializedPatientInfo, chunkSizePerPatientData, predictModel } = request.body as IKidneyDiseasePredictionControllerParams;

            if (serializedPatientInfo === undefined || chunkSizePerPatientData === undefined || predictModel === undefined) {
                response.status(400).json({ msg: "Missing required body data." });
                return;
            }

            const serializedPublickey = await CkksKeyManagementService.loadCkksKey(session.user.id, "publicKey");
            const serializedRelinKeys = await CkksKeyManagementService.loadCkksKey(session.user.id, "relinKeys");
            const serializedGaloisKeys = await CkksKeyManagementService.loadCkksKey(session.user.id, "galoisKeys");

            if (serializedPublickey.length === 0 || serializedRelinKeys.length === 0 || serializedGaloisKeys.length === 0) {
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
                            .deserializeGaloisKey(serializedGaloisKeys)
                            .build();
                    });

                    const prediction = FastKidneyDiseasePredictionService.predictKidneyDisease(
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
                            .deserializeGaloisKey(serializedGaloisKeys)
                            .build();
                    });

                    const prediction = AccurateKidneyDiseasePredictionService.predictKidneyDisease(
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