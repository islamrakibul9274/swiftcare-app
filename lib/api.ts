import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError } from "@/lib/errors";
export function assertOrigin(request: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return;
  const origin = request.headers.get("origin");
  const expected = new URL(process.env.AUTH_URL || request.url).origin;
  if (!origin || origin !== expected)
    throw new AppError(403, "Request origin is not allowed.", "INVALID_ORIGIN");
}
export async function body<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.output<T>> {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new AppError(415, "Send a JSON request.");
  const reader = request.body?.getReader();
  if (!reader) throw new AppError(400, "The request body is empty.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    size += chunk.value.byteLength;
    if (size > 65536) {
      await reader.cancel();
      throw new AppError(413, "The request is too large.");
    }
    chunks.push(chunk.value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const raw = new TextDecoder().decode(bytes);
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new AppError(400, "The request contains invalid JSON.");
  }
  return schema.parse(data);
}
export function api<C>(
  handler: (request: Request, context: C) => Promise<unknown>,
) {
  return async (request: Request, context: C) => {
    try {
      assertOrigin(request);
      const result = await handler(request, context);
      return NextResponse.json(result, {
        headers: { "Cache-Control": "no-store" },
      });
    } catch (error) {
      if (error instanceof z.ZodError)
        return NextResponse.json(
          {
            message: error.issues[0]?.message || "Check the form fields.",
            fields: error.flatten().fieldErrors,
          },
          { status: 400 },
        );
      if (error instanceof AppError)
        return NextResponse.json(
          { message: error.message, code: error.code },
          {
            status: error.status,
            headers: error.status === 429 ? { "Retry-After": "900" } : {},
          },
        );
      if (error instanceof Error && error.name === "VersionError")
        return NextResponse.json(
          {
            message: "This record changed. Refresh it before saving.",
            code: "CONFLICT",
          },
          { status: 409 },
        );
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === 11000
      )
        return NextResponse.json(
          {
            message:
              "This record already exists or another session is active. Refresh before continuing.",
            code: "CONFLICT",
          },
          { status: 409 },
        );
      // Never log request bodies, Mongo errors, tokens, or clinical text.
      console.error("SwiftCare request failed", {
        category: error instanceof Error ? error.name : "UnknownError",
      });
      return NextResponse.json(
        {
          message: "We could not complete this request. Please try again.",
          code: "INTERNAL_ERROR",
        },
        { status: 500 },
      );
    }
  };
}
