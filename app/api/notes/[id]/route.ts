import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Note from "@/models/Note";
import Claim from "@/models/Claim"; // <-- Import the new Claim model
import { auth } from "@/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role === "RBT") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();
    const resolvedParams = await params;

    // 1. Update the note's status to "Approved"
    const updatedNote = await Note.findByIdAndUpdate(
      resolvedParams.id, 
      { status: "Approved" }, 
      { returnDocument: 'after' } 
    );

    if (!updatedNote) {
      return NextResponse.json({ message: "Note not found" }, { status: 404 });
    }

    // 2. THE CLAIM ENGINE: Automatically generate a billing claim!
    // We'll use a standard rate of $150.00 for a therapy session for this MVP
    await Claim.create({
      clientName: updatedNote.clientName,
      noteId: updatedNote._id,
      dateOfService: updatedNote.date,
      amount: 150.00,
      status: "Pending Submission",
      billingCode: "97153"
    });

    return NextResponse.json({ message: "Note approved and Claim generated", note: updatedNote }, { status: 200 });
  } catch (error) {
    console.error("Failed to approve note:", error);
    return NextResponse.json({ message: "Failed to approve note" }, { status: 500 });
  }
}