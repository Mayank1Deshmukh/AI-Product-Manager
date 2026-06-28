import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { blueprintResultSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { ideaInput, targetAudience, monetisationModel, competitors } =
    (await request.json()) as {
      ideaInput: string;
      targetAudience?: string;
      monetisationModel?: string;
      competitors?: string;
    };

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY!,
  });

  const { object } = await generateObject({
    model: google("gemini-2.5-flash"),
    schema: blueprintResultSchema,
    system: `You are a senior product strategist and business analyst. You produce
sharp, actionable product blueprints that help founders move from idea to
execution. Be specific, realistic, and direct. Avoid vague filler language.
Write markdown with clean ## h2 headings and short paragraphs (2–4 sentences each).`,
    prompt: `Generate a full product blueprint for the following idea.

IDEA:
${ideaInput}

${targetAudience ? `TARGET AUDIENCE:\n${targetAudience}` : "Target audience: infer from the idea."}

${monetisationModel ? `MONETISATION MODEL:\n${monetisationModel}` : "Monetisation model: suggest the most appropriate one."}

${competitors ? `KNOWN COMPETITORS:\n${competitors}` : "Competitors: identify the most relevant ones yourself."}

─────────────────────────────────────
INSTRUCTIONS FOR EACH SECTION:

BRD (Business Requirement Document):
- title: "Business Requirement Document — [short product name]"
- tags: 3–5 tags. Use variant="default" for category labels (e.g. "SaaS", "B2B"),
  variant="green" for strong positive signals (e.g. "Growing market"),
  variant="amber" for risks or cautions (e.g. "High churn risk").
- markdown must include exactly these ## sections in order:
    ## Problem statement — 2–3 sentences on the pain being solved.
    ## Value proposition — 2–3 sentences on what makes this uniquely better.
    ## Revenue model — paragraph describing pricing tiers, billing cadence, and any annual option.
    ## Key risks — paragraph naming 2–3 real risks and a mitigation approach.
- metrics: realistic estimates. targetTAM as "$X.XB" or "$XXM", breakEvenMRR
  as "$X,XXX/mo", targetPayback as "X months".

PRD (Product Requirements Document):
- title: "Product Requirements — MVP"
- tags: 3–5 tags. Include one like "3 epics" (variant="default"). Mark any
  stretch-goal epic with variant="amber".
- markdown must contain 3–5 epics. Each epic follows this structure exactly:
    ## Epic N — [Epic Name]
    **User story:** As a [role], I want to [action] so that [outcome].
    **Acceptance criteria:**
    - [ ] [criterion 1]
    - [ ] [criterion 2]
    - [ ] [criterion 3]

Market Analysis:
- title: "Market Analysis — [short product name]"
- tags: 3–5 tags. Use variant="green" for blue-ocean signals, variant="amber"
  for crowded or commoditised segments.
- markdown must include exactly these ## sections in order:
    ## Competitive landscape — name at least 3 real or likely competitors,
       describe their positioning and pricing briefly.
    ## Positioning opportunity — 2–3 sentences on the specific gap this idea can own.
- metrics: avgCompetitorPrice as "$XX/mo" or "$XX/yr", priceGap as a short
  descriptive phrase (e.g. "40% cheaper at entry tier"), knownCompetitors as a
  plain integer string (e.g. "6").`,
  });

  // Persist the blueprint if the user is authenticated
  let blueprintId: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: row } = await supabase
        .from("blueprints")
        .insert({
          user_id: user.id,
          title: ideaInput.slice(0, 60),
          idea_input: ideaInput,
          brd: object.brd.markdown,
          prd: object.prd.markdown,
          market: object.market.markdown,
        })
        .select("id")
        .single();
      blueprintId = row?.id ?? null;
    }
  } catch {
    // Non-fatal — blueprint is still returned to the client even if save fails
  }

  return Response.json({ ...object, blueprintId });
}
