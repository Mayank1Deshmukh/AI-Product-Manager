import { generateText, generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { tavily } from "@tavily/core";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY! });

const competitorSchema = z.object({
  name: z.string(),
  pricing: z.string(),
  key_features: z.array(z.string()),
  weaknesses: z.array(z.string()),
  target_customer: z.string(),
});

// ── Action: extract competitor names from market markdown ─────────────────────

async function extractCompetitors(marketMarkdown: string): Promise<string[]> {
  const { text } = await generateText({
    model: google("gemini-2.5-flash"),
    prompt: `Extract only the competitor company names from this text as a JSON array. Return nothing else.\n\n${marketMarkdown}`,
  });
  try {
    const parsed = JSON.parse(text.trim().replace(/```json\n?|```/g, "").trim());
    if (Array.isArray(parsed)) return parsed.slice(0, 6) as string[];
  } catch {
    // Fall back to a best-effort line parse
    const names = text.match(/"([^"]+)"/g)?.map((s) => s.replace(/"/g, "")) ?? [];
    return names.slice(0, 6);
  }
  return [];
}

// ── Action: search one competitor via Tavily + structure via Gemini ───────────

async function searchCompetitor(name: string): Promise<z.infer<typeof competitorSchema>> {
  const client = tavily({ apiKey: process.env.TAVILY_API_KEY! });

  const result = await client.search(
    `${name} pricing features target customers weaknesses`,
    { maxResults: 5, searchDepth: "basic" }
  );

  const searchContent = result.results
    .map((r) => `${r.title}\n${r.content}`)
    .join("\n\n")
    .slice(0, 6000); // keep prompt manageable

  const { object } = await generateObject({
    model: google("gemini-2.5-flash"),
    schema: competitorSchema,
    prompt: `Based on the following web search results about "${name}", extract structured competitive intelligence.
Be specific and concise. If a field is unclear, make a reasonable inference from the content.

SEARCH RESULTS:
${searchContent}`,
  });

  return object;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action: "extract" | "search";
    marketMarkdown?: string;
    competitor?: string;
    blueprintId?: string;
    allResults?: z.infer<typeof competitorSchema>[];
  };

  // ── Extract competitor names ───────────────────────────────────────────────
  if (body.action === "extract") {
    if (!body.marketMarkdown) {
      return Response.json({ error: "marketMarkdown required" }, { status: 400 });
    }
    const competitors = await extractCompetitors(body.marketMarkdown);
    return Response.json({ competitors });
  }

  // ── Search one competitor ─────────────────────────────────────────────────
  if (body.action === "search") {
    if (!body.competitor) {
      return Response.json({ error: "competitor name required" }, { status: 400 });
    }
    try {
      const competitor = await searchCompetitor(body.competitor);
      return Response.json({ competitor });
    } catch (err) {
      return Response.json(
        { error: err instanceof Error ? err.message : "Search failed" },
        { status: 500 }
      );
    }
  }

  // ── Save completed deep-dive to Supabase ───────────────────────────────────
  if (body.action === "save") {
    if (!body.blueprintId || !body.allResults) {
      return Response.json({ error: "blueprintId and allResults required" }, { status: 400 });
    }
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

      await supabase
        .from("blueprints")
        .update({ competitor_data: body.allResults })
        .eq("id", body.blueprintId);

      return Response.json({ success: true });
    } catch {
      return Response.json({ success: false });
    }
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
