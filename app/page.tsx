import Link from "next/link";
import { Network, Briefcase, LayoutList, BarChart2, ArrowRight, Zap, FileText } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Nav */}
      <header className="h-14 border-b border-border flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Blueprint</span>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign in
        </Link>
      </header>

      <main className="flex-1">
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="flex flex-col items-center justify-center text-center px-6 py-24 gap-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
            AI product manager
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold leading-tight max-w-2xl">
            Turn your startup idea into a fundable blueprint
          </h1>
          <p className="text-base text-muted-foreground max-w-md">
            Paste your idea. Get a business case, product spec, and market
            analysis in under 20 seconds.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Get started free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        {/* ── How it works ──────────────────────────────────────────── */}
        <section className="border-t border-border px-6 py-20">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium text-center mb-10">
              How it works
            </p>
            <div className="grid sm:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  title: "Input your idea",
                  description:
                    "Describe your product in plain language — the problem, the audience, how it makes money.",
                },
                {
                  step: "2",
                  title: "Blueprint generates",
                  description:
                    "Our AI writes a structured business case, product spec, and market analysis in seconds.",
                },
                {
                  step: "3",
                  title: "Export anywhere",
                  description:
                    "Download as Markdown, copy sections, or push to Notion. Edit and refine inline.",
                },
              ].map(({ step, title, description }) => (
                <div key={step} className="flex flex-col gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-primary">{step}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────────── */}
        <section className="border-t border-border bg-muted/30 px-6 py-20">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium text-center mb-10">
              What you get
            </p>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                {
                  icon: Briefcase,
                  title: "Business case",
                  description:
                    "Problem statement, value proposition, revenue model, key risks, and market sizing — ready to share with investors or stakeholders.",
                },
                {
                  icon: LayoutList,
                  title: "Product specs",
                  description:
                    "Epics, user stories, and acceptance criteria your engineering team can act on immediately.",
                },
                {
                  icon: BarChart2,
                  title: "Market intel",
                  description:
                    "Competitive landscape, positioning opportunity, and pricing benchmarks to sharpen your go-to-market strategy.",
                },
              ].map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              ))}
            </div>

            {/* Secondary feature strip */}
            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: Zap,
                  title: "Refine with one sentence",
                  description: "Type a direction and every section updates to match — no prompt engineering required.",
                },
                {
                  icon: FileText,
                  title: "Export as Markdown or PDF",
                  description: "One clean file with all three sections, ready for Notion, Obsidian, or Linear.",
                },
              ].map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-xl border border-border bg-card p-5 flex gap-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA strip ─────────────────────────────────────────────── */}
        <section className="border-t border-border px-6 py-20 flex flex-col items-center gap-5 text-center">
          <h2 className="text-2xl font-semibold">Ready to build smarter?</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Free to start. No credit card required.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Get started free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Blueprint</span>
        </div>
        <Link
          href="/login"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Get started →
        </Link>
      </footer>
    </div>
  );
}
