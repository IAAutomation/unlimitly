// ============================================================
// Unlimitly by Proflow Tools — Activation Gate
// Welcome screen + license key verification against own Supabase
// Loaded BEFORE sidepanel.js — sidepanel main UI is fully hidden
// until a valid key is activated and bound to this device.
// ============================================================
(function () {
  const SUPABASE_URL = 'https://sqkvakhzgsgqvfayefwm.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_UtFsx1XfkWAIauj4kXssaw_5h45Em0D';
  const WHATSAPP_CONTACT_URL =
    'https://wa.me/923165852898?text=' +
    encodeURIComponent(
      "Hi Ihtisham 👋\n\nI'd like an activation key for the Unlimitly extension (Lovable unlimited access). Please share the details and pricing.\n\nThanks!"
    );
  const STORAGE_KEYS = {
    activated: 'unl_activated',
    key: 'unl_key',
    fp: 'unl_fp',
    expires: 'unl_expires_at',
    firstOpen: 'unl_first_open_seen'
  };

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = String(s == null ? '' : s);
    return d.innerHTML;
  }

  async function fp() {
    try {
      if (typeof getHardwareFingerprint === 'function') {
        const v = await getHardwareFingerprint();
        if (v) return String(v);
      }
    } catch (e) {}
    return new Promise(function (resolve) {
      try {
        chrome.storage.local.get([STORAGE_KEYS.fp], function (r) {
          if (r && r[STORAGE_KEYS.fp]) return resolve(r[STORAGE_KEYS.fp]);
          const rnd = 'dev-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
          chrome.storage.local.set({ [STORAGE_KEYS.fp]: rnd }, function () { resolve(rnd); });
        });
      } catch (e) {
        resolve('dev-fallback');
      }
    });
  }

  function storeGet(keys) {
    return new Promise(function (resolve) {
      try { chrome.storage.local.get(keys, function (r) { resolve(r || {}); }); }
      catch (e) { resolve({}); }
    });
  }
  function storeSet(obj) {
    return new Promise(function (resolve) {
      try { chrome.storage.local.set(obj, function () { resolve(); }); }
      catch (e) { resolve(); }
    });
  }

  async function callRpc(name, body) {
    const url = SUPABASE_URL + '/rest/v1/rpc/' + name;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY
      },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
    if (!res.ok) {
      const msg = (data && (data.message || data.error || data.hint)) || ('HTTP ' + res.status);
      throw new Error(msg);
    }
    return data;
  }

  async function activateKey(key, deviceFp) {
    return callRpc('unl_activate_key', { p_key: key, p_fp: deviceFp });
  }
  async function validateKey(key, deviceFp) {
    return callRpc('unl_validate_key', { p_key: key, p_fp: deviceFp });
  }

  // -------- UI --------
  function welcomeMarkup() {
    return `
      <div class="unl-gate" id="unl-gate">
        <div class="unl-gate-inner">
          <div class="unl-word-stack" aria-hidden="true">
            <span class="unl-word unl-w1">Welcome</span>
            <span class="unl-word unl-w2">to</span>
            <span class="unl-word unl-w3">Unlimitly.</span>
          </div>

          <p class="unl-tagline">
            <span class="unl-line unl-l1">Build on Lovable.</span>
            <span class="unl-line unl-l2">Without watching the meter.</span>
          </p>

          <div class="unl-key-block">
            <label class="unl-key-label" for="unl-key-input">Activation key</label>
            <input
              id="unl-key-input"
              class="unl-key-input"
              type="text"
              spellcheck="false"
              autocomplete="off"
              placeholder="UNL-XXXX-XXXX-XXXX-XXXX"
            />
            <button id="unl-activate-btn" class="unl-activate-btn" type="button">
              <span class="unl-btn-label">Activate</span>
              <span class="unl-btn-spinner" aria-hidden="true"></span>
            </button>
            <div id="unl-key-msg" class="unl-key-msg" role="status" aria-live="polite"></div>
          </div>

          <div class="unl-help">
            <span class="unl-help-text">Don't have a key?</span>
            <a class="unl-help-link" id="unl-wa-btn" href="${WHATSAPP_CONTACT_URL}" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Message us on WhatsApp
            </a>
          </div>
        </div>
      </div>
    `;
  }

  function verifiedMarkup() {
    return `
      <div class="unl-gate unl-gate-verified" id="unl-gate-verified">
        <div class="unl-verified-inner">
          <svg class="unl-check" viewBox="0 0 52 52" width="72" height="72">
            <circle class="unl-check-circle" cx="26" cy="26" r="24" fill="none"/>
            <path class="unl-check-mark" fill="none" d="M14 27 l8 8 l16 -18"/>
          </svg>
          <p class="unl-verified-title">Verified.</p>
          <p class="unl-verified-sub">Opening your workspace…</p>
        </div>
      </div>
    `;
  }

  function invalidMarkup(reason) {
    return `
      <div class="unl-gate unl-gate-invalid" id="unl-gate-invalid">
        <div class="unl-invalid-inner">
          <svg class="unl-cross" viewBox="0 0 52 52" width="72" height="72">
            <circle class="unl-cross-circle" cx="26" cy="26" r="24" fill="none"/>
            <path class="unl-cross-mark" fill="none" d="M17 17 L35 35 M35 17 L17 35"/>
          </svg>
          <p class="unl-invalid-title">Invalid key.</p>
          <p class="unl-invalid-sub">${esc(reason || 'This activation key could not be verified.')}</p>
          <div class="unl-invalid-actions">
            <button type="button" id="unl-try-again" class="unl-activate-btn unl-try-again-btn">
              <span class="unl-btn-label">Try another key</span>
            </button>
            <a class="unl-help-link" href="${WHATSAPP_CONTACT_URL}" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Message us on WhatsApp
            </a>
          </div>
        </div>
      </div>
    `;
  }

  async function showWelcome() {
    const body = document.getElementById('sp-body');
    if (!body) return;
    body.innerHTML = welcomeMarkup();

    const input = document.getElementById('unl-key-input');
    const btn = document.getElementById('unl-activate-btn');
    const msg = document.getElementById('unl-key-msg');

    async function doActivate() {
      const key = (input.value || '').trim();
      if (!key) {
        setMsg('Please enter your activation key.', 'err', true);
        return;
      }
      btn.classList.add('is-loading');
      btn.disabled = true;
      setMsg('Checking…', 'info');
      try {
        const deviceFp = await fp();
        const result = await activateKey(key, deviceFp);
        // Expected: { ok: true, expires_at: '...', status: 'active' }
        //     or : { ok: false, reason: 'not_found'|'revoked'|'bound_other'|'expired', message: '...' }
        const row = Array.isArray(result) ? result[0] : result;
        if (row && row.ok) {
          await storeSet({
            [STORAGE_KEYS.activated]: true,
            [STORAGE_KEYS.key]: key,
            [STORAGE_KEYS.fp]: deviceFp,
            [STORAGE_KEYS.expires]: row.out_expires_at || row.expires_at || null,
            [STORAGE_KEYS.firstOpen]: true
          });
          showVerified();
          setTimeout(function () {
            if (typeof window.__unlOnActivated === 'function') window.__unlOnActivated();
          }, 1600);
        } else {
          const reason = (row && (row.message || row.reason)) || 'Invalid key.';
          showInvalid(prettyReason(reason));
        }
      } catch (e) {
        showInvalid((e && e.message) ? e.message : 'Could not reach the server.');
      }
    }

    function setMsg(text, kind, shake) {
      msg.textContent = text || '';
      msg.className = 'unl-key-msg' + (kind ? ' is-' + kind : '');
      if (shake) {
        const inner = document.querySelector('.unl-key-block');
        if (inner) {
          inner.classList.remove('unl-shake');
          void inner.offsetWidth;
          inner.classList.add('unl-shake');
        }
      }
    }

    function prettyReason(r) {
      const s = String(r || '').toLowerCase();
      if (s.indexOf('not_found') !== -1 || s.indexOf('invalid') !== -1) return 'This key is not valid.';
      if (s.indexOf('revoked') !== -1) return 'This key has been revoked.';
      if (s.indexOf('bound') !== -1 || s.indexOf('device') !== -1) return 'This key is already active on another device.';
      if (s.indexOf('expired') !== -1) return 'This key has expired.';
      return r;
    }

    btn.addEventListener('click', doActivate);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); doActivate(); }
    });
    // subtle focus after entrance
    setTimeout(function () { try { input.focus(); } catch (e) {} }, 900);
  }

  function showVerified() {
    const body = document.getElementById('sp-body');
    if (!body) return;
    body.innerHTML = verifiedMarkup();
  }

  function showInvalid(reason) {
    const body = document.getElementById('sp-body');
    if (!body) return;
    body.innerHTML = invalidMarkup(reason);
    const again = document.getElementById('unl-try-again');
    if (again) again.addEventListener('click', function () { showWelcome(); });
  }

  async function silentRevalidate() {
    const r = await storeGet([STORAGE_KEYS.activated, STORAGE_KEYS.key, STORAGE_KEYS.fp]);
    if (!r[STORAGE_KEYS.activated] || !r[STORAGE_KEYS.key]) return { ok: false };
    try {
      const result = await validateKey(r[STORAGE_KEYS.key], r[STORAGE_KEYS.fp] || (await fp()));
      const row = Array.isArray(result) ? result[0] : result;
      if (row && row.ok) return { ok: true, expires_at: row.out_expires_at || row.expires_at || null };
      return { ok: false };
    } catch (e) {
      // Network failure: trust cached state so users aren't kicked out offline.
      return { ok: true, cached: true };
    }
  }

  async function clearActivation() {
    await storeSet({
      [STORAGE_KEYS.activated]: false,
      [STORAGE_KEYS.key]: '',
      [STORAGE_KEYS.expires]: null
    });
  }

  async function ensureActivated(onOk) {
    window.__unlOnActivated = onOk;
    const check = await silentRevalidate();
    if (check.ok) {
      onOk();
    } else {
      await clearActivation();
      showWelcome();
    }
  }

  window.UNL_GATE = {
    ensureActivated: ensureActivated,
    showWelcome: showWelcome,
    clear: clearActivation
  };
})();