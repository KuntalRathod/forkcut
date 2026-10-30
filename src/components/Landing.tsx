"use client";

import { useCallback, useState, type CSSProperties, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { MAX_FILE_BYTES, humanBytes } from "@/lib/media/opfs";
import { SOURCE_URL } from "@/app/site";
import {
  BranchIcon,
  CheckIcon,
  CropIcon,
  ExportIcon,
  FadeTrackIcon,
  GithubIcon,
  KeyIcon,
  Logo,
  SplitIcon,
  UndoIcon,
} from "@/components/ui";

/** A hole plus its gap. Real film has one pitch, so a repeat on it has no seam. */
const PITCH = 21;

/** Sprocket holes. The strip is raised and the holes drop to the background, so they read as holes. */
function Perforations({ state = "still" }: { state?: "still" | "threaded" | "running" }) {
  return (
    <div className="overflow-hidden bg-[#2a221b] px-3 py-[5px]" aria-hidden="true">
      <div
        style={{ "--pitch": `${PITCH}px`, gap: PITCH - 13 } as CSSProperties}
        className={`flex items-center transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)] ${
          state === "running" ? "threading" : state === "threaded" ? "-translate-x-[21px]" : ""
        }`}
      >
        {Array.from({ length: 48 }, (_, i) => (
          <span key={i} className="h-[9px] w-[13px] shrink-0 rounded-[2px] bg-shell" />
        ))}
      </div>
    </div>
  );
}

/** The drop target. Everything about importing lives here and nowhere else on the page. */
function Gate({ narrow }: { narrow: boolean }) {
  const importFile = useStore((s) => s.importFile);
  const busy = useStore((s) => s.busy);
  const status = useStore((s) => s.status);
  const [over, setOver] = useState(false);

  const take = useCallback(
    (files: FileList | null) => {
      const f = files?.[0];
      if (f) void importFile(f);
    },
    [importFile],
  );

  const gate = busy ? "running" : over ? "threaded" : "still";

  return (
    <div id="start">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          if (!narrow) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (!narrow) take(e.dataTransfer.files);
        }}
        className={`block overflow-hidden rounded-panel border shadow-[0_24px_60px_-24px_rgba(0,0,0,.8)] transition-colors duration-200
                    focus-within:border-leader focus-within:ring-2 focus-within:ring-leader ${
                      narrow ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                    } ${
                      over
                        ? "border-leader bg-leader/[.08]"
                        : "border-edge bg-panel hover:border-leader/60 hover:bg-raised/50"
                    }`}
      >
        <input
          type="file"
          accept="video/*"
          className="sr-only"
          onChange={(e) => take(e.target.files)}
          disabled={busy || narrow}
        />
        <Perforations state={gate} />
        <div className="px-6 py-9 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-leader/40 bg-leader/10 text-leader">
            <ExportIcon size={18} className="-rotate-90" />
          </div>
          <p className="text-[15px] font-medium text-ink">
            {narrow
              ? "Editing needs a wider screen"
              : busy
                ? (status ?? "Working")
                : over
                  ? "Release to load it"
                  : "Drop a video, or click to choose"}
          </p>
          <p className="mt-1.5 font-mono text-[12px] text-ink-3">
            {narrow
              ? "Open this page on a laptop or desktop (860px+)."
              : busy
                ? "Reading it on your machine."
                : over
                  ? "It never leaves this machine."
                  : `MP4 or WebM · up to ${humanBytes(MAX_FILE_BYTES)} · stays on this device`}
          </p>
        </div>
        <Perforations state={gate} />
      </label>

      {/* An import that fails leaves `busy` false, so the reason lives outside the gate. */}
      {!busy && status && (
        <p role="alert" className="rise-in mt-3 text-[12.5px] leading-relaxed text-grease">
          {status}
        </p>
      )}
    </div>
  );
}

/**
 * The version graph: one history, and a variant that forks off it. The
 * product's whole idea, drawn the way a git log draws it, with film frames
 * for commits.
 */
function ForkGraph() {
  const trunk = [
    { x: 40, label: "Import", sub: "0:48 · 1080p" },
    { x: 150, label: "Split at 0:12", sub: "+1 clip" },
    { x: 260, label: "Close silences", sub: "−4.0s" },
    { x: 370, label: "Fade out", sub: "+fade" },
  ];
  const fork = [
    { x: 260, label: "Tighter cut", sub: "−11.2s" },
    { x: 370, label: "Reframe 9:16", sub: "variant-b" },
  ];
  const Y = 104;
  const FY = 210;
  return (
    <svg
      viewBox="0 0 440 300"
      className="h-auto w-full"
      role="img"
      aria-label="A version history: four edits on the main line, and a second variant that branches off after the first split."
    >
      {/* Trunk and fork. */}
      <path d={`M40 ${Y}H370`} stroke="#5a4d3f" strokeWidth="2" />
      <path
        d={`M150 ${Y}C190 ${Y} 200 ${FY} 260 ${FY}H370`}
        stroke="var(--color-leader)"
        strokeWidth="2"
        fill="none"
      />
      {trunk.map((n, i) => (
        <g key={n.label}>
          <rect
            x={n.x - 14}
            y={Y - 18}
            width="28"
            height="36"
            rx="5"
            fill="#1c1713"
            stroke={i === trunk.length - 1 ? "#f1e9dc" : "#5a4d3f"}
            strokeWidth="1.6"
          />
          <rect x={n.x - 8} y={Y - 11} width="16" height="22" rx="2" fill="#3a3027" />
          <text x={n.x} y={Y - 30} textAnchor="middle" fontSize="10.5" fill="#f1e9dc" fontFamily="var(--font-plex-mono)">
            {n.label}
          </text>
          <text x={n.x} y={Y + 36} textAnchor="middle" fontSize="9.5" fill="#9a8f80" fontFamily="var(--font-plex-mono)">
            {n.sub}
          </text>
        </g>
      ))}
      {fork.map((n, i) => (
        <g key={n.label}>
          <rect
            x={n.x - 14}
            y={FY - 18}
            width="28"
            height="36"
            rx="5"
            fill="#1c1713"
            stroke="var(--color-leader)"
            strokeWidth="1.6"
          />
          <rect
            x={n.x - 8}
            y={FY - 11}
            width="16"
            height="22"
            rx="2"
            fill="var(--color-leader)"
            opacity={i === fork.length - 1 ? 1 : 0.55}
          />
          <text x={n.x} y={FY - 30} textAnchor="middle" fontSize="10.5" fill="#f1e9dc" fontFamily="var(--font-plex-mono)">
            {n.label}
          </text>
          <text x={n.x} y={FY + 36} textAnchor="middle" fontSize="9.5" fill="var(--color-leader)" fontFamily="var(--font-plex-mono)">
            {n.sub}
          </text>
        </g>
      ))}
      <text x="40" y="282" fontSize="10" fill="#9a8f80" fontFamily="var(--font-plex-mono)" letterSpacing="1.5">
        MAIN ─── VARIANT-B
      </text>
    </svg>
  );
}

/** Decorative film frames for the running reel. Warm stocks, no real footage. */
const STOCKS = [
  ["#3a2a18", "#8a5a2b"],
  ["#1d2b33", "#4f7f8c"],
  ["#2e1d1b", "#b4503f"],
  ["#2a2a1c", "#a8943f"],
  ["#241c2b", "#7d5fa0"],
  ["#1c2b24", "#5f9e80"],
  ["#33241a", "#d98a45"],
];

function Reel() {
  const frames = [...STOCKS, ...STOCKS, ...STOCKS, ...STOCKS];
  const strip = (
    <div className="flex shrink-0 gap-2 pr-2">
      {frames.map(([a, b], i) => (
        <div key={i} className="relative h-[84px] w-[132px] shrink-0 overflow-hidden rounded-[4px]">
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${a}, ${b})` }} />
          <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/40 px-1.5 py-0.5 font-mono text-[8.5px] tracking-wider text-ink/70">
            <span>FK {String(5000 + i * 7)}</span>
            <span>{String((i % 24) + 1).padStart(2, "0")}A</span>
          </div>
        </div>
      ))}
    </div>
  );
  return (
    <div className="border-y border-edge bg-[#0f0c0a]" aria-hidden="true">
      <Perforations />
      <div className="overflow-hidden py-2">
        <div className="reel flex w-max">
          {strip}
          {strip}
        </div>
      </div>
      <Perforations />
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[11.5px] uppercase tracking-[.22em] text-leader">{children}</p>
  );
}

const FEATURES: { icon: ReactNode; title: string; body: string; code: string }[] = [
  {
    icon: <SplitIcon size={18} />,
    title: "A real editor, by hand",
    body: "Split, trim, reorder, change speed, add fades and punch-ins. Nothing is locked behind AI or an account.",
    code: "CUT",
  },
  {
    icon: <UndoIcon size={18} />,
    title: "Every change is a version",
    body: "Restore any earlier state instantly. Going back is itself undoable, so you can be wrong without losing anything.",
    code: "REWIND",
  },
  {
    icon: <BranchIcon size={18} />,
    title: "Fork a variant",
    body: "Try a tighter cut beside the first and switch between them. Like git branches, for video.",
    code: "FORK",
  },
  {
    icon: <KeyIcon size={18} />,
    title: "AI on your own key",
    body: "Optional. Paste a key from Anthropic, OpenAI, Gemini and more. It goes from your browser to the provider and nowhere else.",
    code: "ASK",
  },
  {
    icon: <CropIcon size={18} />,
    title: "Reframe for anywhere",
    body: "9:16, 1:1 or 4:5 in a click, with a focus point so the subject stays in frame.",
    code: "FRAME",
  },
  {
    icon: <ExportIcon size={18} />,
    title: "Export on your machine",
    body: "Encoded in the browser with WebCodecs, using the same renderer as the preview. What you watched is what you get.",
    code: "PRINT",
  },
];

const STEPS = [
  { n: "01", title: "Drop", body: "Drag in an MP4 or WebM. Forkcut reads the real frame rate and finds the silences while it imports." },
  { n: "02", title: "Cut", body: "Split, trim, fade and reframe on the timeline. Every change lands in the history as a version." },
  { n: "03", title: "Fork", body: "Branch a variant to try another cut. Switch back whenever you like. Then export the one you want." },
];

export default function Landing({ narrow = false }: { narrow?: boolean }) {
  return (
    <div className="landing relative h-dvh overflow-y-auto overflow-x-hidden scroll-smooth bg-shell text-ink">
      {/* Film grain over everything, very quiet. */}
      <div className="grain pointer-events-none fixed inset-0 z-40" aria-hidden="true" />

      {/* ── Nav ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-edge/70 bg-shell/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1120px] items-center gap-6 px-5">
          <Logo />
          <nav className="ml-6 hidden items-center gap-6 text-[13px] text-ink-2 md:flex">
            <a href="#features" className="transition-colors hover:text-ink">Features</a>
            <a href="#how" className="transition-colors hover:text-ink">How it works</a>
            <a href="#privacy" className="transition-colors hover:text-ink">Privacy</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <a
              href={SOURCE_URL}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Forkcut on GitHub. Free and open source."
              className="inline-flex h-9 items-center gap-2 rounded-ctl border border-edge px-3 text-[12.5px] text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
            >
              <GithubIcon size={14} />
              <span className="hidden sm:inline">Star on GitHub</span>
            </a>
            <a
              href="#start"
              className="inline-flex h-9 items-center rounded-ctl bg-leader px-3.5 text-[13px] font-medium text-black transition-[background-color,transform] hover:bg-leader-hi active:scale-[.97]"
            >
              Open editor
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ──────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          {/* A safelight glow, not a gradient blob. */}
          <div
            className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-[.18] blur-3xl"
            style={{ background: "radial-gradient(closest-side, var(--color-leader), transparent)" }}
            aria-hidden="true"
          />
          <div className="relative mx-auto grid max-w-[1120px] items-center gap-12 px-5 pb-20 pt-16 lg:grid-cols-[1.05fr_.95fr] lg:pt-24">
            <div>
              <div className="settle">
                <Eyebrow>Reel 01 · No sign-up · No upload</Eyebrow>
                <h1 className="mt-5 text-[44px] font-semibold leading-[1.02] tracking-[-.035em] text-balance sm:text-[60px]">
                  Cut it. <span className="text-leader">Fork it.</span>
                  <br />
                  Keep every take.
                </h1>
                <p className="mt-6 max-w-[50ch] text-[16px] leading-relaxed text-ink-2">
                  Forkcut is a video editor that runs in your browser and treats every edit like a
                  commit. Go back to any version, branch a variant, and let AI help on your own key
                  when you want it.
                </p>
              </div>
              <div className="settle mt-9 max-w-[520px]" style={{ animationDelay: "120ms" }}>
                <Gate narrow={narrow} />
                <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11.5px] text-ink-3">
                  {["Free & open source", "No account", "Footage stays local"].map((t) => (
                    <li key={t} className="inline-flex items-center gap-1.5">
                      <CheckIcon size={12} className="text-leader" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="settle relative" style={{ animationDelay: "200ms" }}>
              <div className="overflow-hidden rounded-panel border border-edge bg-panel shadow-[0_30px_80px_-30px_rgba(0,0,0,.9)]">
                <div className="flex items-center gap-2 border-b border-edge px-4 py-2.5 font-mono text-[11px] text-ink-3">
                  <span className="h-2 w-2 rounded-full bg-grease" />
                  <span className="h-2 w-2 rounded-full bg-leader" />
                  <span className="h-2 w-2 rounded-full bg-ink-3" />
                  <span className="ml-2 uppercase tracking-[.18em]">History · 2 variants</span>
                </div>
                <div className="p-4">
                  <ForkGraph />
                </div>
              </div>
              <p className="mt-3 text-center font-mono text-[11px] text-ink-3">
                Every edit, yours or the agent&rsquo;s, becomes a point you can return to.
              </p>
            </div>
          </div>
        </section>

        <Reel />

        {/* ── Stats ─────────────────────────────────────────── */}
        <section className="mx-auto max-w-[1120px] px-5 py-14">
          <dl className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              ["0", "accounts to create"],
              ["0", "bytes uploaded"],
              ["∞", "versions kept"],
              ["8", "AI providers, optional"],
            ].map(([n, label]) => (
              <div key={label} className="border-l border-leader/50 pl-4">
                <dt className="font-mono text-[34px] leading-none text-ink">{n}</dt>
                <dd className="mt-2 text-[13px] text-ink-3">{label}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Features ──────────────────────────────────────── */}
        <section id="features" className="mx-auto max-w-[1120px] scroll-mt-20 px-5 py-16">
          <Eyebrow>The cutting room</Eyebrow>
          <h2 className="mt-4 max-w-[22ch] text-[34px] font-semibold leading-[1.1] tracking-[-.03em] text-balance sm:text-[42px]">
            Everything a cut needs. Nothing it doesn&rsquo;t.
          </h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className="group relative overflow-hidden rounded-panel border border-edge bg-panel p-6 transition-colors duration-200 hover:border-leader/50 hover:bg-raised/60"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-ctl border border-edge bg-shell text-leader transition-colors group-hover:border-leader/50">
                    {f.icon}
                  </span>
                  <span className="font-mono text-[10.5px] tracking-[.22em] text-ink-3">{f.code}</span>
                </div>
                <h3 className="mt-5 text-[17px] font-semibold tracking-[-.015em]">{f.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────── */}
        <section id="how" className="scroll-mt-20 border-y border-edge bg-panel/60">
          <div className="mx-auto max-w-[1120px] px-5 py-20">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-4 max-w-[20ch] text-[34px] font-semibold leading-[1.1] tracking-[-.03em] text-balance sm:text-[42px]">
              Three frames from file to final.
            </h2>
            <ol className="mt-12 grid gap-5 md:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.n} className="overflow-hidden rounded-panel border border-edge bg-shell">
                  <Perforations />
                  <div className="p-6">
                    <span className="font-mono text-[44px] leading-none text-leader">{s.n}</span>
                    <h3 className="mt-4 text-[19px] font-semibold tracking-[-.015em]">{s.title}</h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{s.body}</p>
                  </div>
                  <Perforations />
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Ask / AI ──────────────────────────────────────── */}
        <section className="mx-auto grid max-w-[1120px] items-center gap-12 px-5 py-20 lg:grid-cols-2">
          <div>
            <Eyebrow>Ask, if you want to</Eyebrow>
            <h2 className="mt-4 text-[34px] font-semibold leading-[1.1] tracking-[-.03em] text-balance sm:text-[42px]">
              An assistant editor, not an autopilot.
            </h2>
            <p className="mt-5 max-w-[48ch] text-[15.5px] leading-relaxed text-ink-2">
              The editor is complete without it. Turn it on for the passes that are tedious by hand,
              and every move it makes is a version you can undo.
            </p>
            <ul className="mt-6 space-y-3 text-[14px] text-ink-2">
              {[
                "Uses the same tools you do, so it can do nothing you couldn\u2019t.",
                "Knows your playhead and selection, so \u201Csplit here\u201D just works.",
                "Your key stays in this browser and is never saved with a project.",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <CheckIcon size={16} className="mt-0.5 shrink-0 text-leader" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="overflow-hidden rounded-panel border border-edge bg-panel font-mono text-[12.5px] shadow-[0_30px_80px_-30px_rgba(0,0,0,.9)]">
            <div className="flex items-center gap-2 border-b border-edge px-4 py-2.5 text-[11px] uppercase tracking-[.18em] text-ink-3">
              <FadeTrackIcon size={13} className="text-leader" /> Ask
            </div>
            <div className="space-y-3 p-4 leading-relaxed">
              <p className="ml-auto w-fit max-w-[85%] rounded-ctl bg-raised px-3 py-2 text-ink">
                cut all the silences and fade out at the end
              </p>
              <p className="w-fit max-w-[90%] rounded-ctl border border-leader/30 bg-leader/[.07] px-3 py-2 text-ink-2">
                Closed 6 gaps (−4.0s) and added a 1.5s fade at the end. Saved as a new version.
              </p>
              <p className="ml-auto w-fit max-w-[85%] rounded-ctl bg-raised px-3 py-2 text-ink">
                undo that, then make it vertical
              </p>
              <p className="w-fit max-w-[90%] rounded-ctl border border-leader/30 bg-leader/[.07] px-3 py-2 text-ink-2">
                Restored the earlier version and reframed to 9:16.
              </p>
            </div>
          </div>
        </section>

        {/* ── Privacy ───────────────────────────────────────── */}
        <section id="privacy" className="scroll-mt-20 border-t border-edge bg-panel/60">
          <div className="mx-auto grid max-w-[1120px] items-center gap-12 px-5 py-20 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <Eyebrow>Private by construction</Eyebrow>
              <h2 className="mt-4 text-[34px] font-semibold leading-[1.1] tracking-[-.03em] text-balance sm:text-[42px]">
                There is no server to send it to.
              </h2>
              <p className="mt-5 max-w-[48ch] text-[15.5px] leading-relaxed text-ink-2">
                Your footage is written to browser-private storage on your own disk. Editing and
                export run on your machine, which is also why it is fast.
              </p>
            </div>
            <div className="overflow-hidden rounded-panel border border-edge bg-shell p-5 font-mono text-[12.5px] leading-[1.9] text-ink-2">
              <p><span className="text-ink-3">$</span> accounts <span className="text-leader">0</span></p>
              <p><span className="text-ink-3">$</span> uploads <span className="text-leader">0</span></p>
              <p><span className="text-ink-3">$</span> storage <span className="text-ink">browser-private (OPFS)</span></p>
              <p><span className="text-ink-3">$</span> render <span className="text-ink">WebCodecs, on-device</span></p>
              <p><span className="text-ink-3">$</span> keys <span className="text-ink">this browser → your provider</span></p>
              <p><span className="text-ink-3">$</span> license <span className="text-ink">MIT</span></p>
            </div>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute bottom-[-220px] left-1/2 h-[420px] w-[800px] -translate-x-1/2 rounded-full opacity-[.16] blur-3xl"
            style={{ background: "radial-gradient(closest-side, var(--color-leader), transparent)" }}
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-[760px] px-5 py-24 text-center">
            <h2 className="text-[40px] font-semibold leading-[1.05] tracking-[-.035em] text-balance sm:text-[54px]">
              Roll camera. <span className="text-leader">Fork the cut.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-[44ch] text-[16px] leading-relaxed text-ink-2">
              Free, open source, and ready as soon as you drop a clip in.
            </p>
            <div className="mt-8 flex justify-center">
              <a
                href="#start"
                className="inline-flex h-11 items-center rounded-ctl bg-leader px-6 text-[14px] font-medium text-black transition-[background-color,transform] hover:bg-leader-hi active:scale-[.97]"
              >
                Start editing
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-edge">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-x-6 gap-y-3 px-5 py-8 text-[12.5px] text-ink-3">
          <Logo />
          <span className="font-mono">Built by Kuntal Rathod · MIT licensed</span>
          <a
            href={SOURCE_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="ml-auto inline-flex items-center gap-2 transition-colors hover:text-ink"
          >
            <GithubIcon size={14} />
            Source on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
