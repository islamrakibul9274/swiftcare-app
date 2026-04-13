import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Claim from "@/models/Claim";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    
    // Strict RBAC: Only ADMINs can view financial data
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized: Admins only" }, { status: 403 });
    }

    await dbConnect();
    
    // Fetch all claims, sorted by newest first
    const claims = await Claim.find({}).sort({ dateOfService: -1 });
    
    return NextResponse.json({ claims }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch claims:", error);
    return NextResponse.json({ message: "Failed to fetch claims" }, { status: 500 });
  }
}