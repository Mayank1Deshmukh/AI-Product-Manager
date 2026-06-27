import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { blueprintResultSchema } from "@/lib/schemas";
import type { Tag, BRDMetrics, MarketMetrics } from "@/lib/schemas";

type ActiveTab = "brd" | "prd" | "market";

export async function POST(request: Request) {
  const {
    tab,
    ideaInput,
    currentBRD,
    currentPRD,
    currentMarket,
    brdTitle,
    prdTitle,
    marketTitle,
    brdTags,
    prdTags,
    marketTags,
    brdMetrics,
    marketMetrics,
  } = (await request.json()) as {
    tab: ActiveTab;
    ideaInput: string;
    currentBRD: string;
    currentPRD: string;
    currentMarket: string;
    brdTitle: string;
    prdTitle: string;
    marketTitle: string;
    brdTags: Tag[];
    prdTags: Tag[];
    marketTags: Tag[];
    brdMetrics: BRDMetrics;
    marketMetrics: MarketMetrics;
  };

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY!,
  });

  const TAB_LABEL: Record<ActiveTab, string> = {
    brd: "Business case (BRD)",
    prd: "Product specs (PRD)",
    market: "Market intel",
  };

  const system = `You are regenerating ONLY the ${TAB_LABEL[tab]} section of a product blueprint.
Return ONLY that section in the JSON response — nothing else.
The other sections are provided as coherence context only; do not return or modify them.
Produce a fresh take on this section while keeping it coherent with the other sections provided.`;

  const contextBlock = `
ORIGINAL IDEA:
${ideaInput}

COHERENCE CONTEXT (do not regenerate these — they are provided so your output stays consistent):

BRD — ${brdTitle}
${currentBRD}

PRD — ${prdTitle}
${currentPRD}

Market Intel — ${marketTitle}
${currentMarket}`.trim();

  if (tab === "brd") {
    const schema = z.object({ brd: blueprintResultSchema.shape.brd });
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema,
      system,
      prompt: `${contextBlock}

Now regenerate the BRD section only. Follow the same structure: title, 3–5 tags (variant: default/green/amber), markdown with ## Problem statement / ## Value proposition / ## Revenue model / ## Key risks, and metrics (targetTAM, breakEvenMRR, targetPayback).`,
    });
    return Response.json(object);
  }

  if (tab === "prd") {
    const schema = z.object({ prd: blueprintResultSchema.shape.prd });
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema,
      system,
      prompt: `${contextBlock}

Now regenerate the PRD section only. Follow the same structure: title, 3–5 tags (variant: default/green/amber), markdown with 3–5 epics each using ## Epic N — [name], user story, and acceptance criteria checkboxes.`,
    });
    return Response.json(object);
  }

  // tab === "market"
  const schema = z.object({ market: blueprintResultSchema.shape.market });
  const { object } = await generateObject({
    model: google("gemini-2.5-flash"),
    schema,
    system,
    prompt: `${contextBlock}

Now regenerate the Market intel section only. Follow the same structure: title, 3–5 tags (variant: default/green/amber), markdown with ## Competitive landscape / ## Positioning opportunity, and metrics (avgCompetitorPrice, priceGap, knownCompetitors).`,
  });
  return Response.json(object);
}
