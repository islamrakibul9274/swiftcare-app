import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { name, email, password, role, clinicName } = await req.json();

    // 1. Validate the input
    if (!name || !email || !password || !role || !clinicName) {
      return NextResponse.json({ message: "All fields are required." }, { status: 400 });
    }

    await dbConnect();

    // 2. Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "Email is already registered." }, { status: 409 });
    }

    // 3. Securely hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create the user in MongoDB
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      clinicName,
    });

    return NextResponse.json({ message: "User registered successfully." }, { status: 201 });

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ message: "An error occurred during registration." }, { status: 500 });
  }
}