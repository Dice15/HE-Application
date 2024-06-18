"use client"

import { Dispatch, SetStateAction, useCallback } from "react";
import Papa from 'papaparse';
import Swal from 'sweetalert2';
import styled from "styled-components";

export interface PatientUploaderProps {
    setPatientsInfo: Dispatch<SetStateAction<any[]>>;
    title: string;
}

export default function PatientUploader({ setPatientsInfo, title }: PatientUploaderProps) {
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
                    results.errors.length ? alertUploadError(results.errors) : setPatientsInfo((results.data as any[]))//.filter((_, index) => index % 10 === 0))
                },
                error: (error) => {
                    alertUploadError(error);
                }
            });
        }
    }, [setPatientsInfo, alertUploadError]);

    return (
        <Wrapper>
            <Content>
                <Title>{title}</Title>
                <CsvUploader type="file" accept=".csv" onChange={handleUploadCSV} />
            </Content>
        </Wrapper>
    );
}

const Wrapper = styled.div`
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    user-select: none;
`;

const Content = styled.div`
    height: calc(100% - 80px);
    width: calc(100% - 40%);
    padding: 50px 20%;
    padding-bottom: 30px;
`;

const Title = styled.h3`
    font-size: 30px;
    font-weight: bold;
    margin-bottom: 30px;
    color: #3182F6; 
`;

const CsvUploader = styled.input`
    font-size: 20px;
    color: black;
    cursor: pointer;
`;