import { NextResponse } from "next/server";
import path from "path";
import { ingestKB } from "@/lib/rag/pipeline";

// Nur im Server-Kontext
export const dynamic = "force-dynamic";

export async function POST() {
  const kbDir = path.join(process.cwd(), "kb");
  const result = await ingestKB(kbDir);
  return NextResponse.json({ status: "ok", ...result });
}
