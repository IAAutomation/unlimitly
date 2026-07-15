"use client";

import { useEffect, useState, useCallback } from "react";
import { getUnlSupabase } from "@/lib/unl-supabase";
import { Copy, Check, KeyRound, TrendingUp, Wallet, Download, FileText, Loader2, Sparkles, Layers } from "lucide-react";

type KeyRow = {
  key: string;
  duration_type: string;
  status: string;
  device_fingerprint: string | null;
  activated_at: string | null;
  expires_at: string | null;
  client_name: string | null;
  created_at: string;
  batch_id?: string | null;
};

type ResellerInfo = { id: string; quota: number; keys_created: number; disabled: boolean };

type BatchRow = {
  batch_id: string;
  batch_size: number;
  batch_label: string;
  duration_type: string;
  created_at: string;
  active_count: number;
  unused_count: number;
  revoked_count: number;
};

/* ---------- copy hook ---------- */
function useCopy() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copy = useCallback(async (text: string, id: string) => {
    try { await navigator.clipboard.writeText(text); } catch {
      const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
    }
    setCopiedKey(id); setTimeout(() => setCopiedKey(null), 1400);
  }, []);
  return { copiedKey, copy };
}

function CopyButton({ value, id }: { value: string; id: string }) {
  const { copiedKey, copy } = useCopy();
  const isCopied = copiedKey === id;
  return (
    <button onClick={() => copy(value, id)} title={isCopied ? "Copied!" : "Copy key"}
      className={`grid h-7 w-7 place-items-center rounded-md border transition ${isCopied ? "border-emerald-300 bg-emerald-50 text-emerald-600" : "border-neutral-200 bg-white text-neutral-500 hover:border-neutral-400 hover:text-neutral-900"}`}>
      {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

/* ---------- download batch .txt ---------- */
async function downloadBatchTxt(supabase: ReturnType<typeof getUnlSupabase>, batch: BatchRow, resellerEmail: string) {
  const { data, error } = await supabase.rpc("unl_get_batch_keys", { p_batch_id: batch.batch_id });
  if (error) return alert(error.message);
  const rows = (data as any[]) || [];
  const lines = rows.map((r) => r.key);
  const header = [
    `# Unlimitly License Keys — Bulk Batch`,
    `# Reseller: ${resellerEmail}`,
    `# Label: ${batch.batch_label}`,
    `# Duration: ${batch.duration_type}`,
    `# Total keys: ${batch.batch_size}`,
    `# Active: ${batch.active_count} · Unused: ${batch.unused_count} · Revoked: ${batch.revoked_count}`,
    `# Generated: ${new Date().toISOString()}`,
    ``,
    ...lines,
    ``,
  ].join("\n");
  const blob = new Blob([header], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const stamp = new Date(batch.created_at).toISOString().slice(0, 10);
  const safeEmail = resellerEmail.replace(/[^a-zA-Z0-9@._-]/g, "_");
  a.download = `unlimitly-batch-${safeEmail}-${stamp}.txt`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

/* ---------- batch card ---------- */
function BatchCard({ batch, supabase, resellerEmail }: { batch: BatchRow; supabase: ReturnType<typeof getUnlSupabase>; resellerEmail: string }) {
  const [expanded, setExpanded] = useState(false);
  const [keys, setKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { copiedKey, copy } = useCopy();

  async function toggleExpand() {
    if (expanded) { setExpanded(false); return; }
    if (keys.length === 0) {
      setLoading(true);
      const { data, error } = await supabase.rpc("unl_get_batch_keys", { p_batch_id: batch.batch_id });
      setLoading(false);
      if (error) return alert(error.message);
      setKeys(((data as any[]) || []).map((r) => r.key));
    }
    setExpanded(true);
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 transition hover:border-amber-300">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-100 text-amber-700"><Layers className="h-5 w-5" /></div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-900">{batch.batch_label}</span>
              <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">BULK</span>
            </div>
            <div className="mt-0.5 text-[11px] text-neutral-500">{batch.batch_size} keys · {batch.duration_type} · {new Date(batch.created_at).toLocaleString()}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 text-[10px]">
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700">{batch.active_count} active</span>
            <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-neutral-600">{batch.unused_count} unused</span>
            {batch.revoked_count > 0 && <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-700">{batch.revoked_count} revoked</span>}
          </div>
          <button onClick={() => downloadBatchTxt(supabase, batch, resellerEmail)} className="inline-flex items-center gap-1.5 rounded-md border border-neutral-900 bg-neutral-900 px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-neutral-700">
            <Download className="h-3 w-3" /> .txt
          </button>
          <button onClick={toggleExpand} disabled={loading} className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-neutral-700 transition hover:bg-neutral-50">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : expanded ? "Hide" : "View"}
          </button>
        </div>
      </div>
      {expanded && keys.length > 0 && (
        <div className="mt-3 max-h-48 overflow-y-auto rounded-md border border-neutral-200 bg-white">
          <table className="w-full text-left text-xs">
            <tbody>
              {keys.map((k, i) => (
                <tr key={k} className="border-b border-neutral-50 last:border-0 hover:bg-amber-50/40">
                  <td className="w-10 px-3 py-1.5 text-neutral-400">{i + 1}</td>
                  <td className="px-3 py-1.5"><code className="font-mono text-[11px] tracking-tight text-neutral-800">{k}</code></td>
                  <td className="w-10 px-3 py-1.5 text-right">
                    <button onClick={() => copy(k, `r-batch-${k}`)} title="Copy" className={`grid h-6 w-6 place-items-center rounded border transition ${copiedKey === `r-batch-${k}` ? "border-emerald-300 bg-emerald-50 text-emerald-600" : "border-neutral-200 text-neutral-500 hover:text-neutral-900"}`}>
                      {copiedKey === `r-batch-${k}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ResellerPage() {
  const supabase = getUnlSupabase();
  const [session, setSession] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [isReseller, setIsReseller] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) await verify(data.session.user.id);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s);
      if (s) await verify(s.user.id);
      else setIsReseller(false);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  async function verify(userId: string) {
    const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "reseller" });
    setIsReseller(!error && data === true);
  }

  if (checking) return <Shell><p className="text-sm text-neutral-500">Checking session…</p></Shell>;
  if (!session) return <LoginForm supabase={supabase} />;
  if (!isReseller) return (
    <Shell>
      <p className="text-sm text-red-600">This account is not a reseller.</p>
      <button onClick={() => supabase.auth.signOut()} className="mt-3 rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100">Sign out</button>
    </Shell>
  );
  return <ResellerDashboard supabase={supabase} email={session.user.email} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#FBF7EC] px-6 py-10 font-sans text-neutral-900"><div className="mx-auto max-w-6xl">{children}</div></div>;
}

function LoginForm({ supabase }: { supabase: ReturnType<typeof getUnlSupabase> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setErr(error.message);
  }
  return (
    <Shell>
      <div className="mx-auto max-w-sm">
        <h1 className="mb-1 font-serif text-3xl italic" style={{ fontFamily: "'Instrument Serif', serif" }}>Reseller Console</h1>
        <p className="mb-6 text-sm text-neutral-500">Sign in to your reseller account.</p>
        <form onSubmit={submit} className="space-y-3">
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900" />
          <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900" />
          {err && <p className="text-xs text-red-600">{err}</p>}
          <button disabled={busy} className="w-full rounded-md bg-neutral-900 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50">{busy ? "Signing in…" : "Sign in"}</button>
        </form>
      </div>
    </Shell>
  );
}

function ResellerDashboard({ supabase, email }: { supabase: ReturnType<typeof getUnlSupabase>; email: string }) {
  const [me, setMe] = useState<ResellerInfo | null>(null);
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [duration, setDuration] = useState<"1m" | "3m" | "6m" | "1y">("1m");
  const [clientName, setClientName] = useState("");
  const [creating, setCreating] = useState(false);

  // Bulk create form
  const [bulkDuration, setBulkDuration] = useState<"1m" | "3m" | "6m" | "1y" | "lifetime">("1m");
  const [bulkCount, setBulkCount] = useState(50);
  const [bulkPrefix, setBulkPrefix] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkErr, setBulkErr] = useState<string | null>(null);

  async function load() {
    setLoading(true); setErr(null);
    const [k, m, b] = await Promise.all([
      supabase.rpc("unl_reseller_list_keys"),
      supabase.rpc("unl_reseller_me"),
      supabase.rpc("unl_reseller_list_bulk_batches"),
    ]);
    if (k.error) setErr(k.error.message);
    else setKeys((k.data as KeyRow[]) || []);
    if (!m.error) {
      const row = Array.isArray(m.data) ? m.data[0] : m.data;
      if (row) setMe(row as ResellerInfo);
    }
    if (!b.error) setBatches((b.data as BatchRow[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2400); }

  async function createKey() {
    setCreating(true);
    const { data, error } = await supabase.rpc("unl_reseller_create_key", { p_duration: duration, p_client_name: clientName || null });
    setCreating(false);
    if (error) return alert(error.message);
    const newKey = Array.isArray(data) ? data[0]?.key : (data as any)?.key || data;
    try { await navigator.clipboard.writeText(String(newKey)); flash("Key created & copied: " + newKey); } catch { flash("Key created: " + newKey); }
    setClientName(""); load();
  }

  async function createBulkKeys() {
    setBulkBusy(true); setBulkErr(null);
    if (bulkCount < 1 || bulkCount > 1000) { setBulkErr("Count must be between 1 and 1000."); setBulkBusy(false); return; }
    const { data, error } = await supabase.rpc("unl_reseller_create_bulk_keys", { p_duration: bulkDuration, p_count: bulkCount, p_client_prefix: bulkPrefix || null });
    setBulkBusy(false);
    if (error) { setBulkErr(error.message); return; }
    const rows = Array.isArray(data) ? data : [];
    const newKeys = rows.map((r: any) => r.key).filter(Boolean);
    if (newKeys.length > 0) {
      const stamp = new Date().toISOString().slice(0, 10);
      const safeEmail = email.replace(/[^a-zA-Z0-9@._-]/g, "_");
      const text = newKeys.join("\n") + "\n";
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `unlimitly-bulk-${safeEmail}-${stamp}.txt`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 500);
    }
    flash(`${newKeys.length} bulk keys created — .txt downloaded`);
    setBulkPrefix(""); load();
  }

  async function resetBinding(k: string) {
    if (!confirm("Reset device binding for " + k + " ?")) return;
    const { error } = await supabase.rpc("unl_reseller_reset_binding", { p_key: k });
    if (error) return alert(error.message);
    flash("Binding reset"); load();
  }

  async function revokeKey(k: string) {
    if (!confirm("Revoke " + k + " ?\n\nThis will immediately disable the extension for that client.")) return;
    const { error } = await supabase.rpc("unl_reseller_revoke_key", { p_key: k });
    if (error) return alert(error.message);
    flash("Key revoked"); load();
  }

  const remaining = me ? Math.max(0, me.quota - me.keys_created) : null;
  const activeCount = keys.filter((k) => k.status === "active").length;
  const unusedCount = keys.filter((k) => k.status === "unused").length;

  return (
    <Shell>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl italic" style={{ fontFamily: "'Instrument Serif', serif" }}>Reseller Console</h1>
          <p className="text-xs text-neutral-500">Signed in as {email}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-100">Refresh</button>
          <button onClick={() => supabase.auth.signOut()} className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-100">Sign out</button>
        </div>
      </header>

      {toast && <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{toast}</div>}
      {err && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
      {me?.disabled && <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">Your reseller account is currently disabled. Contact admin.</div>}

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard icon={<Wallet className="h-4 w-4" />} label="Quota" value={me ? String(me.quota) : "—"} tone="neutral" />
        <SummaryCard icon={<KeyRound className="h-4 w-4" />} label="Used" value={me ? String(me.keys_created) : "—"} tone="amber" />
        <SummaryCard icon={<TrendingUp className="h-4 w-4" />} label="Remaining" value={remaining != null ? String(remaining) : "—"} tone={remaining != null && remaining > 0 ? "green" : "red"} />
        <SummaryCard icon={<Layers className="h-4 w-4" />} label="Bulk batches" value={String(batches.length)} tone="amber" />
      </div>

      <section className="space-y-6">
        {/* Single key create */}
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">Create a single key</h2>
          <div className="flex flex-wrap gap-2">
            <select value={duration} onChange={(e) => setDuration(e.target.value as any)} className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
              <option value="1m">1 month</option><option value="3m">3 months</option><option value="6m">6 months</option><option value="1y">1 year</option>
            </select>
            <input placeholder="Client name (optional)" value={clientName} onChange={(e) => setClientName(e.target.value)} className="flex-1 min-w-[180px] rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            <button onClick={createKey} disabled={creating || me?.disabled || remaining === 0} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50">{creating ? "Creating…" : remaining === 0 ? "Quota reached" : "Generate key"}</button>
          </div>
        </div>

        {/* Bulk create */}
        <div className="rounded-lg border border-amber-200 bg-amber-50/30 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold">Bulk create keys</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <select value={bulkDuration} onChange={(e) => setBulkDuration(e.target.value as any)} className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
              <option value="1m">1 month</option><option value="3m">3 months</option><option value="6m">6 months</option><option value="1y">1 year</option><option value="lifetime">Lifetime</option>
            </select>
            <input type="number" min={1} max={1000} value={bulkCount} onChange={(e) => setBulkCount(Number(e.target.value))} placeholder="Count" className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            <input type="text" value={bulkPrefix} onChange={(e) => setBulkPrefix(e.target.value)} placeholder="Prefix (optional)" className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            <button onClick={createBulkKeys} disabled={bulkBusy || me?.disabled || remaining === 0} className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
              {bulkBusy ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="h-4 w-4" /> Generate {bulkCount}</>}
            </button>
          </div>
          {bulkErr && <p className="mt-2 text-xs text-red-600">{bulkErr}</p>}
        </div>

        {/* Bulk batches */}
        {batches.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/20 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-semibold">Bulk batches <span className="text-neutral-400">({batches.length})</span></h2>
            </div>
            <div className="space-y-2">
              {batches.map((b) => <BatchCard key={b.batch_id} batch={b} supabase={supabase} resellerEmail={email} />)}
            </div>
          </div>
        )}

        {/* Single keys table */}
        <div className="rounded-lg border border-neutral-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Single keys <span className="text-neutral-400">({keys.length})</span></h2>
              <p className="mt-0.5 text-[11px] text-neutral-400">{unusedCount} unused · {activeCount} active · {keys.length - unusedCount - activeCount} other</p>
            </div>
            {keys.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <button onClick={() => downloadKeysTxt(keys, "unused", email)} disabled={unusedCount === 0} title="Download unused keys" className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40">
                  <Download className="h-3 w-3" /> Unused ({unusedCount})
                </button>
                <button onClick={() => downloadKeysTxt(keys, "active", email)} disabled={activeCount === 0} title="Download active keys" className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40">
                  <Download className="h-3 w-3" /> Active ({activeCount})
                </button>
                <button onClick={() => downloadKeysTxt(keys, "all", email)} title="Download all single keys" className="inline-flex items-center gap-1.5 rounded-md border border-neutral-900 bg-neutral-900 px-2.5 py-1.5 text-[11px] font-medium text-white transition hover:bg-neutral-700">
                  <FileText className="h-3 w-3" /> All ({keys.length})
                </button>
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-neutral-50 text-neutral-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Key</th><th className="px-3 py-2 font-medium">Duration</th><th className="px-3 py-2 font-medium">Status</th><th className="px-3 py-2 font-medium">Client</th><th className="px-3 py-2 font-medium">Activated</th><th className="px-3 py-2 font-medium">Expires</th><th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={7} className="px-3 py-8 text-center text-neutral-500">Loading…</td></tr>}
                {!loading && keys.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-neutral-500">No single keys yet.</td></tr>}
                {keys.map((k) => (
                  <tr key={k.key} className="border-t border-neutral-100 transition hover:bg-amber-50/40">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] tracking-tight text-neutral-800">{k.key}</code>
                        <CopyButton value={k.key} id={k.key} />
                      </div>
                    </td>
                    <td className="px-3 py-2 text-neutral-700">{k.duration_type}</td>
                    <td className="px-3 py-2">
                      <span className={"rounded px-2 py-0.5 text-[10px] font-medium " + (k.status === "active" ? "bg-emerald-50 text-emerald-700" : k.status === "revoked" ? "bg-red-50 text-red-700" : k.status === "expired" ? "bg-amber-50 text-amber-700" : "bg-neutral-100 text-neutral-700")}>{k.status}</span>
                    </td>
                    <td className="px-3 py-2 text-neutral-700">{k.client_name || "—"}</td>
                    <td className="px-3 py-2 text-neutral-600">{fmt(k.activated_at)}</td>
                    <td className="px-3 py-2 text-neutral-600">{k.duration_type === "lifetime" ? "∞" : fmt(k.expires_at)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        {k.status === "active" && <button onClick={() => resetBinding(k.key)} className="rounded border border-neutral-300 px-2 py-1 text-[11px] hover:bg-neutral-100">Reset device</button>}
                        {k.status !== "revoked" && <button onClick={() => revokeKey(k.key)} className="rounded border border-red-300 px-2 py-1 text-[11px] text-red-700 hover:bg-red-50">Revoke</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </Shell>
  );
}

function downloadKeysTxt(keys: KeyRow[], scope: "all" | "unused" | "active", resellerEmail: string) {
  const filtered = keys.filter((k) => scope === "all" ? true : k.status === scope);
  if (filtered.length === 0) return;
  const lines = filtered.map((k) => k.key);
  const header = [`# Unlimitly License Keys`, `# Reseller: ${resellerEmail}`, `# Scope: ${scope} (${filtered.length} keys)`, `# Generated: ${new Date().toISOString()}`, ``, ...lines, ``].join("\n");
  const blob = new Blob([header], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const stamp = new Date().toISOString().slice(0, 10);
  const safeEmail = resellerEmail.replace(/[^a-zA-Z0-9@._-]/g, "_");
  a.download = `unlimitly-keys-${safeEmail}-${scope}-${stamp}.txt`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function SummaryCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "neutral" | "amber" | "green" | "red" }) {
  const tones = { neutral: "border-neutral-200 bg-white text-neutral-900", amber: "border-amber-200 bg-amber-50 text-amber-900", green: "border-emerald-200 bg-emerald-50 text-emerald-900", red: "border-red-200 bg-red-50 text-red-900" };
  const iconTones = { neutral: "text-neutral-500", amber: "text-amber-600", green: "text-emerald-600", red: "text-red-600" };
  return (
    <div className={`rounded-lg border p-4 ${tones[tone]}`}>
      <div className="mb-2 flex items-center gap-1.5"><span className={iconTones[tone]}>{icon}</span><span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">{label}</span></div>
      <div className="font-serif text-2xl italic" style={{ fontFamily: "'Instrument Serif', serif" }}>{value}</div>
    </div>
  );
}

function fmt(iso: string | null) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); } catch { return iso; }
}
