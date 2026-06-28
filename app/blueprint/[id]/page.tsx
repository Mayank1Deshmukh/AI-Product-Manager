import Link from "next/link";
import { Network } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { PublicViewer } from "@/components/blueprint/public-viewer";
import type { BlueprintRow } from "@/lib/types";

type Props = {
  params: Promise<{ id: string }>;
};

function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4">
      <div className="text-center space-y-4 max-w-sm">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
          404
        </p>
        <h1 className="text-2xl font-semibold">Blueprint not found</h1>
        <p className="text-sm text-muted-foreground">
          This blueprint doesn&apos;t exist or is no longer public.
        </p>
        <Link
          href="/login"
          className="inline-block mt-2 text-sm text-primary hover:underline"
        >
          Create your own blueprint →
        </Link>
      </div>
    </div>
  );
}

export default async function SharedBlueprintPage({ params }: Props) {
  const { id } = await params;

  const supabase = createServiceClient();
  const { data: blueprint } = await supabase
    .from("blueprints")
    .select("*")
    .eq("id", id)
    .single();

  if (!blueprint || !(blueprint as BlueprintRow).is_public) {
    return <NotFoundPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Nav */}
      <nav className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0 bg-background">
        <Link href="/" className="flex items-center gap-2">
          <Network className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Blueprint</span>
        </Link>
        <Link
          href="/login"
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Get started free →
        </Link>
      </nav>

      {/* Viewer fills the rest of the screen */}
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 3rem)" }}>
        <PublicViewer blueprint={blueprint as BlueprintRow} />
      </div>
    </div>
  );
}
