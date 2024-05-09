"use client"

import { CKKSSeal, CKKSSealBuilder } from '@/core/modules/homomorphic-encryption/ckks';
import { NodeSealProvider } from '@/core/modules/homomorphic-encryption/node-seal';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import Papa from 'papaparse';
import { KidneyDisease } from '@/core/modules/disease-prediction/kidney-disease';
import Swal from 'sweetalert2';
import PatientTable from './_components/PatientTable';
import ProgressBar from './_components/ProgressBar';

export default function Test() {
    const [ckksSeal, setCkksSeal] = useState<CKKSSeal>();
    const [originalPatientsInfo, setOriginalPatientsInfo] = useState<any[]>([]);
    const [predictionResults, setPredictionResults] = useState<boolean[]>([]);
    const [progress, setProgress] = useState<number>(0);

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

    const predicting = useCallback((ckksSeal: CKKSSeal, preprocessPatientsInfo: any[]): void => {
        const features = ['age', 'bp', 'sg', 'al', 'su', 'rbc', 'pc', 'pcc', 'ba', 'bgr', 'bu', 'sc', 'sod', 'pot', 'hemo', 'pcv', 'wc', 'rc', 'htn', 'dm', 'cad', 'appet', 'pe', 'ane'];

        const totalPredictions = preprocessPatientsInfo.length;
        let completedPredictions = 0;

        const predictions = preprocessPatientsInfo.map((patientInfo, index) => {
            const body = {
                serializedPatientInfo: ckksSeal.serializeCipherText(ckksSeal.encrypt(features.map(feature => (patientInfo[feature] || 0)))),
                serializedPublickey: ckksSeal.serializePublicKey(),
                serializedRelinKeys: ckksSeal.serializeRelinKeys(),
                serializedGaloisKey: ckksSeal.serializeGaloisKey(),
            };

            return axios.post('/api/diseasePrediction/kidneyDisease', body).then((response) => {
                const { prediction } = response.data;
                const temp = ckksSeal.decrypt(ckksSeal.deserializeCipherText(prediction))[0];
                const result = temp < 0.5;//ckksSeal.decrypt(ckksSeal.deserializeCipherText(prediction))[0] < 0.5;

                console.log(`${index} - ${temp}`);

                setPredictionResults(prevResults => {
                    const newResults = [...prevResults];
                    newResults[index] = result;
                    return newResults;
                });

                completedPredictions++;
                setProgress((completedPredictions / totalPredictions) * 100);
            }).catch(error => {
                console.error("Prediction error:", error);
            });
        });

        Promise.allSettled(predictions).then(() => {
            hideLoading();
        });
    }, [hideLoading]);

    const handleUploadCSV = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        if (ckksSeal) {
            showLoading('Loading...', 'Uploading CSV file.');
            const minLoadingTime = 2000;
            const startTime = Date.now();

            const file = event.target.files?.[0];
            if (file) {
                Papa.parse(file, {
                    header: true,
                    delimiter: ',',
                    skipEmptyLines: true,
                    dynamicTyping: true,
                    complete: (results) => {
                        if (results.errors.length) {
                            Swal.fire({
                                icon: 'error',
                                title: 'Oops...',
                                text: 'Error processing the file!',
                            });
                            console.error("Parsing error:", results.errors);
                        } else {
                            const data = (results.data as any[]).slice(0, 10); //filter((value, index) => index % 15 === 0);
                            const result = Array.from({ length: data.length }, () => false);
                            const origin = JSON.parse(JSON.stringify(data, null, 2)) as any[];
                            const remainTime = minLoadingTime - (Date.now() - startTime);

                            setTimeout(() => {
                                setPredictionResults(result);
                                setOriginalPatientsInfo(origin);
                                setProgress(0); // 초기화

                                setTimeout(() => {
                                    predicting(ckksSeal, KidneyDisease.preprocessData(data));
                                }, 3000);
                            }, remainTime > 0 ? remainTime : 0);
                        }
                    },
                    error: (error) => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Oops...',
                            text: 'Error reading the file!',
                        });
                        console.error("Parsing error:", error);
                    }
                });
            }
        }
    }, [ckksSeal, predicting, showLoading]);

    useEffect(() => {
        showLoading('Loading...', 'Node Seal is being initialized.');
        const minLoadingTime = 2000;
        const startTime = Date.now();

        (async () => {
            try {
                const ckksLibray = new CKKSSealBuilder().build(await NodeSealProvider.getSeal());
                const remainTime = minLoadingTime - (Date.now() - startTime);

                setTimeout(() => {
                    setCkksSeal(ckksLibray);
                    hideLoading();
                }, remainTime > 0 ? remainTime : 0)
            } catch (error) {
                console.error("An error occurred:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Something went wrong!',
                });
            }
        })();
    }, [hideLoading, showLoading]);

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: 'white', display: "flex", flexDirection: "column", alignItems: 'center' }}>
            <div style={{ width: '100%', height: '150px', paddingTop: '10px', display: 'flex', flexDirection: "column", justifyContent: 'center', alignItems: 'center' }}>
                <h1>환자 정보 CSV파일 업로드</h1>
                <input type="file" accept=".csv" onChange={handleUploadCSV} style={{ marginTop: '30px' }} disabled={ckksSeal === undefined} />
            </div>
            <div style={{ width: 'calc(100% - 40px)', height: '20px', padding: '20px', display: 'flex', flexDirection: "column", justifyContent: 'center', alignItems: 'center' }}>
                <ProgressBar progress={progress} />
            </div>
            <div style={{ width: 'calc(100% - 40px)', height: 'calc(100% - 160px - 60px - 20px)', padding: '10px 20px', display: 'flex', flexDirection: "column", alignItems: 'center' }}>
                <PatientTable title="환자 정보" data={originalPatientsInfo} result={predictionResults} />
            </div>
        </div>
    )
}
