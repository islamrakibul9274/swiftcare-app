export const ROLES = ["ADMIN", "BCBA", "RBT"] as const;
export type Role = (typeof ROLES)[number];
export const IDLE_MS = 15 * 60 * 1000;
export const ABSOLUTE_MS = 8 * 60 * 60 * 1000;
export function roleHome(role: Role) {
  return { ADMIN: "/admin", BCBA: "/director", RBT: "/tech" }[role];
}
export function safeReturnUrl(value: string | null | undefined, role: Role) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes(String.fromCharCode(92))
  )
    return roleHome(role);
  if (/[\u0000-\u001f]/.test(value)) return roleHome(role);
  const path = new URL(value, "https://swiftcare.invalid").pathname;
  return [
    roleHome(role),
    "/clients",
    "/schedule",
    "/settings",
    "/notifications",
  ].some((p) => path === p || path.startsWith(p + "/"))
    ? value
    : roleHome(role);
}
export function clientAccessFilter(
  role: Role,
  actorId: string,
  clinicId: string,
) {
  return {
    clinicId,
    ...(role === "BCBA"
      ? { assignedBCBA: actorId }
      : role === "RBT"
        ? { assignedRBTs: actorId }
        : {}),
  };
}
export function billingUnits(minutes: number) {
  return Math.floor(minutes / 15);
}
export function isSessionValid(
  lastActivity: Date,
  expiresAt: Date,
  now = Date.now(),
) {
  return now < expiresAt.getTime() && now - lastActivity.getTime() < IDLE_MS;
}
