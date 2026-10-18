import { api, body } from "@/lib/api";
import { getActor } from "@/lib/security";
import { createNote, listNotes } from "@/lib/clinical";
import { noteSchema } from "@/lib/validation";
export const GET = api(async () => ({
  notes: await listNotes(await getActor(["RBT", "BCBA"])),
}));
export const POST = api(async (request) => ({
  note: await createNote(
    await getActor(["RBT"]),
    await body(request, noteSchema),
  ),
  message: "Note submitted for clinician review.",
}));
