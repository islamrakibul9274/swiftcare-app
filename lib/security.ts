import "server-only";
import { cache } from "react";
import type { ClientSession } from "mongoose";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Client from "@/models/Client";
import { AuditEvent, LoginSession } from "@/models/Security";
import { AppError } from "@/lib/errors";
import { isSessionValid, clientAccessFilter, type Role } from "@/lib/policy";
import { idSchema } from "@/lib/validation";
export interface Actor {
  id: string;
  name: string;
  email: string;
  role: Role;
  clinicId: string;
  clinicName: string;
  sid: string;
  forcePasswordChange: boolean;
  notificationPreferences: boolean;
}
const readActor = cache(async (): Promise<Actor> => {
  const session = await auth();
  if (!session?.user?.id || !session.user.sid)
    throw new AppError(
      401,
      "Your session has ended. Please sign in again.",
      "SESSION_EXPIRED",
    );
  await dbConnect();
  const [user, login] = await Promise.all([
    User.findById(session.user.id).lean(),
    LoginSession.findById(session.user.sid).lean(),
  ]);
  if (
    !user ||
    user.active === false ||
    (user.sessionVersion ?? 0) !== session.user.sessionVersion ||
    !login ||
    login.userId !== String(user._id) ||
    !isSessionValid(login.lastActivity, login.expiresAt)
  )
    throw new AppError(
      401,
      "Your session has ended. Please sign in again.",
      "SESSION_EXPIRED",
    );
  if (!user.clinicId)
    throw new AppError(
      403,
      "Your clinic administrator needs to verify the clinic mapping for this account before access can continue.",
      "CLINIC_MAPPING_REQUIRED",
    );
  const role = user.role as Role;
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role,
    clinicId: user.clinicId,
    clinicName: user.clinicName,
    sid: session.user.sid,
    forcePasswordChange: user.forcePasswordChange ?? false,
    notificationPreferences: user.notificationPreferences ?? true,
  };
});
export async function getActor(
  roles?: readonly Role[],
  allowPasswordChange = false,
): Promise<Actor> {
  const actor = await readActor();
  if (roles && !roles.includes(actor.role))
    throw new AppError(
      403,
      "You do not have permission for this action.",
      "FORBIDDEN",
    );
  if (actor.forcePasswordChange && !allowPasswordChange)
    throw new AppError(
      403,
      "Change your password in Settings before continuing.",
      "PASSWORD_CHANGE_REQUIRED",
    );
  return actor;
}
export function clientScope(actor: Actor) {
  return clientAccessFilter(actor.role, actor.id, actor.clinicId);
}
export async function getClient(actor: Actor, id: string) {
  idSchema.parse(id);
  const client = await Client.findOne({ _id: id, ...clientScope(actor) });
  if (!client)
    throw new AppError(
      404,
      "This client is unavailable or outside your caseload.",
      "NOT_FOUND",
    );
  return client;
}
export async function audit(
  actor: Actor,
  action: string,
  resource: string,
  resourceId?: string,
  session?: ClientSession,
) {
  await AuditEvent.create(
    [
      {
        clinicId: actor.clinicId,
        actorId: actor.id,
        actorName: actor.name,
        action,
        resource,
        resourceId,
      },
    ],
    session ? { session } : {},
  );
}
