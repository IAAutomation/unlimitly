import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getUnlSupabase } from "@/lib/unl-supabase";

export const Route = createFileRoute("/resellers-og")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Unlimitly — Reseller Console" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResellerPage,
});

type KeyRow = {
  key: string;
  duration_type: string;
  status: string;
  device_fingerprint: string | null;
  activated_at: string | null;
  expires_at: string | null;
  client_name: string | null;
  created_at: string;
};

type ResellerInfo = { id: string; quota: number; keys_created: number; disabled: boolean };

function ResellerPage() {
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
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function verify(userId: string) {
    const { data, error } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "reseller",
    });
    setIsReseller(!error && data === true);
  }

  if (checking) return <Shell><p className="text-sm text-neutral-500">Checking session…</p></Shell>;
  if (!session) return <LoginForm supabase={supabase} />;
  if (!isReseller)
    return (
      <Shell>
        <p className="text-sm text-red-600">This account is not a reseller.</p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-3 rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
        >
          Sign out
        </button>
      </Shell>
    );

  return <ResellerDashboard supabase={supabase} email={session.user.email} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FBF7EC] px-6 py-10 font-sans text-neutral-900">
      <div className="mx-auto max-w-5xl">{children}</div>
    </div>
  );
}

function LoginForm({ supabase }: { supabase: ReturnType<typeof getUnlSupabase> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setErr(error.message);
  }

  return (
    <Shell>
      <div className="mx-auto max-w-sm">
        <h1 className="mb-1 font-serif text-3xl italic" style={{ fontFamily: "'Instrument Serif', serif" }}>
          Reseller Console
        </h1>
        <p className="mb-6 text-sm text-neutral-500">Sign in to your reseller account.</p>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
          {err && <p className="text-xs text-red-600">{err}</p>}
          <button
            disabled={busy}
            className="w-full rounded-md bg-neutral-900 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </Shell>
  );
}

function ResellerDashboard({
  supabase,
  email,
}: {
  supabase: ReturnType<typeof getUnlSupabase>;
  email: string;
}) {
  const [me, setMe] = useState<ResellerInfo | null>(null);
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [duration, setDuration] = useState<"1m" | "3m" | "6m" | "1y">("1m");
  const [clientName, setClientName] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    const [k, m] = await Promise.all([
      supabase.rpc("unl_reseller_list_keys"),
      supabase.rpc("unl_reseller_me"),
    ]);
    if (k.error) setErr(k.error.message);
    else setKeys((k.data as KeyRow[]) || []);
    if (!m.error) {
      const row = Array.isArray(m.data) ? m.data[0] : m.data;
      if (row) setMe(row as ResellerInfo);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  async function createKey() {
    setCreating(true);
    const { data, error } = await supabase.rpc("unl_reseller_create_key", {
      p_duration: duration,
      p_client_name: clientName || null,
    });
    setCreating(false);
    if (error) return alert(error.message);
    const newKey = Array.isArray(data) ? data[0]?.key : (data as any)?.key || data;
    try {
      await navigator.clipboard.writeText(String(newKey));
      flash("Key created & copied: " + newKey);
    } catch {
      flash("Key created: " + newKey);
    }
    setClientName("");
    load();
  }

  async function resetBinding(k: string) {
    if (!confirm("Reset device binding for " + k + " ?")) return;
    const { error } = await supabase.rpc("unl_reseller_reset_binding", { p_key: k });
    if (error) return alert(error.message);
    flash("Binding reset");
    load();
  }

  async function revokeKey(k: string) {
    if (!confirm("Revoke " + k + " ?\n\nThis will immediately disable the extension for that client.")) return;
    const { error } = await supabase.rpc("unl_reseller_revoke_key", { p_key: k });
    if (error) return alert(error.message);
    flash("Key revoked");
    load();
  }

  const remaining = me ? Math.max(0, me.quota - me.keys_created) : null;

  return (
    <Shell>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1
            className="font-serif text-3xl italic"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Reseller Console
          </h1>
          <p className="text-xs text-neutral-500">Signed in as {email}</p>
        </div>
        <div className="flex items-center gap-3">
          {me && (
            <span className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs">
              <b>{me.keys_created}</b> used / <b>{me.quota}</b> quota · <b>{remaining}</b> left
            </span>
          )}
          <button
            onClick={load}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-100"
          >
            Refresh
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-100"
          >
            Sign out
          </button>
        </div>
      </header>

      {toast && (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {toast}
        </div>
      )}
      {err && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
      {me?.disabled && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Your reseller account is currently disabled. Contact admin.
        </div>
      )}

      <section className="space-y-6">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">Create a key for a client</h2>
          <div className="flex flex-wrap gap-2">
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value as any)}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="1m">1 month</option>
              <option value="3m">3 months</option>
              <option value="6m">6 months</option>
              <option value="1y">1 year</option>
            </select>
            <input
              placeholder="Client name (optional)"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="flex-1 min-w-[180px] rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
            <button
              onClick={createKey}
              disabled={creating || me?.disabled || remaining === 0}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {creating ? "Creating…" : remaining === 0 ? "Quota reached" : "Generate key"}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-4 py-3">
            <h2 className="text-sm font-semibold">
              Your clients <span className="text-neutral-400">({keys.length})</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Key</th>
                  <th className="px-3 py-2 font-medium">Duration</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Client</th>
                  <th className="px-3 py-2 font-medium">Activated</th>
                  <th className="px-3 py-2 font-medium">Expires</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-neutral-500">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && keys.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-neutral-500">
                      No keys yet.
                    </td>
                  </tr>
                )}
                {keys.map((k) => (
                  <tr key={k.key} className="border-t border-neutral-100">
                    <td className="px-3 py-2 font-mono">{k.key}</td>
                    <td className="px-3 py-2">{k.duration_type}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          "rounded px-2 py-0.5 text-[10px] font-medium " +
                          (k.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : k.status === "revoked"
                              ? "bg-red-50 text-red-700"
                              : k.status === "expired"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-neutral-100 text-neutral-700")
                        }
                      >
                        {k.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">{k.client_name || "—"}</td>
                    <td className="px-3 py-2">{fmt(k.activated_at)}</td>
                    <td className="px-3 py-2">{k.duration_type === "lifetime" ? "∞" : fmt(k.expires_at)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        {k.status === "active" && (
                          <button
                            onClick={() => resetBinding(k.key)}
                            className="rounded border border-neutral-300 px-2 py-1 text-[11px] hover:bg-neutral-100"
                          >
                            Reset device
                          </button>
                        )}
                        {k.status !== "revoked" && (
                          <button
                            onClick={() => revokeKey(k.key)}
                            className="rounded border border-red-300 px-2 py-1 text-[11px] text-red-700 hover:bg-red-50"
                          >
                            Revoke
                          </button>
                        )}
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

function fmt(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}