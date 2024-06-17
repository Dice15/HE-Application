import { CKKSSealBuilder } from "@/core/modules/homomorphic-encryption/ckks";
import { NodeSealProvider } from "@/core/modules/homomorphic-encryption/node-seal";
import CkksKeyManagementService from "@/services/ckksKeyManager/CkksKeyManagementService";
import AccurateKidneyDiseasePredictionService from "@/services/diseasePrediction/AccurateKidneyDiseasePredictionService";
import FastKidneyDiseasePredictionService from "@/services/diseasePrediction/FastKidneyDiseasePredictionService";
import PatientDataManagementService from "@/services/patientDataManager/PatientDataManagementService";
import { NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-auth";


interface IKidneyDiseasePredictionControllerParams {
    featureSize: string | undefined;
    predictModel: ("linear" | "logistic") | undefined;
}


export default class KidneyDiseasePredictionController {
    private constructor() { }


    public static async handlePredictKidneyDisease(request: NextApiRequest, response: NextApiResponse, session: Session): Promise<void> {
        try {
            const { featureSize, predictModel } = request.body as IKidneyDiseasePredictionControllerParams;

            if (featureSize === undefined || predictModel === undefined) {
                response.status(400).json({ msg: "Missing required body data." });
                return;
            }

            const serializedPublickey = await CkksKeyManagementService.loadCkksKey(session.user.id, "publicKey").then((publicKey) => {
                console.log(`Loaded publicKey: ${publicKey.length}(length)`);
                return publicKey;
            });

            const serializedRelinKeys = await CkksKeyManagementService.loadCkksKey(session.user.id, "relinKeys").then((relinKeys) => {
                console.log(`Loaded relinKeys: ${relinKeys.length}(length)`);
                return relinKeys;
            });

            const serializedGaloisKeys = await CkksKeyManagementService.loadCkksKey(session.user.id, "galoisKeys").then((galoisKeys) => {
                console.log(`Loaded galoisKeys: ${galoisKeys.length}(length)`);
                return galoisKeys;
            });

            const serializedPatientData = await PatientDataManagementService.loadPatientData(session.user.id).then((patientData) => {
                console.log(`Loaded patientData: ${patientData.length}(length)`);
                return patientData;
            });

            if (serializedPublickey.length === 0 || serializedRelinKeys.length === 0 || serializedGaloisKeys.length === 0 || serializedPatientData.length === 0) {
                response.status(502).json({ msg: "Failed download." });
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
                        ckksSeal.deserializeCipherText(serializedPatientData),
                        parseInt(featureSize)
                    );

                    response.status(200).json({
                        msg: "정상적으로 처리되었습니다.",
                        data: {
                            prediction: this.uint8ArrayToBase64(ckksSeal.serializeCipherText(prediction)),
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
                        ckksSeal.deserializeCipherText(serializedPatientData),
                        parseInt(featureSize)
                    );

                    response.status(200).json({
                        msg: "정상적으로 처리되었습니다.",
                        data: {
                            prediction: this.uint8ArrayToBase64(ckksSeal.serializeCipherText(prediction)),
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

    private static uint8ArrayToBase64(arr: Uint8Array): string {
        let binaryString = '';
        for (let i = 0; i < arr.length; i++) {
            binaryString += String.fromCharCode(arr[i]);
        }
        return btoa(binaryString);
    }
}