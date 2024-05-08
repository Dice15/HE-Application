"use client"

import { CKKSSeal, CKKSSealBuilder } from '@/core/modules/homomorphic-encryption/ckks';
import { NodeSealProvider } from '@/core/modules/homomorphic-encryption/node-seal';
import axios from 'axios';
import { useEffect, useState } from 'react';
import Papa from 'papaparse';


export default function Test() {
    const [ckksSeal, setCkksSeal] = useState<CKKSSeal>();
    const [originalPatientsInfo, setOriginalPatientsInfo] = useState<string>(JSON.stringify([], null, 2));
    const [preprocessedPatientsInfo, setPreprocessedPatientsInfo] = useState<any[]>([]);
    const [processingError, setProcessingError] = useState<string>('');

    useEffect(() => {
        (async () => {
            try {
                const node_seal = await NodeSealProvider.getSeal();
                const ckks_seal = new CKKSSealBuilder().build(node_seal);
                setCkksSeal(ckks_seal);
            } catch (error) {
                console.error("An error occurred:", error);
            }
        })();
    }, []);


    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                delimiter: ',', // 명시적으로 구분자 설정
                skipEmptyLines: true,
                dynamicTyping: true, // 동적 타이핑 활성화
                complete: (results) => {
                    console.log("Parsing complete:", results);
                    if (results.errors.length) {
                        setProcessingError('Error processing the file');
                        return;
                    }
                    const data = (results.data as any[]).slice(0, 10);
                    setOriginalPatientsInfo(JSON.stringify(data, null, 2));
                    preprocessPatientsInfo(data);
                },
                error: (error) => {
                    console.error("Parsing error:", error);
                    setProcessingError('Error reading the file');
                }
            });
        }
    };


    const preprocessPatientsInfo = (data: any[]) => {
        // 수치형 데이터의 결측값을 평균값으로 대체
        const numeric_means: Record<string, number> = {
            age: 51.483375959079275,
            bp: 76.46907216494844,
            sg: 1.0174079320113314,
            al: 1.0169491525423728,
            su: 0.4501424501424502,
            bgr: 148.0365168539326,
            bu: 57.4257217847769,
            sc: 3.072454308093995,
            sod: 137.52875399361022,
            pot: 4.62724358974359,
            hemo: 12.526436781609195,
            rc: 4.241635687732342,
            wc: 8406.122448979591,
            pcv: 38.88449848024316,
        };

        Object.entries(numeric_means).forEach(([col, mean]) => {
            data.forEach(row => { row[col] = row[col] ?? mean; });
        });


        // 범주형 데이터의 결측값을 적절한 값으로 대체
        data.forEach(row => {
            row['rbc'] = row['rbc'] ?? 'normal';
            row['pc'] = row['pc'] ?? 'normal';
            row['pcc'] = row['pcc'] ?? 'notpresent';
            row['ba'] = row['ba'] ?? 'notpresent';
            row['htn'] = row['htn'] ?? 'no';
            row['dm'] = (row['dm'] ?? 'no').replace(/(\t| )*(no|yes)/gi, "$2");
            row['cad'] = (row['cad'] ?? 'no').replace(/\t?(no|ckd)\t?/g, "$1");
            row['appet'] = row['appet'] ?? 'good';
            row['pe'] = row['pe'] ?? 'no';
            row['ane'] = row['ane'] ?? 'no';
        });


        // 범주형 데이터를 레이블 인코딩
        const categorical_label_mappings: Record<string, Record<string, number>> = {
            rbc: { 'abnormal': 0, 'normal': 1 },
            pc: { 'abnormal': 0, 'normal': 1 },
            pcc: { 'notpresent': 0, 'present': 1 },
            ba: { 'notpresent': 0, 'present': 1 },
            htn: { 'no': 0, 'yes': 1 },
            dm: { 'no': 0, 'yes': 1 },
            cad: { 'no': 0, 'yes': 1 },
            appet: { 'good': 0, 'poor': 1 },
            pe: { 'no': 0, 'yes': 1 },
            ane: { 'no': 0, 'yes': 1 },
            classification: { 'ckd': 0, 'ckd\t': 1, 'notckd': 2 }
        }

        Object.entries(categorical_label_mappings).forEach(([col, label_mappings]) => {
            data.forEach(row => { row[col] = label_mappings[row[col]] });
        });


        // 수치형 데이터를 MinMax 스케일링
        const feature_ranges: Record<string, Record<string, number>> = {
            id: { 'min': 0, 'max': 399 },
            age: { 'min': 2.0, 'max': 90.0 },
            bp: { 'min': 50.0, 'max': 180.0 },
            sg: { 'min': 1.005, 'max': 1.025 },
            al: { 'min': 0.0, 'max': 5.0 },
            su: { 'min': 0.0, 'max': 5.0 },
            rbc: { 'min': 0, 'max': 1 },
            pc: { 'min': 0, 'max': 1 },
            pcc: { 'min': 0, 'max': 1 },
            ba: { 'min': 0, 'max': 1 },
            bgr: { 'min': 22.0, 'max': 490.0 },
            bu: { 'min': 1.5, 'max': 391.0 },
            sc: { 'min': 0.4, 'max': 76.0 },
            sod: { 'min': 4.5, 'max': 163.0 },
            pot: { 'min': 2.5, 'max': 47.0 },
            hemo: { 'min': 3.1, 'max': 17.8 },
            pcv: { 'min': 9.0, 'max': 54.0 },
            wc: { 'min': 2200.0, 'max': 26400.0 },
            rc: { 'min': 2.0, 'max': 8.0 },
            htn: { 'min': 0, 'max': 1 },
            dm: { 'min': 0, 'max': 1 },
            cad: { 'min': 0, 'max': 1 },
            appet: { 'min': 0, 'max': 1 },
            pe: { 'min': 0, 'max': 1 },
            ane: { 'min': 0, 'max': 1 },
            classification: { 'min': 0, 'max': 2 }
        }

        Object.entries(feature_ranges).forEach(([col, { min, max }]) => {
            data.forEach(row => {
                const scaled = (row[col] - min) / (max - min);
                row[col] = Math.min(1, Math.max(0, scaled));
            });
        });

        setPreprocessedPatientsInfo(data);
    };

    useEffect(() => {
        if (ckksSeal && preprocessedPatientsInfo.length > 0) {
            const features = ['age', 'bp', 'sg', 'al', 'su', 'rbc', 'pc', 'pcc', 'ba', 'bgr', 'bu', 'sc', 'sod', 'pot', 'hemo', 'pcv', 'wc', 'rc', 'htn', 'dm', 'cad', 'appet', 'pe', 'ane'];

            for (let i = 0; i < Math.min(preprocessedPatientsInfo.length, 10); i++) {
                const body = {
                    serializedPatientInfo: ckksSeal.serializeCipherText(ckksSeal.encrypt(features.map(feature => (preprocessedPatientsInfo[i][feature] || 0)))),
                    serializedPublickey: ckksSeal.serializePublicKey(),
                    serializedRelinKeys: ckksSeal.serializeRelinKeys(),
                    serializedGaloisKey: ckksSeal.serializeGaloisKey(),
                };
                //console.log(`Body size for request ${i}: ${new Blob([JSON.stringify(body)]).size} bytes`);

                axios.post('/api/diseasePrediction/kidneyDisease', body).then((response) => {
                    const { message, prediction } = response.data;
                    const result = ckksSeal.decrypt(ckksSeal.deserializeCipherText(prediction))[0];
                    console.log(i, result, result >= 0.5);
                });
            }

        }
    }, [ckksSeal, preprocessedPatientsInfo]);

    return (
        <div>
            <input type="file" accept=".csv" onChange={handleFileUpload} />
            {processingError && <div className="error">{processingError}</div>}
            <div style={{ display: "flex" }}>
                <div>
                    <pre>{originalPatientsInfo}</pre>
                </div>
                <div>
                    <pre>{JSON.stringify(preprocessedPatientsInfo, null, 2)}</pre>
                </div>
            </div>
        </div>
    )
}



// if (ckksSeal) {
//     const predictKidneyDisease = (inputValues: Record<string, number>) => {
//         const featureCoefficients: Record<string, number> = {
//             age: -0.048679266632216,
//             bp: -0.320403544732430,
//             sg: 0.729050323269200,
//             al: -0.367482996543020,
//             su: -0.052605427622177,
//             rbc: 0.052538820178293,
//             pc: -0.116129053176325,
//             pcc: 0.081432102516962,
//             ba: 0.044370466546876,
//             bgr: -0.254182963093594,
//             bu: 0.128986738493353,
//             sc: 0.242814750966399,
//             sod: 0.707590579406548,
//             pot: -0.138404721177172,
//             hemo: 0.870227239358290,
//             pcv: -0.007279127153422,
//             wc: 0.039198895907087,
//             rc: -0.010319417466081,
//             htn: -0.058067090087025,
//             dm: -0.046350509373686,
//             cad: 0.053633228194063,
//             appet: -0.050534520076565,
//             pe: -0.062903240930798,
//             ane: 0.076360701482898
//         };

//         const scaleConst = ckksSeal.encrypt([1]);
//         const intercept = ckksSeal.encrypt([-0.9187316984291245]);
//         const coeffs = ckksSeal.encrypt(Object.keys(featureCoefficients).map(key => featureCoefficients[key]));
//         const values = ckksSeal.encrypt(Object.keys(featureCoefficients).map(key => (inputValues[key] || 0)));

//         const prediction = ckksSeal.add(ckksSeal.sum(ckksSeal.multiply(coeffs, values)), ckksSeal.multiply(scaleConst, intercept));
//         return ckksSeal.decrypt(prediction)[0];
//     }

//     for (let i = 0; i < Math.min(data.length, 30); i++) {
//         const result = predictKidneyDisease(data[i]);
//         console.log(i, result, result >= 0.5);
//     }
// }


// const predictKidneyDisease = (inputValues: Record<string, number>) => {
//     const featureCoefficients: Record<string, number> = {
//         age: -0.048679266632216,
//         bp: -0.320403544732430,
//         sg: 0.729050323269200,
//         al: -0.367482996543020,
//         su: -0.052605427622177,
//         rbc: 0.052538820178293,
//         pc: -0.116129053176325,
//         pcc: 0.081432102516962,
//         ba: 0.044370466546876,
//         bgr: -0.254182963093594,
//         bu: 0.128986738493353,
//         sc: 0.242814750966399,
//         sod: 0.707590579406548,
//         pot: -0.138404721177172,
//         hemo: 0.870227239358290,
//         pcv: -0.007279127153422,
//         wc: 0.039198895907087,
//         rc: -0.010319417466081,
//         htn: -0.058067090087025,
//         dm: -0.046350509373686,
//         cad: 0.053633228194063,
//         appet: -0.050534520076565,
//         pe: -0.062903240930798,
//         ane: 0.076360701482898
//     };

//     const scaleConst = ckksSeal.encrypt([1]);
//     const intercept = ckksSeal.encrypt([-0.9187316984291245]);
//     const coeffs = ckksSeal.encrypt(Object.keys(featureCoefficients).map(key => featureCoefficients[key]));
//     const patientInfo = ckksSeal.encrypt(Object.keys(featureCoefficients).map(key => (inputValues[key] || 0)));

//     const prediction = serverCkksSeal.add(serverCkksSeal.sum(serverCkksSeal.multiply(coeffs, patientInfo)), serverCkksSeal.multiply(scaleConst, intercept));
//     return ckksSeal.decrypt(prediction)[0];
// }

// for (let i = 0; i < Math.min(patientsInfo.length, 10); i++) {
//     const result = predictKidneyDisease(patientsInfo[i]);
//     console.log(i, result, result >= 0.5);
// }

// for (let i = 0; i < Math.min(patientsInfo.length, 10); i++) {
//     const patientData = Object.keys(featureCoefficients).map(key => (patientsInfo[i][key] || 0));
//     const encryptedData = ckksSeal.serializeCipherText(ckksSeal.encrypt(patientData));
//     const serializedPublicKey = ckksSeal.serializePublicKey();

//     const payload = {
//         serializedPatientInfo: encryptedData,
//         serializedPublickey: serializedPublicKey,
//     };

//     const payloadString = JSON.stringify(payload);
//     const payloadSize = new Blob([payloadString]).size; // Blob 객체를 사용해 크기를 측정

//     console.log(`Payload size for request ${i}: ${payloadSize} bytes`);

//     axios.post(`/api/diseasePrediction/kidneyDisease`, payload)
//         .then((response) => {
//             console.log("Response received:", response.data);
//             const { message, prediction } = response.data;
//             const result = ckksSeal.decrypt(ckksSeal.deserializeCipherText(prediction))[0];
//             console.log(i, result, result >= 0.5);
//         })
//         .catch((error) => {
//             console.error("Error sending request:", error);
//         });
// }