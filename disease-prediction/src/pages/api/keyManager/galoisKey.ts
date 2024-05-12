import MongoDbProvider from "@/core/modules/database/MongoDbProvider";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    const db = await MongoDbProvider.getDb();
    const session = await getServerSession(request, response, authOptions)

    if (!session) {
        response.status(401).json({ message: "Unauthorized", data: null });
        return;
    }

    switch (request.method) {
        case "GET": {
            try {
                const result = await db.collection("galoiskey").findOne({
                    id: session.user.id,
                });
                response.status(200).json({ message: "SUCCESS", data: { serializedGaloisKey: result ? result.galoiskey as string : null } });
            }
            catch (error) {
                response.status(502).json({ message: "Database error", error: error });
            }
            break;
        }
        case "POST": {
            const { serializedGaloisKey } = request.body;
            try {
                const result = await db.collection("galoiskey").insertOne({
                    id: session.user.id,
                    name: session.user.name,
                    email: session.user.email,
                    galoiskey: serializedGaloisKey,
                });
                response.status(200).json({ message: "SUCCESS", data: { id: result.insertedId.toString() } });
            }
            catch (error) {
                response.status(502).json({ message: "Database error", error: error });
            }
            break;
        }
        case "DELETE": {
            try {
                const result = await db.collection("galoiskey").deleteMany({
                    id: session.user.id,
                });
                response.status(200).json({ message: "SUCCESS", data: { deletedCount: result.deletedCount } });
            }
            catch (error) {
                response.status(502).json({ message: "Database error", error: error });
            }
            break;
        }
        default: {
            response.setHeader("Allow", ["GET", "POST", "DELETE"]);
            response.status(405).end(`Method ${request.method} Not Allowed`);
        }
    }
}

