import { createFileRoute } from "@tanstack/react-router";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const Route = createFileRoute("/api/public/download-extension")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const headers = {
          "Content-Type": "application/zip",
          "Content-Disposition": 'attachment; filename="unlimitly-extension.zip"',
          "Cache-Control": "no-store",
        };

        const localCandidates = [
          join(process.cwd(), "public", "unlimitly-extension.zip"),
          join(process.cwd(), ".output", "public", "unlimitly-extension.zip"),
          join(process.cwd(), ".vercel", "output", "static", "unlimitly-extension.zip"),
        ];

        for (const filePath of localCandidates) {
          try {
            const file = await readFile(filePath);
            return new Response(new Uint8Array(file), { headers });
          } catch {
            // Try the next possible deployment path.
          }
        }

        const staticUrl = new URL("/unlimitly-extension.zip", request.url);
        const cookie = request.headers.get("cookie");
        const staticResponse = await fetch(staticUrl, {
          headers: cookie ? { cookie } : undefined,
        });

        if (!staticResponse.ok) {
          return new Response("Extension zip not found", { status: 404 });
        }

        const file = await staticResponse.arrayBuffer();
        return new Response(file, { headers });
      },
    },
  },
});
