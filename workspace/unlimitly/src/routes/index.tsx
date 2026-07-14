import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Zap,
  Sparkles,
  Shield,
  Infinity as InfinityIcon,
  Clock,
  Rocket,
  Star,
  Quote,
  Puzzle,
  Globe,
  TrendingUp,
  ChevronDown,
  Download,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Unlimitly by ProFlow Tools — Prompt Lovable Without Limits" },
      {
        name: "description",
        content:
          "The premium extension that unlocks unlimited prompts on Lovable — zero credits, zero limits. Custom pricing on WhatsApp.",
      },
    ],
  }),
});

const WHATSAPP_URL =
  "https://wa.me/923165852898?text=" +
  encodeURIComponent(
    "Hi ProFlow Tools! I'm interested in Unlimitly Pro. Could you share pricing and next steps?"
  );

/* ---------- primitives ---------- */

function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto mb-14 max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-butter/60 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-gold">
          <span className="h-1 w-1 rounded-full bg-gold" />
          {eyebrow}
        </div>
        <h2 className="mt-5 font-display text-4xl leading-[1.05] md:text-6xl">
          {title}
        </h2>
        {lead && (
          <div className="mx-auto mt-6 flex max-w-2xl flex-col items-center gap-3">
            <span aria-hidden className="h-px w-14 bg-gradient-to-r from-transparent via-gold to-transparent" />
            <p className="text-[15px] leading-relaxed text-espresso/75 md:text-base">
              {lead}
            </p>
          </div>
        )}
      </div>
      {children}
    </section>
  );
}

function Tile({
  children,
  className = "",
  tone = "paper",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "paper" | "sand" | "gold" | "ink";
}) {
  const tones = {
    paper: "bg-lavender border-espresso/10",
    sand: "bg-butter border-espresso/10",
    gold: "bg-gold text-espresso border-gold/60",
    ink: "bg-espresso text-cream border-espresso",
  } as const;
  return (
    <div
      className={`group relative overflow-hidden rounded-[2rem] border ${tones[tone]} p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(27,26,23,0.25)] ${className}`}
    >
      {children}
    </div>
  );
}

/* ---------- charts (pure SVG) ---------- */

function AreaChart() {
  const pts = [8, 22, 14, 34, 28, 46, 40, 58, 52, 68, 62, 82, 74, 92, 88];
  const w = 320,
    h = 120,
    step = w / (pts.length - 1);
  const max = 100;
  const coords = pts.map((v, i) => [i * step, h - (v / max) * (h - 10) - 4]);
  const path = coords
    .map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`))
    .join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full">
      <defs>
        <linearGradient id="ga" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1="0"
          x2={w}
          y1={(h / 4) * i + 4}
          y2={(h / 4) * i + 4}
          stroke="#1B1A17"
          strokeOpacity="0.06"
          strokeDasharray="2 4"
        />
      ))}
      <path d={area} fill="url(#ga)" />
      <path
        d={path}
        fill="none"
        stroke="#C9A84C"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === coords.length - 1 ? 4 : 2} fill="#1B1A17" />
      ))}
    </svg>
  );
}

function BarChart() {
  const bars = [42, 68, 55, 78, 60, 88, 72, 95];
  const labels = ["M", "T", "W", "T", "F", "S", "S", "M"];
  return (
    <div className="flex h-full items-end justify-between gap-2">
      {bars.map((v, i) => (
        <div key={i} className="flex h-full w-full flex-col items-center justify-end gap-1.5">
          <div
            className="w-full rounded-t-md bg-gradient-to-t from-gold to-gold-light transition-all duration-500 group-hover:from-espresso group-hover:to-espresso/70"
            style={{ height: `${v}%` }}
          />
          <span className="text-[10px] text-espresso/40">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

function Donut({ value = 78 }: { value?: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="relative h-32 w-32">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} stroke="#1B1A17" strokeOpacity="0.08" strokeWidth="10" fill="none" />
        <circle
          cx="60"
          cy="60"
          r={r}
          stroke="#C9A84C"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-display text-3xl italic-serif">{value}%</div>
          <div className="text-[10px] uppercase tracking-widest text-espresso/50">saved</div>
        </div>
      </div>
    </div>
  );
}

function Sparkline({ data, up = true }: { data: number[]; up?: boolean }) {
  const w = 120,
    h = 36;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  const stroke = up ? "#C9A84C" : "#1B1A17";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-9 w-full">
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- page ---------- */

function Landing() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i += 61;
      if (i >= 4287) {
        i = 4287;
        clearInterval(t);
      }
      setCount(i);
    }, 22);
    return () => clearInterval(t);
  }, []);

  const [openFaq, setOpenFaq] = useState(0);

  const tools = [
    "Landing pages",
    "Dashboards",
    "Auth flows",
    "Pricing tables",
    "Blog CMS",
    "Onboarding",
    "Dark mode",
    "Stripe checkout",
    "Emails",
    "Admin panels",
    "AI chatbots",
    "Cron jobs",
  ];

  const features = [
    { icon: InfinityIcon, title: "Truly unlimited", body: "Every prompt is free. No throttling, no soft caps, no fine print." },
    { icon: Zap, title: "Zero latency", body: "Ships as a background service worker. You won't feel it running." },
    { icon: Shield, title: "Private by default", body: "Runs locally in your browser. No prompts leave your machine." },
    { icon: Rocket, title: "One-click install", body: "Works on Chrome, Edge, Arc and Brave in under 60 seconds." },
    { icon: Puzzle, title: "Zero configuration", body: "Auto-detects your Lovable workspace. No API keys required." },
    { icon: Sparkles, title: "Free forever updates", body: "Every future release lands in your extension automatically." },
  ];

  const stats = [
    { label: "Active builders", value: "4,287", spark: [12, 18, 14, 22, 28, 24, 36, 42, 40, 52], up: true },
    { label: "Prompts today", value: "182K", spark: [40, 52, 46, 60, 68, 62, 78, 84, 80, 96], up: true },
    { label: "Avg. saved / mo", value: "$482", spark: [20, 24, 30, 28, 40, 44, 50, 58, 62, 70], up: true },
    { label: "Uptime", value: "99.99%", spark: [90, 92, 91, 94, 93, 95, 96, 95, 97, 98], up: true },
  ];

  const steps = [
    { n: "01", title: "Install", body: "Add Unlimitly to your browser from the ProFlow site." },
    { n: "02", title: "Sign in", body: "Open Lovable — Unlimitly links to your workspace automatically." },
    { n: "03", title: "Prompt", body: "Build anything. Every prompt is free, from now until forever." },
  ];

  const testimonials = [
    { name: "Amelia R.", role: "Indie founder", body: "I shipped three MVPs in a week. Unlimitly paid for itself by lunchtime on day one." },
    { name: "Karim H.", role: "Design engineer", body: "The best $ I've spent this year — and it wasn't a subscription. Truly a lifetime deal." },
    { name: "Priya S.", role: "Studio lead", body: "Our team stopped rationing prompts. Iteration went from careful to fearless overnight." },
  ];

  const compare = [
    { label: "Prompt limit", a: "Unlimited", b: "Metered credits" },
    { label: "Cost model", a: "One-time, negotiated", b: "Monthly subscription" },
    { label: "Setup time", a: "Under 60 seconds", b: "Account + billing + trial" },
    { label: "Future updates", a: "Included forever", b: "Tier-gated" },
    { label: "Data leaves browser", a: "Never", b: "Depends on plan" },
  ];

  const faqs = [
    { q: "How is this different from a paid Lovable plan?", a: "Unlimitly is a one-time deal negotiated on WhatsApp. No renewals, no tiers, no per-seat math. You keep the tool for life." },
    { q: "Why isn't the price on the site?", a: "We tailor pricing to your team size and use case. Say hi on WhatsApp and we'll send a fair number the same afternoon." },
    { q: "Which browsers are supported?", a: "Chromium browsers today: Chrome, Edge, Brave, Arc, Opera. Safari and Firefox builds are on the roadmap." },
    { q: "Will future updates cost extra?", a: "Never. Every release, big or small, ships to your extension automatically. Forever means forever." },
    { q: "Do you offer refunds?", a: "Yes — 14 days, no questions. If Unlimitly doesn't earn back what you paid in your first week, we don't want your money." },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-cream text-espresso">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20"
        style={{
          background:
            "radial-gradient(1000px 700px at 12% 0%, #F0D78C55, transparent 60%), radial-gradient(900px 700px at 100% 10%, #EFE5CEcc, transparent 60%), radial-gradient(1100px 800px at 50% 100%, #F5EEDDcc, transparent 60%), linear-gradient(180deg, #FBF8F1, #F5EEDD)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage: "radial-gradient(rgba(27,26,23,0.06) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* NAV */}
      <header className="mx-auto max-w-6xl px-4 pt-6">
        <div className="flex items-center justify-between rounded-full border border-espresso/10 bg-lavender/70 px-3 py-2 shadow-[0_10px_30px_-15px_rgba(27,26,23,0.15)] backdrop-blur">
          <a href="#" className="flex items-center gap-2.5 pl-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-gold">
              <div className="h-3 w-3 rotate-45 border-2 border-espresso" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-xl italic-serif text-espresso">Unlimitly</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-espresso/50">by ProFlow</span>
            </div>
          </a>
          <nav className="hidden items-center gap-7 text-sm text-espresso/70 md:flex">
            <a href="#features" className="transition hover:text-espresso">Features</a>
            <a href="#metrics" className="transition hover:text-espresso">Live metrics</a>
            <a href="#how" className="transition hover:text-espresso">How it works</a>
            <a href="#compare" className="transition hover:text-espresso">Compare</a>
            <a href="#pricing" className="transition hover:text-espresso">Pricing</a>
            <a href="#faq" className="transition hover:text-espresso">FAQ</a>
          </nav>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 rounded-full bg-espresso px-5 py-2.5 text-sm font-semibold text-cream shadow-lg shadow-espresso/25 transition hover:-translate-y-0.5 hover:bg-gold hover:text-espresso"
          >
            Get Pro
            <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-14 md:pt-20">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:grid-rows-[auto_auto_auto]">
          <Tile tone="paper" className="md:col-span-8 md:row-span-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-butter px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-gold">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
              v2.0 · lifetime deal live
            </span>
            <h1 className="mt-8 font-display text-[52px] leading-[0.98] md:text-[104px]">
              Prompt Lovable
              <br />
              <span className="italic-serif text-gradient">without limits.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-espresso/75">
              The premium extension that unlocks{" "}
              <span className="italic-serif text-gradient font-semibold">unlimited prompts</span> on Lovable —{" "}
              <span className="rounded-md bg-butter px-1.5 py-0.5 font-semibold text-espresso ring-1 ring-gold/30">
                zero credits deducted
              </span>
              , ever. <span className="italic-serif text-espresso">Iterate fearlessly.</span>{" "}
              <span className="italic-serif text-gold">Ship relentlessly.</span>
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-2xl bg-espresso px-7 py-4 text-sm font-bold uppercase tracking-wider text-cream shadow-[0_18px_45px_-12px_rgba(27,26,23,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_55px_-10px_rgba(27,26,23,0.65)]"
              >
                Talk pricing on WhatsApp
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </a>
              <Link
                to="/extension"
                className="group inline-flex items-center gap-2 rounded-2xl border border-gold/50 bg-gold px-6 py-4 text-sm font-bold uppercase tracking-wider text-espresso shadow-[0_16px_40px_-18px_rgba(201,168,76,0.65)] transition hover:-translate-y-0.5 hover:bg-gold-light"
              >
                Download extension
                <Download className="h-4 w-4 transition group-hover:translate-y-0.5" />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-2 rounded-2xl border border-espresso/20 bg-butter px-6 py-4 text-sm font-semibold text-espresso transition hover:-translate-y-0.5 hover:border-gold hover:text-gold"
              >
                See how it works
              </a>
            </div>
            <div className="mt-8 flex items-center gap-6 text-xs text-espresso/60">
              <div className="flex -space-x-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-7 w-7 rounded-full border-2 border-lavender bg-gradient-to-br from-gold-light to-gold" />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-gold">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-3 w-3 fill-gold" />
                  ))}
                </div>
                <span>4,287 builders shipping without limits</span>
              </div>
            </div>
          </Tile>

          <Tile tone="ink" className="md:col-span-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-gold">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
              live now
            </div>
            <div className="mt-8">
              <div className="text-[11px] uppercase tracking-[0.2em] text-cream/50">Prompts today</div>
              <div className="mt-1 font-display text-6xl italic-serif tabular-nums text-cream">
                {count.toLocaleString()}
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-gold-light">
                <TrendingUp className="h-3.5 w-3.5" /> 0.00 credits used · ever
              </div>
            </div>
            <div className="mt-6 h-20">
              <BarChart />
            </div>
          </Tile>

          <Tile tone="gold" className="md:col-span-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-espresso/70">Cost saved</div>
                <div className="mt-2 font-display text-3xl italic-serif">vs. metered plans</div>
              </div>
              <Donut value={78} />
            </div>
          </Tile>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="border-y border-espresso/10 bg-butter/60 py-5 backdrop-blur">
        <div className="text-center text-[11px] uppercase tracking-[0.25em] text-espresso/50">
          Ship anything on Lovable — no credit anxiety
        </div>
        <div className="mt-4 flex overflow-hidden">
          <div className="flex shrink-0 items-center gap-3 pr-3 animate-marquee">
            {[...tools, ...tools, ...tools].map((t, i) => (
              <span
                key={i}
                className="whitespace-nowrap rounded-full border border-espresso/10 bg-lavender/80 px-4 py-1.5 text-sm text-espresso/70"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* METRICS */}
      <Section
        id="metrics"
        eyebrow="Live metrics"
        title={<>Numbers that quietly compound <span className="italic-serif text-gold">every day.</span></>}
        lead={<>Instrumented <span className="italic-serif text-gold">end-to-end</span>. Here&apos;s what the network <span className="rounded bg-butter px-1.5 py-0.5 ring-1 ring-gold/25">looked like this morning</span>.</>}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Tile key={s.label} tone="paper" className="p-6">
              <div className="text-[11px] uppercase tracking-[0.2em] text-espresso/50">{s.label}</div>
              <div className="mt-2 font-display text-4xl italic-serif">{s.value}</div>
              <div className="mt-4"><Sparkline data={s.spark} up={s.up} /></div>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-gold">
                <TrendingUp className="h-3 w-3" /> +12.4% wow
              </div>
            </Tile>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Tile tone="paper" className="md:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-espresso/50">Prompts unlocked · last 15 days</div>
                <div className="mt-2 font-display text-3xl italic-serif">1.24M and climbing</div>
              </div>
              <div className="rounded-full border border-gold/40 bg-butter px-3 py-1 text-[11px] font-medium text-gold">+42% mom</div>
            </div>
            <div className="mt-6 h-40"><AreaChart /></div>
          </Tile>

          <Tile tone="ink" className="flex flex-col justify-between">
            <div>
              <Quote className="h-8 w-8 text-gold" />
              <p className="mt-4 font-display text-2xl italic-serif leading-snug text-cream">
                "The moment we removed the credit meter, our roadmap doubled."
              </p>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gold-light to-gold" />
              <div>
                <div className="text-sm text-cream">Nadia Okafor</div>
                <div className="text-[11px] uppercase tracking-widest text-cream/50">Head of Product · Northwind</div>
              </div>
            </div>
          </Tile>
        </div>
      </Section>

      {/* FEATURES */}
      <Section
        id="features"
        eyebrow="Features"
        title={<>Quiet on the surface. <span className="italic-serif text-gold">Loud where it counts.</span></>}
        lead={<><span className="italic-serif text-gold">Six deliberate features</span> that get out of your way. <span className="text-espresso">No dashboards</span> to babysit.</>}
      >
        <div className="grid gap-4 md:grid-cols-12">
          {features.map((f, i) => {
            const Icon = f.icon;
            const span = i === 0 ? "md:col-span-6" : i === 3 ? "md:col-span-6" : "md:col-span-4";
            return (
              <Tile key={f.title} tone={i === 0 ? "gold" : "paper"} className={span}>
                <div className={`grid h-12 w-12 place-items-center rounded-2xl ${i === 0 ? "bg-espresso text-gold" : "bg-butter text-gold"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-6 font-display text-2xl italic-serif">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-espresso/70">{f.body}</p>
                {i === 0 && (
                  <div className="mt-6 flex items-center gap-2 text-xs font-medium text-espresso/70">
                    <InfinityIcon className="h-4 w-4" /> unlimited · unmetered · unbothered
                  </div>
                )}
              </Tile>
            );
          })}
        </div>
      </Section>

      {/* HOW */}
      <Section
        id="how"
        eyebrow="How it works"
        title={<>From install to unlimited <span className="italic-serif text-gold">in three steps.</span></>}
      >
        <div className="relative grid gap-4 md:grid-cols-3">
          <div
            aria-hidden
            className="pointer-events-none absolute left-8 right-8 top-14 hidden h-px md:block"
            style={{ background: "repeating-linear-gradient(90deg, #C9A84C 0 6px, transparent 6px 12px)" }}
          />
          {steps.map((s) => (
            <Tile key={s.n} tone="paper" className="relative">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-espresso text-sm font-semibold text-gold">{s.n}</div>
                <div className="h-px flex-1 bg-espresso/10" />
                <Clock className="h-4 w-4 text-espresso/40" />
              </div>
              <h3 className="mt-6 font-display text-3xl italic-serif">{s.title}</h3>
              <p className="mt-2 text-sm text-espresso/70">{s.body}</p>
            </Tile>
          ))}
        </div>
      </Section>

      {/* ECOSYSTEM */}
      <Section
        eyebrow="Ecosystem"
        title={<>Plays nicely with <span className="italic-serif text-gold">every stack you ship.</span></>}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Tile tone="paper" className="md:col-span-2">
            <div className="text-[11px] uppercase tracking-[0.2em] text-espresso/50">Supported surfaces</div>
            <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {["Chrome", "Edge", "Brave", "Arc", "Opera", "Vivaldi", "Chromium", "Kiwi"].map((b) => (
                <div key={b} className="flex items-center gap-2 rounded-xl border border-espresso/10 bg-butter/70 px-3 py-3 text-sm">
                  <Globe className="h-4 w-4 text-gold" />
                  {b}
                </div>
              ))}
            </div>
          </Tile>

          <Tile tone="ink">
            <div className="text-[11px] uppercase tracking-[0.2em] text-gold">Rollout progress</div>
            <div className="mt-6 space-y-4">
              {[["Chromium browsers", 100], ["Firefox beta", 62], ["Safari (macOS)", 28]].map(([label, pct]) => (
                <div key={label as string}>
                  <div className="flex justify-between text-xs text-cream/70">
                    <span>{label}</span>
                    <span className="text-gold-light">{pct}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Tile>
        </div>
      </Section>

      {/* COMPARE */}
      <Section
        id="compare"
        eyebrow="Head to head"
        title={<>Unlimitly vs. <span className="italic-serif text-gold">the meter.</span></>}
      >
        <Tile tone="paper" className="p-0">
          <div className="grid grid-cols-3 border-b border-espresso/10 text-[11px] uppercase tracking-[0.2em] text-espresso/50">
            <div className="p-5" />
            <div className="border-l border-espresso/10 p-5 text-gold">Unlimitly</div>
            <div className="border-l border-espresso/10 p-5">Metered plans</div>
          </div>
          {compare.map((row, i) => (
            <div key={row.label} className={`grid grid-cols-3 ${i !== compare.length - 1 ? "border-b border-espresso/10" : ""}`}>
              <div className="p-5 text-sm font-medium text-espresso">{row.label}</div>
              <div className="flex items-center gap-2 border-l border-espresso/10 p-5 text-sm text-espresso">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-gold text-espresso">
                  <Check className="h-3 w-3" />
                </span>
                {row.a}
              </div>
              <div className="border-l border-espresso/10 p-5 text-sm text-espresso/60">{row.b}</div>
            </div>
          ))}
        </Tile>
      </Section>

      {/* TESTIMONIALS */}
      <Section
        eyebrow="Loved by builders"
        title={<>Kind words from <span className="italic-serif text-gold">shipping people.</span></>}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Tile key={t.name} tone={i === 1 ? "gold" : "paper"}>
              <div className="flex items-center gap-1 text-gold">
                {[0, 1, 2, 3, 4].map((s) => (
                  <Star key={s} className="h-3.5 w-3.5 fill-gold" />
                ))}
              </div>
              <p className="mt-4 font-display text-xl italic-serif leading-snug">"{t.body}"</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gold-light to-espresso" />
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-[11px] uppercase tracking-widest text-espresso/60">{t.role}</div>
                </div>
              </div>
            </Tile>
          ))}
        </div>
      </Section>

      {/* PRICING */}
      <Section
        id="pricing"
        eyebrow="Pricing"
        title={<>One conversation. <span className="italic-serif text-gold">One payment.</span> Forever yours.</>}
        lead={<><span className="italic-serif text-gold">No sticker price.</span> We tailor every deal to your team size &amp; use case — <span className="rounded bg-butter px-1.5 py-0.5 font-semibold text-espresso ring-1 ring-gold/30">most builders hear back within 15 minutes</span>.</>}
      >
        <div className="mx-auto max-w-4xl">
          <div
            className="relative overflow-hidden rounded-[2.5rem] p-1 shadow-[0_40px_80px_-30px_rgba(27,26,23,0.35)]"
            style={{ background: "conic-gradient(from 140deg, #C9A84C, #F0D78C, #1B1A17, #C9A84C)" }}
          >
            <div className="relative rounded-[calc(2.5rem-4px)] bg-lavender p-10 md:p-12">
              <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gold-light/30 blur-3xl" />

              <div className="relative grid gap-8 md:grid-cols-2">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-butter px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-gold">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                    Lifetime · negotiated
                  </div>
                  <div className="mt-6 font-display text-5xl md:text-6xl">
                    Unlimitly <span className="italic-serif text-gold">Pro</span>
                  </div>
                  <div className="mt-6 flex flex-wrap items-baseline gap-3">
                    <div className="font-display text-5xl italic-serif leading-none">Let's talk</div>
                    <div className="rounded-full bg-gold/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-espresso">
                      Custom pricing
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-espresso/70">
                    Message us on WhatsApp — we'll send a fair one-time number the same afternoon. Every future update, free forever.
                  </p>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-espresso px-6 py-5 text-base font-bold uppercase tracking-wider text-cream shadow-[0_22px_55px_-12px_rgba(27,26,23,0.5)] transition hover:-translate-y-0.5 hover:bg-gold hover:text-espresso"
                  >
                    Talk pricing on WhatsApp
                    <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </a>
                  <p className="mt-3 text-center text-[11px] text-espresso/50">
                    +92 316 5852898 · replies in ~15 min
                  </p>
                </div>

                <div className="grid gap-3">
                  {[
                    "Truly unlimited prompts",
                    "Zero credits deducted, ever",
                    "Chrome · Edge · Arc · Brave",
                    "Every future update — free",
                    "Priority WhatsApp support",
                    "Works on every project",
                    "14-day refund, no questions",
                    "Onboarding call included",
                  ].map((x) => (
                    <div key={x} className="flex items-center gap-3 rounded-2xl border border-espresso/10 bg-butter/70 px-4 py-3 text-sm">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold text-espresso">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      {x}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section
        id="faq"
        eyebrow="Questions"
        title={<>Everything you'd want to <span className="italic-serif text-gold">ask us first.</span></>}
      >
        <div className="mx-auto max-w-3xl divide-y divide-espresso/10 overflow-hidden rounded-[2rem] border border-espresso/10 bg-lavender">
          {faqs.map((f, i) => {
            const open = openFaq === i;
            return (
              <button
                key={f.q}
                onClick={() => setOpenFaq(open ? -1 : i)}
                className="block w-full px-6 py-5 text-left transition hover:bg-butter/50"
              >
                <div className="flex items-center justify-between gap-6">
                  <span className="font-display text-lg md:text-xl">{f.q}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-gold transition-transform ${open ? "rotate-180" : ""}`} />
                </div>
                <div className={`grid overflow-hidden transition-all duration-300 ${open ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="min-h-0 text-sm text-espresso/70">{f.a}</div>
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div
          className="relative overflow-hidden rounded-[2.5rem] bg-espresso p-10 text-cream md:p-16"
          style={{
            backgroundImage:
              "radial-gradient(600px 400px at 10% 0%, rgba(201,168,76,0.35), transparent 60%), radial-gradient(500px 300px at 90% 100%, rgba(240,215,140,0.25), transparent 60%)",
          }}
        >
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-espresso/60 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-gold">
                Ready when you are
              </div>
              <h3 className="mt-5 font-display text-4xl leading-[1.05] md:text-6xl">
                Stop watching the meter. <span className="italic-serif text-gold">Start shipping.</span>
              </h3>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-end">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-2xl bg-gold px-7 py-4 text-sm font-bold uppercase tracking-wider text-espresso transition hover:-translate-y-0.5 hover:bg-gold-light"
              >
                Get Unlimitly Pro
                <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
              <span className="text-xs text-cream/60">
                One-time · lifetime updates · WhatsApp us to negotiate
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-espresso/10 bg-butter/50">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <nav
            aria-label="Sections"
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-espresso/70"
          >
            {[
              { href: "#metrics", label: "Metrics" },
              { href: "#features", label: "Features" },
              { href: "#how", label: "How it works" },
              { href: "#compare", label: "Compare" },
              { href: "#pricing", label: "Pricing" },
              { href: "#faq", label: "FAQ" },
            ].map((l) => (
              <a key={l.href} href={l.href} className="transition hover:text-gold">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mx-auto mt-6 h-px w-24 bg-gradient-to-r from-transparent via-gold to-transparent" />
          <div className="mt-5 flex flex-col items-center justify-center gap-1 text-[10px] uppercase tracking-[0.22em] text-espresso/50">
            <span>© 2026 Unlimitly · ProFlow Tools</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
