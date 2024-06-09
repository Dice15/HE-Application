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
    const [predictModel, setPredictModel] = useState<'linear' | 'logistic'>('linear');
    const [patients, setPatients] = useState<any[]>([]);
    const [predictions, setPredictions] = useState<boolean[]>([]);
    const [progress, setProgress] = useState<number>(0);


    // handler
    const showLoading = useCallback((title: string, text: string): void => {
        Swal.fire({
            title: title,
            text: text,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
    }, []);


    const hideLoading = useCallback((): void => {
        Swal.close();
    }, []);


    const keySender = useCallback(async (ckksSeal: CKKSSeal) => {
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

        const sendChunks = async (url: string, chunks: Uint8Array[]) => {
            for (let i = 0; i < chunks.length; i++) {
                const base64Chunk = uint8ArrayToBase64(chunks[i]);
                await axios.post(url, {
                    chunk: base64Chunk,
                    index: i,
                });
            }
        }

        const publicKeyChunks = splitIntoChunks(ckksSeal.serializePublicKey(), CHUNK_SIZE_BYTES);
        const relinKeysChunks = splitIntoChunks(ckksSeal.serializeRelinKeys(), CHUNK_SIZE_BYTES);
        const galoisKeyChunks = splitIntoChunks(ckksSeal.serializeGaloisKey(), CHUNK_SIZE_BYTES);

        return await Promise.allSettled([
            sendChunks('/api/keyManager/publicKey', publicKeyChunks),
            sendChunks('/api/keyManager/relinKeys', relinKeysChunks),
            sendChunks('/api/keyManager/galoisKey', galoisKeyChunks)
        ]);
    }, []);





    const keyRemover = () => {
        return [
            axios.delete('/api/keyManager/publicKey'),
            axios.delete('/api/keyManager/relinKeys'),
            axios.delete('/api/keyManager/galoisKey'),
        ];
    }


    const predicting = useCallback((ckksSeal: CKKSSeal, zippedData: any[][], chunkSize: number, predictModel: "linear" | "logistic", afterPredict: (prediction: number[], index: number) => void): Promise<void>[] => {
        return zippedData.map((data, index) => {
            const body = {
                serializedPatientInfo: ckksSeal.serializeCipherText(ckksSeal.encrypt(data)),
                chunkSizePerPatientData: chunkSize,
                predictModel: predictModel
            };

            return axios.post('/api/diseasePrediction/kidneyDisease', body)
                .then((response) => {
                    afterPredict(ckksSeal.decrypt(ckksSeal.deserializeCipherText(response.data.data.prediction as string)), index);
                })
                .catch(error => {
                    console.error("Prediction error:", error);
                });
        })
    }, []);


    const handleCreateCkksSeal = useCallback(async (predictModel: "linear" | "logistic"): Promise<CKKSSeal | null> => {
        return await NodeSealProvider.getSeal()
            .then((sealLibrary) => {
                return predictModel === "linear"
                    ? new CKKSSealBuilder(sealLibrary, Math.pow(2, 12), 2, Math.pow(2, 20)).build()
                    : new CKKSSealBuilder(sealLibrary, Math.pow(2, 15), 15, Math.pow(2, 40)).build();
            })
            .catch((reason) => {
                console.error("An error occurred:", reason);
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Failed to initializing Node Seal!',
                });
                return null;
            });
    }, []);


    const handleStartPredict = useCallback(async () => {
        showLoading('Loading...', 'Node Seal is being initialized.');
        const ckksSeal = await handleCreateCkksSeal(predictModel);

        if (ckksSeal) {
            showLoading('Predicting...', 'Predicting patient information.');
            setProgress(0);
            setPredictions(Array.from({ length: patients.length }, () => false));

            const features = KidneyDisease.getFeatures();
            const samples = KidneyDisease.transformToMLData(JSON.parse(JSON.stringify(patients, null, 2)) as any[]);

            const { zippedData, chunkSize } = ckksSeal.arrayZipper(samples.map((sample) => features.map(feature => (sample[feature] || 0))));
            const slotCount = ckksSeal.getSlotCount();

            let progressCounter = 0;
            keySender(ckksSeal).then(() => {
                Promise.allSettled(
                    predicting(ckksSeal, zippedData, chunkSize, predictModel, (prediction: number[], index: number) => {
                        const sliceCount = Math.floor(slotCount / chunkSize);
                        const startIndex = sliceCount * index;

                        for (let i = 0; i < sliceCount; i++) {
                            //console.log(startIndex + i, (1 / (1 + Math.exp(-prediction[i * chunkSize]))));
                            //const result = KidneyDisease.isDisease(1 / (1 + Math.exp(- prediction[i * chunkSize])));
                            const result = KidneyDisease.isDisease(prediction[i * chunkSize] as number);

                            setPredictions(prevResults => {
                                const newResults = [...prevResults];
                                newResults[startIndex + i] = result;
                                return newResults;
                            });
                        }

                        setProgress((++progressCounter / zippedData.length) * 100);
                    })
                ).then(() => {
                    Promise.allSettled(keyRemover()).then(() => {
                        setTimeout(() => { hideLoading() }, 2000);
                    })
                });
            })
        }

        setTimeout(() => { hideLoading() }, 2000);
    }, [handleCreateCkksSeal, hideLoading, keySender, patients, predictModel, predicting, showLoading]);


    // useEffect(() => {
    //     if (ckksSeal && patients.length > 0) {
    //         showLoading('Predicting...', 'Predicting patient information.');
    //         setProgress(0);
    //         setPredictions(Array.from({ length: patients.length }, () => false));

    //         setTimeout(() => {
    //             const features = KidneyDisease.getFeatures();
    //             const samples = KidneyDisease.transformToMLData(JSON.parse(JSON.stringify(patients, null, 2)) as any[]);
    //             const { zippedData, chunkSize } = ckksSeal.arrayZipper(samples.map((sample) => features.map(feature => (sample[feature] || 0))));
    //             const slotCount = ckksSeal.getSlotCount();

    //             let progressCounter = 0;
    //             Promise.allSettled(keySender(ckksSeal)).then(() => {
    //                 Promise.allSettled(
    //                     predicting(ckksSeal, zippedData, chunkSize, (prediction: number[], index: number) => {
    //                         const sliceCount = Math.floor(slotCount / chunkSize);
    //                         const startIndex = sliceCount * index;

    //                         for (let i = 0; i < sliceCount; i++) {
    //                             const result = KidneyDisease.isDisease(prediction[i * chunkSize] as number);

    //                             setPredictions(prevResults => {
    //                                 const newResults = [...prevResults];
    //                                 newResults[startIndex + i] = result;
    //                                 return newResults;
    //                             });
    //                         }

    //                         setProgress((++progressCounter / zippedData.length) * 100);
    //                     })
    //                 ).then(() => {
    //                     Promise.allSettled(keyRemover()).then(() => {
    //                         setTimeout(() => { hideLoading() }, 2000);
    //                     })
    //                 });
    //             })
    //         }, 2000);
    //     }
    // }, [ckksSeal, patients, showLoading, hideLoading, predicting])




    // useEffect(() => {
    //     const temp = async () => {
    //         const ckksSeal = new CKKSSealBuilder(await NodeSealProvider.getSeal(), Math.pow(2, 15), 15, Math.pow(2, 40)).build();
    //         console.log(ckksSeal.serializePublicKey().length);
    //         console.log(ckksSeal.serializeRelinKeys().length);
    //         console.log(ckksSeal.serializeGaloisKey().length);

    //         // const encryptedIntercept = ckksSeal.encrypt([2]);
    //         // const encryptedCoefficients = ckksSeal.encrypt([2]);
    //         // const encryptedPatientsData = ckksSeal.encrypt([2]);
    //         // const ckksScaleCorrection = ckksSeal.encrypt([1]);
    //         // const encryptedPolyCoefficients = [0.499509755651757, 0.196809345741200, 0.000058588762850, -0.005439803888197, -0.000001517035421, 0.000074967999198, 0.000000009991278, -0.000000357551295
    //         // ].map((polyCoefficient) => {
    //         //     return ckksSeal.encrypt(Array.from(
    //         //         { length: ckksSeal.getSlotCount() },
    //         //         () => polyCoefficient)
    //         //     );
    //         // });

    //         // const serializedPublicKey = ckksSeal.serializePublicKey();
    //         // const serializedRelinKeys = ckksSeal.serializeRelinKeys();
    //         // const serializedGaloisKey = ckksSeal.serializeGaloisKey();

    //         // console.log(serializedPublicKey.length)
    //         // console.log(serializedRelinKeys.length)
    //         // console.log(serializedGaloisKey.length)

    //         // const logit = ckksSeal.add(
    //         //     ckksSeal.sumElements(
    //         //         ckksSeal.multiply(encryptedCoefficients, encryptedPatientsData),
    //         //         31
    //         //     ),
    //         //     ckksSeal.multiply(encryptedIntercept, ckksScaleCorrection)
    //         // );

    //         // let predict = encryptedPolyCoefficients[0];
    //         // let x = logit.clone();
    //         // let s = ckksSeal.multiply(ckksScaleCorrection, ckksScaleCorrection);

    //         // for (let i = 1; i <= 7; i++) {
    //         //     predict = ckksSeal.add(
    //         //         ckksSeal.multiply(predict, s),
    //         //         ckksSeal.multiply(encryptedPolyCoefficients[i], x)
    //         //     );
    //         //     x = ckksSeal.multiply(x, logit);
    //         //     console.log(predict.scale)
    //         // }

    //         // (-0.000000357551295)**7
    //         // let v1 = ckksSeal.encrypt([-0.000000357551295]);
    //         // let v2 = ckksSeal.encrypt([1]);

    //         // for (let i = 1; i <= 7; i++) {
    //         //     v2 = ckksSeal.multiply(v2, v1);
    //         //     console.log(ckksSeal.decrypt(v2)[0], (-0.000000357551295) ** i);
    //         // }
    //     }
    //     temp();
    // }, []);


    return (
        <Wrapper>
            <ConfigComponent>
                <PatientUploader
                    title={"환자 정보 CSV파일 업로드"}
                    setPatientsInfo={setPatients}
                />
                <PredictModelSelector
                    predictModel={predictModel}
                    setPredictModel={setPredictModel}
                />
            </ConfigComponent>

            <PredictingContatiner>
                <ProgressBarField>
                    <ProgressBar progress={progress} />
                </ProgressBarField>

                <StartPredictionButton onClick={handleStartPredict} disabled={patients.length === 0}>
                    {"검사 시작"}
                </StartPredictionButton>
            </PredictingContatiner>

            <div style={{ width: 'calc(100% - 40px)', height: 'calc(100% - 160px - 30px - 20px)', padding: '10px 20px', display: 'flex', flexDirection: "column", alignItems: 'center' }}>
                <PatientTable title={"환자 정보"} data={patients} result={predictions} />
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
`;