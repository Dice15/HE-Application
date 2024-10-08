"use client"

import styled from "styled-components";
import { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import PatientTable from './PatientTable';
import ProgressBar from './ProgressBar';
import PatientUploader from './PatientUploader';
import { KidneyDiseasePredictionService } from '../_classes/KidneyDiseasePredictionService';
import { useRouter, useSearchParams } from "next/navigation";


export default function KidneyDiseasePrediction() {
    // hook
    const modelParams = useSearchParams();
    const router = useRouter();


    // state
    const [predictionModel, setPredictionModel] = useState<'linear' | 'logistic'>('linear');
    const [uploadedPatientData, setUploadedPatientData] = useState<any[]>([]);
    const [diseasePredictions, setDiseasePredictions] = useState<number[]>([]);
    const [progressPercent, setProgressPercent] = useState<number>(0);


    // handler
    const handleShowProcessing = useCallback((title: string, text: string) => {
        return Swal.fire({
            title: title,
            text: text,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
        })
    }, []);


    const handleShowCompleted = useCallback((title: string, text: string) => {
        return Swal.fire({
            title: title,
            text: text,
            allowOutsideClick: false,
        })
    }, []);


    const handleCloseAlert = useCallback(() => {
        return Swal.close();
    }, []);


    const handleStartPredict = useCallback(async () => {
        const startTime = Date.now();
        setDiseasePredictions([]);

        try {
            /**
             * Initialize view table and database
             */
            handleCloseAlert();
            setProgressPercent(0);
            handleShowProcessing('Processing', '초기화 중...');

            const result = Array.from({ length: uploadedPatientData.length }, () => 2);
            await KidneyDiseasePredictionService.deleteCkksKey();
            await KidneyDiseasePredictionService.deletePatientData();


            /**
             * Create CKKS Seal
             */
            handleCloseAlert();
            setProgressPercent(prev => prev + 5);
            handleShowProcessing('Processing', '암호화 모듈 준비중...');

            const ckksSeal = await KidneyDiseasePredictionService.createCkksSeal(predictionModel)
                .then(async (ckksSeal) => {
                    return ckksSeal;
                })
                .catch(async () => {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: '암호화 모듈(CkksSeal)을 생성하는데 실패했습니다.',
                        allowOutsideClick: false,
                    });
                    throw new Error('Failed to initializing CkksSeal.');
                });


            /**
             * Upload CKKS Keys to the database
             */
            handleCloseAlert();
            setProgressPercent(prev => prev + 5);
            handleShowProcessing('Processing', '암호화 모듈의 공개키 업로드 중...');

            await KidneyDiseasePredictionService.uploadCkksKey(ckksSeal)
                .catch(async () => {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: '암호화 모듈의 공개키를 업로드하는데 실패했습니다.',
                        allowOutsideClick: false,
                    });
                    throw new Error('Failed to uploading CkksKey.');
                });


            /**
             * Start predicting kidney disease
             */
            handleCloseAlert();
            setProgressPercent(prev => prev + 40);
            handleShowProcessing('Predicting', '환자의 신장 질환 검사 중...');


            const patientData = KidneyDiseasePredictionService.preprocessPatientData(JSON.parse(JSON.stringify(uploadedPatientData, null, 2)) as any[]);
            const zippedPatientData = ckksSeal.arrayZipper(patientData.rows);
            const totalChunkCount = zippedPatientData.zippedData.reduce((cnt, zipped) => cnt + Math.floor(zipped.length / zippedPatientData.chunkSize), 0);


            await Promise.all(
                zippedPatientData.zippedData.map((data, i) =>
                    KidneyDiseasePredictionService.uploadPatientData(ckksSeal, data, `kidneyDisease${i}`)
                        .then(async () => {
                            const predictions = await KidneyDiseasePredictionService.predictDisease(ckksSeal, `kidneyDisease${i}`, zippedPatientData.chunkSize, predictionModel);
                            const sliceCount = Math.floor(zippedPatientData.zippedData[i].length / zippedPatientData.chunkSize);
                            const startIndex = sliceCount * i;

                            for (let j = 0; j < sliceCount; j++) {
                                const isDisease = KidneyDiseasePredictionService.isKidneyDisease(predictions[j * zippedPatientData.chunkSize]);
                                result[startIndex + j] = Number(isDisease);
                                setProgressPercent(prev => prev + ((1 / totalChunkCount) * 45));
                            }
                        })
                        .catch(async () => {
                            await Swal.fire({
                                icon: 'error',
                                title: 'Oops...',
                                text: '환자의 신장 질환 검사 중 오류가 발생했습니다.',
                                allowOutsideClick: false,
                            });
                            throw new Error('Failed to predicting patient data.');
                        })
                )
            )

            ckksSeal.delete();
            await KidneyDiseasePredictionService.deleteCkksKey();
            await KidneyDiseasePredictionService.deletePatientData();

            handleCloseAlert();
            setProgressPercent(100);
            const endTime = Date.now();
            const durationInSeconds = ((endTime - startTime) / 1000).toFixed(2);
            handleShowCompleted('Completed', `검사가 완료되었습니다. (소요 시간: ${durationInSeconds}초)`).then(() => {
                setDiseasePredictions(result);
            });
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message);
            } else {
                throw new Error('An unknown error occurred while predicting processing');
            }
        }
    }, [handleCloseAlert, handleShowCompleted, handleShowProcessing, predictionModel, uploadedPatientData]);


    // effect
    useEffect(() => {
        if (modelParams) {
            const modelParam = modelParams.get('model') ?? "";

            switch (modelParam) {
                case "fast": {
                    setPredictionModel("linear");
                    break;
                }
                case "accurate": {
                    setPredictionModel("logistic");
                    break;
                }
                default: {
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: '잘못된 접근 입니다. 홈 페이지로 이동합니다.',
                        allowOutsideClick: false,
                    }).then(() => {
                        router.replace('/');
                    });
                }
            }
        }
    }, [modelParams, router]);


    // render
    return (
        <Wrapper>
            <ConfigComponent>
                <PatientUploader
                    title={"환자 정보 CSV파일 업로드"}
                    setPatientsData={setUploadedPatientData}
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

            <DisplayPatientData>
                <PatientTable tableTitle={"환자 정보"} patientData={uploadedPatientData} diseasePredictions={diseasePredictions} />
            </DisplayPatientData>
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
    height: 200px;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

const PredictingContatiner = styled.div`
    height: calc(100px - 70px);
    width: calc(100% - 100px);
    padding: 35px 50px;
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const ProgressBarField = styled.div`
    height: 100%;
    width: calc(100% - 240px);
`;

const StartPredictionButton = styled.button`
    width: calc(200px - 4px);
    margin-left: 40px;
    border: 2px solid #a2a2a2;
    border-radius: 5px;
    font-size: 20px;
    font-weight: bold;
    cursor: pointer;
`;

const DisplayPatientData = styled.div`
    height: calc(100% - 300px - 20px);
    width: calc(100% - 40px);
    padding: 10px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
`;