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
