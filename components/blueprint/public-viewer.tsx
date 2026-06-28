"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Briefcase, LayoutList, BarChart2, Download, FileText } from "lucide-react";
import { TagPill } from "@/components/blueprint/tag-pill";
import { MetricCard } from "@/components/blueprint/metric-card";
import { cn } from "@/lib/utils";
import type { BlueprintRow } from "@/lib/types";

type ActiveTab = "brd" | "prd" | "market";

const TABS: { id: ActiveTab; icon: React.ElementType; label: string }[] = [
  { id: "brd", icon: Briefcase, label: "Business case" },
  { id: "prd", icon: LayoutList, label: "Product specs" },
  { id: "market", icon: BarChart2, label: "Market intel" },
];

const mdComponents = {
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-6 mb-2 first:mt-0">
      {children}
    </h2>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-sm leading-relaxed text-muted-foreground mb-3 last:mb-0">{children}</p>
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

function parseMarkdownSections(markdown: string) {
  const sections: { heading: string; raw: string }[] = [];
  let currentHeading = "";
  let currentLines: string[] = [];
  for (const line of markdown.split("\n")) {
    if (line.startsWith("## ")) {
      if (currentHeading) {
        sections.push({ heading: currentHeading, raw: `## ${currentHeading}\n\n${currentLines.join("\n").trim()}` });
      }
      currentHeading = line.slice(3).trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  if (currentHeading) {
    sections.push({ heading: currentHeading, raw: `## ${currentHeading}\n\n${currentLines.join("\n").trim()}` });
  }
  return sections;
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

interface PublicViewerProps {
  blueprint: BlueprintRow;
}

export function PublicViewer({ blueprint }: PublicViewerProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("brd");

  const content =
    activeTab === "brd"
      ? blueprint.brd ?? ""
      : activeTab === "prd"
        ? blueprint.prd ?? ""
        : blueprint.market ?? "";

  async function handleDownloadPDF() {
    const { downloadBlueprintPDF } = await import("@/components/pdf/blueprint-pdf");
    await downloadBlueprintPDF({
      title: blueprint.title ?? "Blueprint",
      brd: blueprint.brd ?? "",
      prd: blueprint.prd ?? "",
      market: blueprint.market ?? "",
    });
  }

  function handleDownload() {
    const title = blueprint.title ?? "blueprint";
    const date = new Date().toISOString().slice(0, 10);
    const body = [
      `# Blueprint: ${title}`,
      `Generated on ${date}`,
      "",
      "---",
      "",
      "## Business case (BRD)",
      "",
      blueprint.brd ?? "",
      "",
      "---",
      "",
      "## Product specs (PRD)",
      "",
      blueprint.prd ?? "",
      "",
      "---",
      "",
      "## Market intel",
      "",
      blueprint.market ?? "",
    ].join("\n");
    const blob = new Blob([body], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `blueprint-${slugify(title.slice(0, 40))}-${date}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* View-only banner */}
      <div className="shrink-0 bg-muted/50 border-b border-border px-4 py-2.5 flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          This is a shared blueprint — view only.{" "}
          <a href="/login" className="text-primary hover:underline font-medium">
            Create your own →
          </a>
        </p>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5" />
            .md
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
          >
            <FileText className="h-3.5 w-3.5" />
            PDF
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-48 shrink-0 border-r bg-background flex flex-col">
          <div className="px-4 pt-4 pb-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Blueprint
            </p>
          </div>
          <nav className="flex flex-col gap-0.5 px-1 pt-2">
            {TABS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-3 w-full rounded-md px-2 py-2 text-sm transition-colors border-l-2",
                  activeTab === id
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-10 border-b flex items-center px-4 shrink-0">
            <span className="text-[13px] font-medium text-foreground">
              {TABS.find((t) => t.id === activeTab)?.label}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div key={activeTab} className="animate-in fade-in duration-150 max-w-2xl">
              <h1 className="text-xl font-semibold text-foreground mb-6">
                {blueprint.title ?? "Blueprint"}
              </h1>

              <div className="flex flex-wrap gap-1.5 mb-6">
                {/* Tags are not stored in Supabase — omitted for public view */}
              </div>

              <div className="space-y-6">
                {parseMarkdownSections(content).map((section) => (
                  <div key={section.heading}>
                    <ReactMarkdown components={mdComponents}>
                      {section.raw}
                    </ReactMarkdown>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
