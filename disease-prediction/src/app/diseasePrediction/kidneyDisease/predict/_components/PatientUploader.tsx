import { Dispatch, SetStateAction, useCallback, useState } from "react";
import Papa from 'papaparse';
import Swal from 'sweetalert2';
import styled from "styled-components";


export interface PatientUploaderProps {
    setPatientsData: Dispatch<SetStateAction<any[]>>;
    title: string;
}


export default function PatientUploader({ setPatientsData, title }: PatientUploaderProps) {
    // state
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [fileName, setFileName] = useState<string | null>(null);

    // handler
    const alertUploadError = useCallback((error: any) => {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error reading the file!',
        });
        console.error(error);
    }, []);

    const handleUploadCSV = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                delimiter: ',',
                skipEmptyLines: true,
                dynamicTyping: true,
                complete: (results) => {
                    if (results.errors.length) {
                        alertUploadError(results.errors);
                    } else {
                        setFileName(file.name);
                        setPatientsData((results.data as any[]));
                    }
                },
                error: (error) => {
                    alertUploadError(error);
                }
            });
        }
    }, [setPatientsData, alertUploadError]);

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                delimiter: ',',
                skipEmptyLines: true,
                dynamicTyping: true,
                complete: (results) => {
                    if (results.errors.length) {
                        alertUploadError(results.errors);
                    } else {
                        setFileName(file.name);
                        setPatientsData((results.data as any[]));
                    }
                },
                error: (error) => {
                    console.error(error);
                }
            });
        }
    }, [setPatientsData, alertUploadError]);

    const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    return (
        <Wrapper
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
            <Content>
                <Title>{title}</Title>
                <CsvUploader>
                    <Label htmlFor="csv-upload" className="custom-file-upload">파일 선택</Label>
                    <HiddenCsvUploader id="csv-upload" type="file" accept=".csv" onChange={handleUploadCSV} />
                    <DragField>
                        {fileName === null ? '파일을 마우스로 끌어놓으세요.' : fileName}
                    </DragField>
                </CsvUploader>
            </Content>

            {isDragging && (
                <DragOverlay>
                    <DragMessage />
                </DragOverlay>
            )}
        </Wrapper>
    );
}

const Wrapper = styled.div`
    position: relative;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    user-select: none;
`;

const Content = styled.div`
    height: calc(100% - 50px);
    width: calc(100% - 40%);
    padding: 50px 20%;
    padding-bottom: 0px;
`;

const Title = styled.h3`
    font-size: 30px;
    font-weight: bold;
    margin-bottom: 30px;
    color: #3182F6; 
`;

const CsvUploader = styled.div`
    height: calc(100% - 60px);
    width: 100%;
    display: flex;
`;

const HiddenCsvUploader = styled.input`
    display: none;
`;

const Label = styled.label`
    display: flex; 
    align-items: center; 
    justify-content: center;
    height: 30px;
    font-size: 22px;
    color: black;
    cursor: pointer;
    border: 2px solid #3182F6;
    padding: 8px 20px;
    border-radius: 10px;
    background-color: #ffffff;
    &:hover {
        background-color: #dceaff;
    }
`;

const DragField = styled.div`
    display: flex; 
    align-items: center; 
    justify-content: center;
    height: calc(100% - 2px);
    width: calc(100% - 140px - 40px - 2px);
    margin-left: 40px;
    font-size: 23px;
    color: black;
    border: 1px solid #3182F6;
    border-radius: 10px;
`;

const DragOverlay = styled.div`
    position: absolute;
    top: 110px;
    left: calc(20% + 170px);
    width: calc(100% - 40% - 170px);
    height: 88px;
    background-color: rgba(0, 0, 0, 0.20);
    border: 1px solid transparent;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
    font-weight: bold;
    pointer-events: none;
`;

const DragMessage = styled.div`
    text-align: center;
`;
