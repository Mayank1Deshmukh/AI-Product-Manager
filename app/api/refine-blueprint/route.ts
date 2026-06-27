import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { blueprintResultSchema } from "@/lib/schemas";
import type { Tag, BRDMetrics, MarketMetrics } from "@/lib/schemas";

export async function POST(request: Request) {
  const {
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
    refinement,
  } = (await request.json()) as {
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
    refinement: string;
  };

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY!,
  });

  const { object } = await generateObject({
    model: google("gemini-2.5-flash"),
    schema: blueprintResultSchema,
    system: `You are refining an existing product blueprint based on a user instruction.
Only modify the sections that are directly affected by the refinement instruction.
Return unchanged sections verbatim — copy their exact markdown, tags, and metrics without any alterations.
Be surgical: if the instruction only affects pricing, only update the revenue model in the BRD. If it adds a B2B angle, update positioning and value proposition but leave the PRD epics untouched unless they must change.`,
    prompt: `ORIGINAL IDEA:
${ideaInput}

REFINEMENT INSTRUCTION:
${refinement}

─────────────────────────────────────
CURRENT BLUEPRINT — return these verbatim unless directly affected by the refinement:

BRD:
Title: ${brdTitle}
Tags: ${JSON.stringify(brdTags)}
Markdown:
${currentBRD}
Metrics: ${JSON.stringify(brdMetrics)}

PRD:
Title: ${prdTitle}
Tags: ${JSON.stringify(prdTags)}
Markdown:
${currentPRD}

Market Intel:
Title: ${marketTitle}
Tags: ${JSON.stringify(marketTags)}
Markdown:
${currentMarket}
Metrics: ${JSON.stringify(marketMetrics)}

Apply the refinement instruction to the relevant sections only. Return the full JSON with all three sections.`,
  });

  return Response.json(object);
}
