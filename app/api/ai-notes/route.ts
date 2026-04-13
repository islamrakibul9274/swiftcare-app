import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize the OpenAI client but point it to Groq's free servers
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "",
  baseURL: "https://api.groq.com/openai/v1", // This is the magic redirect!
});

export async function POST(req: Request) {
  try {
    const { clientName, duration, behaviors } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ message: "Groq API key is missing." }, { status: 500 });
    }

    const behaviorSummary = behaviors.map((b: any) => 
      `- ${b.name} (${b.type}): ${b.count} instances`
    ).join("\n");

    const systemPrompt = `
      You are an expert Board Certified Behavior Analyst (BCBA). 
      Write a professional, objective, and clinically accurate session summary note (under 2 paragraphs) based on this data:
      
      Client Name: ${clientName}
      Session Duration: ${duration}
      
      Behavioral Data:
      ${behaviorSummary}
      
      Keep it objective (no emotional words, only observable behavior) and appropriate for medical billing.
    `;

 // Call the Meta Llama 3.1 model hosted on Groq
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // <--- THIS IS THE CRITICAL LINE
      messages: [
        { role: "system", content: systemPrompt }
      ],
      temperature: 0.2, 
    });

    const generatedNote = completion.choices[0]?.message?.content || "Note generation failed.";

    return NextResponse.json({ note: generatedNote }, { status: 200 });

  } catch (error) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ message: "Failed to generate AI note." }, { status: 500 });
  }
}