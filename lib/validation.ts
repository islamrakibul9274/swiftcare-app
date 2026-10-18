import { z } from "zod";
export const idSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Choose a valid record.");
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(254);
export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .refine(
    (v) => new TextEncoder().encode(v).length <= 72,
    "Use at most 72 UTF-8 bytes.",
  )
  .regex(/[a-z]/, "Include a lowercase letter.")
  .regex(/[A-Z]/, "Include an uppercase letter.")
  .regex(/\d/, "Include a number.");
export const loginSchema = z
  .object({ email: emailSchema, password: z.string().min(1).max(200) })
  .strict();
export const behaviorSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    type: z.enum(["increase", "decrease"]),
    count: z.number().int().min(0).max(100000),
    durationSeconds: z.number().int().min(0).max(86400).default(0),
    intervals: z.number().int().min(0).max(10000).default(0),
    opportunities: z.number().int().min(0).max(10000).default(0),
  })
  .strict()
  .refine(
    (v) => v.intervals <= v.opportunities,
    "Positive intervals cannot exceed opportunities.",
  );
export const noteSchema = z
  .object({
    sessionId: idSchema,
    summary: z
      .string()
      .trim()
      .min(20, "Add at least 20 characters of clinical observations.")
      .max(12000),
    authorReviewed: z.literal(true, {
      error: "Review and confirm the note before submitting.",
    }),
    aiGenerated: z.boolean().default(false),
  })
  .strict();
export const reviewSchema = z
  .object({
    action: z.enum(["approve", "request_changes", "resubmit"]),
    comment: z.string().trim().max(2000).default(""),
    summary: z.string().trim().min(20).max(12000).optional(),
    revision: z.number().int().min(0),
    reviewed: z.boolean().optional(),
    authorReviewed: z.boolean().optional(),
  })
  .strict()
  .refine(
    (v) => v.action !== "request_changes" || v.comment.length >= 5,
    "Explain which changes are needed.",
  );
export const inviteSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: emailSchema,
    role: z.enum(["ADMIN", "BCBA", "RBT"]),
    credential: z.string().max(100).default(""),
    credentialExpiresAt: z.iso.datetime().optional(),
  })
  .strict();
export const resetRequestSchema = z.object({ email: emailSchema }).strict();
export const tokenPasswordSchema = z
  .object({
    token: z.string().regex(/^[a-f\d]{64}$/),
    password: passwordSchema,
  })
  .strict();
export const staffPatchSchema = z
  .object({
    id: idSchema,
    role: z.enum(["ADMIN", "BCBA", "RBT"]).optional(),
    active: z.boolean().optional(),
    credential: z.string().max(100).optional(),
    credentialExpiresAt: z.iso.datetime().nullable().optional(),
    reset: z.boolean().optional(),
  })
  .strict();
export const goalSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    target: z.number().min(0).max(100000),
    masteryCriteria: z.string().trim().min(5).max(300),
    direction: z.enum(["increase", "decrease"]),
    phaseDate: z.iso.datetime().optional(),
  })
  .strict();
export const clientSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    dateOfBirth: z.iso
      .date()
      .refine(
        (v) => new Date(v) <= new Date(),
        "Birth date must be in the past.",
      ),
    code: z.string().trim().min(2).max(30),
    assignedBCBA: idSchema,
    assignedRBTs: z.array(idSchema).max(20),
    authorizationHours: z.number().min(0).max(5000),
    authorizationExpiresAt: z.iso.datetime().optional(),
    goals: z.array(goalSchema).max(30),
    targetBehaviors: z
      .array(
        z
          .object({
            name: z.string().trim().min(1).max(80),
            type: z.enum(["increase", "decrease"]),
            measurement: z.enum(["frequency", "duration", "interval"]),
          })
          .strict(),
      )
      .min(1)
      .max(20),
  })
  .strict();
export const scheduleSchema = z
  .object({
    clientId: idSchema,
    technicianId: idSchema,
    date: z.iso.datetime(),
    scheduledEnd: z.iso.datetime(),
  })
  .strict()
  .refine(
    (v) =>
      new Date(v.scheduledEnd) > new Date(v.date) &&
      +new Date(v.scheduledEnd) - +new Date(v.date) <= 8 * 3600000,
    "Choose an end time within 8 hours after the start.",
  );
export const sessionPatchSchema = z
  .object({
    id: idSchema,
    action: z.enum(["start", "save", "complete", "cancel"]),
    revision: z.number().int().min(0),
    draftText: z.string().max(12000).optional(),
    aiOriginalText: z.string().max(12000).optional(),
    aiGenerated: z.boolean().optional(),
    behaviors: z.array(behaviorSchema).max(20).optional(),
    abcData: z
      .array(
        z
          .object({
            antecedent: z.string().max(500),
            behavior: z.string().max(500),
            consequence: z.string().max(500),
            at: z.iso.datetime(),
          })
          .strict(),
      )
      .max(100)
      .optional(),
  })
  .strict();
export const claimPatchSchema = z
  .object({
    id: idSchema,
    status: z.enum(["Pending Submission", "Submitted", "Paid", "Denied"]),
    amount: z.number().min(0).max(1000000).optional(),
    billingCode: z
      .string()
      .regex(/^\d{5}$/, "Enter a five-digit CPT code.")
      .optional(),
    payerReference: z.string().trim().max(100).default(""),
  })
  .strict();
export const aiSchema = z
  .object({
    sessionId: idSchema,
    template: z.enum(["SOAP", "Session"]).default("SOAP"),
    tone: z.enum(["Clinical", "Concise"]).default("Clinical"),
    length: z.enum(["Brief", "Detailed"]).default("Brief"),
  })
  .strict();
export const profileSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    notificationPreferences: z.boolean(),
    currentPassword: z.string().max(200).optional(),
    newPassword: passwordSchema.optional(),
  })
  .strict()
  .refine(
    (v) => !v.newPassword || !!v.currentPassword,
    "Enter your current password to change it.",
  );
