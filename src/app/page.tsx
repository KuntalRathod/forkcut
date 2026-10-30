"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import Preview from "@/components/Preview";
import Timeline from "@/components/Timeline";
import Transport from "@/components/Transport";
import Chat from "@/components/Chat";
import DesktopOnly, {
  MIN_WIDTH,
  useWindowWidth,
} from "@/components/DesktopOnly";
import History from "@/components/History";
import ExportDialog from "@/components/ExportDialog";
import Landing from "@/components/Landing";
import {
  Button,
  ConfirmDialog,
  ExportIcon,
  IconButton,
  Logo,
  NewProjectIcon,
  RedoActionIcon,
  UndoActionIcon,
} from "@/components/ui";

import { edlOf } from "@/lib/store";
import * as vcs from "@/lib/vcs/repo";

export default function Page() {
  const hydrate = useStore((s) => s.hydrate);
  const repo = useStore((s) => s.repo);
  const reset = useStore((s) => s.reset);
  const setPlaying = useStore((s) => s.setPlaying);
  const playing = useStore((s) => s.playing);
  const media = useStore((s) => s.media);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const redoStack = useStore((s) => s.redoStack);
  const edl = edlOf(repo);
  const canUndo = !!repo && vcs.canUndo(repo);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Which rail panels are open: a per-viewer convenience, remembered in this browser.
  const [rail, setRail] = useState({ ask: true, versions: true });
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("forkcut.rail") ?? "null",
      ) as Record<string, unknown> | null;
      if (saved)
        setRail({
          ask: saved.ask !== false,
          versions: saved.versions !== false,
        });
    } catch {
      /* storage blocked; both stay open */
    }
  }, []);
  const fold = (panel: "ask" | "versions") =>
    setRail((r) => {
      const next = { ...r, [panel]: !r[panel] };
      try {
        localStorage.setItem("forkcut.rail", JSON.stringify(next));
      } catch {
        /* not remembered, still folds */
      }
      return next;
    });
  const windowWidth = useWindowWidth();

  // Name what is actually at stake, rather than asking "are you sure?".
  const atStake = useMemo(() => {
    if (!repo) return null;
    const versions = vcs.log(repo).length;
    const branches = Object.keys(repo.branches).length;
    return { versions, branches, files: media.length };
  }, [repo, media.length]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && ["INPUT", "TEXTAREA"].includes(el.tagName)) return;
      if (e.code === "Space") {
        e.preventDefault();
        setPlaying(!playing);
      }
      // The shortcut everyone reaches for without thinking.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, setPlaying, undo, redo]);

  // Before anything mounts, so no work is done for a screen that cannot use it.
  if (repo && windowWidth > 0 && windowWidth < MIN_WIDTH)
    return <DesktopOnly width={windowWidth} />;

  // No project yet: the landing page. It is what the server sends, so a
  // crawler sees real content; a saved project replaces it once IndexedDB answers.
  if (!repo)
    return <Landing narrow={windowWidth > 0 && windowWidth < MIN_WIDTH} />;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-shell">
      <header className="flex h-11 shrink-0 items-center gap-3 border-b border-edge bg-panel px-3">
        <Logo />
        {repo && media[0] && (
          <>
            <span className="h-3.5 w-px bg-edge" />
            <span className="truncate text-[12.5px] text-ink-2">
              {media[0].name}
            </span>
            <span className="tnum shrink-0 font-mono text-[11px] text-ink-3">
              {edl.width}×{edl.height} at {edl.fps} fps
            </span>
          </>
        )}
        {repo && (
          <div className="ml-auto flex items-center gap-1">
            <IconButton
              label="Undo"
              title="Undo the last change (⌘Z). It leaves no trace in the version history."
              icon={<UndoActionIcon />}
              disabled={!canUndo}
              onClick={undo}
            />
            <IconButton
              label="Redo"
              title="Redo the change you just undid (⇧⌘Z)"
              icon={<RedoActionIcon />}
              disabled={!redoStack.length}
              onClick={redo}
            />
            <span className="mx-1 h-4 w-px bg-edge" />
            <Button
              onClick={() => setConfirmingReset(true)}
              icon={<NewProjectIcon />}
            >
              New project
            </Button>
            {/* The one action that turns the edit into a file, so it takes the primary treatment. */}
            <Button
              variant="primary"
              onClick={() => setExporting(true)}
              icon={<ExportIcon size={13} />}
            >
              Export
            </Button>
          </div>
        )}
      </header>

      {/* Everything else in the app is undoable. This is not: it clears the
          stored project and the imported media outright. */}
      <ConfirmDialog
        open={confirmingReset}
        title="Start a new project?"
        confirmLabel="Delete and start over"
        cancelLabel="Keep editing"
        onCancel={() => setConfirmingReset(false)}
        onConfirm={() => {
          setConfirmingReset(false);
          void reset();
        }}
        body={
          <>
            <p>
              This permanently deletes the current project from this browser —{" "}
              <strong className="font-medium text-ink">
                {atStake?.versions ?? 0} version
                {atStake?.versions === 1 ? "" : "s"}
              </strong>
              {atStake && atStake.branches > 1
                ? ` across ${atStake.branches} variants`
                : ""}{" "}
              and{" "}
              <strong className="font-medium text-ink">
                {atStake?.files ?? 0} imported file
                {atStake?.files === 1 ? "" : "s"}
              </strong>
              .
            </p>
            <p className="mt-2">Undo cannot bring it back.</p>
          </>
        }
      />

      {/* Mounted only while open: a closed dialog's text still answers text
          queries, and its length row shadowed the timeline's own timecode. */}
      {exporting && <ExportDialog open onClose={() => setExporting(false)} />}

      {/* The landing is what the server sends. A "Loading" shell was all a
          crawler ever saw — most do not run JS — so the page had no indexable
          content at all. A saved project takes its place a moment later, once
          IndexedDB answers, which is also the only honest first render: until
          it does, nobody knows whether there is a project. */}
      {repo && (
        <main className="gate-in flex min-h-0 flex-1">
          <section className="flex min-w-0 flex-1 flex-col">
            <Preview />
            {/* Breathing room, so the timeline reads as its own instrument
                rather than as the bottom edge of the viewer. */}
            <div className="shrink-0 bg-shell px-3 pb-3 pt-2 xl:pt-7">
              <div className="relative">
                <div className="mb-2 flex justify-center xl:absolute xl:-top-4 xl:left-2/5 xl:z-20 xl:mb-0 xl:block xl:-translate-x-1/2">
                  <Transport />
                </div>

                <Timeline />
              </div>
            </div>
          </section>
          <aside className="flex w-[290px] shrink-0 flex-col border-l border-edge bg-panel xl:w-[340px]">
            <Chat open={rail.ask} onToggle={() => fold("ask")} />
            <History open={rail.versions} onToggle={() => fold("versions")} />
          </aside>
        </main>
      )}
    </div>
  );
}
