import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { getUnlSupabase } from "@/lib/unl-supabase";

export const Route = createFileRoute("/admin-og")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Unlimitly — Admin Console" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
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
  created_by_admin_id: string | null;
  created_by_reseller_id: string | null;
  reseller_email?: string | null;
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

function AdminPage() {
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
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function verifyAdmin(userId: string) {
    const { data, error } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    setIsAdmin(!error && data === true);
  }

  if (checking) return <Shell><p className="text-sm text-neutral-500">Checking session…</p></Shell>;
  if (!session) return <LoginForm supabase={supabase} title="Admin Console" />;
  if (!isAdmin)
    return (
      <Shell>
        <p className="text-sm text-red-600">This account is not an admin.</p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-3 rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
        >
          Sign out
        </button>
      </Shell>
    );

  return <AdminDashboard supabase={supabase} email={session.user.email} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FBF7EC] px-6 py-10 font-sans text-neutral-900">
      <div className="mx-auto max-w-5xl">{children}</div>
    </div>
  );
}

function LoginForm({ supabase, title }: { supabase: ReturnType<typeof getUnlSupabase>; title: string }) {
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
          {title}
        </h1>
        <p className="mb-6 text-sm text-neutral-500">Sign in to continue.</p>
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

function AdminDashboard({
  supabase,
  email,
}: {
  supabase: ReturnType<typeof getUnlSupabase>;
  email: string;
}) {
  const [tab, setTab] = useState<"keys" | "resellers">("keys");
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [resellers, setResellers] = useState<ResellerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Create key form
  const [duration, setDuration] = useState<"1m" | "3m" | "6m" | "1y" | "lifetime">("1m");
  const [clientName, setClientName] = useState("");
  const [creating, setCreating] = useState(false);

  // Reseller form
  const [rEmail, setREmail] = useState("");
  const [rQuota, setRQuota] = useState(10);

  const [filterStatus, setFilterStatus] = useState<string>("all");

  async function load() {
    setLoading(true);
    setErr(null);
    const [k, r] = await Promise.all([
      supabase.rpc("unl_admin_list_keys"),
      supabase.rpc("unl_admin_list_resellers"),
    ]);
    if (k.error) setErr(k.error.message);
    else setKeys((k.data as KeyRow[]) || []);
    if (!r.error) setResellers((r.data as ResellerRow[]) || []);
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
    const { data, error } = await supabase.rpc("unl_admin_create_key", {
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

  async function revokeKey(k: string) {
    if (!confirm("Revoke key " + k + " ?")) return;
    const { error } = await supabase.rpc("unl_admin_revoke_key", { p_key: k });
    if (error) return alert(error.message);
    flash("Revoked");
    load();
  }

  async function resetBinding(k: string) {
    if (!confirm("Reset device binding for " + k + " ?")) return;
    const { error } = await supabase.rpc("unl_admin_reset_binding", { p_key: k });
    if (error) return alert(error.message);
    flash("Binding reset");
    load();
  }

  async function grantReseller() {
    if (!rEmail) return;
    const { error } = await supabase.rpc("unl_admin_grant_reseller", {
      p_email: rEmail,
      p_quota: rQuota,
    });
    if (error) return alert(error.message);
    flash("Reseller granted");
    setREmail("");
    setRQuota(10);
    load();
  }

  async function setQuota(id: string, q: number) {
    const { error } = await supabase.rpc("unl_admin_set_reseller_quota", {
      p_reseller_id: id,
      p_quota: q,
    });
    if (error) return alert(error.message);
    flash("Quota updated");
    load();
  }

  async function toggleReseller(id: string, disabled: boolean) {
    const { error } = await supabase.rpc("unl_admin_toggle_reseller", {
      p_reseller_id: id,
      p_disabled: !disabled,
    });
    if (error) return alert(error.message);
    load();
  }

  const shown = useMemo(
    () => (filterStatus === "all" ? keys : keys.filter((k) => k.status === filterStatus)),
    [keys, filterStatus],
  );

  return (
    <Shell>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1
            className="font-serif text-3xl italic"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Admin Console
          </h1>
          <p className="text-xs text-neutral-500">Signed in as {email}</p>
        </div>
        <div className="flex gap-2">
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

      <div className="mb-5 flex gap-1 border-b border-neutral-200">
        {(["keys", "resellers"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              "px-4 py-2 text-sm font-medium " +
              (tab === t
                ? "border-b-2 border-neutral-900 text-neutral-900"
                : "text-neutral-500 hover:text-neutral-800")
            }
          >
            {t === "keys" ? "License Keys" : "Resellers"}
          </button>
        ))}
      </div>

      {tab === "keys" && (
        <section className="space-y-6">
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold">Create a new key</h2>
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
                <option value="lifetime">Lifetime</option>
              </select>
              <input
                placeholder="Client name (optional)"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="flex-1 min-w-[180px] rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
              <button
                onClick={createKey}
                disabled={creating}
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {creating ? "Creating…" : "Generate key"}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
              <h2 className="text-sm font-semibold">
                All keys <span className="text-neutral-400">({shown.length})</span>
              </h2>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-md border border-neutral-300 px-2 py-1 text-xs"
              >
                <option value="all">All statuses</option>
                <option value="unused">Unused</option>
                <option value="active">Active</option>
                <option value="revoked">Revoked</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Key</th>
                    <th className="px-3 py-2 font-medium">Duration</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Client</th>
                    <th className="px-3 py-2 font-medium">Reseller</th>
                    <th className="px-3 py-2 font-medium">Activated</th>
                    <th className="px-3 py-2 font-medium">Expires</th>
                    <th className="px-3 py-2 font-medium">Device FP</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={9} className="px-3 py-8 text-center text-neutral-500">
                        Loading…
                      </td>
                    </tr>
                  )}
                  {!loading && shown.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-3 py-8 text-center text-neutral-500">
                        No keys yet.
                      </td>
                    </tr>
                  )}
                  {shown.map((k) => (
                    <tr key={k.key} className="border-t border-neutral-100">
                      <td className="px-3 py-2 font-mono">{k.key}</td>
                      <td className="px-3 py-2">{k.duration_type}</td>
                      <td className="px-3 py-2">
                        <StatusPill status={k.status} />
                      </td>
                      <td className="px-3 py-2">{k.client_name || "—"}</td>
                      <td className="px-3 py-2">{k.reseller_email || (k.created_by_admin_id ? "admin" : "—")}</td>
                      <td className="px-3 py-2">{fmt(k.activated_at)}</td>
                      <td className="px-3 py-2">{k.duration_type === "lifetime" ? "∞" : fmt(k.expires_at)}</td>
                      <td className="px-3 py-2 font-mono text-[10px] text-neutral-500">
                        {k.device_fingerprint ? k.device_fingerprint.slice(0, 12) + "…" : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right">
                        {k.status === "active" && (
                          <button
                            onClick={() => resetBinding(k.key)}
                            className="mr-1 rounded border border-neutral-300 px-2 py-1 text-[11px] hover:bg-neutral-100"
                          >
                            Reset device
                          </button>
                        )}
                        {k.status !== "revoked" && (
                          <button
                            onClick={() => revokeKey(k.key)}
                            className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-700 hover:bg-red-100"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {tab === "resellers" && (
        <section className="space-y-6">
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-1 text-sm font-semibold">Grant reseller role</h2>
            <p className="mb-3 text-xs text-neutral-500">
              First create the user in Supabase Auth (Authentication → Users → Add user). Then paste their email here.
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                type="email"
                placeholder="reseller@email.com"
                value={rEmail}
                onChange={(e) => setREmail(e.target.value)}
                className="flex-1 min-w-[220px] rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min={0}
                value={rQuota}
                onChange={(e) => setRQuota(Number(e.target.value))}
                className="w-24 rounded-md border border-neutral-300 px-3 py-2 text-sm"
                title="Key quota"
              />
              <button
                onClick={grantReseller}
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
              >
                Grant
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-4 py-3">
              <h2 className="text-sm font-semibold">
                Resellers <span className="text-neutral-400">({resellers.length})</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Quota</th>
                    <th className="px-3 py-2 font-medium">Used</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Created</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {resellers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-neutral-500">
                        No resellers yet.
                      </td>
                    </tr>
                  )}
                  {resellers.map((r) => (
                    <tr key={r.id} className="border-t border-neutral-100">
                      <td className="px-3 py-2">{r.email}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          defaultValue={r.quota}
                          onBlur={(e) => {
                            const v = Number(e.target.value);
                            if (v !== r.quota) setQuota(r.id, v);
                          }}
                          className="w-20 rounded border border-neutral-300 px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2">{r.keys_created}</td>
                      <td className="px-3 py-2">
                        {r.disabled ? (
                          <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600">
                            Disabled
                          </span>
                        ) : (
                          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">{fmt(r.created_at)}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-right">
                        <button
                          onClick={() => toggleReseller(r.id, r.disabled)}
                          className="rounded border border-neutral-300 px-2 py-1 text-[11px] hover:bg-neutral-100"
                        >
                          {r.disabled ? "Enable" : "Disable"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </Shell>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    unused: "bg-neutral-100 text-neutral-700",
    active: "bg-emerald-50 text-emerald-700",
    revoked: "bg-red-50 text-red-700",
    expired: "bg-amber-50 text-amber-700",
  };
  return (
    <span className={"rounded px-2 py-0.5 text-[10px] font-medium " + (styles[status] || "bg-neutral-100 text-neutral-700")}>
      {status}
    </span>
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