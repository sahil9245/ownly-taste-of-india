import { useEffect, useState } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "ownly-install-dismissed-at";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISSED_KEY));
    return at > 0 && Date.now() - at < SNOOZE_MS;
  } catch {
    return false;
  }
}

function isIosSafari() {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  return ios && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA/.test(ua);
}

export default function InstallPrompt() {
  const [mode, setMode] = useState<"android" | "ios" | null>(null);
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);

  useEffect(() => {
    if (isInstalled() || recentlyDismissed()) return;

    if (isIosSafari()) {
      setMode("ios");
      return;
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as InstallEvent);
      setMode("android");
    };
    const onInstalled = () => {
      setMode(null);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      /* storage unavailable */
    }
    setMode(null);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setMode(null);
  };

  if (!mode) return null;

  return (
    <div className="install-banner" role="dialog" aria-label="Install app">
      <style>{INSTALL_STYLES}</style>
      <div className="install-banner-text">
        {mode === "android" ? (
          <strong>Add Taste of India to your home screen</strong>
        ) : (
          <strong>Tap Share, then &lsquo;Add to Home Screen&rsquo;.</strong>
        )}
      </div>
      {mode === "android" && (
        <button type="button" className="install-banner-action" onClick={install}>
          Install
        </button>
      )}
      <button type="button" className="install-banner-close" aria-label="Dismiss" onClick={dismiss}>
        &times;
      </button>
    </div>
  );
}

const INSTALL_STYLES = String.raw`
.install-banner{position:fixed;z-index:1000;left:50%;transform:translateX(-50%);bottom:calc(12px + env(safe-area-inset-bottom));width:min(366px,calc(100% - 24px));display:flex;align-items:center;gap:10px;background:#1F1A1C;color:#fff;border-radius:16px;padding:10px 10px 10px 16px;font:600 13px/1.3 "Figtree",system-ui,sans-serif;box-shadow:0 10px 30px rgba(31,26,28,.35);-webkit-user-select:none;user-select:none}
.install-banner-text{flex:1}
.install-banner button{border:0;font:inherit;cursor:pointer}
.install-banner-action{background:#D81B60;color:#fff;border-radius:999px;min-height:36px;padding:0 16px;font-weight:800}
.install-banner-close{background:transparent;color:#fff;width:36px;height:36px;border-radius:50%;font-size:22px;line-height:1;opacity:.75}
`;
