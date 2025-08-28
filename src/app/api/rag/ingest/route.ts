// src/app/api/rag/ingest/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import path from "path";
import { existsSync } from "fs";
import { ingestKB } from "@/lib/rag/pipeline";

export async function POST() {
  const kbDir = path.resolve(process.cwd(), "kb");
  if (!existsSync(kbDir)) {
    return NextResponse.json(
      { status: "error", message: `KB folder not found: ${kbDir}` },
      { status: 400 }
    );
  }
  const result = await ingestKB(kbDir);
  return NextResponse.json({ status: "ok", ...result });
}
