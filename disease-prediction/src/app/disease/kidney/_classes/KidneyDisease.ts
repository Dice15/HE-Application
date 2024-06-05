import { CKKSSealBuilder } from "@/core/modules/homomorphic-encryption/ckks";
import { NodeSealProvider } from "@/core/modules/homomorphic-encryption/node-seal";
import Swal from "sweetalert2";

export class KidneyDisease {
    private constructor() { }


    private static transformToMLData(data: any[]): any[] {
        // 수치형 데이터의 결측값을 평균값으로 대체
        const numericMeans: Record<string, number> = {
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

        Object.entries(numericMeans).forEach(([col, mean]) => {
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

        return data;
    };


    private static getFeatures(): string[] {
        return ['age', 'bp', 'sg', 'al', 'su', 'rbc', 'pc', 'pcc', 'ba', 'bgr', 'bu', 'sc', 'sod', 'pot', 'hemo', 'pcv', 'wc', 'rc', 'htn', 'dm', 'cad', 'appet', 'pe', 'ane'];
    }


    private static isDisease(prediction: number): boolean {
        return prediction < 0.5;
    }





    public static prediction(): boolean {
        return true;
    }
}
