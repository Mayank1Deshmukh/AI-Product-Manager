"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, Globe, Lock } from "lucide-react";

interface ShareButtonProps {
  blueprintId: string | null;
  isPublic: boolean;
  onMakePublic: () => Promise<void>;
  onMakePrivate: () => Promise<void>;
}

export function ShareButton({
  blueprintId,
  isPublic,
  onMakePublic,
  onMakePrivate,
}: ShareButtonProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    }
    if (popoverOpen) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [popoverOpen]);

  function copyLink() {
    const url = `${window.location.origin}/blueprint/${blueprintId}`;
    navigator.clipboard.writeText(url);
    setToast("Link copied!");
    setTimeout(() => setToast(null), 2000);
  }

  async function handleMakePublic() {
    setBusy(true);
    try {
      await onMakePublic();
      copyLink();
    } finally {
      setBusy(false);
      setPopoverOpen(false);
    }
  }

  async function handleMakePrivate() {
    setBusy(true);
    try {
      await onMakePrivate();
    } finally {
      setBusy(false);
    }
  }

  function handleClick() {
    if (!blueprintId) return;
    if (isPublic) {
      copyLink();
    } else {
      setPopoverOpen((o) => !o);
    }
  }

  if (!blueprintId) return null;

  return (
    <div ref={containerRef} className="relative flex items-center gap-1">
      {/* Public badge */}
      {isPublic && (
        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded dark:bg-green-900/20 dark:border-green-800">
          <Globe className="h-3 w-3" />
          Public
        </span>
      )}

      {/* Share / Copy link button */}
      <button
        onClick={handleClick}
        title={isPublic ? "Copy link" : "Share blueprint"}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
      >
        <Share2 className="h-3.5 w-3.5" />
        {toast ?? (isPublic ? "Copy link" : "Share")}
      </button>

      {/* Make private button */}
      {isPublic && (
        <button
          onClick={handleMakePrivate}
          disabled={busy}
          title="Make private"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted disabled:opacity-40"
        >
          <Lock className="h-3 w-3" />
        </button>
      )}

      {/* Confirm popover */}
      {popoverOpen && (
        <div className="absolute right-0 top-full mt-1 w-72 rounded-xl border border-border bg-card shadow-lg z-50 p-4 space-y-3">
          <p className="text-sm text-foreground font-medium">Share blueprint</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Make this blueprint public so anyone with the link can view it?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleMakePublic}
              disabled={busy}
              className="flex-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium py-1.5 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {busy ? "Please wait…" : "Make public & copy link"}
            </button>
            <button
              onClick={() => setPopoverOpen(false)}
              className="px-3 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
