import { z } from "zod";

export const tagSchema = z.object({
  label: z.string(),
  variant: z.enum(["default", "green", "amber"]),
});
export type Tag = z.infer<typeof tagSchema>;

export const brdMetricsSchema = z.object({
  targetTAM: z.string(),
  breakEvenMRR: z.string(),
  targetPayback: z.string(),
});
export type BRDMetrics = z.infer<typeof brdMetricsSchema>;

export const marketMetricsSchema = z.object({
  avgCompetitorPrice: z.string(),
  priceGap: z.string(),
  knownCompetitors: z.string(),
});
export type MarketMetrics = z.infer<typeof marketMetricsSchema>;

export const blueprintResultSchema = z.object({
  brd: z.object({
    title: z.string(),
    tags: z.array(tagSchema).min(3).max(5),
    markdown: z
      .string()
      .describe(
        "Markdown with ## Problem statement, ## Value proposition, ## Revenue model, ## Key risks sections"
      ),
    metrics: brdMetricsSchema,
  }),
  prd: z.object({
    title: z.string(),
    tags: z.array(tagSchema).min(3).max(5),
    markdown: z
      .string()
      .describe(
        "Markdown with 3–5 epics, each as ## Epic N — [name], user story, and acceptance criteria checkboxes"
      ),
  }),
  market: z.object({
    title: z.string(),
    tags: z.array(tagSchema).min(3).max(5),
    markdown: z
      .string()
      .describe(
        "Markdown with ## Competitive landscape and ## Positioning opportunity sections"
      ),
    metrics: marketMetricsSchema,
  }),
});

export type BlueprintResult = z.infer<typeof blueprintResultSchema>;
