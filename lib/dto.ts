import type { Role } from "@/lib/policy";
export interface Person {
  _id: string;
  name: string;
  email?: string;
  role: Role;
  active: boolean;
  credential?: string;
  credentialExpiresAt?: string;
  forcePasswordChange?: boolean;
}
export interface Goal {
  name: string;
  target: number;
  masteryCriteria?: string;
  direction: string;
  phaseDate?: string;
}
export interface ClientDTO {
  _id: string;
  code?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  assignedBCBA?: string;
  assignedRBTs: string[];
  active: boolean;
  authorizationHours?: number;
  authorizationExpiresAt?: string;
  goals: Goal[];
  targetBehaviors: {
    name: string;
    type: "increase" | "decrease";
    measurement: "frequency" | "duration" | "interval";
  }[];
}
export interface Behavior {
  name: string;
  type: "increase" | "decrease";
  count: number;
  durationSeconds: number;
  intervals: number;
  opportunities: number;
}
export interface SessionDTO {
  aiDraftedNote?: string;
  aiOriginalNote?: string;
  aiGenerated?: boolean;
  _id: string;
  client: string;
  technician: string;
  date: string;
  scheduledEnd?: string;
  startedAt?: string;
  endedAt?: string;
  durationMinutes: number;
  status: string;
  revision: number;
  behaviorData: {
    behaviorName: string;
    frequency: number;
    durationSeconds: number;
    intervals: number;
    opportunities: number;
  }[];
  abcData: {
    antecedent: string;
    behavior: string;
    consequence: string;
    at: string;
  }[];
}
export interface NoteDTO {
  _id: string;
  clientId?: string;
  sessionId?: string;
  clientName: string;
  rbtName: string;
  rbtId: string;
  duration: string;
  durationMinutes: number;
  summary: string;
  status: "Draft" | "Pending Review" | "Changes Requested" | "Approved";
  date: string;
  aiGenerated: boolean;
  reviewedAt?: string;
  revision: number;
  behaviors: Behavior[];
  comments: { authorName: string; message: string; at: string }[];
}
export interface ClaimDTO {
  _id: string;
  clientName: string;
  clientId?: string;
  noteId: string;
  dateOfService: string;
  amount: number;
  status: "Pending Submission" | "Submitted" | "Paid" | "Denied";
  units: number;
  billingCode: string;
  requiresReview: boolean;
  payerReference: string;
}
export interface NotificationDTO {
  _id: string;
  title: string;
  message?: string;
  href: string;
  readAt?: string;
  createdAt: string;
}
export interface AuditDTO {
  _id: string;
  actorName?: string;
  actorId: string;
  action: string;
  resource: string;
  resourceId?: string;
  createdAt: string;
}
export interface SupervisionDTO {
  _id: string;
  technician: string;
  supervisor: string;
  date: string;
  minutes: number;
  observation?: string;
}
export interface WorkspaceData {
  asOf: string;
  actor: {
    id: string;
    name: string;
    email: string;
    role: Role;
    clinicId: string;
    clinicName: string;
    forcePasswordChange: boolean;
    notificationPreferences: boolean;
  };
  clinic: { name: string; ratePerUnit: number; billingCode: string };
  clients: ClientDTO[];
  notes: NoteDTO[];
  sessions: SessionDTO[];
  claims: ClaimDTO[];
  staff: Person[];
  notifications: NotificationDTO[];
  supervisions: SupervisionDTO[];
  audit: AuditDTO[];
  demo: boolean;
  capped: boolean;
}
export function clientName(client?: Pick<ClientDTO, "firstName" | "lastName">) {
  return client
    ? `${client.firstName} ${client.lastName}`
    : "Unavailable client";
}
export function transport<T>(record: unknown): T {
  return JSON.parse(JSON.stringify(record)) as T;
}
