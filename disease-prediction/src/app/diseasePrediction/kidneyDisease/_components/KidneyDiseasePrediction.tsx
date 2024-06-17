"use client"

import styled from "styled-components";
import { useCallback, useState } from 'react';
import Swal from 'sweetalert2';
import PatientTable from './PatientTable';
import ProgressBar from './ProgressBar';
import PatientUploader from './PatientUploader';
import PredictModelSelector from './PredictModelSelector';
import { KidneyDiseasePredictionService } from '../_classes/KidneyDiseasePredictionService';


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


    const handleStartPredict = useCallback(async () => {
        try {
            /**
             * Initialize view table and database
             */
            setProgressPercent(0);
            handleShowProcessing('Processing', 'Initializing');

            setDiseasePredictions(Array.from({ length: uploadedPatientData.length }, () => false));
            await KidneyDiseasePredictionService.deleteCkksKey();
            await KidneyDiseasePredictionService.deletePatientData();


            /**
             * Create CKKS Seal
             */
            setProgressPercent(prev => prev + 5);
            handleShowProcessing('Processing', 'Creating CkksSeal');

            const ckksSeal = await KidneyDiseasePredictionService.createCkksSeal(predictionModel)
                .then(async (ckksSeal) => {
                    return ckksSeal;
                })
                .catch(async () => {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: 'Failed to initializing CkksSeal.',
                        allowOutsideClick: false,
                    });
                    throw new Error('Failed to initializing CkksSeal.');
                });


            /**
             * Upload CKKS Keys to the database
             */
            setProgressPercent(prev => prev + 5);
            handleShowProcessing('Processing', 'Uploading Ckkskey');

            await KidneyDiseasePredictionService.uploadCkksKey(ckksSeal)
                .catch(async () => {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: 'Failed to uploading CkksKey.',
                        allowOutsideClick: false,
                    });
                    throw new Error('Failed to uploading CkksKey.');
                });


            /**
             * Start predicting kidney disease
             */
            setProgressPercent(prev => prev + 40);
            handleShowProcessing('Processing', 'Predicting kidneydisease');

            const patientData = KidneyDiseasePredictionService.preprocessPatientData(JSON.parse(JSON.stringify(uploadedPatientData, null, 2)) as any[]);
            const zippedPatientData = ckksSeal.arrayZipper(patientData.rows);
            const totalChunkCount = zippedPatientData.zippedData.reduce((cnt, zipped) => cnt + Math.floor(zipped.length / zippedPatientData.chunkSize), 0);

            for (let i = 0; i < zippedPatientData.zippedData.length; i++) {
                await KidneyDiseasePredictionService.uploadPatientData(ckksSeal, zippedPatientData.zippedData[i])
                    .then(async () => {
                        const predictions = await KidneyDiseasePredictionService.predictDisease(ckksSeal, zippedPatientData.chunkSize, predictionModel);
                        const sliceCount = Math.floor(zippedPatientData.zippedData[i].length / zippedPatientData.chunkSize);
                        const startIndex = sliceCount * i;

                        for (let j = 0; j < sliceCount; j++) {
                            const result = KidneyDiseasePredictionService.isKidneyDisease(predictions[j * zippedPatientData.chunkSize]);
                            setDiseasePredictions(prevResults => {
                                const newResults = [...prevResults];
                                newResults[startIndex + j] = result;
                                return newResults;
                            });
                            setProgressPercent(prev => prev + ((1 / totalChunkCount) * 45));
                        }
                    })
                    .catch(async () => {
                        await Swal.fire({
                            icon: 'error',
                            title: 'Oops...',
                            text: 'Failed to predicting patient data.',
                            allowOutsideClick: false,
                        });
                        throw new Error('Failed to predicting patient data.');
                    })
                    .finally(async () => {
                        await KidneyDiseasePredictionService.deletePatientData();
                    });
            }
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message);
            } else {
                throw new Error('An unknown error occurred while predicting processing');
            }
        }
        finally {
            /**
             * Finalize the process
             */
            await KidneyDiseasePredictionService.deleteCkksKey();
            handleHideProcessing();
            setProgressPercent(100);
        }
    }, [handleHideProcessing, handleShowProcessing, predictionModel, uploadedPatientData]);


    // render
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