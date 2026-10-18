import nextEnv from "@next/env";
import mongoose from "mongoose";

const argument = (name: string) =>
  process.argv
    .find((value) => value.startsWith(`--${name}=`))
    ?.slice(name.length + 3);

async function main() {
  nextEnv.loadEnvConfig(process.cwd());
  const database = argument("database");
  if (!database || !/^swiftcare_preview_[a-z0-9_]{1,40}$/.test(database))
    throw new Error("Specify --database=swiftcare_preview_<unique-name>.");
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required.");
  const client = new mongoose.mongo.MongoClient(uri, {
    serverSelectionTimeoutMS: 8000,
    maxPoolSize: 2,
  });
  if (database.toLowerCase() === client.options.dbName.toLowerCase())
    throw new Error("The preview target must differ from the source database.");

  try {
    await client.connect();
    // Never query the source database: inspect only the explicitly named target.
    const target = client.db(database);
    const collections = await target
      .listCollections({}, { nameOnly: true })
      .toArray();
    console.log(JSON.stringify({ database, collections: collections.length }));
    if (collections.length)
      throw new Error(
        "Target has collections. Refusing to overwrite, reset, or reseed it.",
      );
  } finally {
    await client.close();
  }

  if (!process.argv.includes("--apply")) {
    console.log(
      "Dry run complete. No records or indexes changed. Add --apply to seed synthetic preview data.",
    );
    return;
  }

  // Import models only after the read-only emptiness check. seedDemo checks again
  // with automatic collection/index creation disabled before its first write.
  const { seedDemo } = await import("./seed-demo");
  await seedDemo(uri, { previewDatabase: database });
  const target = mongoose.connection.db!;
  const collections = await target
    .listCollections({}, { nameOnly: true })
    .toArray();
  const counts: Record<string, number> = {};
  for (const { name } of collections)
    counts[name] = await target.collection(name).countDocuments({});
  console.log(JSON.stringify({ database, syntheticDemo: true, counts }));
}

main()
  .catch((error: unknown) => {
    // Database driver errors can contain hostnames and connection details.
    // Only expose our own validation messages, never the URI or driver output.
    const safeMessages = [
      "Specify --database=swiftcare_preview_<unique-name>.",
      "MONGODB_URI is required.",
      "The preview target must differ from the source database.",
      "Target has collections. Refusing to overwrite, reset, or reseed it.",
      "Preview seed requires a separate swiftcare_preview_* database.",
      "Preview seed refuses a target that already has collections.",
    ];
    console.error(
      error instanceof Error && safeMessages.includes(error.message)
        ? error.message
        : "Preview seed failed. Check database permissions and connectivity; connection details were withheld.",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
