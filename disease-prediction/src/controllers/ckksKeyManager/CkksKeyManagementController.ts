import CkksKeyManagementService from "@/services/ckksKeyManager/CkksKeyManagementService";
import { NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-auth";


interface ICkksKeyManagementControllerParams {
    chunk: string | undefined;
    index: string | undefined;
    keyType: ("publicKey" | "relinKeys" | "galoisKeys") | undefined;
}


export default class CkksKeyManagementController {
    private constructor() { }


    public static async handleSaveCkksKey(request: NextApiRequest, response: NextApiResponse, session: Session): Promise<void> {
        try {
            const { chunk, index, keyType } = request.body as ICkksKeyManagementControllerParams;

            if (chunk === undefined || index === undefined || keyType === undefined) {
                response.status(400).json({ msg: "Missing required body data." });
                return;
            }

            await CkksKeyManagementService.saveCkksKey(session.user.id, chunk, index, keyType);
            console.log(`Saved ${keyType} chunk${index}`);

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


    public static async handleDeleteCkksKey(request: NextApiRequest, response: NextApiResponse, session: Session): Promise<void> {
        try {
            await CkksKeyManagementService.deleteCkksKey(session.user.id, "publicKey");
            await CkksKeyManagementService.deleteCkksKey(session.user.id, "relinKeys");
            await CkksKeyManagementService.deleteCkksKey(session.user.id, "galoisKeys");
            console.log(`Deleted all keyType chunks`);

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