"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Network, ChevronLeft, ChevronRight, Trash2, ExternalLink, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { BlueprintRow } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

const PAGE_SIZE = 10;

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Today";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function memberSince(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function getInitials(user: User): string {
  const name: string = (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email ??
    "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [blueprints, setBlueprints] = useState<BlueprintRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, [supabase]);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/blueprints?page=${page}&limit=${PAGE_SIZE}`);
        const json = await res.json() as { blueprints: BlueprintRow[]; total: number };
        setBlueprints(json.blueprints ?? []);
        setTotal(json.total ?? 0);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [page]);

  async function handleDelete(id: string, title: string | null) {
    if (!confirm(`Delete "${title ?? "this blueprint"}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await fetch(`/api/blueprints/${id}`, { method: "DELETE" });
      setBlueprints((prev) => prev.filter((b) => b.id !== id));
      setTotal((t) => t - 1);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const avatarUrl: string | null =
    (user?.user_metadata?.avatar_url as string | undefined) ??
    (user?.user_metadata?.picture as string | undefined) ??
    null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="h-12 border-b border-border flex items-center justify-between px-4 bg-background">
        <Link href="/app" className="flex items-center gap-2">
          <Network className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Blueprint</span>
        </Link>
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5">
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </Button>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">
        {/* Profile card */}
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Avatar"
              className="h-14 w-14 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-base font-semibold text-primary">
                {user ? getInitials(user) : "…"}
              </span>
            </div>
          )}
          <div className="space-y-0.5">
            <p className="text-base font-semibold text-foreground">
              {(user?.user_metadata?.full_name as string | undefined) ??
                (user?.user_metadata?.name as string | undefined) ??
                user?.email ??
                "…"}
            </p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground">
              Member since {user?.created_at ? memberSince(user.created_at) : "…"}
            </p>
          </div>
        </div>

        {/* Blueprints */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Blueprints {total > 0 && <span className="text-muted-foreground font-normal">({total})</span>}
            </h2>
            <Link href="/app" className="text-xs text-primary hover:underline">
              + New blueprint
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : blueprints.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground mb-3">No blueprints yet</p>
              <Link href="/app">
                <Button size="sm">Generate your first blueprint</Button>
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              {blueprints.map((bp, i) => (
                <div
                  key={bp.id}
                  className={[
                    "flex items-center gap-3 px-4 py-3",
                    i < blueprints.length - 1 ? "border-b border-border" : "",
                  ].join(" ")}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {bp.title ?? bp.idea_input?.slice(0, 60) ?? "Untitled"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {relativeTime(bp.created_at)}
                      {bp.is_public && (
                        <span className="ml-2 text-green-600 font-medium">· Public</span>
                      )}
                    </p>
                  </div>
                  <Link href={`/app?load=${bp.id}`}>
                    <Button variant="outline" size="xs" className="gap-1">
                      <ExternalLink className="h-3 w-3" />
                      Open
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => handleDelete(bp.id, bp.title)}
                    disabled={deletingId === bp.id}
                    title="Delete blueprint"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
