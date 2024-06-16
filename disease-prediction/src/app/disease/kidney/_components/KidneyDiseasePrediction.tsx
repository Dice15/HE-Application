"use client"

import { CKKSSeal, CKKSSealBuilder } from '@/core/modules/homomorphic-encryption/ckks';
import styled from "styled-components";
import { NodeSealProvider } from '@/core/modules/homomorphic-encryption/node-seal';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import PatientTable from './PatientTable';
import ProgressBar from './ProgressBar';
import PatientUploader from './PatientUploader';
import PredictModelSelector from './PredictModelSelector';
import { KidneyDisease } from '../_classes/KidneyDisease';
import { CipherText } from 'node-seal/implementation/cipher-text';


export default function KidneyDiseasePrediction() {
    const [predictionModel, setPredictionModel] = useState<'linear' | 'logistic'>('linear');
    const [uploadedPatientData, setUploadedPatientData] = useState<any[]>([]);
    const [predictions, setPredictions] = useState<boolean[]>([]);
    const [progressPercent, setProgressPercent] = useState<number>(0);


    // handler
    const handleShowProcessing = useCallback((title: string, text: string): void => {
        Swal.fire({
            title: title,
            text: text,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
    }, []);


    const handleHideProcessing = useCallback((): void => {
        Swal.close();
    }, []);


    const handleCreateCkksSeal = useCallback(async (predictModel: "linear" | "logistic"): Promise<CKKSSeal> => {
        return NodeSealProvider.getSeal()
            .then((nodeSeal) => {
                return predictModel === "linear"
                    ? new CKKSSealBuilder(nodeSeal, nodeSeal.SecurityLevel.tc128)
                        .setCoeffModulus(Math.pow(2, 14), [60, 60, 60, 60])
                        .setScale(Math.pow(2, 60))
                        .setRotationSteps([1, 2, 4, 8, 16])
                        .build()
                    : new CKKSSealBuilder(nodeSeal, nodeSeal.SecurityLevel.tc128)
                        .setCoeffModulus(Math.pow(2, 15), [60, 60, 60, 60, 60, 60, 60, 60, 60])
                        .setScale(Math.pow(2, 60))
                        .setRotationSteps([1, 2, 4, 8, 16])
                        .build();
            })
            .catch((error) => {
                console.error("An error occurred:", error);
                if (error instanceof Error) {
                    throw new Error(`Failed to initializing CkksSeal: ${error.message}`);
                } else {
                    throw new Error('An unknown error occurred while initializing the CkksSeal');
                }
            });
    }, []);


    const handleUploadCkksKey = useCallback(async (ckksSeal: CKKSSeal): Promise<void> => {
        const CHUNK_SIZE_MB = 1;
        const CHUNK_SIZE_BYTES = CHUNK_SIZE_MB * 1024 * 1024;

        const splitIntoChunks = (arr: Uint8Array, chunkSize: number): Uint8Array[] => {
            const chunks = [];
            for (let i = 0; i < arr.length; i += chunkSize) {
                chunks.push(arr.slice(i, i + chunkSize));
            }
            return chunks;
        }

        const uint8ArrayToBase64 = (arr: Uint8Array): string => {
            let binaryString = '';
            for (let i = 0; i < arr.length; i++) {
                binaryString += String.fromCharCode(arr[i]);
            }
            return btoa(binaryString);
        }

        const saveChunks = async (chunks: Uint8Array[], keyType: "publicKey" | "relinKeys" | "galoisKeys") => {
            for (let i = 0; i < chunks.length; i++) {
                const base64Chunk = uint8ArrayToBase64(chunks[i]);
                await axios.post('/api/ckksKeyManager/ckksKeyManagement', {
                    chunk: base64Chunk,
                    index: i,
                    keyType: keyType
                });
            }
        }

        return Promise.all(
            [
                saveChunks(splitIntoChunks(ckksSeal.serializePublicKey(), CHUNK_SIZE_BYTES), "publicKey"),
                saveChunks(splitIntoChunks(ckksSeal.serializeRelinKeys(), CHUNK_SIZE_BYTES), "relinKeys"),
                saveChunks(splitIntoChunks(ckksSeal.serializeGaloisKey(), CHUNK_SIZE_BYTES), "galoisKeys")
            ])
            .then(() => { })
            .catch((error) => {
                console.error("An error occurred:", error);
                if (error instanceof Error) {
                    throw new Error(`Failed to uploading CkksKey: ${error.message}`);
                } else {
                    throw new Error('An unknown error occurred while uploading the CkksKey');
                }
            });
    }, []);


    const handleDeleteCkksKey = useCallback(async (): Promise<void> => {
        return axios.delete('/api/ckksKeyManager/ckksKeyManagement')
            .then(() => { })
            .catch((error) => {
                console.error("An error occurred:", error);
                if (error instanceof Error) {
                    throw new Error(`Failed to deleting CkksKey: ${error.message}`);
                } else {
                    throw new Error('An unknown error occurred while deleting the CkksKey');
                }
            });
    }, []);


    const handleUploadPatientData = useCallback(async (ckksSeal: CKKSSeal, patientData: any[]): Promise<void> => {
        const CHUNK_SIZE_MB = 1;
        const CHUNK_SIZE_BYTES = CHUNK_SIZE_MB * 1024 * 1024;

        const splitIntoChunks = (arr: Uint8Array, chunkSize: number): Uint8Array[] => {
            const chunks = [];
            for (let i = 0; i < arr.length; i += chunkSize) {
                chunks.push(arr.slice(i, i + chunkSize));
            }
            return chunks;
        }

        const uint8ArrayToBase64 = (arr: Uint8Array): string => {
            let binaryString = '';
            for (let i = 0; i < arr.length; i++) {
                binaryString += String.fromCharCode(arr[i]);
            }
            return btoa(binaryString);
        }

        const saveChunks = async (chunks: Uint8Array[]): Promise<void> => {
            for (let i = 0; i < chunks.length; i++) {
                const base64Chunk = uint8ArrayToBase64(chunks[i]);
                await axios.post('/api/patientDataManager/patientDataManagement', {
                    chunk: base64Chunk,
                    index: i,
                });
            }
        }

        return saveChunks(splitIntoChunks(ckksSeal.serializeCipherText(ckksSeal.encrypt(patientData)), CHUNK_SIZE_BYTES))
            .then(() => { })
            .catch((error) => {
                console.error("An error occurred:", error);
                if (error instanceof Error) {
                    throw new Error(`Failed to uploading patient data: ${error.message}`);
                } else {
                    throw new Error('An unknown error occurred while uploading the patient data');
                }
            });
    }, []);


    const handleDeletePatientData = useCallback(async (): Promise<void> => {
        return axios.delete('/api/patientDataManager/patientDataManagement')
            .then(() => { })
            .catch((error) => {
                console.error("An error occurred:", error);
                if (error instanceof Error) {
                    throw new Error(`Failed to deleting patient data: ${error.message}`);
                } else {
                    throw new Error('An unknown error occurred while deleting the patient data');
                }
            });
    }, []);


    // const predicting = useCallback((ckksSeal: CKKSSeal, zippedData: any[][], chunkSize: number, predictModel: "linear" | "logistic", afterPredict: (prediction: number[], index: number) => void): Promise<void>[] => {
    //     return zippedData.map((data, index) => {
    //         const body = {
    //             serializedPatientInfo: ckksSeal.serializeCipherText(ckksSeal.encrypt(data)),
    //             chunkSizePerPatientData: chunkSize,
    //             predictModel: predictModel
    //         };

    //         return axios.post('/api/diseasePrediction/kidneyDiseasePrediction', body)
    //             .then((response) => {
    //                 afterPredict(ckksSeal.decrypt(ckksSeal.deserializeCipherText(response.data.data.prediction as string)), index);
    //             })
    //             .catch(error => {
    //                 console.error("Prediction error:", error);
    //             });
    //     })
    // }, []);


    const handleStartPredict = useCallback(async () => {
        setPredictions(Array.from({ length: uploadedPatientData.length }, () => false));
        setProgressPercent(0);

        handleShowProcessing('Processing', 'Initializing CkksSeal');
        await handleCreateCkksSeal(predictionModel)
            .then(async (ckksSeal) => {
                handleShowProcessing('Processing', 'Uploading Ckkskey');

                await handleUploadCkksKey(ckksSeal)
                    .then(async () => {
                        handleShowProcessing('Processing', 'Predicting kidneydisease');

                        const patientData = KidneyDisease.preprocessPatientData(JSON.parse(JSON.stringify(uploadedPatientData, null, 2)) as any[]);
                        const zippedPatientData = ckksSeal.arrayZipper(patientData.rows);

                        for (let i = 0, progressCounter = 0; i < zippedPatientData.zippedData.length; i++) {
                            await handleUploadPatientData(ckksSeal, zippedPatientData.zippedData[i])
                                .then(() => {
                                    setProgressPercent((++progressCounter / zippedPatientData.zippedData.length) * 100)
                                })
                                .catch(() => {
                                    throw new Error('Uploading patient data failed');
                                })
                                .finally(async () => {
                                    await handleDeletePatientData();
                                });
                        }
                    })
                    .catch(async () => {
                        await Swal.fire({
                            icon: 'error',
                            title: 'Oops...',
                            text: 'Failed to uploading CkksKey.',
                            allowOutsideClick: false,
                        });
                    })
                    .finally(async () => {
                        await handleDeleteCkksKey();
                    })
            })
            .catch(async () => {
                await Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Failed to initializing CkksSeal.',
                    allowOutsideClick: false,
                });
            })
            .finally(() => {
                handleHideProcessing();
            });
    }, [uploadedPatientData, handleShowProcessing, handleCreateCkksSeal, predictionModel, handleUploadCkksKey, handleUploadPatientData, handleDeletePatientData, handleDeleteCkksKey, handleHideProcessing]);



    // const handleStartPredict = useCallback(async () => {
    //     handleShowLoading('Loading...', 'Node Seal is being initialized.');
    //     const ckksSeal = await handleCreateCkksSeal(predictModel);

    //     if (ckksSeal) {
    //         handleShowLoading('Predicting...', 'Predicting patient information.');
    //         setProgress(0);
    //         setPredictions(Array.from({ length: patients.length }, () => false));

    //         const features = KidneyDisease.getFeatures();
    //         const samples = KidneyDisease.transformToMLData(JSON.parse(JSON.stringify(patients, null, 2)) as any[]);

    //         const { zippedData, chunkSize } = ckksSeal.arrayZipper(samples.map((sample) => features.map(feature => (sample[feature] || 0))));
    //         const slotCount = ckksSeal.getSlotCount();

    //         zippedData.forEach((data, index) => {
    //             console.log(ckksSeal.serializeCipherText(ckksSeal.encrypt(data)).length);
    //         })


    //         let progressCounter = 0;
    //         uploadCkksKey(ckksSeal).then(() => {
    //             Promise.allSettled(
    //                 predicting(ckksSeal, zippedData, chunkSize, predictModel, (prediction: number[], index: number) => {
    //                     const sliceCount = Math.floor(slotCount / chunkSize);
    //                     const startIndex = sliceCount * index;

    //                     for (let i = 0; i < sliceCount; i++) {
    //                         //console.log(startIndex + i, (1 / (1 + Math.exp(-prediction[i * chunkSize]))));
    //                         //const result = KidneyDisease.isDisease(1 / (1 + Math.exp(- prediction[i * chunkSize])));
    //                         const result = KidneyDisease.isDisease(prediction[i * chunkSize] as number);

    //                         setPredictions(prevResults => {
    //                             const newResults = [...prevResults];
    //                             newResults[startIndex + i] = result;
    //                             return newResults;
    //                         });
    //                     }

    //                     setProgress((++progressCounter / zippedData.length) * 100);
    //                 })
    //             ).then(() => {
    //                 deleteCkksKey().then(() => {
    //                     setTimeout(() => { hideLoading() }, 2000);
    //                 })
    //             });
    //         })
    //     }

    //     setTimeout(() => { hideLoading() }, 2000);
    // }, [handleCreateCkksSeal, hideLoading, uploadCkksKey, deleteCkksKey, patients, predictModel, predicting, handleShowLoading]);


    // useEffect(() => {
    //     const temp = async () => {
    //         const ckksSeal = await NodeSealProvider.getSeal().then((nodeSeal) => {
    //             return new CKKSSealBuilder(nodeSeal, nodeSeal.SecurityLevel.tc128)
    //                 .setCoeffModulus(Math.pow(2, 14), [60, 60, 60, 60])
    //                 .setScale(Math.pow(2, 60))
    //                 .setRotationSteps([1, 2, 4, 8, 16])
    //                 .build();
    //         });

    //         console.log(ckksSeal.serializePublicKey().length);
    //         console.log(ckksSeal.serializeRelinKeys().length);
    //         console.log(ckksSeal.serializeGaloisKey().length);

    //         const intercept = ckksSeal.encrypt([0.0025]);
    //         const coefficients = ckksSeal.encrypt([0.03]);
    //         const patientsData = ckksSeal.encrypt([0.05]);

    //         const logit = ckksSeal.add(
    //             ckksSeal.sumElements(ckksSeal.multiply(coefficients, patientsData), 24),
    //             intercept
    //         );
    //         console.log(ckksSeal.decrypt(logit)[0]);
    //     }
    //     temp();
    // }, []);


    // useEffect(() => {
    //     const temp = async () => {
    //         const ckksSeal = await NodeSealProvider.getSeal().then((nodeSeal) => {
    //             return new CKKSSealBuilder(nodeSeal, nodeSeal.SecurityLevel.tc128)
    //                 .setCoeffModulus(Math.pow(2, 15), [60, 60, 60, 60, 60, 60, 60, 60, 60])
    //                 .setScale(Math.pow(2, 60))
    //                 .setRotationSteps([1, 2, 4, 8, 16])
    //                 .build();
    //         });

    //         console.log(ckksSeal.serializePublicKey().length);
    //         console.log(ckksSeal.serializeRelinKeys().length);
    //         console.log(ckksSeal.serializeGaloisKey().length);

    //         const intercept = ckksSeal.encrypt([0.0025]);
    //         const coefficients = ckksSeal.encrypt([0.03]);
    //         const patientsData = ckksSeal.encrypt([0.05]);
    //         const polyCoefficients = [0, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    //             .map((polyCoefficient) => {
    //                 return ckksSeal.encrypt(Array.from({ length: ckksSeal.getSlotCount() }, () => polyCoefficient));
    //             });

    //         const logit = ckksSeal.add(
    //             ckksSeal.sumElements(ckksSeal.multiply(coefficients, patientsData), 25),
    //             intercept
    //         );
    //         console.log(ckksSeal.decrypt(logit)[0]);


    //         let x = Array.from({ length: 9 }) as CipherText[];
    //         x[1] = logit;
    //         x[2] = ckksSeal.multiply(x[1], x[1]);
    //         x[4] = ckksSeal.multiply(x[2], x[2]);
    //         x[6] = ckksSeal.multiply(x[4], x[2]);
    //         x[8] = ckksSeal.multiply(x[4], x[4]);

    //         let even = polyCoefficients[0];
    //         let odd = polyCoefficients[1];

    //         for (let i = 2; i <= 8; i += 2) {
    //             even = ckksSeal.add(even, ckksSeal.multiply(polyCoefficients[i], x[i]));
    //             odd = ckksSeal.add(odd, ckksSeal.multiply(polyCoefficients[i + 1], x[i]));
    //         }

    //         const predict = ckksSeal.add(even, ckksSeal.multiply(odd, x[1]));

    //         let temp = 0;
    //         for (let i = 1; i <= 9; i++) {
    //             temp += Math.pow(0.004, i);
    //         }
    //         console.log(ckksSeal.decrypt(predict)[0], temp);
    //     }
    //     temp();
    // }, []);

    return (
        <Wrapper>
            <ConfigComponent>
                <PatientUploader
                    title={"환자 정보 CSV파일 업로드"}
                    setPatientsInfo={setUploadedPatientData}
                />
                <PredictModelSelector
                    predictModel={predictionModel}
                    setPredictModel={setPredictionModel}
                />
            </ConfigComponent>

            <PredictingContatiner>
                <ProgressBarField>
                    <ProgressBar progress={progressPercent} />
                </ProgressBarField>

                <StartPredictionButton onClick={handleStartPredict} disabled={uploadedPatientData.length === 0}>
                    {"검사 시작"}
                </StartPredictionButton>
            </PredictingContatiner>

            <div style={{ width: 'calc(100% - 40px)', height: 'calc(100% - 160px - 30px - 20px)', padding: '10px 20px', display: 'flex', flexDirection: "column", alignItems: 'center' }}>
                <PatientTable title={"환자 정보"} data={uploadedPatientData} result={predictions} />
            </div>
        </Wrapper>
    )
}


const Wrapper = styled.div`
    height: calc(100% - 20px);
    width: calc(100% - 20px);
    padding: 10px;
    background-color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const ConfigComponent = styled.div`
    height: 20%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

const PredictingContatiner = styled.div`
    height: calc(5% - 2%);
    width: calc(100% - 4%);
    padding: 1% 2%;
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const ProgressBarField = styled.div`
    height: 100%;
    width: 85%;
`;

const StartPredictionButton = styled.button`
    height: 100%;
    width: 12.5%;
    border: 2px solid #a2a2a2;
    border-radius: 5px;
    font-size: 1.5vh;
    font-weight: bold;
    cursor: pointer;
`;