import "server-only";
import mongoose from "mongoose";
type Cache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};
const runtime = globalThis as typeof globalThis & { swiftcareMongo?: Cache };
const cache = (runtime.swiftcareMongo ??= { connection: null, promise: null });
export default async function dbConnect() {
  if (cache.connection) return cache.connection;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("DATABASE_NOT_CONFIGURED");
  cache.promise ??= mongoose.connect(uri, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 8000,
    maxPoolSize: 10,
  });
  try {
    cache.connection = await cache.promise;
    return cache.connection;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
}
