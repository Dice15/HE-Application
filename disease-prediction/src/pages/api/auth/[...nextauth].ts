import MongoDbProvider from "@/core/modules/database/MongoDbProvider";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import NextAuth, { AuthOptions, Session, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import { ObjectId } from "mongodb";


declare module "next-auth/jwt" {
    interface JWT {
        user: User;
    }
}


declare module "next-auth" {
    interface Session {
        user: User & { id: string };
    }
}


export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Guest User',
            credentials: {},
            authorize: async () => {
                // 새로운 게스트 사용자 ID 생성
                const guestId = new ObjectId().toString();
                return {
                    id: guestId,
                    name: 'Guest User',
                    email: `guest_${guestId}@guest.com`,
                };
            },
        }),
    ],

    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60 // 30일
    },

    callbacks: {
        // JWT 토큰 생성 시 호출 (사용자 정보를 JWT 토큰에 포함)
        jwt: async ({ token, user }: { token: JWT, user?: User }) => {
            if (user) {
                token.user = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                };
            }
            return token;
        },

        // 세션 조회 시 호출 (JWT 토큰의 사용자 정보를 세션에 포함)
        session: async ({ session, token }: { session: Session, token: JWT }) => {
            session.user = token.user;
            return session;
        },
    },

    // 비밀 키: JWT 토큰을 서명하거나 검증할 때 사용됩니다.
    secret: process.env.NEXTAUTH_SECRET,

    // 데이터베이스 어댑터: MongoDB를 사용하도록 설정합니다.
    //adapter: MongoDBAdapter(MongoDbProvider.connectDb(process.env.MONGODB_URI)),
}


export default NextAuth(authOptions);