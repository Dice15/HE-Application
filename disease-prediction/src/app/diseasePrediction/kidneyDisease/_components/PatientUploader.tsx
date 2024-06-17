"use client"

import { CKKSSeal } from "@/core/modules/homomorphic-encryption/ckks";
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
            <Title>{title}</Title>
            <CsvUploader type="file" accept=".csv" onChange={handleUploadCSV} />
        </Wrapper>
    );
}

const Wrapper = styled.div`
    height: calc(70% - 2%);
    width: calc(100% - 2%);
    padding: 1%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
`;

const Title = styled.h1`
    font-size: 3.5vh;
`;

const CsvUploader = styled.input`
    margin-left: 9vw;
    font-size: 1.5vh;
`;