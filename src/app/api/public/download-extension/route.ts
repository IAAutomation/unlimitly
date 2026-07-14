import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  const headers = {
    "Content-Type": "application/zip",
    "Content-Disposition": 'attachment; filename="unlimitly-extension.zip"',
    "Cache-Control": "no-store",
  };

  try {
    const filePath = join(process.cwd(), "public", "unlimitly-extension.zip");
    const file = await readFile(filePath);
    return new NextResponse(new Uint8Array(file), { headers });
  } catch (err) {
    return new NextResponse("Extension zip not found", { status: 404 });
  }
}
