// Client-only — always imported dynamically in event handlers, never at module top-level
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 56,
    paddingLeft: 56,
    paddingRight: 56,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#1f2937",
    backgroundColor: "#ffffff",
  },
  // Cover page
  coverTitle: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 10,
    lineHeight: 1.3,
  },
  coverDate: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 28,
  },
  rule: {
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  // Section heading (BRD / PRD / Market)
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 18,
  },
  // Markdown ## heading
  h2: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    marginTop: 20,
    marginBottom: 6,
  },
  body: {
    fontSize: 11,
    lineHeight: 1.7,
    color: "#374151",
    marginBottom: 6,
  },
  bullet: {
    fontSize: 11,
    lineHeight: 1.7,
    color: "#374151",
    marginBottom: 4,
    marginLeft: 14,
  },
  spacer: { height: 8 },
  // Footer
  footer: {
    position: "absolute",
    bottom: 28,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 9,
    color: "#9ca3af",
  },
});

// ── Markdown-to-PDF renderer ──────────────────────────────────────────────────

function stripInline(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

function MarkdownContent({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <Text key={i} style={s.h2}>
              {line.slice(3).toUpperCase()}
            </Text>
          );
        }
        if (line.startsWith("- [ ] ") || line.startsWith("- [x] ") || line.startsWith("- [X] ")) {
          const done = !line.startsWith("- [ ] ");
          return (
            <Text key={i} style={s.bullet}>
              {done ? "☑" : "☐"} {stripInline(line.slice(6))}
            </Text>
          );
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <Text key={i} style={s.bullet}>
              • {stripInline(line.slice(2))}
            </Text>
          );
        }
        if (line.trim() === "") {
          return <View key={i} style={s.spacer} />;
        }
        // Skip bare markdown headings we don't handle (### etc.)
        if (line.startsWith("#")) return null;
        return (
          <Text key={i} style={s.body}>
            {stripInline(line)}
          </Text>
        );
      })}
    </>
  );
}

function Footer({ title }: { title: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>{title}</Text>
      <Text
        style={s.footerText}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

// ── Document component ────────────────────────────────────────────────────────

interface BlueprintPDFProps {
  title: string;
  date: string;
  brd: string;
  prd: string;
  market: string;
}

function BlueprintPDFDoc({ title, date, brd, prd, market }: BlueprintPDFProps) {
  return (
    <Document title={title} author="Blueprint" creator="Blueprint">
      {/* Cover page */}
      <Page size="A4" style={s.page}>
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text style={s.coverTitle}>{title}</Text>
          <Text style={s.coverDate}>Generated {date}</Text>
          <View style={s.rule} />
        </View>
        <Footer title={title} />
      </Page>

      {/* Business case */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>Business Case</Text>
        <MarkdownContent markdown={brd} />
        <Footer title={title} />
      </Page>

      {/* Product specs */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>Product Specs</Text>
        <MarkdownContent markdown={prd} />
        <Footer title={title} />
      </Page>

      {/* Market intel */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>Market Intel</Text>
        <MarkdownContent markdown={market} />
        <Footer title={title} />
      </Page>
    </Document>
  );
}

// ── Download utility ──────────────────────────────────────────────────────────

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function downloadBlueprintPDF(opts: {
  title: string;
  brd: string;
  prd: string;
  market: string;
}) {
  const { title, brd, prd, market } = opts;
  const date = new Date().toISOString().slice(0, 10);

  const blob = await pdf(
    <BlueprintPDFDoc title={title} date={date} brd={brd} prd={prd} market={market} />
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `blueprint-${slugify(title.slice(0, 40))}-${date}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
