import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import PatientDataManagementController from "@/controllers/patientDataManager/PatientDataManagementController";


export const config = {
    api: {
        bodyParser: {
            sizeLimit: '2mb'
        }
    }
};


export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    const session = await getServerSession(request, response, authOptions)

    if (!session) {
        response.status(401).end('Unauthorized');
        return;
    }

    switch (request.method) {
        case "POST": {
            try {
                await PatientDataManagementController.handleSavePatientData(request, response, session);
            } catch (error) {
                console.error(error);
                response.status(500).end(`${error}`);
            }
            break;
        }
        case "DELETE": {
            try {
                await PatientDataManagementController.handleDeletePatientData(request, response, session);
            } catch (error) {
                console.error(error);
                response.status(500).end(`${error}`);
            }
            break;
        }
        default: {
            response.setHeader("Allow", ["POST", "DELETE"]);
            response.status(405).end(`Method ${request.method} Not Allowed`);
        }
    }
}