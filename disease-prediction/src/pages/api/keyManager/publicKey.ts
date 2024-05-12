import MongoDbProvider from "@/core/modules/database/MongoDbProvider";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    const { serializedPublickey } = request.body;
    const db = await MongoDbProvider.getDb(process.env.MONGODB_URI);
    const session = await getServerSession(request, response, authOptions)

    try {
        if (session === null) {
            response.status(500).json({ message: "FAIL", data: null });
        } else {
            const result = await db.collection("publickey").insertOne({
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                publickey: serializedPublickey,
            });
            response.status(200).json({ message: "SUCCESS", data: { id: result.insertedId.toString() } });
        }
    }
    catch (e) {
        response.status(502).json({ message: e });
    }
}