import "server-only";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { AuditEvent } from "@/models/Security";
export async function credentialReminders(clinicId?: string) {
  await dbConnect();
  const expiring = await User.find({
    active: { $ne: false },
    clinicId: clinicId || { $exists: true },
    credentialExpiresAt: { $lte: new Date(Date.now() + 30 * 86400000) },
  })
    .select("clinicId credentialExpiresAt")
    .lean();
  const clinicIds = [
    ...new Set(
      expiring.map((s) => s.clinicId).filter((id): id is string => !!id),
    ),
  ];
  const admins = await User.find({
    clinicId: { $in: clinicIds },
    role: "ADMIN",
    active: { $ne: false },
    notificationPreferences: { $ne: false },
  })
    .select("clinicId")
    .lean();
  let created = 0;
  for (const staff of expiring) {
    if (!staff.credentialExpiresAt) continue;
    const days = Math.ceil(
      (+staff.credentialExpiresAt - Date.now()) / 86400000,
    );
    const period = days <= 0 ? "expired" : days <= 7 ? "7d" : "30d";
    for (const admin of admins.filter((a) => a.clinicId === staff.clinicId)) {
      const result = await Notification.updateOne(
        {
          sourceKey: `credential:${staff._id}:${staff.credentialExpiresAt.toISOString().slice(0, 10)}:${period}:${admin._id}`,
        },
        {
          $setOnInsert: {
            clinicId: staff.clinicId,
            userId: String(admin._id),
            title:
              days <= 0
                ? "Credential review overdue"
                : "A credential needs review",
            message:
              days <= 0
                ? "A team credential has passed its recorded expiry date. Review staff access and credential records."
                : `A team credential expires within ${days <= 7 ? 7 : 30} days. Review staff records and arrange renewal.`,
            href: "/admin/staff",
          },
        },
        { upsert: true },
      );
      created += result.upsertedCount;
    }
  }
  for (const id of clinicIds)
    await AuditEvent.create({
      clinicId: id,
      actorId: "system:credential-reminders",
      action: "check_credential_expiry",
      resource: "staff",
    });
  return { created };
}
