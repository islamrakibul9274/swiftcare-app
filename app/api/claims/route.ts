import { api, body } from "@/lib/api";
import mongoose from "mongoose";
import { audit, getActor } from "@/lib/security";
import Claim from "@/models/Claim";
import { claimPatchSchema } from "@/lib/validation";
import { AppError } from "@/lib/errors";
export const GET = api(async () => {
  const actor = await getActor(["ADMIN"]);
  const claims = await Claim.find({ clinicId: actor.clinicId })
    .sort({ dateOfService: -1 })
    .limit(250)
    .lean();
  await audit(
    actor,
    "view_list",
    "claims",
    claims.map((c) => String(c._id)).join(","),
  );
  return { claims };
});
export const PATCH = api(async (request) => {
  const actor = await getActor(["ADMIN"]);
  const data = await body(request, claimPatchSchema);
  const claim = await Claim.findOne({ _id: data.id, clinicId: actor.clinicId });
  if (!claim) throw new AppError(404, "This claim is unavailable.");
  const allowed: Record<string, string[]> = {
    "Pending Submission": ["Pending Submission", "Submitted"],
    Submitted: ["Submitted", "Paid", "Denied"],
    Denied: ["Denied", "Pending Submission"],
    Paid: ["Paid"],
  };
  if (!allowed[claim.status]?.includes(data.status))
    throw new AppError(409, "Use the next valid step in the claim pipeline.");
  if (
    claim.status === "Paid" &&
    (data.amount !== undefined || data.billingCode !== undefined)
  )
    throw new AppError(
      409,
      "Paid claims are locked. Record adjustments in your payer system.",
    );
  if (data.amount !== undefined) claim.amount = data.amount;
  if (data.billingCode) claim.billingCode = data.billingCode;
  if (data.status === "Submitted" && claim.amount <= 0)
    throw new AppError(
      400,
      "Review the charge amount before recording submission.",
    );
  claim.status = data.status;
  claim.requiresReview = false;
  claim.updatedBy = actor.id;
  claim.payerReference = data.payerReference;
  await mongoose.connection.transaction(async (transaction) => {
    await claim.save({ session: transaction });
    await audit(actor, "update_status", "claim", data.id, transaction);
  });
  return {
    claim,
    message:
      "Claim ledger updated. Payer submission takes place in your billing system.",
  };
});
