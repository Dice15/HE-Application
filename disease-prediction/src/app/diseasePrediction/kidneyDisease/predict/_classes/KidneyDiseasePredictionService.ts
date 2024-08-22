import { CKKSSeal, CKKSSealBuilder } from "@/core/modules/node-ckks/CKKSSeal";
import { NodeSealProvider } from "@/core/modules/node-ckks/NodeSeal";
import axios from "axios";


export class KidneyDiseasePredictionService {
    private constructor() { }


    public static async createCkksSeal(predictModel: "linear" | "logistic"): Promise<CKKSSeal> {
        return NodeSealProvider.getSeal()
            .then((nodeSeal) => {
                return (predictModel === "linear"
                    ? new CKKSSealBuilder(nodeSeal, nodeSeal.SecurityLevel.tc128, Math.pow(2, 14), [47, 47, 47, 60], Math.pow(2, 47))
                    : new CKKSSealBuilder(nodeSeal, nodeSeal.SecurityLevel.tc128, Math.pow(2, 14), [47, 47, 47, 47, 47, 47, 47, 47, 60], Math.pow(2, 47))
                )
                    .createSecretKey()
                    .createPublicKey()
                    .createRelinKeys()
                    .createGaloisKeys([1, 2, 4, 8, 16])
                    .build()
            })
            .catch((error) => {
                console.error("An error occurred:", error);
                if (error instanceof Error) {
                    throw new Error(`Failed to initializing CkksSeal: ${error.message}`);
                } else {
                    throw new Error('An unknown error occurred while initializing the CkksSeal');
                }
            });
    }


    public static async uploadCkksKey(ckksSeal: CKKSSeal): Promise<void> {
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

        const saveChunks = async (chunks: Uint8Array[], keyType: "publicKey" | "relinKeys" | "galoisKeys") => {
            for (let i = 0; i < chunks.length; i++) {
                const base64Chunk = uint8ArrayToBase64(chunks[i]);
                axios.post('/api/ckksKeyManager/ckksKeyManagement', {
                    chunk: base64Chunk,
                    index: i,
                    keyType: keyType
                });
            }
        }

        return Promise.all(
            [
                saveChunks(splitIntoChunks(ckksSeal.serializePublicKey(), CHUNK_SIZE_BYTES), "publicKey"),
                saveChunks(splitIntoChunks(ckksSeal.serializeRelinKeys(), CHUNK_SIZE_BYTES), "relinKeys"),
                saveChunks(splitIntoChunks(ckksSeal.serializeGaloisKey(), CHUNK_SIZE_BYTES), "galoisKeys")
            ])
            .then(() => { })
            .catch((error) => {
                console.error("An error occurred:", error);
                if (error instanceof Error) {
                    throw new Error(`Failed to uploading CkksKey: ${error.message}`);
                } else {
                    throw new Error('An unknown error occurred while uploading the CkksKey');
                }
            });
    }


    public static async deleteCkksKey(): Promise<void> {
        return axios.delete('/api/ckksKeyManager/ckksKeyManagement')
            .then(() => { })
            .catch((error) => {
                console.error("An error occurred:", error);
                if (error instanceof Error) {
                    throw new Error(`Failed to deleting CkksKey: ${error.message}`);
                } else {
                    throw new Error('An unknown error occurred while deleting the CkksKey');
                }
            });
    }


    public static preprocessPatientData(patientData: any[]): {
        features: string[];
        rows: any[][];
    } {
        /**
         * List of features used in the dataset
         */
        const features = ['age', 'bp', 'sg', 'al', 'su', 'rbc', 'pc', 'pcc', 'ba', 'bgr', 'bu', 'sc', 'sod', 'pot', 'hemo', 'pcv', 'wc', 'rc', 'htn', 'dm', 'cad', 'appet', 'pe', 'ane'];


        /**
         * Replace missing numeric values with their mean
         */
        Object.entries({
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
        } as Record<string, number>).forEach(([feature, mean]) => {
            patientData.forEach(row => { row[feature] = row[feature] ?? mean; });
        });


        /**
         * Replace missing categorical values with a default
         */
        patientData.forEach(row => {
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


        /**
         * Encode categorical values into numeric labels
         */
        Object.entries({
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
        } as Record<string, Record<string, number>>).forEach(([feature, label_mappings]) => {
            patientData.forEach(row => { row[feature] = label_mappings[row[feature]] });
        });


        /**
         * Apply MinMax scaling to numeric data
         */
        Object.entries({
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
        } as Record<string, Record<string, number>>).forEach(([feature, { min, max }]) => {
            patientData.forEach(row => {
                const scaled = (row[feature] - min) / (max - min);
                row[feature] = Math.min(1, Math.max(0, scaled));
            });
        });

        return {
            features: features,
            rows: patientData.map((data) => features.map(feature => (data[feature] || 0)))
        };
    };


    public static async uploadPatientData(ckksSeal: CKKSSeal, patientData: any[], dataName: string): Promise<void> {
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

        const saveChunks = async (chunks: Uint8Array[]): Promise<void> => {
            for (let i = 0; i < chunks.length; i++) {
                const base64Chunk = uint8ArrayToBase64(chunks[i]);
                axios.post('/api/patientDataManager/patientDataManagement', {
                    chunk: base64Chunk,
                    index: i,
                    dataName: dataName
                });
            }
        }

        return saveChunks(splitIntoChunks(ckksSeal.serializeCipherText(ckksSeal.encrypt(patientData)), CHUNK_SIZE_BYTES))
            .then(() => { })
            .catch((error) => {
                console.error("An error occurred:", error);
                if (error instanceof Error) {
                    throw new Error(`Failed to uploading patient data: ${error.message}`);
                } else {
                    throw new Error('An unknown error occurred while uploading the patient data');
                }
            });
    }


    public static async deletePatientData(): Promise<void> {
        return axios.delete('/api/patientDataManager/patientDataManagement')
            .then(() => { })
            .catch((error) => {
                console.error("An error occurred:", error);
                if (error instanceof Error) {
                    throw new Error(`Failed to deleting patient data: ${error.message}`);
                } else {
                    throw new Error('An unknown error occurred while deleting the patient data');
                }
            });
    }


    public static async predictDisease(ckksSeal: CKKSSeal, dataName: string, chunkSize: number, predictModel: "linear" | "logistic"): Promise<number[]> {
        const base64ToUint8Array = (base64: string): Uint8Array => {
            const binaryString = atob(base64);
            const length = binaryString.length;
            const bytes = new Uint8Array(length);
            for (let i = 0; i < length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes;
        }

        return axios.post('/api/diseasePrediction/kidneyDiseasePrediction',
            {
                dataName: dataName,
                featureSize: chunkSize,
                predictModel: predictModel
            })
            .then((response) => {
                return ckksSeal.decrypt(ckksSeal.deserializeCipherText(base64ToUint8Array(response.data.data.prediction)));
            })
            .catch((error) => {
                console.error("An error occurred:", error);
                if (error instanceof Error) {
                    throw new Error(`Failed to predicting disease: ${error.message}`);
                } else {
                    throw new Error('An unknown error occurred while predicting the disease');
                }
            });
    }


    public static isKidneyDisease(prediction: number): boolean {
        return prediction < 0.5;
    }
}