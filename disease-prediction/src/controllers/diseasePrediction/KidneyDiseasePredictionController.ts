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
            const startTime = Date.now(); // 전체 처리 시작 시간
            const { featureSize, predictModel } = request.body as IKidneyDiseasePredictionControllerParams;


            if (featureSize === undefined || predictModel === undefined) {
                response.status(400).json({ msg: "Missing required body data." });
                return;
            }


            // const ckksSeal = await NodeSealProvider.getSeal().then((nodeSeal) => {
            //     return (predictModel === "linear"
            //         ? new CKKSSealBuilder(nodeSeal, nodeSeal.SecurityLevel.tc128, Math.pow(2, 14), [60, 60, 60, 60], Math.pow(2, 60))
            //         : new CKKSSealBuilder(nodeSeal, nodeSeal.SecurityLevel.tc128, Math.pow(2, 15), [60, 60, 60, 60, 60, 60, 60, 60, 60], Math.pow(2, 60))
            //     )
            //         .loadPublicKey()
            //         .createRelinKeys()
            //         .createGaloisKeys([1, 2, 4, 8, 16])
            //         .build()
            // })



            console.log("Start loading keys and patient data");
            const loadStartTime = Date.now(); // 키와 데이터 로드 시작 시간

            const [serializedPublickey, serializedRelinKeys, serializedGaloisKeys, serializedPatientData] = await Promise.all([
                CkksKeyManagementService.loadCkksKey(session.user.id, "publicKey").then((publicKey) => {
                    console.log(`Loaded publicKey: ${publicKey.length}(length)`);
                    return publicKey;
                }),
                CkksKeyManagementService.loadCkksKey(session.user.id, "relinKeys").then((relinKeys) => {
                    console.log(`Loaded relinKeys: ${relinKeys.length}(length)`);
                    return relinKeys;
                }),
                CkksKeyManagementService.loadCkksKey(session.user.id, "galoisKeys").then((galoisKeys) => {
                    console.log(`Loaded galoisKeys: ${galoisKeys.length}(length)`);
                    return galoisKeys;
                }),
                PatientDataManagementService.loadPatientData(session.user.id).then((patientData) => {
                    console.log(`Loaded patientData: ${patientData.length}(length)`);
                    return patientData;
                })
            ]);

            const loadEndTime = Date.now(); // 키와 데이터 로드 종료 시간
            console.log(`Time taken to load keys and patient data: ${loadEndTime - loadStartTime} ms`);

            if (serializedPublickey.length === 0 || serializedRelinKeys.length === 0 || serializedGaloisKeys.length === 0 || serializedPatientData.length === 0) {
                response.status(502).json({ msg: "Failed download." });
                return;
            }

            let buildStartTime, buildEndTime, predictStartTime, predictEndTime;
            switch (predictModel) {
                case "linear": {
                    console.log("Start building CKKS seal for linear model");
                    buildStartTime = Date.now(); // CKKS Seal 빌드 시작 시간

                    const ckksSeal = await NodeSealProvider.getSeal().then((nodeSeal) => {
                        return new CKKSSealBuilder(nodeSeal, nodeSeal.SecurityLevel.tc128, Math.pow(2, 14), [60, 60, 60, 60], Math.pow(2, 60))
                            .loadPublicKey(serializedPublickey)
                            .loadRelinKeys(serializedRelinKeys)
                            .loadGaloisKeys(serializedGaloisKeys)
                            .build();
                    });

                    buildEndTime = Date.now(); // CKKS Seal 빌드 종료 시간
                    console.log(`Time taken to build CKKS seal (linear model): ${buildEndTime - buildStartTime} ms`);

                    console.log("Start predicting using the fast kidney disease prediction service");
                    predictStartTime = Date.now(); // 예측 시작 시간

                    const prediction = FastKidneyDiseasePredictionService.predictKidneyDisease(
                        ckksSeal,
                        ckksSeal.deserializeCipherText(serializedPatientData),
                        parseInt(featureSize)
                    );

                    predictEndTime = Date.now(); // 예측 종료 시간
                    console.log(`Time taken to predict (linear model): ${predictEndTime - predictStartTime} ms`);

                    response.status(200).json({
                        msg: "정상적으로 처리되었습니다.",
                        data: {
                            prediction: this.uint8ArrayToBase64(ckksSeal.serializeCipherText(prediction)),
                        }
                    });
                    break;
                }
                case "logistic": {
                    console.log("Start building CKKS seal for logistic model");
                    buildStartTime = Date.now(); // CKKS Seal 빌드 시작 시간

                    const ckksSeal = await NodeSealProvider.getSeal().then((nodeSeal) => {
                        return new CKKSSealBuilder(nodeSeal, nodeSeal.SecurityLevel.tc128, Math.pow(2, 15), [60, 60, 60, 60, 60, 60, 60, 60, 60], Math.pow(2, 60))
                            .loadPublicKey(serializedPublickey)
                            .loadRelinKeys(serializedRelinKeys)
                            .loadGaloisKeys(serializedGaloisKeys)
                            .build();
                    });

                    buildEndTime = Date.now(); // CKKS Seal 빌드 종료 시간
                    console.log(`Time taken to build CKKS seal (logistic model): ${buildEndTime - buildStartTime} ms`);

                    console.log("Start predicting using the accurate kidney disease prediction service");
                    predictStartTime = Date.now(); // 예측 시작 시간

                    const prediction = AccurateKidneyDiseasePredictionService.predictKidneyDisease(
                        ckksSeal,
                        ckksSeal.deserializeCipherText(serializedPatientData),
                        parseInt(featureSize)
                    );

                    predictEndTime = Date.now(); // 예측 종료 시간
                    console.log(`Time taken to predict (logistic model): ${predictEndTime - predictStartTime} ms`);

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

            const endTime = Date.now(); // 전체 처리 종료 시간
            console.log(`Total time taken: ${endTime - startTime} ms`);
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