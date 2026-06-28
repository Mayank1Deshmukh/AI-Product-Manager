"use client";

import { useState, useRef } from "react";
import { Loader2, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CompetitorRow } from "@/lib/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractValueProp(brdMarkdown: string): string {
  const match = brdMarkdown.match(/##\s*Value proposition\s*\n+([\s\S]*?)(?=\n##|$)/i);
  return match?.[1]?.replace(/\*\*/g, "").trim().slice(0, 150) ?? "";
}

function countCompetitors(marketMetricValue: string): number {
  const n = parseInt(marketMetricValue);
  return isNaN(n) ? 4 : Math.min(n, 6);
}

// ── Editable cell ─────────────────────────────────────────────────────────────

function EditableCell({ initialValue }: { initialValue: string }) {
  return (
    <td className="px-3 py-2.5 border-r border-border last:border-0">
      <div
        contentEditable
        suppressContentEditableWarning
        className="text-xs text-foreground outline-none min-h-[1.5rem] focus:ring-1 focus:ring-primary/40 focus:bg-primary/5 rounded px-1 -mx-1"
      >
        {initialValue}
      </div>
    </td>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface CompetitorTabProps {
  blueprintId: string | null;
  marketMarkdown: string;
  brdMarkdown: string;
  knownCompetitorsCount: string;
  savedCompetitorData: CompetitorRow[] | null;
  onComplete: (results: CompetitorRow[]) => void;
}

type RowStatus = "loading" | "done" | "error";

export function CompetitorTab({
  blueprintId,
  marketMarkdown,
  brdMarkdown,
  knownCompetitorsCount,
  savedCompetitorData,
  onComplete,
}: CompetitorTabProps) {
  const [phase, setPhase] = useState<"idle" | "extracting" | "searching" | "done">(
    savedCompetitorData ? "done" : "idle"
  );
  const [competitorNames, setCompetitorNames] = useState<string[]>(
    savedCompetitorData?.map((c) => c.name) ?? []
  );
  const [results, setResults] = useState<Map<string, CompetitorRow>>(
    () => new Map(savedCompetitorData?.map((c) => [c.name, c]) ?? [])
  );
  const [rowStatus, setRowStatus] = useState<Map<string, RowStatus>>(
    () => new Map(savedCompetitorData?.map((c) => [c.name, "done" as RowStatus]) ?? [])
  );
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const resultsRef = useRef<Map<string, CompetitorRow>>(
    new Map(savedCompetitorData?.map((c) => [c.name, c]) ?? [])
  );

  const estimatedCount = countCompetitors(knownCompetitorsCount);
  const valueProp = extractValueProp(brdMarkdown);

  async function runDeepDive() {
    setError(null);
    setPhase("extracting");

    try {
      // Step A: extract competitor names
      const extractRes = await fetch("/api/deep-dive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extract", marketMarkdown }),
      });
      const { competitors } = (await extractRes.json()) as { competitors: string[] };

      if (!competitors || competitors.length === 0) {
        setError("Could not extract competitor names from your Market Intel.");
        setPhase("idle");
        return;
      }

      const capped = competitors.slice(0, 6);
      if (competitors.length > 6) setTruncated(true);

      setCompetitorNames(capped);
      const initStatus = new Map(capped.map((n) => [n, "loading" as RowStatus]));
      setRowStatus(initStatus);
      setPhase("searching");

      // Step B: parallel per-competitor searches
      resultsRef.current = new Map();
      await Promise.all(
        capped.map(async (name) => {
          try {
            const res = await fetch("/api/deep-dive", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "search", competitor: name }),
            });
            const { competitor } = (await res.json()) as { competitor: CompetitorRow };
            resultsRef.current.set(name, competitor);
            setResults(new Map(resultsRef.current));
            setRowStatus((prev) => new Map(prev).set(name, "done"));
          } catch {
            setRowStatus((prev) => new Map(prev).set(name, "error"));
          }
        })
      );

      setPhase("done");

      const allResults = capped
        .map((n) => resultsRef.current.get(n))
        .filter((r): r is CompetitorRow => !!r);

      onComplete(allResults);

      // Step C: save to Supabase
      if (blueprintId) {
        fetch("/api/deep-dive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save", blueprintId, allResults }),
        }).catch(() => {/* non-fatal */});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deep-dive failed.");
      setPhase("idle");
    }
  }

  // ── Placeholder state ──────────────────────────────────────────────────────

  if (phase === "idle") {
    return (
      <div className="flex-1 flex items-center justify-center py-16 px-6">
        <div className="w-full max-w-[480px] space-y-5">
          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Competitor analysis
            </p>
            <h2 className="text-xl font-semibold text-foreground">
              Competitor deep-dive
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We&apos;ll search the web for each competitor identified in your
              blueprint and build a structured comparison.
            </p>
          </div>

          {/* Cost warning */}
          <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              This feature runs a separate web search per competitor and uses approximately{" "}
              <strong>5× more API credits</strong> than a standard generation. It will run{" "}
              <strong>{estimatedCount} searches</strong> based on the competitors found in
              your Market Intel.
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button onClick={runDeepDive}>Run deep-dive →</Button>
        </div>
      </div>
    );
  }

  // ── Extracting state ───────────────────────────────────────────────────────

  if (phase === "extracting") {
    return (
      <div className="flex-1 flex items-center justify-center py-16 px-6">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Identifying competitors from your Market Intel…
        </div>
      </div>
    );
  }

  // ── Searching / Done state — show the table ────────────────────────────────

  const tableCompetitors = phase === "done"
    ? competitorNames.filter((n) => results.has(n))
    : competitorNames;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            Competitor deep-dive
          </h2>
          {phase === "done" && (
            <Button variant="outline" size="sm" onClick={() => {
              setPhase("idle");
              setCompetitorNames([]);
              setResults(new Map());
              setRowStatus(new Map());
              resultsRef.current = new Map();
              setTruncated(false);
            }}>
              Re-run
            </Button>
          )}
        </div>

        {truncated && (
          <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
            Showing the top 6 competitors. Edit your Market Intel to prioritise which ones appear.
          </p>
        )}

        {/* Comparison table */}
        <div className="rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["Competitor", "Pricing", "Key features", "Weaknesses", "Target customer"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-xs font-semibold text-muted-foreground border-r border-border last:border-0 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {tableCompetitors.map((name) => {
                const status = rowStatus.get(name) ?? "loading";
                const data = results.get(name);

                return (
                  <tr key={name} className="border-b border-border last:border-0">
                    {/* Name cell with status indicator */}
                    <td className="px-3 py-2.5 border-r border-border">
                      <div className="flex items-center gap-2">
                        {status === "loading" && (
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0" />
                        )}
                        {status === "done" && (
                          <Check className="h-3 w-3 text-green-600 shrink-0" />
                        )}
                        {status === "error" && (
                          <span className="h-3 w-3 text-destructive shrink-0">✕</span>
                        )}
                        <span className="text-xs font-medium text-foreground">{name}</span>
                      </div>
                    </td>

                    {status === "loading" ? (
                      <>
                        {[0, 1, 2, 3].map((i) => (
                          <td key={i} className="px-3 py-2.5 border-r border-border last:border-0">
                            <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                          </td>
                        ))}
                      </>
                    ) : status === "error" ? (
                      <td colSpan={4} className="px-3 py-2.5 text-xs text-destructive">
                        Search failed for this competitor
                      </td>
                    ) : data ? (
                      <>
                        <td className="px-3 py-2.5 border-r border-border text-xs text-muted-foreground">
                          {data.pricing}
                        </td>
                        <td className="px-3 py-2.5 border-r border-border">
                          <ul className="space-y-0.5">
                            {data.key_features.slice(0, 4).map((f, i) => (
                              <li key={i} className="text-xs text-muted-foreground">
                                • {f}
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-3 py-2.5 border-r border-border">
                          <ul className="space-y-0.5">
                            {data.weaknesses.slice(0, 3).map((w, i) => (
                              <li key={i} className="text-xs text-muted-foreground">
                                • {w}
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">
                          {data.target_customer}
                        </td>
                      </>
                    ) : null}
                  </tr>
                );
              })}

              {/* "Your app" editable row — shown only when at least one result is in */}
              {tableCompetitors.some((n) => results.has(n)) && (
                <tr className="border-t-2 border-primary/20 bg-primary/5">
                  <td className="px-3 py-2.5 border-r border-border">
                    <span className="text-xs font-semibold text-primary">Your app</span>
                  </td>
                  <EditableCell initialValue="" />
                  <EditableCell initialValue="" />
                  <EditableCell initialValue="" />
                  <EditableCell initialValue={valueProp} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
