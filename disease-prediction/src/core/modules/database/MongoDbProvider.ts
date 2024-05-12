import { MongoClient, Db } from "mongodb";

/**
 * MongoDbProvider는 MongoDB 데이터베이스 연결을 관리하는 싱글톤 클래스입니다.
 * 이 클래스는 애플리케이션 전역에서 단일 MongoDB 클라이언트 인스턴스를 관리하여
 * 효율적인 연결 및 리소스 사용을 보장합니다.
 */
export default class MongoDbProvider {
    private static client: MongoClient | undefined = undefined;
    private static dbInstance: Db | undefined = undefined;
    private static uri: string = process.env.MONGODB_URI || "";

    /**
     * 생성자는 private로 설정되어 외부에서 인스턴스 생성을 방지합니다.
     */
    private constructor() { }

    /**
     * MongoDB 서버에 연결합니다. 기존 연결이 있을 경우 재사용합니다.
     * @returns {Promise<MongoClient>} 연결된 MongoClient 인스턴스를 반환합니다.
     */
    public static async connectDb(): Promise<MongoClient> {
        if (MongoDbProvider.client) {
            return MongoDbProvider.client;
        }

        if (!MongoDbProvider.uri) {
            throw new Error("MongoDB URI is not defined.");
        }

        MongoDbProvider.client = new MongoClient(MongoDbProvider.uri, {
            serverSelectionTimeoutMS: 30000, // 타임아웃 설정
        });

        try {
            await MongoDbProvider.client.connect();
            console.log("MongoDB connected successfully");
        } catch (err) {
            console.error("MongoDB connection failed:", err);
            MongoDbProvider.client = undefined;
            throw err;
        }

        return MongoDbProvider.client;
    }

    /**
     * 현재의 MongoDB 연결을 종료하고 모든 관련 인스턴스를 해제합니다.
     */
    public static async disconnectDb(): Promise<void> {
        if (MongoDbProvider.client) {
            await MongoDbProvider.client.close();
            MongoDbProvider.client = undefined;
            MongoDbProvider.dbInstance = undefined;
        }
    }

    /**
     * 요청된 데이터베이스 인스턴스를 반환합니다. 필요한 경우 URI를 사용하여 데이터베이스에 연결합니다.
     * @returns {Promise<Db>} 데이터베이스 인스턴스를 반환합니다.
     */
    public static async getDb(): Promise<Db> {
        if (!MongoDbProvider.client) {
            await MongoDbProvider.connectDb();
        }

        if (!MongoDbProvider.dbInstance && MongoDbProvider.client) {
            MongoDbProvider.dbInstance = MongoDbProvider.client.db();
        }

        if (!MongoDbProvider.dbInstance) {
            throw new Error("Failed to get MongoDB instance.");
        }

        return MongoDbProvider.dbInstance;
    }
}
