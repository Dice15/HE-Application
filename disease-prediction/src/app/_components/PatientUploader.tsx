import { CKKSSeal } from "@/core/modules/homomorphic-encryption/ckks";
import { Dispatch, SetStateAction, useCallback } from "react";
import Papa from 'papaparse';
import Swal from 'sweetalert2';

export interface PatientUploaderProps {
    ckksSeal: CKKSSeal | undefined;
    setPatientsInfo: Dispatch<SetStateAction<any[]>>;
    title: string;
}

export default function PatientUploader({ ckksSeal, setPatientsInfo, title }: PatientUploaderProps) {
    const alertUploadError = useCallback((error: any) => {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error reading the file!',
        });
        console.error(error);
    }, []);

    const handleUploadCSV = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        if (ckksSeal) {
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
        }
    }, [ckksSeal, setPatientsInfo, alertUploadError]);

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: "column", justifyContent: 'center', alignItems: 'center' }}>
            <h1>{title}</h1>
            <input type="file" accept=".csv" onChange={handleUploadCSV} style={{ marginTop: '30px' }} disabled={ckksSeal === undefined} />
        </div>
    );
}