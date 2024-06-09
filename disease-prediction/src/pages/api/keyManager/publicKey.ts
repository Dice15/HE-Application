import MongoDbProvider from "@/core/modules/database/MongoDbProvider";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";


export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb'
        }
    }
};


export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    const db = await MongoDbProvider.connectDb(process.env.MONGODB_URI).then(() => MongoDbProvider.getDb());
    const session = await getServerSession(request, response, authOptions)

    if (!session) {
        response.status(401).json({ message: "Unauthorized", data: null });
        return;
    }

    switch (request.method) {
        case "POST": {
            const { chunk, index } = request.body;

            try {
                const result = await db.collection("publickey").insertOne({
                    id: session.user.id,
                    chunk: chunk,
                    index: index,
                });
                response.status(200).json({ message: "SUCCESS", data: { id: result.insertedId.toString() } });
            }
            catch (error) {
                console.error(error);
                response.status(502).json({ message: "Database error", error: error });
            }
            break;
        }
        case "DELETE": {
            try {
                const result = await db.collection("publickey").deleteMany({
                    id: session.user.id,
                });
                response.status(200).json({ message: "SUCCESS", data: { deletedCount: result.deletedCount } });
            }
            catch (error) {
                console.error(error);
                response.status(502).json({ message: "Database error", error: error });
            }
            break;
        }
        default: {
            response.setHeader("Allow", ["POST", "DELETE"]);
            response.status(405).end(`Method ${request.method} Not Allowed`);
        }
    }
}