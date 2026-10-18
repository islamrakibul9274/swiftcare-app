import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import nextEnv from "@next/env";
import { z } from "zod";
import User from "../models/User";
import Clinic from "../models/Clinic";
import { passwordSchema, emailSchema } from "../lib/validation";
const arg = (name: string) =>
  process.argv.find((v) => v.startsWith(`--${name}=`))?.slice(name.length + 3);
async function main() {
  nextEnv.loadEnvConfig(process.cwd());
  const input = z
    .object({
      name: z.string().min(2),
      email: emailSchema,
      clinicId: z.string().min(3),
      clinicName: z.string().min(2),
      password: passwordSchema,
    })
    .parse({
      name: arg("name"),
      email: arg("email"),
      clinicId: arg("clinic-id"),
      clinicName: arg("clinic-name"),
      password: process.env.BOOTSTRAP_PASSWORD,
    });
  if (!process.argv.includes("--apply"))
    throw new Error(
      "Add --apply only after selecting the intended database. Set BOOTSTRAP_PASSWORD in the process environment; do not put it in command arguments.",
    );
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required.");
  await mongoose.connect(process.env.MONGODB_URI);
  await User.init();
  if (await User.exists({ clinicId: input.clinicId, role: "ADMIN" }))
    throw new Error(
      "This clinic already has an administrator. Use its invitation flow.",
    );
  await Clinic.updateOne(
    { _id: input.clinicId },
    {
      $setOnInsert: {
        name: input.clinicName,
        ratePerUnit: 0,
        billingCode: "97153",
      },
    },
    { upsert: true },
  );
  await User.create({
    name: input.name,
    email: input.email,
    password: await bcrypt.hash(input.password, 12),
    role: "ADMIN",
    clinicId: input.clinicId,
    clinicName: input.clinicName,
    active: true,
    forcePasswordChange: true,
  });
  console.log(
    "Administrator created. A password change is required on first sign-in.",
  );
  await mongoose.disconnect();
}
main().catch(async (error) => {
  console.error(
    error instanceof z.ZodError
      ? error.issues[0].message
      : error instanceof Error
        ? error.message
        : "Bootstrap failed",
  );
  await mongoose.disconnect();
  process.exit(1);
});
