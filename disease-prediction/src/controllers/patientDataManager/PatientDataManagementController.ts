import PatientDataManagementService from "@/services/patientDataManager/PatientDataManagementService";
import { NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-auth";


interface IPatientDataManagementControllerParams {
    chunk: string | undefined;
    index: string | undefined;
}


export default class PatientDataManagementController {
    private constructor() { }


    public static async handleSavePatientData(request: NextApiRequest, response: NextApiResponse, session: Session): Promise<void> {
        try {
            const { chunk, index } = request.body as IPatientDataManagementControllerParams;

            if (chunk === undefined || index === undefined) {
                response.status(400).json({ msg: "Missing required body data." });
                return;
            }

            await PatientDataManagementService.savePatientData(session.user.id, chunk, index);
            console.log(`Saved patientData chunk${index}`);

            response.status(200).json({
                msg: "정상적으로 처리되었습니다.",
                data: null
            });
        }
        catch (error) {
            console.error(error);
            response.status(500).end(`${error}`);
        }
    }


    public static async handleDeletePatientData(request: NextApiRequest, response: NextApiResponse, session: Session): Promise<void> {
        try {
            await PatientDataManagementService.deletePatientData(session.user.id);
            console.log(`Deleted patientData chunks`);

            response.status(200).json({
                msg: "정상적으로 처리되었습니다.",
                data: null
            });
        }
        catch (error) {
            console.error(error);
            response.status(500).end(`${error}`);
        }
    }
}