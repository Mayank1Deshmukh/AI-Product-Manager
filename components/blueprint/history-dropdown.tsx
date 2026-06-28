"use client";

import { useState, useEffect, useRef } from "react";
import { History, Plus, Clock } from "lucide-react";
import type { BlueprintRow } from "@/lib/types";

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

interface HistoryDropdownProps {
  onSelect: (blueprint: BlueprintRow) => void;
  onNew: () => void;
}

export function HistoryDropdown({ onSelect, onNew }: HistoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [blueprints, setBlueprints] = useState<BlueprintRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isOpen]);

  async function open() {
    setIsOpen((o) => !o);
    if (!isOpen) {
      setIsLoading(true);
      setLoadError(false);
      try {
        const res = await fetch("/api/blueprints?limit=10");
        if (!res.ok) throw new Error("Failed to load");
        const json = await res.json() as { blueprints: BlueprintRow[] };
        setBlueprints(json.blueprints ?? []);
      } catch {
        setBlueprints([]);
        setLoadError(true);
      } finally {
        setIsLoading(false);
      }
    }
  }

  async function select(bp: BlueprintRow) {
    setIsOpen(false);
    setSelectingId(bp.id);
    try {
      const res = await fetch(`/api/blueprints/${bp.id}`);
      const json = await res.json() as { blueprint?: BlueprintRow };
      if (json.blueprint) onSelect(json.blueprint);
    } finally {
      setSelectingId(null);
    }
  }

  function handleNew() {
    setIsOpen(false);
    onNew();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={open}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
        title="My blueprints"
      >
        <History className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">My blueprints</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-72 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden">
          {/* New blueprint */}
          <button
            onClick={handleNew}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors border-b border-border"
          >
            <Plus className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-medium">New blueprint</span>
          </button>

          {/* List */}
          <div className="max-h-72 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-xs text-muted-foreground gap-2">
                <Clock className="h-3.5 w-3.5 animate-pulse" />
                Loading…
              </div>
            ) : loadError ? (
              <p className="text-xs text-destructive text-center py-8 px-3">
                Failed to load blueprints.
              </p>
            ) : blueprints.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                No blueprints yet
              </p>
            ) : (
              blueprints.map((bp) => (
                <button
                  key={bp.id}
                  onClick={() => select(bp)}
                  disabled={selectingId === bp.id}
                  className="w-full flex flex-col items-start px-3 py-2.5 text-left hover:bg-muted transition-colors border-b border-border/50 last:border-0 disabled:opacity-50"
                >
                  <span className="text-sm text-foreground truncate w-full">
                    {bp.title ?? bp.idea_input?.slice(0, 60) ?? "Untitled"}
                  </span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {selectingId === bp.id ? "Opening…" : relativeTime(bp.created_at)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
