"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { getUnlSupabase } from "@/lib/unl-supabase";
import { Copy, Check, Download, FileText, Loader2, Sparkles, ChevronDown, ChevronRight, Layers } from "lucide-react";

type KeyRow = {
  key: string;
  duration_type: string;
  status: string;
  device_fingerprint: string | null;
  activated_at: string | null;
  expires_at: string | null;
  client_name: string | null;
  created_at: string;
  created_by_admin: string | null;
  created_by_reseller: string | null;
  reseller_email?: string | null;
  batch_id?: string | null;
};

type ResellerRow = {
  id: string;
  user_id: string;
  email: string;
  quota: number;
  keys_created: number;
  disabled: boolean;
  created_at: string;
};

type BatchRow = {
  batch_id: string;
  batch_size: number;
  batch_label: string;
  duration_type: string;
  reseller_email: string | null;
  created_at: string;
  created_by_admin: string | null;
  created_by_reseller: string | null;
  active_count: number;
  unused_count: number;
  revoked_count: number;
  expired_count?: number;
};

type BatchKey = {
  key: string;
  duration_type: string;
  status: string;
  client_name: string | null;
  expires_at: string | null;
  activated_at: string | null;
  device_fingerprint: string | null;
};

/* ---------- copy hook ---------- */
function useCopy() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 1400);
  }, []);
  return { copiedKey, copy };
}

function CopyButton({ value, id }: { value: string; id: string }) {
  const { copiedKey, copy } = useCopy();
  const isCopied = copiedKey === id;
  return (
    <button
      onClick={() => copy(value, id)}
      title={isCopied ? "Copied!" : "Copy key"}
      className={`grid h-7 w-7 place-items-center rounded-md border transition ${
        isCopied ? "border-emerald-300 bg-emerald-50 text-emerald-600" : "border-neutral-200 bg-white text-neutral-500 hover:border-neutral-400 hover:text-neutral-900"
      }`}
    >
      {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

/* ---------- download batch .txt ---------- */
async function downloadBatchTxt(supabase: ReturnType<typeof getUnlSupabase>, batch: BatchRow) {
  const { data, error } = await supabase.rpc("unl_get_batch_keys", { p_batch_id: batch.batch_id });
  if (error) return alert(error.message);
  const rows = (data as any[]) || [];
  const lines = rows.map((r) => r.key);
  const header = [
    `# Unlimitly License Keys — Bulk Batch`,
    `# Reseller: ${batch.reseller_email || "admin"}`,
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
  const safeEmail = (batch.reseller_email || "admin").replace(/[^a-zA-Z0-9@._-]/g, "_");
  a.download = `unlimitly-batch-${safeEmail}-${stamp}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

/* ---------- batch card ---------- */
function BatchCard({ batch, supabase, showReseller = false, isAdmin = false, onChanged }: { batch: BatchRow; supabase: ReturnType<typeof getUnlSupabase>; showReseller?: boolean; isAdmin?: boolean; onChanged?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [keys, setKeys] = useState<BatchKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const { copiedKey, copy } = useCopy();

  async function toggleExpand() {
    if (expanded) { setExpanded(false); return; }
    if (keys.length === 0) {
      setLoading(true);
      const { data, error } = await supabase.rpc("unl_get_batch_keys", { p_batch_id: batch.batch_id });
      setLoading(false);
      if (error) return alert(error.message);
      setKeys((data as BatchKey[]) || []);
    }
    setExpanded(true);
  }

  async function revokeKey(k: string) {
    if (!confirm("Revoke key " + k + " ?")) return;
    setBusy(k);
    const rpc = isAdmin ? "unl_admin_revoke_key" : "unl_reseller_revoke_key";
    const { error } = await supabase.rpc(rpc, { p_key: k });
    setBusy(null);
    if (error) return alert(error.message);
    setKeys((prev) => prev.map((kk) => (kk.key === k ? { ...kk, status: "revoked" } : kk)));
    onChanged?.();
  }

  async function resetBinding(k: string) {
    if (!confirm("Reset device binding for " + k + " ?")) return;
    setBusy(k);
    const rpc = isAdmin ? "unl_admin_reset_binding" : "unl_reseller_reset_binding";
    const { error } = await supabase.rpc(rpc, { p_key: k });
    setBusy(null);
    if (error) return alert(error.message);
    setKeys((prev) => prev.map((kk) => (kk.key === k ? { ...kk, status: "unused", device_fingerprint: null, activated_at: null } : kk)));
    onChanged?.();
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 transition hover:border-amber-300">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-100 text-amber-700">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-900">{batch.batch_label}</span>
              <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">BULK</span>
            </div>
            <div className="mt-0.5 text-[11px] text-neutral-500">
              {batch.batch_size} keys · {batch.duration_type} · {new Date(batch.created_at).toLocaleString()}
              {showReseller && batch.reseller_email && ` · ${batch.reseller_email}`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-wrap gap-1.5 text-[10px]">
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700">{batch.active_count} active</span>
            <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-neutral-600">{batch.unused_count} unused</span>
            {batch.revoked_count > 0 && <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-700">{batch.revoked_count} revoked</span>}
            {batch.expired_count && batch.expired_count > 0 && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-700">{batch.expired_count} expired</span>}
          </div>
          <button
            onClick={() => downloadBatchTxt(supabase, batch)}
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-900 bg-neutral-900 px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-neutral-700"
          >
            <Download className="h-3 w-3" /> .txt
          </button>
          <button
            onClick={toggleExpand}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-neutral-700 transition hover:bg-neutral-50"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            {expanded ? "Hide" : "View"}
          </button>
        </div>
      </div>
      {expanded && keys.length > 0 && (
        <div className="mt-3 max-h-80 overflow-y-auto rounded-md border border-neutral-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-neutral-50 text-neutral-500">
              <tr>
                <th className="w-8 px-3 py-2 font-medium">#</th>
                <th className="px-3 py-2 font-medium">Key</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Client</th>
                <th className="px-3 py-2 font-medium">Expires</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {keys.map((k, i) => (
                <tr key={k.key} className="border-b border-neutral-50 last:border-0 hover:bg-amber-50/40">
                  <td className="px-3 py-2 text-neutral-400">{i + 1}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] tracking-tight text-neutral-800">{k.key}</code>
                      <button
                        onClick={() => copy(k.key, `batch-${k.key}`)}
                        title="Copy"
                        className={`grid h-6 w-6 place-items-center rounded border transition ${copiedKey === `batch-${k.key}` ? "border-emerald-300 bg-emerald-50 text-emerald-600" : "border-neutral-200 text-neutral-500 hover:text-neutral-900"}`}
                      >
                        {copiedKey === `batch-${k.key}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={"rounded px-2 py-0.5 text-[10px] font-medium " + (k.status === "active" ? "bg-emerald-50 text-emerald-700" : k.status === "revoked" ? "bg-red-50 text-red-700" : k.status === "expired" ? "bg-amber-50 text-amber-700" : "bg-neutral-100 text-neutral-700")}>{k.status}</span>
                  </td>
                  <td className="px-3 py-2 text-neutral-600">{k.client_name || "—"}</td>
                  <td className="px-3 py-2 text-neutral-600">{k.duration_type === "lifetime" || batch.duration_type === "lifetime" ? "∞" : fmt(k.expires_at)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    {busy === k.key ? (
                      <Loader2 className="h-3 w-3 animate-spin text-neutral-400" />
                    ) : (
                      <div className="flex justify-end gap-1">
                        {k.status === "active" && (
                          <button onClick={() => resetBinding(k.key)} className="rounded border border-neutral-300 px-2 py-1 text-[10px] hover:bg-neutral-100">Reset</button>
                        )}
                        {k.status !== "revoked" && (
                          <button onClick={() => revokeKey(k.key)} className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[10px] text-red-700 hover:bg-red-100">Revoke</button>
                        )}
                      </div>
                    )}
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

export default function AdminPage() {
  const supabase = getUnlSupabase();
  const [session, setSession] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) await verifyAdmin(data.session.user.id);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s);
      if (s) await verifyAdmin(s.user.id);
      else setIsAdmin(false);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  async function verifyAdmin(userId: string) {
    const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    setIsAdmin(!error && data === true);
  }

  if (checking) return <Shell><p className="text-sm text-neutral-500">Checking session…</p></Shell>;
  if (!session) return <LoginForm supabase={supabase} title="Admin Console" />;
  if (!isAdmin) return (
    <Shell>
      <p className="text-sm text-red-600">This account is not an admin.</p>
      <button onClick={() => supabase.auth.signOut()} className="mt-3 rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100">Sign out</button>
    </Shell>
  );
  return <AdminDashboard supabase={supabase} email={session.user.email} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#FBF7EC] px-6 py-10 font-sans text-neutral-900"><div className="mx-auto max-w-6xl">{children}</div></div>;
}

function LoginForm({ supabase, title }: { supabase: ReturnType<typeof getUnlSupabase>; title: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setErr(error.message);
  }
  return (
    <Shell>
      <div className="mx-auto max-w-sm">
        <h1 className="mb-1 font-serif text-3xl italic" style={{ fontFamily: "'Instrument Serif', serif" }}>{title}</h1>
        <p className="mb-6 text-sm text-neutral-500">Sign in to continue.</p>
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

function AdminDashboard({ supabase, email }: { supabase: ReturnType<typeof getUnlSupabase>; email: string }) {
  const [tab, setTab] = useState<"keys" | "bulk" | "resellers">("keys");
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [resellers, setResellers] = useState<ResellerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [duration, setDuration] = useState<"1m" | "3m" | "6m" | "1y" | "lifetime">("1m");
  const [clientName, setClientName] = useState("");
  const [creating, setCreating] = useState(false);
  const [rEmail, setREmail] = useState("");
  const [rQuota, setRQuota] = useState(10);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedReseller, setExpandedReseller] = useState<string | null>(null);
  const [resellerBatches, setResellerBatches] = useState<Record<string, BatchRow[]>>({});

  async function load() {
    setLoading(true); setErr(null);
    const [k, r, b] = await Promise.all([
      supabase.rpc("unl_admin_list_keys"),
      supabase.rpc("unl_admin_list_resellers"),
      supabase.rpc("unl_admin_list_bulk_batches"),
    ]);
    if (k.error) setErr(k.error.message);
    else setKeys((k.data as KeyRow[]) || []);
    if (!r.error) setResellers((r.data as ResellerRow[]) || []);
    if (!b.error) setBatches((b.data as BatchRow[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2400); }

  async function createKey() {
    setCreating(true);
    const { data, error } = await supabase.rpc("unl_admin_create_key", { p_duration: duration, p_client_name: clientName || null });
    setCreating(false);
    if (error) return alert(error.message);
    const newKey = Array.isArray(data) ? data[0]?.key : (data as any)?.key || data;
    try { await navigator.clipboard.writeText(String(newKey)); flash("Key created & copied: " + newKey); } catch { flash("Key created: " + newKey); }
    setClientName(""); load();
  }

  async function revokeKey(k: string) {
    if (!confirm("Revoke key " + k + " ?")) return;
    const { error } = await supabase.rpc("unl_admin_revoke_key", { p_key: k });
    if (error) return alert(error.message);
    flash("Revoked"); load();
  }

  async function resetBinding(k: string) {
    if (!confirm("Reset device binding for " + k + " ?")) return;
    const { error } = await supabase.rpc("unl_admin_reset_binding", { p_key: k });
    if (error) return alert(error.message);
    flash("Binding reset"); load();
  }

  async function grantReseller() {
    if (!rEmail) return;
    const { error } = await supabase.rpc("unl_admin_grant_reseller", { p_email: rEmail, p_quota: rQuota });
    if (error) return alert(error.message);
    flash("Reseller granted"); setREmail(""); setRQuota(10); load();
  }

  async function setQuota(id: string, q: number) {
    const { error } = await supabase.rpc("unl_admin_set_reseller_quota", { p_reseller_id: id, p_quota: q });
    if (error) return alert(error.message);
    flash("Quota updated"); load();
  }

  async function toggleReseller(id: string, disabled: boolean) {
    const { error } = await supabase.rpc("unl_admin_toggle_reseller", { p_reseller_id: id, p_disabled: !disabled });
    if (error) return alert(error.message);
    load();
  }

  async function expandReseller(resellerId: string, resellerEmail: string) {
    if (expandedReseller === resellerId) {
      setExpandedReseller(null);
      return;
    }
    setExpandedReseller(resellerId);
    if (!resellerBatches[resellerId]) {
      const resellerBatchesList = batches.filter((b) => b.reseller_email === resellerEmail);
      setResellerBatches((prev) => ({ ...prev, [resellerId]: resellerBatchesList }));
    }
  }

  const shown = useMemo(() => (filterStatus === "all" ? keys : keys.filter((k) => k.status === filterStatus)), [keys, filterStatus]);

  return (
    <Shell>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl italic" style={{ fontFamily: "'Instrument Serif', serif" }}>Admin Console</h1>
          <p className="text-xs text-neutral-500">Signed in as {email}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-100">Refresh</button>
          <button onClick={() => supabase.auth.signOut()} className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-100">Sign out</button>
        </div>
      </header>

      {toast && <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{toast}</div>}
      {err && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

      <div className="mb-5 flex gap-1 border-b border-neutral-200">
        {([ { id: "keys", label: "License Keys" }, { id: "bulk", label: "Bulk Create" }, { id: "resellers", label: "Resellers" }] as const).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={"px-4 py-2 text-sm font-medium transition " + (tab === t.id ? "border-b-2 border-neutral-900 text-neutral-900" : "text-neutral-500 hover:text-neutral-800")}>{t.label}</button>
        ))}
      </div>

      {tab === "keys" && (
        <section className="space-y-6">
          {/* Bulk batches section */}
          {batches.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/30 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4 text-amber-600" />
                <h2 className="text-sm font-semibold">Bulk Batches <span className="text-neutral-400">({batches.length})</span></h2>
              </div>
              <div className="space-y-2">
                {batches.map((b) => (
                  <BatchCard key={b.batch_id} batch={b} supabase={supabase} showReseller isAdmin onChanged={load} />
                ))}
              </div>
            </div>
          )}

          {/* Single keys */}
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold">Create a single key</h2>
            <div className="flex flex-wrap gap-2">
              <select value={duration} onChange={(e) => setDuration(e.target.value as any)} className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
                <option value="1m">1 month</option><option value="3m">3 months</option><option value="6m">6 months</option><option value="1y">1 year</option><option value="lifetime">Lifetime</option>
              </select>
              <input placeholder="Client name (optional)" value={clientName} onChange={(e) => setClientName(e.target.value)} className="flex-1 min-w-[180px] rounded-md border border-neutral-300 px-3 py-2 text-sm" />
              <button onClick={createKey} disabled={creating} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50">{creating ? "Creating…" : "Generate key"}</button>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
              <h2 className="text-sm font-semibold">Single keys <span className="text-neutral-400">({shown.length})</span></h2>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-md border border-neutral-300 px-2 py-1 text-xs">
                <option value="all">All statuses</option><option value="unused">Unused</option><option value="active">Active</option><option value="revoked">Revoked</option><option value="expired">Expired</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-neutral-50 text-neutral-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Key</th><th className="px-3 py-2 font-medium">Duration</th><th className="px-3 py-2 font-medium">Status</th><th className="px-3 py-2 font-medium">Client</th><th className="px-3 py-2 font-medium">Reseller</th><th className="px-3 py-2 font-medium">Activated</th><th className="px-3 py-2 font-medium">Expires</th><th className="px-3 py-2 font-medium">Device FP</th><th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan={9} className="px-3 py-8 text-center text-neutral-500">Loading…</td></tr>}
                  {!loading && shown.length === 0 && <tr><td colSpan={9} className="px-3 py-8 text-center text-neutral-500">No single keys yet.</td></tr>}
                  {shown.map((k) => (
                    <tr key={k.key} className="border-t border-neutral-100 transition hover:bg-amber-50/40">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] tracking-tight text-neutral-800">{k.key}</code>
                          <CopyButton value={k.key} id={k.key} />
                        </div>
                      </td>
                      <td className="px-3 py-2">{k.duration_type}</td>
                      <td className="px-3 py-2"><StatusPill status={k.status} /></td>
                      <td className="px-3 py-2 text-neutral-700">{k.client_name || "—"}</td>
                      <td className="px-3 py-2 text-neutral-700">{k.reseller_email || (k.created_by_admin ? "admin" : "—")}</td>
                      <td className="px-3 py-2 text-neutral-600">{fmt(k.activated_at)}</td>
                      <td className="px-3 py-2 text-neutral-600">{k.duration_type === "lifetime" ? "∞" : fmt(k.expires_at)}</td>
                      <td className="px-3 py-2 font-mono text-[10px] text-neutral-500">{k.device_fingerprint ? k.device_fingerprint.slice(0, 12) + "…" : "—"}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-right">
                        {k.status === "active" && <button onClick={() => resetBinding(k.key)} className="mr-1 rounded border border-neutral-300 px-2 py-1 text-[11px] hover:bg-neutral-100">Reset device</button>}
                        {k.status !== "revoked" && <button onClick={() => revokeKey(k.key)} className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-700 hover:bg-red-100">Revoke</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {tab === "bulk" && (
        <BulkCreateTab supabase={supabase} resellers={resellers} onCreated={(count, e) => { flash(`${count} keys created for ${e}`); load(); }} />
      )}

      {tab === "resellers" && (
        <section className="space-y-6">
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-1 text-sm font-semibold">Grant reseller role</h2>
            <p className="mb-3 text-xs text-neutral-500">First create the user in Supabase Auth (Authentication → Users → Add user). Then paste their email here.</p>
            <div className="flex flex-wrap gap-2">
              <input type="email" placeholder="reseller@email.com" value={rEmail} onChange={(e) => setREmail(e.target.value)} className="flex-1 min-w-[220px] rounded-md border border-neutral-300 px-3 py-2 text-sm" />
              <input type="number" min={0} value={rQuota} onChange={(e) => setRQuota(Number(e.target.value))} className="w-24 rounded-md border border-neutral-300 px-3 py-2 text-sm" title="Key quota" />
              <button onClick={grantReseller} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">Grant</button>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-4 py-3">
              <h2 className="text-sm font-semibold">Resellers <span className="text-neutral-400">({resellers.length})</span></h2>
            </div>
            <div className="divide-y divide-neutral-100">
              {resellers.length === 0 && <div className="px-4 py-8 text-center text-xs text-neutral-500">No resellers yet.</div>}
              {resellers.map((r) => {
                const resellerBatchList = batches.filter((b) => b.reseller_email === r.email);
                const isExpanded = expandedReseller === r.id;
                return (
                  <div key={r.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <button onClick={() => expandReseller(r.id, r.email)} className="grid h-7 w-7 place-items-center rounded-md border border-neutral-200 text-neutral-500 hover:bg-neutral-50">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                        <div>
                          <div className="text-sm font-medium text-neutral-900">{r.email}</div>
                          <div className="text-[11px] text-neutral-500">
                            {r.keys_created} / {r.quota} keys used
                            {resellerBatchList.length > 0 && ` · ${resellerBatchList.length} bulk batch${resellerBatchList.length !== 1 ? "es" : ""}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" min={0} defaultValue={r.quota} onBlur={(e) => { const v = Number(e.target.value); if (v !== r.quota) setQuota(r.id, v); }} className="w-20 rounded border border-neutral-300 px-2 py-1 text-xs" title="Quota" />
                        <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${r.disabled ? "bg-neutral-100 text-neutral-600" : "bg-emerald-50 text-emerald-700"}`}>{r.disabled ? "Disabled" : "Active"}</span>
                        <button onClick={() => toggleReseller(r.id, r.disabled)} className="rounded border border-neutral-300 px-2 py-1 text-[11px] hover:bg-neutral-100">{r.disabled ? "Enable" : "Disable"}</button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-3 ml-10 space-y-3">
                        {resellerBatchList.length > 0 && (
                          <div>
                            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                              <Layers className="h-3 w-3" /> Bulk batches ({resellerBatchList.length})
                            </div>
                            <div className="space-y-2">
                              {resellerBatchList.map((b) => (
                                <BatchCard key={b.batch_id} batch={b} supabase={supabase} isAdmin onChanged={load} />
                              ))}
                            </div>
                          </div>
                        )}
                        {resellerBatchList.length === 0 && (
                          <p className="text-[11px] text-neutral-400">No bulk batches for this reseller.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </Shell>
  );
}

/* ============== Bulk Create Tab ============== */
function BulkCreateTab({ supabase, resellers, onCreated }: { supabase: ReturnType<typeof getUnlSupabase>; resellers: ResellerRow[]; onCreated: (count: number, email: string) => void }) {
  const [email, setEmail] = useState("");
  const [count, setCount] = useState(50);
  const [duration, setDuration] = useState<"1m" | "3m" | "6m" | "1y" | "lifetime">("1m");
  const [prefix, setPrefix] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ keys: string[]; email: string; duration: string; batchId: string } | null>(null);

  async function generate() {
    setBusy(true); setErr(null); setResult(null);
    if (!email) { setErr("Please enter a reseller email."); setBusy(false); return; }
    if (count < 1 || count > 1000) { setErr("Count must be between 1 and 1000."); setBusy(false); return; }
    const { data, error } = await supabase.rpc("unl_admin_create_bulk_keys", { p_reseller_email: email, p_duration: duration, p_count: count, p_client_prefix: prefix || null });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    const rows = Array.isArray(data) ? data : [];
    const newKeys = rows.map((r: any) => r.key).filter(Boolean);
    const batchId = rows[0]?.batch_id || "";
    setResult({ keys: newKeys, email, duration, batchId });
    if (newKeys.length > 0) {
      const stamp = new Date().toISOString().slice(0, 10);
      const safeEmail = email.replace(/[^a-zA-Z0-9@._-]/g, "_");
      const text = newKeys.join("\n") + "\n";
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `unlimitly-keys-${safeEmail}-${stamp}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 500);
    }
    onCreated(newKeys.length, email);
  }

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-neutral-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-semibold">Bulk create keys for a reseller</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-neutral-700">Reseller email</span>
            <input type="email" list="reseller-emails" placeholder="reseller@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900" />
            <datalist id="reseller-emails">{resellers.map((r) => <option key={r.id} value={r.email} />)}</datalist>
            <span className="mt-1 block text-[11px] text-neutral-400">{resellers.length} reseller{resellers.length !== 1 ? "s" : ""} available</span>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-neutral-700">Number of keys</span>
            <input type="number" min={1} max={1000} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900" />
            <span className="mt-1 block text-[11px] text-neutral-400">Up to 1000 per batch</span>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-neutral-700">Duration</span>
            <select value={duration} onChange={(e) => setDuration(e.target.value as any)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900">
              <option value="1m">1 month</option><option value="3m">3 months</option><option value="6m">6 months</option><option value="1y">1 year</option><option value="lifetime">Lifetime</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-neutral-700">Client name prefix (optional)</span>
            <input type="text" placeholder="e.g. Bulk-Q3-" value={prefix} onChange={(e) => setPrefix(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900" />
            <span className="mt-1 block text-[11px] text-neutral-400">Each key gets a suffix: {prefix ? `${prefix}1, ${prefix}2…` : "1, 2, 3…"}</span>
          </label>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <button onClick={generate} disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating {count} keys…</> : <><Sparkles className="h-4 w-4" /> Generate {count} key{count !== 1 ? "s" : ""}</>}
          </button>
          {err && <span className="text-xs text-red-600">{err}</span>}
        </div>
      </div>
      {result && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-emerald-800">✅ {result.keys.length} keys created for {result.email}</h3>
              <p className="text-xs text-emerald-700">Duration: {result.duration} · .txt file downloaded automatically · Batch ID: {result.batchId.slice(0, 8)}…</p>
            </div>
          </div>
          <p className="text-[11px] text-emerald-700">These keys now appear as a <strong>bulk batch card</strong> in the License Keys tab and under the reseller's entry in the Resellers tab.</p>
        </div>
      )}
    </section>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = { unused: "bg-neutral-100 text-neutral-700", active: "bg-emerald-50 text-emerald-700", revoked: "bg-red-50 text-red-700", expired: "bg-amber-50 text-amber-700" };
  return <span className={"rounded px-2 py-0.5 text-[10px] font-medium " + (styles[status] || "bg-neutral-100 text-neutral-700")}>{status}</span>;
}

function fmt(iso: string | null) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); } catch { return iso; }
}
