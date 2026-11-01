import { MongoClient } from "mongodb";
import { DatabaseError } from "./errors";

// Used only by server routes and local CLI. The route-facing module imports server-only.
const shared = globalThis as typeof globalThis & {
  railMongo?: { uri: string; promise: Promise<MongoClient> };
};
export async function database() {
  const uri = process.env.MONGODB_URI?.trim(),
    name = process.env.MONGODB_DB?.trim();
  if (
    !uri ||
    !/^mongodb(?:\+srv)?:\/\//.test(uri) ||
    /[<>]/.test(uri) ||
    !name ||
    !/^[\w-]{1,63}$/.test(name)
  )
    throw new DatabaseError("DB_CONFIG");
  if (!shared.railMongo || shared.railMongo.uri !== uri) {
    let client: MongoClient;
    try {
      client = new MongoClient(uri, {
        maxPoolSize: 10,
        minPoolSize: 0,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        socketTimeoutMS: 8000,
        waitQueueTimeoutMS: 5000,
      });
    } catch {
      throw new DatabaseError("DB_CONFIG");
    }
    const promise = client.connect().catch(async () => {
      if (shared.railMongo?.promise === promise) shared.railMongo = undefined;
      await client.close().catch(() => undefined);
      throw new DatabaseError("DB_UNAVAILABLE");
    });
    shared.railMongo = { uri, promise };
  }
  try {
    return (await shared.railMongo.promise).db(name);
  } catch {
    throw new DatabaseError("DB_UNAVAILABLE");
  }
}
export async function closeDatabase() {
  const entry = shared.railMongo;
  shared.railMongo = undefined;
  if (entry) await (await entry.promise.catch(() => null))?.close();
}
