import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Note from "@/models/Note";
import User from "@/models/User"; // <-- We added the User model import
import { auth } from "@/auth"

export async function POST(req: Request) {
    try {
        // 1. Verify the user is logged in
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // 2. Grab the note data sent from the frontend
        const { clientName, duration, summary, behaviors } = await req.json();

        if (!clientName || !summary) {
            return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
        }

        // 3. Connect to MongoDB
        await dbConnect();

        // 4. Find the actual user in the DB using their secure session email
        const dbUser = await User.findOne({ email: session.user.email });
        if (!dbUser) {
            return NextResponse.json({ message: "User not found in database." }, { status: 404 });
        }

        // 5. Save the note to the database with the verified MongoDB _id
        const newNote = await Note.create({
            clientName,
            duration,
            summary,
            behaviors, // <-- Save the array to the database!
            rbtName: session.user.name || dbUser.name,
            rbtId: dbUser._id,
            status: "Pending Review",
        });

        return NextResponse.json({ message: "Note saved successfully", note: newNote }, { status: 201 });
    } catch (error) {
        console.error("Failed to save note:", error);
        return NextResponse.json({ message: "Failed to save note" }, { status: 500 });
    }
}



export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Find the current user in the database
    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const userRole = (session.user as any).role;
    let query = {};

    // STRICT SECURITY: If the user is an RBT, ONLY fetch notes they authored!
    if (userRole === "RBT") {
      query = { rbtId: dbUser._id };
    }

    // Fetch the notes (RBTs get their own, BCBAs/Admins get all)
    const notes = await Note.find(query).sort({ date: -1 });
    
    return NextResponse.json({ notes }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch notes:", error);
    return NextResponse.json({ message: "Failed to fetch notes" }, { status: 500 });
  }
}