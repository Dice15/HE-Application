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


export default function KidneyDiseasePrediction() {
    const [predictionModel, setPredictionModel] = useState<'linear' | 'logistic'>('linear');
    const [uploadedPatientData, setUploadedPatientData] = useState<any[]>([]);
    const [diseasePredictions, setDiseasePredictions] = useState<boolean[]>([]);
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


    const handlePredictDisease = useCallback((ckksSeal: CKKSSeal, chunkSize: number, predictModel: "linear" | "logistic"): Promise<number[]> => {
        const base64ToUint8Array = (base64: string): Uint8Array => {
            const binaryString = atob(base64);
            const length = binaryString.length;
            const bytes = new Uint8Array(length);
            for (let i = 0; i < length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes;
        }

        return axios.post('/api/diseasePrediction/kidneyDiseasePrediction',
            {
                featureSize: chunkSize,
                predictModel: predictModel
            })
            .then((response) => {
                return ckksSeal.decrypt(ckksSeal.deserializeCipherText(base64ToUint8Array(response.data.data.prediction)));
            })
            .catch((error) => {
                console.error("An error occurred:", error);
                if (error instanceof Error) {
                    throw new Error(`Failed to predicting disease: ${error.message}`);
                } else {
                    throw new Error('An unknown error occurred while predicting the disease');
                }
            });
    }, []);


    const handleStartPredict = useCallback(async () => {
        setDiseasePredictions(Array.from({ length: uploadedPatientData.length }, () => false));

        setProgressPercent(0);
        handleShowProcessing('Processing', 'Initializing CkksSeal');
        await handleCreateCkksSeal(predictionModel)
            .then(async (ckksSeal) => {
                setProgressPercent(prev => prev + 10);
                handleShowProcessing('Processing', 'Uploading Ckkskey');

                await handleUploadCkksKey(ckksSeal)
                    .then(async () => {
                        setProgressPercent(prev => prev + 25);
                        handleShowProcessing('Processing', 'Predicting kidneydisease');

                        const patientData = KidneyDisease.preprocessPatientData(JSON.parse(JSON.stringify(uploadedPatientData, null, 2)) as any[]);
                        const zippedPatientData = ckksSeal.arrayZipper(patientData.rows);
                        const totalChunkCount = zippedPatientData.zippedData.reduce((cnt, zipped) => cnt + Math.floor(zipped.length / zippedPatientData.chunkSize), 0);

                        for (let i = 0; i < zippedPatientData.zippedData.length; i++) {
                            await handleUploadPatientData(ckksSeal, zippedPatientData.zippedData[i])
                                .then(async () => {
                                    const predictions = await handlePredictDisease(ckksSeal, zippedPatientData.chunkSize, predictionModel);
                                    const sliceCount = Math.floor(zippedPatientData.zippedData[i].length / zippedPatientData.chunkSize);
                                    const startIndex = sliceCount * i;

                                    for (let j = 0; j < sliceCount; j++) {
                                        const result = KidneyDisease.isKidneyDisease(predictions[j * zippedPatientData.chunkSize]);
                                        setDiseasePredictions(prevResults => {
                                            const newResults = [...prevResults];
                                            newResults[startIndex + j] = result;
                                            return newResults;
                                        });
                                        setProgressPercent(prev => prev + ((1 / totalChunkCount) * 60));
                                    }
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
                        setProgressPercent(100);
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
    }, [uploadedPatientData, handleShowProcessing, handleHideProcessing, handleCreateCkksSeal, predictionModel, handleUploadCkksKey, handleUploadPatientData, handleDeletePatientData, handleDeleteCkksKey, handlePredictDisease]);


    // useEffect(() => {
    //     const temp = async () => {
    //         const ckksSeal = await NodeSealProvider.getSeal().then((nodeSeal) => {
    //             return new CKKSSealBuilder(nodeSeal, nodeSeal.SecurityLevel.tc128)
    //                 .setCoeffModulus(Math.pow(2, 15), [60, 60, 60, 60, 60, 60, 60, 60, 60])
    //                 .setScale(Math.pow(2, 60))
    //                 .setRotationSteps([1, 2, 4, 8, 16])
    //                 .build();
    //         });

    //         return;

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


    //         let x: any[] = Array.from({ length: 9 });
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
                <PatientTable title={"환자 정보"} data={uploadedPatientData} result={diseasePredictions} />
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