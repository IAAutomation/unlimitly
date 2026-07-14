import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/extension")({
  head: () => ({
    meta: [
      { title: "Unlimitly — Download the Extension" },
      {
        name: "description",
        content:
          "Download the Unlimitly Chrome extension — a single zip with everything you need. Load it unpacked in 60 seconds.",
      },
      { property: "og:title", content: "Unlimitly — Download the Extension" },
      {
        property: "og:description",
        content: "One zip. Unlimited Lovable. Zero credits.",
      },
    ],
  }),
  component: ExtensionDownloadPage,
});

function ExtensionDownloadPage() {
  const ZIP_URL = "/api/public/download-extension";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[color:var(--color-cream)] text-[color:var(--color-espresso)]">
      {/* Ambient gold blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-[color:var(--color-gold)]/15 blur-3xl animate-blob" />
        <div
          className="absolute top-1/3 -right-32 h-[460px] w-[460px] rounded-full bg-[color:var(--color-apricot)]/25 blur-3xl animate-blob"
          style={{ animationDelay: "3s" }}
        />
        <div
          className="absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full bg-[color:var(--color-butter)]/50 blur-3xl animate-blob"
          style={{ animationDelay: "6s" }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-16 md:py-24">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[color:var(--color-muted-ink)] hover:text-[color:var(--color-gold)] transition-colors"
        >
          ← Back to home
        </a>

        {/* HERO */}
        <section className="mt-10 flex flex-col items-center text-center animate-rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-gold)]/40 bg-white/60 px-4 py-1.5 text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-gold)] shadow-sm backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-gold)] animate-pulse" />
            Chrome extension · v1.1.7 · one zip
          </span>

          <h1 className="mt-6 font-display text-6xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight">
            Install <span className="italic-serif text-gradient">Unlimitly</span>
            <br />
            in 60 seconds.
          </h1>

          <p className="mt-6 max-w-xl text-base md:text-lg text-[color:var(--color-muted-ink)] leading-relaxed">
            Everything ships in a single, signed zip — manifest, side panel,
            license guard, and hardened build. No accounts. No plugins.
            Just unpack and load.
          </p>

          {/* Primary download */}
          <a
            href={ZIP_URL}
            download="unlimitly-extension.zip"
            className="group relative mt-10 inline-flex items-center gap-3 rounded-full bg-[color:var(--color-espresso)] px-10 py-5 text-base font-medium text-[color:var(--color-cream)] shadow-[0_20px_60px_-20px_rgba(201,168,76,0.55)] transition-all hover:scale-[1.02] hover:bg-[color:var(--color-gold)] hover:text-[color:var(--color-espresso)]"
          >
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[color:var(--color-gold)]/0 via-[color:var(--color-gold)]/30 to-[color:var(--color-gold)]/0 opacity-0 transition-opacity group-hover:opacity-100" />
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="relative"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span className="relative">Download unlimitly-extension.zip</span>
          </a>

          <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)]">
            ~862 KB · Manifest V3 · works in Chrome, Edge, Brave, Arc, Opera
          </p>

          <a
            href="https://unlimitly.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-gold)]/50 bg-white/60 px-6 py-3 text-sm font-medium text-[color:var(--color-espresso)] backdrop-blur transition-all hover:bg-[color:var(--color-gold)] hover:text-[color:var(--color-espresso)]"
          >
            Open Dashboard ↗
          </a>
        </section>

        {/* WHAT'S INSIDE */}
        <section className="mt-24">
          <h2 className="mb-8 text-center font-display italic-serif text-4xl">
            What's in the zip
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { g: "M", t: "Manifest", s: "V3 spec" },
              { g: "S", t: "Side panel", s: "UI + logic" },
              { g: "L", t: "License guard", s: "hardware-bound" },
              { g: "H", t: "Hardened", s: "obfuscated build" },
            ].map((c) => (
              <div
                key={c.t}
                className="group rounded-2xl border border-[color:var(--color-gold)]/25 bg-white/60 p-5 backdrop-blur transition-all hover:-translate-y-1 hover:border-[color:var(--color-gold)] hover:shadow-[0_16px_40px_-16px_rgba(201,168,76,0.4)]"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[color:var(--color-gold)] to-[color:var(--color-apricot)] font-display italic-serif text-xl text-[color:var(--color-espresso)] shadow-inner">
                  {c.g}
                </div>
                <div className="font-medium text-sm text-[color:var(--color-espresso)]">
                  {c.t}
                </div>
                <div className="text-xs text-[color:var(--color-muted-ink)] mt-0.5">
                  {c.s}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* INSTALL STEPS */}
        <section className="mt-24">
          <div className="mx-auto max-w-3xl rounded-3xl border border-[color:var(--color-gold)]/30 bg-white/70 p-8 md:p-12 backdrop-blur-md shadow-[0_30px_80px_-40px_rgba(27,26,23,0.25)]">
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-gold)]">
                Install
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-[color:var(--color-gold)]/40 to-transparent" />
            </div>
            <h2 className="mt-3 font-display italic-serif text-4xl md:text-5xl">
              Five taps. Done.
            </h2>

            <ol className="mt-10 space-y-6">
              {[
                {
                  t: "Download & unzip",
                  s: "Extract unlimitly-extension.zip anywhere on your machine.",
                },
                {
                  t: "Open chrome://extensions",
                  s: "Paste into your address bar (works in Chrome, Edge, Brave, Arc, Opera).",
                },
                {
                  t: "Enable Developer mode",
                  s: "Toggle in the top-right corner.",
                },
                {
                  t: "Click 'Load unpacked'",
                  s: "Select the unzipped folder — that's the whole install.",
                },
                {
                  t: "Open lovable.dev",
                  s: "Unlimitly's side panel appears in the toolbar. Sign in and go.",
                },
              ].map((step, i) => (
                <li key={i} className="group flex gap-5 items-start">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--color-espresso)] font-display italic-serif text-2xl text-[color:var(--color-gold)] transition-all group-hover:bg-[color:var(--color-gold)] group-hover:text-[color:var(--color-espresso)]">
                    {i + 1}
                  </span>
                  <div className="pt-1.5">
                    <div className="text-base font-medium text-[color:var(--color-espresso)]">
                      {step.t}
                    </div>
                    <div className="text-sm text-[color:var(--color-muted-ink)] mt-1 leading-relaxed">
                      {step.s}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="mt-24 flex flex-col items-center text-center">
          <p className="font-display italic-serif text-3xl text-[color:var(--color-espresso)]">
            Ready when you are.
          </p>
          <a
            href={ZIP_URL}
            download="unlimitly-extension.zip"
            className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-[color:var(--color-espresso)] bg-transparent px-8 py-4 text-sm font-medium text-[color:var(--color-espresso)] transition-all hover:bg-[color:var(--color-espresso)] hover:text-[color:var(--color-cream)]"
          >
            ⬇ Grab the zip
          </a>
          <a
            href="/"
            className="mt-6 text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-ink)] hover:text-[color:var(--color-gold)] transition-colors"
          >
            ← Back to landing
          </a>
        </section>
      </div>
    </main>
  );
}
