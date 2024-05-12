import { MongoClient, Db } from "mongodb";

/**
 * MongoDbProvider는 MongoDB 데이터베이스 연결을 관리하는 싱글톤 클래스입니다.
 * 이 클래스는 애플리케이션 전역에서 단일 MongoDB 클라이언트 인스턴스를 관리하여
 * 효율적인 연결 및 리소스 사용을 보장합니다.
 */
export default class MongoDbProvider {
    private static client: MongoClient | undefined = undefined;
    private static dbInstance: Db | undefined = undefined;
    private static uri: string;

    /**
     * 생성자는 private로 설정되어 외부에서 인스턴스 생성을 방지합니다.
     */
    private constructor() { }

    /**
     * MongoDB 서버에 연결합니다. 새로운 URI가 제공되면 연결을 재설정하며,
     * 기존 연결이 있을 경우 재사용합니다. 연결 실패 시 예외가 발생합니다.
     * @param {string} uri - MongoDB 서버의 URI입니다.
     * @returns {Promise<MongoClient>} 연결된 MongoClient 인스턴스를 반환합니다.
     */
    public static async connectDb(uri: string): Promise<MongoClient> {
        if (global._mongoUri === uri && global._mongo) {
            // 글로벌 URI 및 클라이언트를 확인하고 재사용합니다.
            if (MongoDbProvider.uri !== uri || !MongoDbProvider.client) {
                MongoDbProvider.uri = global._mongoUri;
                MongoDbProvider.client = global._mongo;
            }
        }
        else if (MongoDbProvider.uri === uri && MongoDbProvider.client) {
            // 기존 URI 및 클라이언트를 확인하고 재사용합니다.
            if (process.env.NODE_ENV === 'development') {
                global._mongoUri = uri;
                global._mongo = MongoDbProvider.client;
            }
        }
        else {
            // 새로운 연결을 설정합니다.
            await MongoDbProvider.disconnectDb();
            MongoDbProvider.uri = uri;
            MongoDbProvider.client = new MongoClient(uri);
            try {
                await MongoDbProvider.client.connect();
                if (process.env.NODE_ENV === 'development') {
                    global._mongo = MongoDbProvider.client;
                    global._mongoUri = uri;
                }
            } catch (err) {
                MongoDbProvider.uri = "";
                MongoDbProvider.client = undefined;
                console.error("MongoDB connection failed:", err);
                throw err;
            }
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
     * @param {string} dbName - 요청할 데이터베이스의 이름입니다.
     * @param {string} [uri] - (선택적) MongoDB 연결 URI입니다.
     * @returns {Promise<Db>} 데이터베이스 인스턴스를 반환합니다.
     */
    public static async getDb(uri: string): Promise<Db> {
        await MongoDbProvider.connectDb(uri);
        if (!MongoDbProvider.dbInstance) {
            if (!MongoDbProvider.client) {
                throw new Error("MongoDB client is not initialized. Call connectDb(uri) first.");
            }
            MongoDbProvider.dbInstance = MongoDbProvider.client.db();
        }
        return MongoDbProvider.dbInstance;
    }
} 