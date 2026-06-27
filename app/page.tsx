"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Network, ChevronDown, Copy, Check, Download, ExternalLink, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TagPill } from "@/components/blueprint/tag-pill";
import { MetricCard } from "@/components/blueprint/metric-card";
import { ChecklistStep } from "@/components/blueprint/checklist-step";
import { Sidebar } from "@/components/blueprint/sidebar";
import { cn } from "@/lib/utils";
import type { Tag, BRDMetrics, MarketMetrics, BlueprintResult } from "@/lib/schemas";

// ── Types ─────────────────────────────────────────────────────────────────────

type ChecklistPhase = 0 | 1 | 2 | 3 | 4;

type AppState = {
  ideaInput: string;
  targetAudience: string;
  monetisationModel: string;
  competitors: string;
  generatedBRD: string;
  generatedPRD: string;
  generatedMarket: string;
  brdTitle: string;
  prdTitle: string;
  marketTitle: string;
  brdTags: Tag[];
  prdTags: Tag[];
  marketTags: Tag[];
  brdMetrics: BRDMetrics;
  marketMetrics: MarketMetrics;
  activeTab: "brd" | "prd" | "market";
  sidebarCollapsed: boolean;
  currentScreen: 1 | 2 | 3 | 4;
  apiError: string | null;
  refineInput: string;
  isRefining: boolean;
  refineError: string | null;
  regeneratingTab: "brd" | "prd" | "market" | null;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const INITIAL_STATE: AppState = {
  ideaInput: "",
  targetAudience: "",
  monetisationModel: "",
  competitors: "",
  generatedBRD: "",
  generatedPRD: "",
  generatedMarket: "",
  brdTitle: "",
  prdTitle: "",
  marketTitle: "",
  brdTags: [],
  prdTags: [],
  marketTags: [],
  brdMetrics: { targetTAM: "", breakEvenMRR: "", targetPayback: "" },
  marketMetrics: { avgCompetitorPrice: "", priceGap: "", knownCompetitors: "" },
  activeTab: "brd",
  sidebarCollapsed: false,
  currentScreen: 1,
  apiError: null,
  refineInput: "",
  isRefining: false,
  refineError: null,
  regeneratingTab: null,
};

const CHECKLIST_STEPS = [
  { label: "Analysing your idea", description: "Extracting problem, audience, and value prop" },
  { label: "Structuring business logic", description: "Revenue model, risks, go-to-market" },
  { label: "Writing user stories", description: "Epics, acceptance criteria, edge cases" },
  { label: "Researching market", description: "Competitive landscape and TAM" },
] as const;

const TAB_NAMES: Record<"brd" | "prd" | "market", string> = {
  brd: "Business case (BRD)",
  prd: "Product specs (PRD)",
  market: "Market intel",
};

// ── Markdown renderer ─────────────────────────────────────────────────────────

const mdComponents = {
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-6 mb-2 first:mt-0">
      {children}
    </h2>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-sm leading-relaxed text-muted-foreground mb-3 last:mb-0">
      {children}
    </p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc list-outside ml-5 space-y-1 mb-3">{children}</ul>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-sm text-muted-foreground leading-relaxed">{children}</li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-medium text-foreground">{children}</strong>
  ),
};

// ── Section copy wrappers ─────────────────────────────────────────────────────

function SectionBlock({
  heading,
  raw,
  children,
}: {
  heading: string;
  raw: string;
  children: React.ReactNode;
}) {
  const [sectionCopied, setSectionCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(raw);
    setSectionCopied(true);
    setTimeout(() => setSectionCopied(false), 1500);
  }

  return (
    <div className="relative group/section">
      <button
        onClick={copy}
        title={`Copy "${heading}"`}
        className="absolute top-0.5 right-0 opacity-0 group-hover/section:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
      >
        {sectionCopied ? (
          <Check className="h-3 w-3 text-green-600" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </button>
      {children}
    </div>
  );
}

function MetricsBlock({
  labels,
  values,
  children,
}: {
  labels: string[];
  values: string[];
  children: React.ReactNode;
}) {
  const [metricsCopied, setMetricsCopied] = useState(false);

  function copy() {
    const header = `| ${labels.join(" | ")} |`;
    const sep = `| ${labels.map(() => "---").join(" | ")} |`;
    const row = `| ${values.join(" | ")} |`;
    navigator.clipboard.writeText([header, sep, row].join("\n"));
    setMetricsCopied(true);
    setTimeout(() => setMetricsCopied(false), 1500);
  }

  return (
    <div className="relative group/metrics">
      <button
        onClick={copy}
        title="Copy metrics as table"
        className="absolute top-0 right-0 opacity-0 group-hover/metrics:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
      >
        {metricsCopied ? (
          <Check className="h-3 w-3 text-green-600" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </button>
      {children}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCounterMeta(charCount: number): { colorClass: string; label: string | null } {
  if (charCount <= 500) return { colorClass: "text-muted-foreground", label: null };
  if (charCount <= 1500) return { colorClass: "text-green-600", label: "✓ Good detail" };
  return { colorClass: "text-amber-600", label: "Consider trimming for best results" };
}

function parseMarkdownSections(markdown: string) {
  const sections: Array<{ heading: string; content: string; raw: string }> = [];
  let currentHeading = "";
  let currentLines: string[] = [];

  for (const line of markdown.split("\n")) {
    if (line.startsWith("## ")) {
      if (currentHeading) {
        const content = currentLines.join("\n").trim();
        sections.push({ heading: currentHeading, content, raw: `## ${currentHeading}\n\n${content}` });
      }
      currentHeading = line.slice(3).trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  if (currentHeading) {
    const content = currentLines.join("\n").trim();
    sections.push({ heading: currentHeading, content, raw: `## ${currentHeading}\n\n${content}` });
  }
  return sections;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getStepStatus(
  index: number,
  phase: ChecklistPhase
): "done" | "active" | "pending" {
  if (phase === 0) return "pending";
  if (phase === 4) return "done";
  if (index < phase) return "done";
  if (index === phase) return "active";
  return "pending";
}

// Shared class for the advanced-fields native inputs
const fieldClass =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm " +
  "placeholder:text-muted-foreground outline-none transition-colors " +
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>(INITIAL_STATE);
  const [checklistPhase, setChecklistPhase] = useState<ChecklistPhase>(0);
  const [minTimerDone, setMinTimerDone] = useState(false);
  const [apiDone, setApiDone] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [showEmptyHint, setShowEmptyHint] = useState(false);
  const [copied, setCopied] = useState(false);

  const apiDataRef = useRef<BlueprintResult | null>(null);
  const transitionedRef = useRef(false);

  // ── Screen 2: start timers + fire API call ──────────────────────────────

  useEffect(() => {
    if (appState.currentScreen !== 2) {
      // Leaving screen 2 (or initial mount on screen 1): reset all flags
      setChecklistPhase(0);
      setMinTimerDone(false);
      setApiDone(false);
      apiDataRef.current = null;
      return;
    }

    // Snapshot the input values from the render that triggered this effect
    const { ideaInput, targetAudience, monetisationModel, competitors } = appState;

    setChecklistPhase(1); // step 1 done immediately, step 2 active

    const t5 = setTimeout(() => setChecklistPhase(2), 5_000);
    const t11 = setTimeout(() => {
      setChecklistPhase(3);
      setMinTimerDone(true);
    }, 11_000);

    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch("/api/generate-blueprint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ideaInput, targetAudience, monetisationModel, competitors }),
        });
        if (!resp.ok) throw new Error(`Request failed (${resp.status})`);
        const data = (await resp.json()) as BlueprintResult;
        if (!cancelled) {
          apiDataRef.current = data;
          setApiDone(true);
        }
      } catch (err) {
        if (!cancelled) {
          setAppState((prev) => ({
            ...prev,
            apiError: err instanceof Error ? err.message : "Blueprint generation failed.",
          }));
        }
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(t5);
      clearTimeout(t11);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState.currentScreen]);

  // ── Screen 2 → 3: transition when timer AND API are both done ────────────

  useEffect(() => {
    if (!apiDone || !minTimerDone || !apiDataRef.current) return;
    if (transitionedRef.current) return;
    transitionedRef.current = true;

    setChecklistPhase(4);

    const data = apiDataRef.current;
    const tid = setTimeout(() => {
      setAppState((prev) => {
        // Guard: if the user reset between now and the timeout, don't overwrite
        if (prev.currentScreen !== 2) return prev;
        return {
          ...prev,
          currentScreen: 3,
          generatedBRD: data.brd.markdown,
          generatedPRD: data.prd.markdown,
          generatedMarket: data.market.markdown,
          brdTitle: data.brd.title,
          prdTitle: data.prd.title,
          marketTitle: data.market.title,
          brdTags: data.brd.tags,
          prdTags: data.prd.tags,
          marketTags: data.market.tags,
          brdMetrics: data.brd.metrics,
          marketMetrics: data.market.metrics,
        };
      });
    }, 400);

    return () => clearTimeout(tid);
  }, [apiDone, minTimerDone]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleGenerate() {
    if (!appState.ideaInput.trim()) {
      setShowEmptyHint(true);
      return;
    }
    setShowEmptyHint(false);
    transitionedRef.current = false;
    setAppState((prev) => ({ ...prev, currentScreen: 2, apiError: null }));
  }

  function handleReset() {
    transitionedRef.current = false;
    setAppState(INITIAL_STATE);
    setAccordionOpen(false);
    setShowEmptyHint(false);
    setCopied(false);
  }

  function getActiveTabMarkdown(): string {
    if (appState.activeTab === "brd") return appState.generatedBRD;
    if (appState.activeTab === "prd") return appState.generatedPRD;
    return appState.generatedMarket;
  }

  async function handleCopyTab() {
    const text = getActiveTabMarkdown();
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const title = appState.brdTitle || appState.ideaInput.slice(0, 40);
    const date = new Date().toISOString().slice(0, 10);
    const content = [
      `# Blueprint: ${title}`,
      `Generated on ${date}`,
      "",
      "---",
      "",
      "## Business case (BRD)",
      "",
      appState.generatedBRD,
      "",
      "---",
      "",
      "## Product specs (PRD)",
      "",
      appState.generatedPRD,
      "",
      "---",
      "",
      "## Market intel",
      "",
      appState.generatedMarket,
    ].join("\n");

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `blueprint-${slugify(title.slice(0, 40))}-${date}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleRegenerate() {
    const tab = appState.activeTab;
    if (appState.regeneratingTab !== null || appState.isRefining) return;

    const {
      ideaInput, generatedBRD, generatedPRD, generatedMarket,
      brdTitle, prdTitle, marketTitle,
      brdTags, prdTags, marketTags,
      brdMetrics, marketMetrics,
    } = appState;

    setAppState((prev) => ({ ...prev, regeneratingTab: tab }));

    try {
      const resp = await fetch("/api/regenerate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab,
          ideaInput,
          currentBRD: generatedBRD,
          currentPRD: generatedPRD,
          currentMarket: generatedMarket,
          brdTitle, prdTitle, marketTitle,
          brdTags, prdTags, marketTags,
          brdMetrics, marketMetrics,
        }),
      });
      if (!resp.ok) throw new Error(`Request failed (${resp.status})`);
      const data = await resp.json() as Record<string, unknown>;

      setAppState((prev) => {
        if (tab === "brd" && data.brd) {
          const brd = data.brd as { markdown: string; title: string; tags: AppState["brdTags"]; metrics: AppState["brdMetrics"] };
          return { ...prev, regeneratingTab: null, generatedBRD: brd.markdown, brdTitle: brd.title, brdTags: brd.tags, brdMetrics: brd.metrics };
        }
        if (tab === "prd" && data.prd) {
          const prd = data.prd as { markdown: string; title: string; tags: AppState["prdTags"] };
          return { ...prev, regeneratingTab: null, generatedPRD: prd.markdown, prdTitle: prd.title, prdTags: prd.tags };
        }
        if (tab === "market" && data.market) {
          const market = data.market as { markdown: string; title: string; tags: AppState["marketTags"]; metrics: AppState["marketMetrics"] };
          return { ...prev, regeneratingTab: null, generatedMarket: market.markdown, marketTitle: market.title, marketTags: market.tags, marketMetrics: market.metrics };
        }
        return { ...prev, regeneratingTab: null };
      });
    } catch {
      // Restore original content silently — the panel will show the unchanged data
      setAppState((prev) => ({ ...prev, regeneratingTab: null }));
    }
  }

  async function handleRefine() {
    const refinement = appState.refineInput.trim();
    if (!refinement || appState.isRefining) return;

    const {
      ideaInput, generatedBRD, generatedPRD, generatedMarket,
      brdTitle, prdTitle, marketTitle,
      brdTags, prdTags, marketTags,
      brdMetrics, marketMetrics,
    } = appState;

    setAppState((prev) => ({ ...prev, isRefining: true, refineError: null }));

    try {
      const resp = await fetch("/api/refine-blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaInput,
          currentBRD: generatedBRD,
          currentPRD: generatedPRD,
          currentMarket: generatedMarket,
          brdTitle, prdTitle, marketTitle,
          brdTags, prdTags, marketTags,
          brdMetrics, marketMetrics,
          refinement,
        }),
      });
      if (!resp.ok) throw new Error(`Request failed (${resp.status})`);
      const data = (await resp.json()) as BlueprintResult;

      setAppState((prev) => ({
        ...prev,
        generatedBRD: data.brd.markdown,
        generatedPRD: data.prd.markdown,
        generatedMarket: data.market.markdown,
        brdTitle: data.brd.title,
        prdTitle: data.prd.title,
        marketTitle: data.market.title,
        brdTags: data.brd.tags,
        prdTags: data.prd.tags,
        marketTags: data.market.tags,
        brdMetrics: data.brd.metrics,
        marketMetrics: data.market.metrics,
        isRefining: false,
        refineInput: "",
      }));
    } catch (err) {
      setAppState((prev) => ({
        ...prev,
        isRefining: false,
        refineError: err instanceof Error ? err.message : "Refinement failed.",
      }));
    }
  }

  // ── Nav bar (persistent) ──────────────────────────────────────────────────

  function renderNavBar() {
    return (
      <nav className="h-12 border-b flex items-center justify-between px-4 shrink-0 bg-background">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Blueprint</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Step {appState.currentScreen} of 4
          </span>
          {appState.currentScreen === 3 && (
            <Button
              size="sm"
              onClick={() => setAppState((prev) => ({ ...prev, currentScreen: 4 }))}
            >
              Export →
            </Button>
          )}
        </div>
      </nav>
    );
  }

  // ── Screen 1 — Brain Dump ─────────────────────────────────────────────────

  function renderScreen1() {
    const ideaLen = appState.ideaInput.length;
    const totalLen =
      ideaLen +
      appState.targetAudience.length +
      appState.monetisationModel.length +
      appState.competitors.length;
    const ideaMeta = getCounterMeta(ideaLen);
    const totalMeta = getCounterMeta(totalLen);
    return (
      <div className="flex-1 flex items-start justify-center py-12 px-4">
        <div className="w-full max-w-[540px] space-y-5">
          {/* Hero copy */}
          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Start here
            </p>
            <h1 className="text-[22px] font-medium leading-snug text-foreground">
              What are you building?
            </h1>
            <p className="text-sm text-muted-foreground">
              Describe your idea in plain language — who it&apos;s for, the
              problem it solves, and how it makes money.
            </p>
          </div>

          {/* Main textarea + live counter */}
          <div>
            <textarea
              value={appState.ideaInput}
              onChange={(e) =>
                setAppState((prev) => ({ ...prev, ideaInput: e.target.value }))
              }
              onFocus={() => setShowEmptyHint(false)}
              placeholder="e.g. A subscription app for indie founders that tracks SaaS metrics and sends weekly digest emails. Targets solo developers, monetised via $12/mo subscription..."
              className="w-full min-h-[130px] resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <p className={cn("mt-1.5 text-right text-[12px]", ideaMeta.colorClass)}>
              {ideaLen.toLocaleString()} characters · ~{Math.ceil(ideaLen / 4)} tokens
              {ideaMeta.label && <span className="ml-2">{ideaMeta.label}</span>}
            </p>
          </div>

          {/* Empty-submit hint */}
          {showEmptyHint && (
            <p className="text-sm text-destructive -mt-2">
              Add a description to continue
            </p>
          )}

          {/* Advanced accordion */}
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setAccordionOpen((o) => !o)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Add target audience and monetisation details</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200",
                  accordionOpen && "rotate-180"
                )}
              />
            </button>

            <div
              className="transition-[max-height] duration-200 ease-in-out overflow-hidden"
              style={{ maxHeight: accordionOpen ? "400px" : "0px" }}
            >
              <div className="px-4 pb-4 pt-4 space-y-4 bg-muted/30 border-t border-border">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Target audience
                  </label>
                  <input
                    type="text"
                    value={appState.targetAudience}
                    onChange={(e) =>
                      setAppState((prev) => ({
                        ...prev,
                        targetAudience: e.target.value,
                      }))
                    }
                    placeholder="e.g. Solo developers, indie hackers aged 25–40"
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Monetisation model
                  </label>
                  <input
                    type="text"
                    value={appState.monetisationModel}
                    onChange={(e) =>
                      setAppState((prev) => ({
                        ...prev,
                        monetisationModel: e.target.value,
                      }))
                    }
                    placeholder="e.g. Freemium with $12/mo Pro tier"
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Competitors{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={appState.competitors}
                    onChange={(e) =>
                      setAppState((prev) => ({
                        ...prev,
                        competitors: e.target.value,
                      }))
                    }
                    placeholder="e.g. Baremetrics, ChartMogul"
                    className={fieldClass}
                  />
                </div>

                <div className="pt-3 border-t border-border/50">
                  <p className={cn("text-right text-[12px]", totalMeta.colorClass)}>
                    {totalLen.toLocaleString()} characters total · ~{Math.ceil(totalLen / 4)} tokens
                    {totalMeta.label && <span className="ml-2">{totalMeta.label}</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex justify-end">
            <Button onClick={handleGenerate}>Generate blueprint →</Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Screen 2 — Engine Room ────────────────────────────────────────────────

  function renderScreen2() {
    return (
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-[360px] space-y-8">
          {/* Header */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Generating your blueprint
            </p>
            <h2 className="text-[18px] font-medium text-foreground">
              This usually takes 15–20 seconds
            </h2>
          </div>

          {/* Checklist */}
          <div className="space-y-5">
            {CHECKLIST_STEPS.map((step, index) => (
              <ChecklistStep
                key={step.label}
                step={index + 1}
                label={step.label}
                description={step.description}
                status={getStepStatus(index, checklistPhase)}
              />
            ))}
          </div>

          {/* Error state */}
          {appState.apiError && (
            <div className="space-y-3 pt-2">
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2.5">
                {appState.apiError}
              </p>
              <Button variant="outline" onClick={handleReset} className="w-full">
                Start over
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Screen 3 — Blueprint Dashboard ───────────────────────────────────────

  function renderScreen3() {
    const activeTags =
      appState.activeTab === "brd"
        ? appState.brdTags
        : appState.activeTab === "prd"
          ? appState.prdTags
          : appState.marketTags;

    const activeTitle =
      appState.activeTab === "brd"
        ? appState.brdTitle
        : appState.activeTab === "prd"
          ? appState.prdTitle
          : appState.marketTitle;

    return (
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={appState.activeTab}
          collapsed={appState.sidebarCollapsed}
          onTabChange={(tab) =>
            setAppState((prev) => ({ ...prev, activeTab: tab }))
          }
          onCollapse={() =>
            setAppState((prev) => ({
              ...prev,
              sidebarCollapsed: !prev.sidebarCollapsed,
            }))
          }
          onExport={() => setAppState((prev) => ({ ...prev, currentScreen: 4 }))}
          onReset={handleReset}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="h-10 border-b flex items-center justify-between px-4 shrink-0">
            <span className="text-[13px] font-medium text-foreground">
              {TAB_NAMES[appState.activeTab]}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleRegenerate}
                disabled={appState.regeneratingTab !== null || appState.isRefining}
                title="Regenerate this section"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RotateCcw
                  className={cn(
                    "h-3.5 w-3.5",
                    appState.regeneratingTab === appState.activeTab && "animate-spin"
                  )}
                />
              </button>
              <button
                onClick={handleCopyTab}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Scrollable panel */}
          <div className="flex-1 overflow-y-auto p-6">
            {appState.regeneratingTab === appState.activeTab ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
                <p className="text-sm text-muted-foreground">
                  Regenerating {TAB_NAMES[appState.activeTab].replace(/ \(.*\)/, "")}...
                </p>
              </div>
            ) : (
            <div
              key={appState.activeTab}
              className="animate-in fade-in duration-150 max-w-2xl"
            >
              {/* Title + tag pills */}
              <h1 className="text-xl font-semibold text-foreground mb-3">
                {activeTitle}
              </h1>
              <div className="flex flex-wrap gap-1.5 mb-6">
                {activeTags.map((tag) => (
                  <TagPill
                    key={tag.label}
                    label={tag.label}
                    variant={tag.variant}
                  />
                ))}
              </div>

              {/* Markdown content — per-section with inline copy buttons */}
              <div className="space-y-6">
                {parseMarkdownSections(getActiveTabMarkdown()).map((section) => (
                  <SectionBlock key={section.heading} heading={section.heading} raw={section.raw}>
                    <ReactMarkdown components={mdComponents}>
                      {section.raw}
                    </ReactMarkdown>
                  </SectionBlock>
                ))}
              </div>

              {/* Metric cards — BRD panel only */}
              {appState.activeTab === "brd" && (
                <MetricsBlock
                  labels={["Target TAM", "Break-even MRR", "Target payback"]}
                  values={[appState.brdMetrics.targetTAM, appState.brdMetrics.breakEvenMRR, appState.brdMetrics.targetPayback]}
                >
                  <div className="grid grid-cols-3 gap-3 mt-6">
                    <MetricCard
                      label="Target TAM"
                      value={appState.brdMetrics.targetTAM}
                    />
                    <MetricCard
                      label="Break-even MRR"
                      value={appState.brdMetrics.breakEvenMRR}
                    />
                    <MetricCard
                      label="Target payback"
                      value={appState.brdMetrics.targetPayback}
                    />
                  </div>
                </MetricsBlock>
              )}

              {/* Metric cards — Market panel only */}
              {appState.activeTab === "market" && (
                <MetricsBlock
                  labels={["Avg competitor price", "Price gap", "Known competitors"]}
                  values={[appState.marketMetrics.avgCompetitorPrice, appState.marketMetrics.priceGap, appState.marketMetrics.knownCompetitors]}
                >
                  <div className="grid grid-cols-3 gap-3 mt-6">
                    <MetricCard
                      label="Avg competitor price"
                      value={appState.marketMetrics.avgCompetitorPrice}
                    />
                    <MetricCard
                      label="Price gap"
                      value={appState.marketMetrics.priceGap}
                    />
                    <MetricCard
                      label="Known competitors"
                      value={appState.marketMetrics.knownCompetitors}
                    />
                  </div>
                </MetricsBlock>
              )}
            </div>
            )}
          </div>

          {/* Refinement row — persistent across all tabs */}
          <div className="shrink-0 border-t px-4 py-3 bg-background">
            {appState.isRefining ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground h-9">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                Updating blueprint...
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={appState.refineInput}
                  onChange={(e) =>
                    setAppState((prev) => ({ ...prev, refineInput: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleRefine()}
                  placeholder="Refine your blueprint... e.g. Make the pricing more aggressive, Add a B2B angle"
                  className={fieldClass + " flex-1"}
                />
                <Button
                  onClick={handleRefine}
                  disabled={!appState.refineInput.trim()}
                  variant="secondary"
                >
                  Refine →
                </Button>
              </div>
            )}
            {appState.refineError && (
              <p className="text-xs text-destructive mt-2">{appState.refineError}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Screen 4 — Export ─────────────────────────────────────────────────────

  function renderScreen4() {
    return (
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-[440px] space-y-6">
          {/* Header */}
          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Export your blueprint
            </p>
            <h2 className="text-2xl font-semibold text-foreground">
              Take it anywhere
            </h2>
            <p className="text-sm text-muted-foreground">
              All three sections merged into one clean file, ready for Notion,
              Obsidian, or Linear.
            </p>
          </div>

          {/* Export action cards */}
          <div className="space-y-3">
            <button
              onClick={handleDownload}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Download className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Download full Markdown
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  BRD + PRD + Market intel as one .md file
                </p>
              </div>
            </button>

            <button
              onClick={handleCopyTab}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {copied ? (
                <Check className="h-5 w-5 shrink-0 text-green-600" />
              ) : (
                <Copy className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {copied ? "Copied!" : "Copy active tab to clipboard"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Paste directly into any doc editor
                </p>
              </div>
            </button>

            <button
              onClick={() => window.open("https://notion.so/", "_blank")}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ExternalLink className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Open in Notion
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Push blueprint directly to a new Notion page
                </p>
              </div>
            </button>
          </div>

          {/* Bottom navigation */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() =>
                setAppState((prev) => ({ ...prev, currentScreen: 3 }))
              }
            >
              ← Back to dashboard
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleReset}>
              ↺ New blueprint
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Root ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col">
      {renderNavBar()}
      <div
        key={appState.currentScreen}
        className="flex-1 flex flex-col animate-in fade-in duration-200 overflow-hidden"
      >
        {appState.currentScreen === 1 && renderScreen1()}
        {appState.currentScreen === 2 && renderScreen2()}
        {appState.currentScreen === 3 && renderScreen3()}
        {appState.currentScreen === 4 && renderScreen4()}
      </div>
    </div>
  );
}
