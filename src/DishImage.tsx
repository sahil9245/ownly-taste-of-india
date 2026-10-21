import { useEffect, useState } from "react";

const probes = new Map<string, Promise<boolean>>();

function imageExists(src: string) {
  let probe = probes.get(src);
  if (!probe) {
    probe = new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
    probes.set(src, probe);
  }
  return probe;
}

function useImageIfExists(src: string) {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    if (!src) return;
    let alive = true;
    imageExists(src).then((exists) => alive && setOk(exists));
    return () => {
      alive = false;
    };
  }, [src]);
  return src && ok ? src : null;
}

function PlateMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <path d="M3 4v6M5 4v6M4 10v10M20 4v16M18 4v7h2" />
    </svg>
  );
}

// Shared by every dish card: the real photo when `src` exists, otherwise the soft pink plate placeholder. Fills its parent.
export default function DishImage({ src, size = 44, alt = "" }: { src: string; size?: number; alt?: string }) {
  const url = useImageIfExists(src);
  return <div className="dish-img">{url ? <img src={url} alt={alt} draggable={false} loading="lazy" decoding="async" /> : <PlateMark size={size} />}</div>;
}
