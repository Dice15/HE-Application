"use client"

import { CKKSSeal, CKKSSealBuilder } from '@/core/modules/homomorphic-encryption/ckks';
import styled from "styled-components";
import { NodeSealProvider } from '@/core/modules/homomorphic-encryption/node-seal';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { KidneyDisease } from '@/core/modules/disease-prediction/kidney-disease';
import Swal from 'sweetalert2';
import PatientTable from './PatientTable';
import ProgressBar from './ProgressBar';
import PatientUploader from './PatientUploader';
import PredictModelSelector from './PredictModelSelector';


export default function KidneyDiseasePrediction() {
    const [predictModel, setPredictModel] = useState<'linear' | 'logistic'>('linear');
    const [ckksSeal, setCkksSeal] = useState<CKKSSeal>();
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


    const handleModelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPredictModel(event.target.value as ("linear" | "logistic"));
    };


    const keySender = (ckksSeal: CKKSSeal) => {
        return [
            axios.post('/api/keyManager/publicKey', { serializedPublickey: ckksSeal.serializePublicKey() }),
            axios.post('/api/keyManager/relinKeys', { serializedRelinKeys: ckksSeal.serializeRelinKeys() }),
            axios.post('/api/keyManager/galoisKey', { serializedGaloisKey: ckksSeal.serializeGaloisKey() })
        ];
    }


    const keyRemover = () => {
        return [
            axios.delete('/api/keyManager/publicKey'),
            axios.delete('/api/keyManager/relinKeys'),
            axios.delete('/api/keyManager/galoisKey'),
        ];
    }


    const predicting = useCallback((ckksSeal: CKKSSeal, zippedData: any[][], chunkSize: number, afterPredict: (prediction: number[], index: number) => void): Promise<void>[] => {
        return zippedData.map((data, index) => {
            const body = {
                serializedPatientInfo: ckksSeal.serializeCipherText(ckksSeal.encrypt(data)),
                chunkSize: chunkSize,
            };

            return axios.post('/api/diseasePrediction/kidneyDisease', body)
                .then((response) => {
                    afterPredict(ckksSeal.decrypt(ckksSeal.deserializeCipherText(response.data.prediction as string)), index);
                })
                .catch(error => {
                    console.error("Prediction error:", error);
                });
        })
    }, []);


    useEffect(() => {
        if (ckksSeal && patients.length > 0) {
            showLoading('Predicting...', 'Predicting patient information.');
            setProgress(0);
            setPredictions(Array.from({ length: patients.length }, () => false));

            setTimeout(() => {
                const features = KidneyDisease.getFeatures();
                const samples = KidneyDisease.transformToMLData(JSON.parse(JSON.stringify(patients, null, 2)) as any[]);
                const { zippedData, chunkSize } = ckksSeal.arrayZipper(samples.map((sample) => features.map(feature => (sample[feature] || 0))));
                const slotCount = ckksSeal.getSlotCount();

                let progressCounter = 0;
                Promise.allSettled(keySender(ckksSeal)).then(() => {
                    Promise.allSettled(
                        predicting(ckksSeal, zippedData, chunkSize, (prediction: number[], index: number) => {
                            const sliceCount = Math.floor(slotCount / chunkSize);
                            const startIndex = sliceCount * index;

                            for (let i = 0; i < sliceCount; i++) {
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
            }, 2000);
        }
    }, [ckksSeal, patients, showLoading, hideLoading, predicting])


    // useEffect(() => {
    //     showLoading('Loading...', 'Node Seal is being initialized.');
    //     const minLoadingTime = 2000;
    //     const startTime = Date.now();

    //     (async () => {
    //         try {
    //             const ckksLibray = new CKKSSealBuilder().build(await NodeSealProvider.getSeal());
    //             const remainTime = minLoadingTime - (Date.now() - startTime);

    //             setTimeout(() => {
    //                 setCkksSeal(ckksLibray);
    //                 hideLoading();
    //             }, remainTime > 0 ? remainTime : 0)
    //         }
    //         catch (error) {
    //             console.error("An error occurred:", error);
    //             Swal.fire({
    //                 icon: 'error',
    //                 title: 'Oops...',
    //                 text: 'Something went wrong!',
    //             });
    //         }
    //     })();
    // }, [hideLoading, showLoading]);


    useEffect(() => {
        if (ckksSeal) {
            let v1 = ckksSeal.encrypt([1]);
            let v2 = ckksSeal.encrypt([2]);

            for (let i = 0; i < 15; i++) {
                v1 = ckksSeal.multiply(v1, v2);
                console.log(ckksSeal.decrypt(v1)[0]);
            }
        }

    }, [ckksSeal]);


    return (
        <Wrapper>
            <ConfigComponent>
                <PatientUploader
                    title={"환자 정보 CSV파일 업로드"}
                    ckksSeal={ckksSeal}
                    setPatientsInfo={setPatients}
                />
                <PredictModelSelector
                    predictModel={predictModel}
                    setPredictModel={setPredictModel}
                />
            </ConfigComponent>

            <PredictingContatiner>
                <ProgressBarField>
                    <ProgressBar
                        progress={progress} />
                </ProgressBarField>
                <StartPredictinButton>
                    {"검사 시작"}
                </StartPredictinButton>
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

const StartPredictinButton = styled.button`
    height: 100%;
    width: 12.5%;
    border: 2px solid #a2a2a2;
    border-radius: 5px;
    font-size: 1.5vh;
    font-weight: bold;
`;