import Note from "@/models/Note";
import { AppError } from "@/lib/errors";
import { idSchema } from "@/lib/validation";
import { api, body } from "@/lib/api";
import { getActor, getClient, audit } from "@/lib/security";
import { reviewNote } from "@/lib/clinical";
import { reviewSchema } from "@/lib/validation";
export const PATCH = api(
  async (request, context: { params: Promise<{ id: string }> }) => ({
    note: await reviewNote(
      await getActor(["BCBA", "RBT"]),
      (await context.params).id,
      await body(request, reviewSchema),
    ),
    message: "Note updated.",
  }),
);

export const GET = api(
  async (_request, context: { params: Promise<{ id: string }> }) => {
    const actor = await getActor(["RBT", "BCBA"]);
    const id = (await context.params).id;
    idSchema.parse(id);
    const note = await Note.findOne({
      _id: id,
      clinicId: actor.clinicId,
      ...(actor.role === "RBT" ? { rbtId: actor.id } : {}),
    }).lean();
    if (!note?.clientId) throw new AppError(404, "This note is unavailable.");
    await getClient(actor, String(note.clientId));
    await audit(actor, "view", "note", id);
    return {
      note: {
        ...note,
        comments: note.comments || [],
        behaviors: note.behaviors || [],
        revision: note.revision ?? 0,
      },
    };
  },
);
