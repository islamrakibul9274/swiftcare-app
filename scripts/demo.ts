import { MongoMemoryReplSet } from "mongodb-memory-server";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { createRequire } from "node:module";
import nextEnv from "@next/env";
import mongoose from "mongoose";
import { seedDemo } from "./seed-demo";
const require = createRequire(import.meta.url);
async function main() {
  nextEnv.loadEnvConfig(process.cwd());
  const mongo = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
      storageEngine: "wiredTiger",
      dbName: "swiftcare_demo",
    },
  });
  const uri = mongo.getUri("swiftcare_demo");
  const port = process.env.DEMO_PORT || "3000";
  await seedDemo(uri);
  await mongoose.disconnect();
  await mkdir(".local", { recursive: true });
  const next = spawn(
    process.execPath,
    [
      require.resolve("next/dist/bin/next"),
      process.argv.includes("--production") ? "start" : "dev",
      "--hostname",
      "127.0.0.1",
      "--port",
      port,
    ],
    {
      stdio: ["inherit", "pipe", "inherit"],
      env: {
        ...process.env,
        MONGODB_URI: uri,
        AUTH_SECRET: randomBytes(32).toString("hex"),
        AUTH_URL: `http://localhost:${port}`,
        AUTH_TRUST_HOST: "true",
        SWIFTCARE_DEMO: "true",
        VERCEL: "",
        VERCEL_ENV: "development",
        VERCEL_URL: "",
      },
    },
  );
  next.stdout.on("data", (chunk: Buffer) => {
    process.stdout.write(chunk);
    if (chunk.toString().includes("Ready in"))
      void writeFile(
        `.local/demo-runtime-${port}.json`,
        JSON.stringify({
          mode: "synthetic-demo",
          mongoUri: uri,
          pid: process.pid,
        }),
        { mode: 0o600 },
      );
  });
  console.log(
    `Synthetic SwiftCare demo: http://localhost:${port}. Production records are not used.`,
  );
  let stopping = false;
  const stop = async (code = 0) => {
    if (stopping) return;
    stopping = true;
    next.kill("SIGTERM");
    await mongo.stop();
    try {
      const runtime = JSON.parse(
        await readFile(`.local/demo-runtime-${port}.json`, "utf8"),
      );
      if (runtime.pid === process.pid)
        await unlink(`.local/demo-runtime-${port}.json`);
    } catch {}
    process.exit(code);
  };
  process.on("SIGTERM", () => void stop());
  process.on("SIGINT", () => void stop());
  next.on("exit", (code) => void stop(code || 0));
}
main().catch((error) => {
  console.error(
    "Demo startup failed",
    error instanceof Error ? error.message : "Unknown error",
  );
  process.exit(1);
});
