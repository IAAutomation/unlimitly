// ============================================
// Unlimitly by Proflow Tools – Hardware Fingerprint
// Generates a stable activation fingerprint for THIS extension install.
// Important: one key must bind to one browser/extension install only.
// Hardware-only fingerprints can match across Chrome/Edge/Brave on the
// same computer, so we include a per-install secret stored in chrome.storage.
// ============================================

async function generateHardwareFingerprint() {
  const components = [];

  // 1. Screen properties (stable across browsers)
  try {
    components.push(
      "screen:" + screen.width + "x" + screen.height,
      "depth:" + screen.colorDepth,
      "pixelRatio:" + window.devicePixelRatio
    );
  } catch(e) {}

  // 2. Platform & CPU info (excludes User-Agent version)
  try {
    components.push("platform:" + navigator.platform);
    components.push("cores:" + (navigator.hardwareConcurrency || "unknown"));
    components.push("memory:" + (navigator.deviceMemory || "unknown"));
    components.push("maxTouchPoints:" + (navigator.maxTouchPoints || 0));
    // Language list is OS-level, stable across browsers
    components.push("langs:" + (navigator.languages || [navigator.language]).join(","));
  } catch(e) {}

  // 3. Timezone (OS-level setting)
  try {
    components.push("tz:" + Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch(e) {}

  // 4. WebGL renderer (GPU info - very stable)
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        components.push("gpu:" + gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
        components.push("gpuVendor:" + gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
      }
      components.push("glVersion:" + gl.getParameter(gl.VERSION));
      // Max texture size is hardware-dependent
      components.push("maxTexture:" + gl.getParameter(gl.MAX_TEXTURE_SIZE));
      components.push("maxViewport:" + gl.getParameter(gl.MAX_VIEWPORT_DIMS).join(","));
    }
  } catch(e) {}

  // 5. Canvas fingerprint (rendering differences per GPU/OS)
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("QLFingerprint", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("QLFingerprint", 4, 17);
      components.push("canvas:" + canvas.toDataURL().substring(0, 100));
    }
  } catch(e) {}

  // 6. Audio context fingerprint (hardware audio stack)
  try {
    const audioCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100);
    const oscillator = audioCtx.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(10000, audioCtx.currentTime);
    const compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, audioCtx.currentTime);
    compressor.knee.setValueAtTime(40, audioCtx.currentTime);
    compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
    compressor.attack.setValueAtTime(0, audioCtx.currentTime);
    compressor.release.setValueAtTime(0.25, audioCtx.currentTime);
    oscillator.connect(compressor);
    compressor.connect(audioCtx.destination);
    oscillator.start(0);

    const audioBuffer = await new Promise((resolve, reject) => {
      audioCtx.startRendering().then(resolve).catch(reject);
      setTimeout(() => reject(new Error("timeout")), 1000);
    });

    const audioData = audioBuffer.getChannelData(0);
    let audioHash = 0;
    for (let i = 4500; i < 5000; i++) {
      audioHash += Math.abs(audioData[i]);
    }
    components.push("audio:" + audioHash.toFixed(6));
  } catch(e) {}

  // 7. Available fonts detection (OS-level)
  try {
    const testFonts = [
      "monospace", "sans-serif", "serif",
      "Courier New", "Georgia", "Helvetica", "Times New Roman",
      "Trebuchet MS", "Verdana", "Impact", "Comic Sans MS",
      "Segoe UI", "Tahoma", "Calibri", "Consolas",
      "Lucida Console", "Palatino Linotype"
    ];
    const canvas = document.createElement("canvas");
    canvas.width = 500;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const baseWidths = {};
      const baseFonts = ["monospace", "sans-serif", "serif"];
      const testStr = "mmmmmmmmmmlli";

      baseFonts.forEach(bf => {
        ctx.font = "72px " + bf;
        baseWidths[bf] = ctx.measureText(testStr).width;
      });

      const detected = [];
      testFonts.forEach(font => {
        let found = false;
        baseFonts.forEach(bf => {
          ctx.font = "72px '" + font + "'," + bf;
          if (ctx.measureText(testStr).width !== baseWidths[bf]) found = true;
        });
        if (found) detected.push(font);
      });
      components.push("fonts:" + detected.join("|"));
    }
  } catch(e) {}

  // Generate SHA-256 hash of all components
  const raw = components.join("||");
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  return hashHex;
}

// Cache the fingerprint to avoid recalculation
let _cachedFingerprint = null;

function randomInstallId() {
  try {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
  } catch(e) {}
  return 'install-' + Math.random().toString(36).slice(2) + '-' + Date.now().toString(36);
}

async function sha256Hex(raw) {
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function getHardwareFingerprint() {
  if (_cachedFingerprint) return _cachedFingerprint;

  // Check storage first. ql_install_fingerprint_v2 is unique per browser
  // profile / extension install, so the same key cannot be reused in another
  // browser even on the same physical computer.
  return new Promise(async (resolve) => {
    chrome.storage.local.get(["ql_install_id_v2", "ql_install_fingerprint_v2"], async (res) => {
      if (res.ql_install_fingerprint_v2) {
        _cachedFingerprint = res.ql_install_fingerprint_v2;
        resolve(_cachedFingerprint);
      } else {
        try {
          const installId = res.ql_install_id_v2 || randomInstallId();
          let hardwareHash = '';
          try { hardwareHash = await generateHardwareFingerprint(); } catch(e) {}
          const fp = await sha256Hex('unlimitly-install-v2||' + installId + '||' + hardwareHash);
          _cachedFingerprint = fp;
          chrome.storage.local.set({
            ql_install_id_v2: installId,
            ql_install_fingerprint_v2: fp
          });
          resolve(fp);
        } catch(e) {
          // Fallback to random UUID if hashing/fingerprinting fails completely
          const fallback = randomInstallId();
          _cachedFingerprint = fallback;
          chrome.storage.local.set({
            ql_install_id_v2: fallback,
            ql_install_fingerprint_v2: fallback
          });
          resolve(fallback);
        }
      }
    });
  });
}
