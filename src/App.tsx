import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { ExtendedFeature, ExtendedFeatureCollection, GeoGeometryObjects } from "d3-geo";
import indiaStates from "./data/india-states.json";
import DishListing from "./DishListing";
import DishImage, { DISH_IMAGE_STYLES } from "./DishImage";
import { dishImagePath, slugify } from "./data/dishListings";

type Dish = { name: string; gem?: boolean };
type StateData = {
  name: string;
  tagline: string;
  image?: string;
  dishes: Dish[];
};
type Screen =
  | { type: "home" }
  | { type: "map" }
  | { type: "dish"; dish: Dish; stateCode: string }
  | { type: "listing"; dish: Dish; stateCode: string };

// All editable product content lives here.
const DATA = {
  states: {
    KA: {
      name: "Karnataka",
      tagline: "Ragi, rice and a coastline full of spice.",
      image: "",
      dishes: [
        { name: "Masala dosa" },
        { name: "Bisi bele bath" },
        { name: "Donne biryani" },
        { name: "Ragi mudde with soppu saaru", gem: true },
        { name: "Mangalore buns", gem: true },
        { name: "Kori rotti", gem: true },
        { name: "Coorg pandi curry", gem: true },
      ],
    },
    KL: {
      name: "Kerala",
      tagline: "Coconut, curry leaves and slow backwater simmers.",
      image: "",
      dishes: [
        { name: "Appam with stew" },
        { name: "Kerala parotta & beef fry" },
        { name: "Malabar biryani" },
        { name: "Puttu & kadala curry", gem: true },
        { name: "Kappa & meen curry", gem: true },
        { name: "Karimeen pollichathu", gem: true },
        { name: "Pazham pori", gem: true },
      ],
    },
    AP: {
      name: "Andhra Pradesh",
      tagline: "Fiery, tangy and unapologetically bold.",
      image: "",
      dishes: [
        { name: "Andhra meals" },
        { name: "Gongura mutton", gem: true },
        { name: "Pesarattu", gem: true },
        { name: "Guntur chilli chicken" },
        { name: "Ulavacharu chicken biryani", gem: true },
        { name: "Natu kodi pulusu", gem: true },
      ],
    },
    TG: {
      name: "Telangana",
      tagline: "Nawabi kitchens and Deccan chai.",
      image: "",
      dishes: [
        { name: "Hyderabadi dum biryani" },
        { name: "Haleem (seasonal)", gem: true },
        { name: "Mirchi ka salan" },
        { name: "Double ka meetha" },
        { name: "Qubani ka meetha", gem: true },
        { name: "Irani chai & Osmania biscuit", gem: true },
      ],
    },
    TN: {
      name: "Tamil Nadu",
      tagline: "Temple-town breakfasts and Chettinad pepper.",
      image: "",
      dishes: [
        { name: "Chettinad chicken" },
        { name: "Kothu parotta", gem: true },
        { name: "Ven pongal" },
        { name: "Idli with podi" },
        { name: "Dindigul biryani", gem: true },
        { name: "Kari dosa", gem: true },
      ],
    },
    PB: {
      name: "Punjab",
      tagline: "Butter, tandoor and big-hearted portions.",
      image: "",
      dishes: [
        { name: "Butter chicken" },
        { name: "Chole bhature" },
        { name: "Amritsari kulcha", gem: true },
        { name: "Sarson da saag & makki roti", gem: true },
        { name: "Dal makhani" },
        { name: "Lassi" },
      ],
    },
    MH: {
      name: "Maharashtra",
      tagline: "Street-smart snacks and Kolhapuri heat.",
      image: "",
      dishes: [
        { name: "Vada pav" },
        { name: "Misal pav", gem: true },
        { name: "Pav bhaji" },
        { name: "Kolhapuri mutton", gem: true },
        { name: "Puran poli", gem: true },
      ],
    },
    WB: {
      name: "West Bengal",
      tagline: "Mustard, fish and always a sweet ending.",
      image: "",
      dishes: [
        { name: "Kosha mangsho", gem: true },
        { name: "Kolkata biryani" },
        { name: "Kathi roll" },
        { name: "Shorshe ilish", gem: true },
        { name: "Mishti doi" },
      ],
    },
    UP: {
      name: "Uttar Pradesh",
      tagline: "Slow-cooked Awadhi elegance from Lucknow.",
      image: "",
      dishes: [
        { name: "Galouti kebab", gem: true },
        { name: "Awadhi biryani" },
        { name: "Nihari", gem: true },
      ],
    },
    GJ: {
      name: "Gujarat",
      tagline: "Sweet, savoury and served on a thali.",
      image: "",
      dishes: [{ name: "Gujarati thali" }, { name: "Khaman dhokla" }],
    },
  } satisfies Record<string, StateData>,
  map: [
    ["JK", "Jammu & Kashmir", 2, 0],
    ["PB", "Punjab", 1, 1],
    ["HP", "Himachal Pradesh", 2, 1],
    ["UK", "Uttarakhand", 3, 1],
    ["SK", "Sikkim", 5, 1],
    ["AR", "Arunachal Pradesh", 7, 1],
    ["RJ", "Rajasthan", 1, 2],
    ["HR", "Haryana", 2, 2],
    ["UP", "Uttar Pradesh", 3, 2],
    ["BR", "Bihar", 4, 2],
    ["AS", "Assam", 6, 2],
    ["NL", "Nagaland", 7, 2],
    ["GJ", "Gujarat", 0, 3],
    ["MP", "Madhya Pradesh", 1, 3],
    ["CG", "Chhattisgarh", 2, 3],
    ["JH", "Jharkhand", 3, 3],
    ["WB", "West Bengal", 4, 3],
    ["ML", "Meghalaya", 6, 3],
    ["MN", "Manipur", 7, 3],
    ["MH", "Maharashtra", 1, 4],
    ["TG", "Telangana", 2, 4],
    ["OD", "Odisha", 3, 4],
    ["TR", "Tripura", 6, 4],
    ["MZ", "Mizoram", 7, 4],
    ["GA", "Goa", 0, 5],
    ["KA", "Karnataka", 1, 5],
    ["AP", "Andhra Pradesh", 2, 5],
    ["KL", "Kerala", 1, 6],
    ["TN", "Tamil Nadu", 2, 6],
  ] as [string, string, number, number][],
  spinOrder: ["KA", "KL", "AP", "TG", "TN", "PB", "MH", "WB", "UP", "GJ"],
} as const;

const STORIES: Record<string, string> = {
  "Kappa & meen curry":
    "Soft, mashed tapioca paired with a fiery red fish curry. A toddy-shop classic from Kerala that tastes like home to many Malayalis.",
};

function Icon({
  name,
  size = 20,
}: {
  name: "back" | "spin" | "close" | "plate";
  size?: number;
}) {
  const paths: Record<string, React.ReactNode> = {
    back: <><path d="m15 18-6-6 6-6" /><path d="M9 12h10" /></>,
    spin: <><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 5v6h-6" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    plate: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><path d="M3 4v6M5 4v6M4 10v10M20 4v16M18 4v7h2" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function Photo({ label = "", src = "", large = false }: { label?: string; src?: string; large?: boolean }) {
  return (
    <div className={`photo ${large ? "large" : ""}`}>
      <DishImage src={src} alt={label} size={large ? 42 : 36} />
    </div>
  );
}

const LISTING_BASE = "/taste-of-india";

function listingPath(stateCode: string, dishName: string) {
  const state = DATA.states[stateCode as keyof typeof DATA.states];
  return `${LISTING_BASE}/${slugify(state.name)}/${slugify(dishName)}`;
}

function parseListingPath(pathname: string): { dish: Dish; stateCode: string } | null {
  const match = pathname.replace(/\/+$/, "").match(/^\/taste-of-india\/([^/]+)\/([^/]+)$/);
  if (!match) return null;
  const stateCode = Object.keys(DATA.states).find((code) => slugify(DATA.states[code as keyof typeof DATA.states].name) === match[1]);
  if (!stateCode) return null;
  const dish = (DATA.states[stateCode as keyof typeof DATA.states].dishes as Dish[]).find((item) => slugify(item.name) === match[2]);
  return dish ? { dish, stateCode } : null;
}

const INITIAL_LISTING = parseListingPath(window.location.pathname);

export default function App() {
  const [stack, setStack] = useState<Screen[]>(
    INITIAL_LISTING ? [{ type: "home" }, { type: "map" }, { type: "listing", ...INITIAL_LISTING }] : [{ type: "home" }],
  );
  const [exiting, setExiting] = useState(false);
  const [selected, setSelected] = useState<string | null>(INITIAL_LISTING?.stateCode ?? null);
  const [viewMode, setViewMode] = useState<"map" | "grid">("map");
  const [votes, setVotes] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [result, setResult] = useState<{ code: string; dish: Dish } | null>(null);
  const [burst, setBurst] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const timers = useRef<number[]>([]);
  const current = stack[stack.length - 1];
  const reducedMotion = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  const clearTimers = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  };

  useEffect(() => () => clearTimers(), []);
  useEffect(() => {
    if (current.type !== "map") {
      clearTimers();
      setSpinning(false);
      setHighlighted(null);
    }
  }, [current.type]);

  const push = (screen: Screen) => {
    setExiting(false);
    setStack((old) => [...old, screen]);
  };

  const popScreen = () => {
    if (stack.length === 1 || exiting) return;
    clearTimers();
    setExiting(true);
    window.setTimeout(() => {
      setStack((old) => old.slice(0, -1));
      setExiting(false);
    }, reducedMotion ? 0 : 190);
  };

  const back = () => {
    if (current.type === "listing") window.history.back();
    else popScreen();
  };

  const openDish = (dish: Dish, stateCode: string) => push({ type: "dish", dish, stateCode });

  const openListing = (dish: Dish, stateCode: string) => {
    window.history.pushState({ ownly: "listing" }, "", listingPath(stateCode, dish.name));
    push({ type: "listing", dish, stateCode });
  };

  const router = useRef({ current, popScreen, push });
  router.current = { current, popScreen, push };

  useEffect(() => {
    if (INITIAL_LISTING && window.history.state?.ownly !== "listing") {
      window.history.replaceState(null, "", "/");
      window.history.pushState({ ownly: "listing" }, "", window.location.pathname === "/" ? listingPath(INITIAL_LISTING.stateCode, INITIAL_LISTING.dish.name) : window.location.pathname);
    }
    const onPop = () => {
      const target = parseListingPath(window.location.pathname);
      const now = router.current.current;
      if (!target && now.type === "listing") router.current.popScreen();
      else if (target && now.type !== "listing") {
        setSelected(target.stateCode);
        setResult(null);
        router.current.push({ type: "listing", ...target });
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const finishSpin = (code: string) => {
    const state = DATA.states[code as keyof typeof DATA.states];
    const gems = state.dishes.filter((dish) => dish.gem);
    const choices = gems.length ? gems : state.dishes;
    const dish = choices[Math.floor(Math.random() * choices.length)];
    setSpinning(false);
    setHighlighted(null);
    setSelected(code);
    setResult({ code, dish });
    if (!reducedMotion) {
      setBurst(true);
      const id = window.setTimeout(() => setBurst(false), 650);
      timers.current.push(id);
    }
  };

  const startSpin = () => {
    if (spinning) return;
    clearTimers();
    setSelected(null);
    setResult(null);
    setSpinning(true);
    const start = Math.floor(Math.random() * DATA.spinOrder.length);
    const steps = 16 + Math.floor(Math.random() * 10);
    if (reducedMotion) {
      setHighlighted(DATA.spinOrder[start]);
      const id = window.setTimeout(() => finishSpin(DATA.spinOrder[(start + steps) % DATA.spinOrder.length]), 320);
      timers.current.push(id);
      return;
    }
    let elapsed = 0;
    for (let n = 0; n <= steps; n++) {
      elapsed += 50 + n * n * 0.55;
      const code = DATA.spinOrder[(start + n) % DATA.spinOrder.length];
      const id = window.setTimeout(() => {
        setHighlighted(code);
        try {
          navigator.vibrate?.(6);
        } catch {
          // Haptics are optional.
        }
      }, elapsed);
      timers.current.push(id);
    }
    const landed = DATA.spinOrder[(start + steps) % DATA.spinOrder.length];
    const id = window.setTimeout(() => finishSpin(landed), elapsed + 380);
    timers.current.push(id);
  };

  const selectState = (code: string) => {
    if (spinning) return;
    setResult(null);
    setHighlighted(null);
    setSelected((old) => (old === code ? null : code));
  };

  const vote = (code: string) => {
    setVotes((old) => new Set(old).add(code));
    const name = DATA.map.find((state) => state[0] === code)?.[1] ?? code;
    setToast(`Vote counted for ${name}`);
    window.setTimeout(() => setToast(""), 2200);
  };

  return (
    <>
      <style>{STYLES}</style>
      <main className={`stage${current.type === "home" ? " stage-home" : ""}`}>
        <div className={`phone ${exiting ? "page-exit" : "page-enter"}`}>
          {current.type === "home" && (
            <Home
              onOpenTaste={() => {
                setViewMode("map");
                push({ type: "map" });
              }}
            />
          )}
          {current.type === "map" && (
            <MapScreen
              onBack={back}
              selected={selected}
              highlighted={highlighted}
              spinning={spinning}
              result={result}
              burst={burst}
              viewMode={viewMode}
              votes={votes}
              onViewMode={setViewMode}
              onSelect={selectState}
              onClose={() => {
                setSelected(null);
                setResult(null);
              }}
              onVote={vote}
              onSpin={startSpin}
              onDish={openListing}
            />
          )}
          {current.type === "dish" && (
            <DishDetail
              dish={current.dish}
              stateCode={current.stateCode}
              onBack={back}
              onDish={openDish}
              cart={cart}
              setCart={setCart}
            />
          )}
          {current.type === "listing" && (
            <DishListing
              stateName={DATA.states[current.stateCode as keyof typeof DATA.states].name}
              stateCode={current.stateCode}
              dishName={current.dish.name}
              onBack={back}
              cart={cart}
              setCart={setCart}
            />
          )}
          {toast && <div className="toast" role="status">{toast}</div>}
        </div>
      </main>
    </>
  );
}

const DEBUG_TAP_AREA = new URLSearchParams(window.location.search).get("debug") === "1";

let homeScrollTop = 0;

function Home({ onOpenTaste }: { onOpenTaste: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = homeScrollTop;
  }, []);
  return (
    <div className="screen home-screen" ref={ref} onScroll={(event) => { homeScrollTop = event.currentTarget.scrollTop; }}>
      <div className="home-frame">
        <img className="home-image" src="/images/home.png" alt="Ownly home screen" draggable={false} />
        <button type="button" className={`home-tap${DEBUG_TAP_AREA ? " debug" : ""}`} aria-label="Open Taste of India" onClick={onOpenTaste} />
      </div>
    </div>
  );
}

type MapProps = {
  onBack: () => void;
  selected: string | null;
  highlighted: string | null;
  spinning: boolean;
  result: { code: string; dish: Dish } | null;
  burst: boolean;
  viewMode: "map" | "grid";
  votes: Set<string>;
  onViewMode: (mode: "map" | "grid") => void;
  onSelect: (code: string) => void;
  onClose: () => void;
  onVote: (code: string) => void;
  onSpin: () => void;
  onDish: (dish: Dish, stateCode: string) => void;
};

const SHEET_MAX_RATIO = 0.85;
const WELCOME_H_GUESS = 100;
const PIN_W = 26;
const PIN_H = 34;
const PIN_BOX = 44;
const SELECTED_SCALE = 1.15;
const LABEL_H = 19;
const LABEL_GAP = 4;
const PAN_MARGIN = 8;
const LABEL_BLEED = 6;

// [longitude, latitude] of each pin, tuned to sit inside its state without crowding neighbours.
const PIN_COORDS: Record<string, [number, number]> = {
  KA: [75.9, 14.6],
  KL: [76.25, 10.0],
  TN: [79.0, 10.9],
  AP: [79.1, 14.6],
  TG: [78.7, 18.2],
  MH: [75.8, 20.6],
  GJ: [71.5, 22.6],
  PB: [75.4, 30.8],
  UP: [80.5, 27.0],
  WB: [87.9, 23.0],
};

const GEO = indiaStates as unknown as ExtendedFeatureCollection<ExtendedFeature<GeoGeometryObjects, { name: string }>>;
const STATE_CODE_BY_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(DATA.states).map(([code, state]) => [state.name, code]),
);

type Rect = { l: number; t: number; r: number; b: number };
type PinPlace = { x: number; y: number; side: "l" | "r"; dy: number; labelW: number };
type MapGeo = {
  ps: number;
  paths: { name: string; code: string | null; d: string }[];
  pins: Record<string, PinPlace>;
  labelsFit: boolean;
  top: number;
};

let measureCtx: CanvasRenderingContext2D | null | undefined;
function labelWidth(text: string) {
  if (measureCtx === undefined) {
    try {
      measureCtx = document.createElement("canvas").getContext("2d");
      if (measureCtx) measureCtx.font = '700 10px "Figtree", system-ui, sans-serif';
    } catch {
      measureCtx = null;
    }
  }
  const textW = measureCtx ? measureCtx.measureText(text).width : text.length * 5.8;
  return Math.ceil(textW) + 18;
}

const overlaps = (a: Rect, b: Rect) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;

function buildGeo(w: number, h: number): MapGeo {
  const ps = Math.min(1, Math.max(0.85, w / 359));
  const pw = PIN_W * ps;
  const ph = PIN_H * ps;
  const projection = geoMercator().fitSize([w, h], GEO);
  const path = geoPath(projection);
  const paths = GEO.features.map((feature) => ({
    name: feature.properties.name,
    code: STATE_CODE_BY_NAME[feature.properties.name] ?? null,
    d: path(feature) ?? "",
  }));
  const bounds = path.bounds(GEO);

  const codes = Object.keys(PIN_COORDS);
  const pins: Record<string, PinPlace> = {};
  const pinRects: Record<string, Rect> = {};
  for (const code of codes) {
    const [x, y] = projection(PIN_COORDS[code]) ?? [0, 0];
    pins[code] = { x, y, side: "r", dy: 0, labelW: labelWidth(DATA.states[code as keyof typeof DATA.states].name) };
    pinRects[code] = { l: x - (pw * SELECTED_SCALE) / 2 - 1, r: x + (pw * SELECTED_SCALE) / 2 + 1, t: y - ph * SELECTED_SCALE - 1, b: y + 1 };
  }

  const labelRect = (p: PinPlace, side: "l" | "r", dy: number): Rect => {
    const cy = p.y - ph / 2 + dy;
    const l = side === "r" ? p.x + pw / 2 + LABEL_GAP : p.x - pw / 2 - LABEL_GAP - p.labelW;
    return { l, r: l + p.labelW, t: cy - LABEL_H / 2, b: cy + LABEL_H / 2 };
  };

  const placed: Rect[] = [];
  let labelsFit = true;
  // Preferred spots first: right of the pin, then left, then nudged further up or down.
  const candidates: ["l" | "r", number][] = [
    ["r", 0], ["r", -9], ["r", 9],
    ["l", 0], ["l", -9], ["l", 9],
    ["r", -18], ["l", -18], ["r", 18], ["l", 18],
    ["r", -27], ["l", -27], ["r", 27], ["l", 27],
  ];
  for (const code of [...codes].sort((a, b) => pins[a].y - pins[b].y)) {
    const p = pins[code];
    const free = candidates.find(([side, dy]) => {
      const rect = labelRect(p, side, dy);
      if (rect.l < -LABEL_BLEED || rect.r > w + LABEL_BLEED) return false;
      if (placed.some((other) => overlaps(rect, other))) return false;
      return !codes.some((other) => overlaps(rect, pinRects[other]));
    });
    if (free) {
      p.side = free[0];
      p.dy = free[1];
      placed.push(labelRect(p, free[0], free[1]));
    } else {
      labelsFit = false;
      const room = candidates.find(([side, dy]) => !codes.some((other) => overlaps(labelRect(p, side, dy), pinRects[other])));
      if (room) {
        p.side = room[0];
        p.dy = room[1];
      }
    }
  }
  return { ps, paths, pins, labelsFit, top: bounds[0][1] };
}

type MapDims = { fitW: number; fitH: number; bottomY: number; screenH: number };

function mapOffset(d: MapDims, sheetH: number, geo: MapGeo, pin: string | null, open: boolean) {
  if (!open || !pin || !geo.pins[pin]) return 0;
  const py = geo.pins[pin].y;
  const available = d.bottomY - sheetH - PAN_MARGIN;
  const ideal = available / 2 + PIN_H / 2 - py;
  const topLimit = PAN_MARGIN - geo.top;
  const pinTop = PIN_H * SELECTED_SCALE + PAN_MARGIN + 4;
  return Math.max(Math.min(ideal, topLimit), pinTop - py);
}

function MapScreen(props: MapProps) {
  const { viewMode, selected, result, spinning, onClose } = props;
  const screenRef = useRef<HTMLDivElement>(null);
  const fitRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<MapDims | null>(null);
  const [sheetH, setSheetH] = useState(0);
  const [welcomeH, setWelcomeH] = useState(WELCOME_H_GUESS);
  const open = !spinning && (selected !== null || result !== null);
  const welcome = viewMode === "map" && !open;
  const shown = useRef({ selected, result });
  if (open) shown.current = { selected, result };

  useLayoutEffect(() => {
    const screen = screenRef.current;
    if (!screen) return;
    const fit = fitRef.current;
    const measure = () => {
      const s = screen.getBoundingClientRect();
      const f = fit?.getBoundingClientRect();
      const next = {
        screenH: s.height,
        fitW: f?.width ?? 0,
        fitH: f?.height ?? 0,
        bottomY: f ? s.bottom - f.top : 0,
      };
      setDims((old) => (old && old.screenH === next.screenH && old.fitW === next.fitW && old.fitH === next.fitH && old.bottomY === next.bottomY ? old : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(screen);
    if (fit) observer.observe(fit);
    return () => observer.disconnect();
  }, [viewMode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const fitW = dims?.fitW ?? 0;
  const fitH = dims?.fitH ?? 0;
  const geo = useMemo(() => (fitW > 0 && fitH > 0 ? buildGeo(fitW, fitH) : null), [fitW, fitH]);
  const offsetY = dims && geo ? mapOffset(dims, sheetH, geo, selected, open) : 0;

  return (
    <div
      ref={screenRef}
      className={`screen map-screen${open ? " sheet-open" : ""}`}
      style={dims ? ({ "--sheet-max": `${dims.screenH * SHEET_MAX_RATIO}px`, "--sheet-h": `${sheetH}px`, "--welcome-h": `${welcomeH}px` } as React.CSSProperties) : undefined}
    >
      <header className="map-header">
        <button type="button" className="circle-button" aria-label="Back" onClick={props.onBack}><Icon name="back" /></button>
        <div className="map-heading"><h1>Taste of India</h1><p>10 states delivering in Bengaluru</p></div>
        <div className="segment" aria-label="View">
          <button type="button" className={viewMode === "map" ? "active" : ""} onClick={() => !spinning && props.onViewMode("map")}>Map</button>
          <button type="button" className={viewMode === "grid" ? "active" : ""} onClick={() => props.onViewMode("grid")}>Grid</button>
        </div>
      </header>
      {viewMode === "map" ? (
        <div
          className="map-stage"
          onClick={(event) => {
            if (!(event.target as Element).closest(".map-pin, .state-shape.live")) onClose();
          }}
        >
          <div className="map-fit" ref={fitRef}>
            {geo && <IndiaMap {...props} geo={geo} width={fitW} height={fitH} offsetY={offsetY} />}
          </div>
        </div>
      ) : (
        <StateGrid selected={selected} highlighted={props.highlighted} spinning={spinning} open={open} sheetH={sheetH} onSelect={props.onSelect} />
      )}
      {viewMode === "grid" && <div className="surprise-float"><SurpriseButton spinning={spinning} onSpin={props.onSpin} /></div>}
      <Sheet
        {...shown.current}
        open={open || welcome}
        welcome={welcome}
        returnsToWelcome={viewMode === "map"}
        onHeight={setSheetH}
        onWelcomeHeight={setWelcomeH}
        votes={props.votes}
        onClose={onClose}
        onVote={props.onVote}
        onDish={props.onDish}
      />
    </div>
  );
}

function SurpriseButton({ spinning, onSpin }: { spinning: boolean; onSpin: () => void }) {
  return (
    <button type="button" className="surprise-btn" onClick={onSpin} disabled={spinning}>
      <span className={`surprise-icon${spinning ? " spinning" : ""}`}><Icon name="spin" size={20} /></span>
      {spinning ? "Spinning…" : "Surprise me"}
    </button>
  );
}

function PinIcon({ scale }: { scale: number }) {
  return (
    <svg className="pin-icon" width={PIN_W * scale} height={PIN_H * scale} viewBox="0 0 26 34" aria-hidden="true" focusable="false">
      <path d="M13 33C13 33 2 21 2 12.5C2 6.4 6.9 1.5 13 1.5S24 6.4 24 12.5C24 21 13 33 13 33Z" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="13" cy="12.5" r="4.2" fill="#fff" />
    </svg>
  );
}

function IndiaMap({
  geo,
  width,
  height,
  offsetY,
  selected,
  onSelect,
}: Pick<MapProps, "selected" | "onSelect"> & { geo: MapGeo; width: number; height: number; offsetY: number }) {
  const stateClass = (code: string | null) => {
    if (!code) return "state-shape";
    return `state-shape live${code === selected ? " selected" : ""}`;
  };
  const ordered = [...DATA.spinOrder].sort((a, b) => geo.pins[a].y - geo.pins[b].y);
  return (
    <div className={`map-canvas${geo.labelsFit ? "" : " no-labels"}`} style={{ transform: `translateY(${offsetY}px)` }}>
      <svg className="map-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Map of India with the states available on Ownly">
        <g>
          {geo.paths.filter((p) => p.code !== selected).map((p) => (
            <path key={p.name} className={stateClass(p.code)} d={p.d} onClick={p.code ? () => onSelect(p.code as string) : undefined} />
          ))}
          {geo.paths.filter((p) => p.code === selected).map((p) => (
            <path key={p.name} className={stateClass(p.code)} d={p.d} onClick={p.code ? () => onSelect(p.code as string) : undefined} />
          ))}
        </g>
      </svg>
      {ordered.map((code) => {
        const name = DATA.states[code as keyof typeof DATA.states].name;
        const pin = geo.pins[code];
        const isSelected = selected === code;
        const labelTop = PIN_BOX - (PIN_H * geo.ps) / 2 + pin.dy - LABEL_H / 2;
        const labelStyle: React.CSSProperties =
          pin.side === "r"
            ? { left: PIN_BOX / 2 + (PIN_W * geo.ps) / 2 + LABEL_GAP, top: labelTop }
            : { right: PIN_BOX / 2 + (PIN_W * geo.ps) / 2 + LABEL_GAP, top: labelTop };
        return (
          <button
            type="button"
            key={code}
            className={`map-pin${isSelected ? " selected" : ""}`}
            style={{ left: pin.x - PIN_BOX / 2, top: pin.y - PIN_BOX }}
            aria-label={`${name} – explore its food`}
            aria-pressed={isSelected}
            onClick={() => onSelect(code)}
          >
            <PinIcon scale={geo.ps} />
            <b style={labelStyle}>{name}</b>
          </button>
        );
      })}
    </div>
  );
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function StateGrid({
  selected,
  highlighted,
  spinning,
  open,
  sheetH,
  onSelect,
}: Pick<MapProps, "selected" | "highlighted" | "spinning" | "onSelect"> & { open: boolean; sheetH: number }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const behavior = () => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth") as ScrollBehavior;

  useEffect(() => {
    if (!spinning || !highlighted) return;
    gridRef.current?.querySelector(`[data-code="${highlighted}"]`)?.scrollIntoView({ block: "nearest", behavior: behavior() });
  }, [spinning, highlighted]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || !open || !selected) return;
    const card = grid.querySelector(`[data-code="${selected}"]`);
    if (!card) return;
    const g = grid.getBoundingClientRect();
    const c = card.getBoundingClientRect();
    const visibleBottom = g.bottom - sheetH - 12;
    const delta = c.bottom > visibleBottom ? c.bottom - visibleBottom : c.top < g.top + 8 ? c.top - g.top - 8 : 0;
    if (delta) grid.scrollBy({ top: delta, behavior: behavior() });
  }, [selected, open, sheetH]);

  return (
    <div className="state-grid" ref={gridRef}>
      {DATA.spinOrder.map((code) => {
        const state: StateData = DATA.states[code as keyof typeof DATA.states];
        const gems = state.dishes.filter((dish) => dish.gem).length;
        const favourites = plural(state.dishes.length, "local favourite", "local favourites");
        const isSelected = selected === code && !spinning;
        const isHighlight = highlighted === code && spinning;
        return (
          <button
            type="button"
            key={code}
            data-code={code}
            className={`grid-card${isSelected ? " selected" : ""}${isHighlight ? " highlight" : ""}`}
            aria-label={`${state.name}, ${favourites}`}
            aria-pressed={isSelected}
            onClick={() => onSelect(code)}
          >
            <span className="grid-image">
              <DishImage src={state.image ?? ""} />
              {gems > 0 && <span className="grid-badge">{plural(gems, "hidden gem", "hidden gems")}</span>}
            </span>
            <strong>{state.name}</strong>
            <small>{state.tagline}</small>
            <em>{favourites}</em>
          </button>
        );
      })}
    </div>
  );
}

type SheetProps = Pick<MapProps, "selected" | "result" | "votes" | "onClose" | "onVote" | "onDish"> & {
  open: boolean;
  welcome: boolean;
  returnsToWelcome: boolean;
  onHeight: (height: number) => void;
  onWelcomeHeight: (height: number) => void;
};

function Sheet(props: SheetProps) {
  const { open, welcome, selected, result, onClose, onHeight } = props;
  const sheetRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const latest = useRef({ open, welcome, returnsToWelcome: props.returnsToWelcome, onClose, onHeight, onWelcomeHeight: props.onWelcomeHeight });
  latest.current = { open, welcome, returnsToWelcome: props.returnsToWelcome, onClose, onHeight, onWelcomeHeight: props.onWelcomeHeight };
  const contentKey = welcome ? "welcome" : `${selected}-${result?.dish.name ?? ""}`;

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    const inner = innerRef.current;
    if (!sheet || !inner) return;
    const fit = (snap: boolean) => {
      const h = Math.ceil(inner.getBoundingClientRect().height);
      if (snap) {
        sheet.classList.add("snap");
        sheet.style.height = `${h}px`;
        void sheet.offsetHeight;
        sheet.classList.remove("snap");
      } else if (sheet.style.height !== `${h}px`) {
        sheet.style.height = `${h}px`;
      }
      latest.current.onHeight(h);
      if (latest.current.welcome) latest.current.onWelcomeHeight(h);
    };
    fit(!wasOpen.current);
    wasOpen.current = open;
    const observer = new ResizeObserver(() => fit(false));
    observer.observe(inner);
    return () => observer.disconnect();
  }, [open, contentKey]);

  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    let tracking = false;
    let dragging = false;
    let fromHandle = false;
    let inScroll = false;
    let scrollTop0 = 0;
    let startX = 0;
    let startY = 0;
    let lastY = 0;
    let lastT = 0;
    let vel = 0;

    const begin = (y: number) => {
      startY = lastY = y;
      lastT = performance.now();
      vel = 0;
      dragging = true;
      el.classList.add("dragging");
    };
    const move = (y: number) => {
      el.style.transform = `translateY(${Math.max(0, y - startY)}px)`;
      const now = performance.now();
      if (now > lastT) vel = 0.5 * vel + 0.5 * ((y - lastY) / (now - lastT));
      lastY = y;
      lastT = now;
    };
    const end = () => {
      tracking = false;
      if (!dragging) return;
      dragging = false;
      const dist = lastY - startY;
      el.classList.remove("dragging");
      if (vel > 0.5 || dist > Math.min(80, el.offsetHeight * 0.3)) {
        el.style.transform = latest.current.returnsToWelcome ? "none" : "translateY(100%)";
        latest.current.onClose();
      } else {
        el.style.transform = "none";
      }
      window.setTimeout(() => {
        el.style.transform = "";
      }, 320);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (!latest.current.open || latest.current.welcome || event.touches.length !== 1) return;
      const touch = event.touches[0];
      const target = event.target as Element;
      const scroller = target.closest(".sheet-scroll") as HTMLElement | null;
      startX = touch.clientX;
      startY = touch.clientY;
      fromHandle = !!target.closest(".grab-zone");
      inScroll = !!scroller;
      scrollTop0 = scroller ? scroller.scrollTop : 0;
      tracking = true;
      dragging = false;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (!tracking) return;
      const touch = event.touches[0];
      if (!dragging) {
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        if (Math.abs(dx) > Math.abs(dy) || dy < 0 || !(fromHandle || !inScroll || scrollTop0 <= 0)) {
          tracking = false;
          return;
        }
        begin(touch.clientY);
      }
      if (event.cancelable) event.preventDefault();
      move(touch.clientY);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0 || !latest.current.open || latest.current.welcome) return;
      if (!(event.target as Element).closest(".grab-zone")) return;
      tracking = true;
      begin(event.clientY);
      const onMove = (e: PointerEvent) => move(e.clientY);
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        end();
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", end);
    el.addEventListener("touchcancel", end);
    el.addEventListener("pointerdown", onPointerDown);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", end);
      el.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  const stateInfo = selected ? DATA.map.find(([code]) => code === selected) : undefined;
  const liveState = selected && selected in DATA.states ? DATA.states[selected as keyof typeof DATA.states] : null;

  const node = welcome ? (
    <div className="welcome">
      <span className="welcome-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" fill="currentColor" /><circle cx="12" cy="10" r="2.6" fill="#FDE7F0" /></svg>
      </span>
      <div className="welcome-text">
        <strong>India’s regional food, all in one place.</strong>
        <span>Tap a state to explore its dishes and order.</span>
      </div>
    </div>
  ) : result ? (
    <ResultCard result={result} onDish={props.onDish} />
  ) : liveState && selected ? (
    <div className="selected-state">
      <h2>{liveState.name}</h2>
      <p>{liveState.tagline}</p>
      <div className="meta">{liveState.dishes.length} local favourites · [X] restaurants near you</div>
      <div className="dish-row">
        {liveState.dishes.map((dish) => (
          <button type="button" className="dish-card" key={dish.name} onClick={() => props.onDish(dish, selected)}>
            <div className="dish-image"><DishImage src={dishImagePath(dish.name)} size={36} />{dish.gem && <span>Hidden gem</span>}</div>
            <strong>{dish.name}</strong>
          </button>
        ))}
      </div>
    </div>
  ) : selected && stateInfo ? (
    <div className="coming-state">
      <h2>{stateInfo[1]}</h2>
      <p>Not on Ownly in Bengaluru yet. Tell us you want it and we’ll bring its kitchens on board.</p>
      <button type="button" className={`vote-button ${props.votes.has(selected) ? "voted" : ""}`} onClick={() => props.onVote(selected)} disabled={props.votes.has(selected)}>
        {props.votes.has(selected) ? "Thanks — we’ll let you know" : "I want this in Bengaluru"}
      </button>
    </div>
  ) : null;

  const prev = useRef({ key: contentKey, node, open });
  const [outgoing, setOutgoing] = useState<{ node: React.ReactNode } | null>(null);
  useLayoutEffect(() => {
    const p = prev.current;
    if (p.key !== contentKey && p.open && open && (p.key === "welcome" || contentKey === "welcome")) setOutgoing({ node: p.node });
    prev.current = { key: contentKey, node, open };
  });
  useEffect(() => {
    if (!outgoing) return;
    const timer = window.setTimeout(() => setOutgoing(null), 200);
    return () => window.clearTimeout(timer);
  }, [outgoing]);

  return (
    <section
      ref={sheetRef}
      className={`sheet${open ? " open" : ""}${welcome ? " welcome-mode" : ""}`}
      aria-label={welcome ? "Welcome" : "State details"}
      aria-hidden={!open}
      inert={!open}
    >
      <div className="sheet-inner" ref={innerRef}>
        <div className="grab-zone" aria-hidden="true"><div className="grab" /></div>
        <button type="button" className="sheet-close" aria-label="Close state" onClick={onClose}><Icon name="close" size={18} /></button>
        <div className="sheet-body">
          <div className="sheet-scroll" key={contentKey}>{node}</div>
          {outgoing && <div className="sheet-scroll out" aria-hidden="true" inert>{outgoing.node}</div>}
        </div>
      </div>
    </section>
  );
}

function ResultCard({ result, onDish }: { result: { code: string; dish: Dish }; onDish: (dish: Dish, code: string) => void }) {
  const state = DATA.states[result.code as keyof typeof DATA.states];
  return (
    <div className="result-state">
      <span className="eyebrow">INDIA PICKED</span>
      <h2>{state.name}</h2>
      <div className="result-card">
        <Photo src={dishImagePath(result.dish.name)} label={result.dish.name} />
        <div><strong>{result.dish.name}</strong><p>{state.tagline}</p><b>First-try offer: [OFFER]</b></div>
      </div>
      <button type="button" className="dark-button" onClick={() => onDish(result.dish, result.code)}>See where to order</button>
    </div>
  );
}

function DishDetail({
  dish,
  stateCode,
  onBack,
  onDish,
  cart,
  setCart,
}: {
  dish: Dish;
  stateCode: string;
  onBack: () => void;
  onDish: (dish: Dish, stateCode: string) => void;
  cart: Record<string, number>;
  setCart: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}) {
  const state = DATA.states[stateCode as keyof typeof DATA.states];
  const story = STORIES[dish.name] || `${dish.name} is a much-loved taste of ${state.name}. ${state.tagline} A delicious regional favourite worth discovering.`;
  const isKappa = dish.name === "Kappa & meen curry";
  const cartKey = (row: number) => `${stateCode}:${dish.name}:${row}`;
  const totalQty = [0, 1, 2].reduce((total, row) => total + (cart[cartKey(row)] || 0), 0);
  const changeQty = (row: number, amount: number) =>
    setCart((old) => ({
      ...old,
      [cartKey(row)]: Math.max(0, (old[cartKey(row)] || 0) + amount),
    }));
  return (
    <div className="screen detail-screen">
      <div className="detail-hero">
        <Photo label={dish.name} src={dishImagePath(dish.name)} large />
        <button type="button" className="circle-button hero-back" aria-label="Back" onClick={onBack}><Icon name="back" /></button>
        <span className="gem-badge">{dish.gem ? "Hidden gem" : "Regional favourite"} · {state.name}</span>
      </div>
      <div className="detail-scroll">
        <h1>{dish.name}</h1>
        <p className="pronunciation">{isKappa ? "Say it: KAP-pa and MEEN curry" : `From ${state.name}`}</p>
        <p className="story">{story}</p>
        <div className="tag-row">
          <span>Spice: {isKappa ? "Hot" : "Ask the kitchen"}</span>
          <span>{isKappa ? "Non-veg · Fish" : "Regional speciality"}</span>
          <span>{isKappa ? "If you like fish curry rice" : `A taste of ${state.name}`}</span>
        </div>
        <div className="offer"><strong>First time trying it?</strong><span>Get [OFFER] off your first order.</span></div>
        <section className="restaurants">
          <h2>Serving it near you</h2><p>Sorted by delivery time</p>
          {[0, 1, 2].map((row) => {
            const rowQty = cart[cartKey(row)] || 0;
            return (
              <div className="restaurant-row" key={row}>
                <div className="thumb"><DishImage src={dishImagePath(dish.name)} size={28} /></div>
                <div><strong>[Restaurant name]</strong><span>[Area] · [XX] min · ₹[PRICE]</span></div>
                {rowQty === 0 ? (
                  <button type="button" className="add-button" onClick={() => changeQty(row, 1)}>Add</button>
                ) : (
                  <div className="stepper">
                    <button type="button" aria-label="Remove one" onClick={() => changeQty(row, -1)}>−</button><span>{rowQty}</span><button type="button" aria-label="Add one" onClick={() => changeQty(row, 1)}>+</button>
                  </div>
                )}
              </div>
            );
          })}
        </section>
        <section className="more-section">
          <h2>More from {state.name}</h2>
          <div className="chips">
            {state.dishes.filter((item) => item.name !== dish.name).slice(0, 5).map((item) => <button type="button" className="chip" key={item.name} onClick={() => onDish(item, stateCode)}>{item.name}</button>)}
          </div>
        </section>
      </div>
      {totalQty > 0 && <button type="button" className="cart-bar"><span>View cart</span><b>{totalQty} item{totalQty > 1 ? "s" : ""}</b></button>}
    </div>
  );
}

const STYLES = String.raw`
${DISH_IMAGE_STYLES}
@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap');
:root{font-family:"Figtree",sans-serif;color:#1F1A1C;background:#F5F2F3;font-synthesis:none}
*{box-sizing:border-box}
body{margin:0;min-width:320px;background:#F5F2F3}
button{font:inherit;color:inherit}
button:focus-visible{outline:3px solid #FFB300;outline-offset:2px}
.stage{min-height:100dvh;display:grid;place-items:center}
.phone{width:390px;height:844px;max-width:100vw;max-height:100dvh;background:#fff;overflow:hidden;position:relative;box-shadow:0 18px 50px rgba(74,35,51,.14)}
.screen{height:100%;display:flex;flex-direction:column;background:#fff}
.stage-home{background:#fff}
.home-screen{overflow-y:auto;overflow-x:hidden;background:#fff;scrollbar-width:none}.home-screen::-webkit-scrollbar{display:none}
.home-frame{position:relative;width:100%;flex:none;line-height:0}
.home-image{display:block;width:100%;height:auto;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.home-tap{position:absolute;left:4.2%;top:41.6%;width:18.3%;height:8.7%;padding:0;border:0;border-radius:20px;background:transparent;-webkit-tap-highlight-color:transparent;transition:background-color .12s ease-out}
.home-tap:active{background:rgba(0,0,0,.08)}
.home-tap.debug{outline:2px solid rgba(216,27,96,.7);outline-offset:0;background:rgba(216,27,96,.12)}
.page-enter{animation:slide-in .22s ease-out}.page-exit{animation:slide-out .2s ease-in forwards}
@keyframes slide-in{from{transform:translateX(36px);opacity:.6}to{transform:none;opacity:1}}
@keyframes slide-out{to{transform:translateX(100%);opacity:.5}}
.eyebrow{font-size:10px;font-weight:800;letter-spacing:.09em;color:#8E0F3F}
.photo{height:96px;background:#FDE7F0;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;color:#8E0F3F;font-size:10px;font-weight:700;overflow:hidden}.photo img{width:100%;height:100%;object-fit:cover;display:block}.photo.warm{background:#FFF1D6;color:#725000}.photo.large{height:240px;border-radius:0;font-size:12px}.photo.large img{object-position:center 56%}
.chips{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none}.chip{border:1px solid #E3DDE0;background:#fff;border-radius:999px;min-height:44px;padding:8px 15px;white-space:nowrap;font-size:13px;font-weight:700}
.map-screen{background:#FFF7FA;position:relative;overflow:hidden}.map-header{flex:none;background:#fff;padding:15px 16px 12px;display:grid;grid-template-columns:44px 1fr auto;align-items:start;gap:10px;border-bottom:1px solid #EDE7EA}
.circle-button{width:44px;height:44px;border-radius:50%;border:1px solid #EDE7EA;background:#fff;display:grid;place-items:center;padding:0;flex:none}
.map-heading h1{font-size:20px;line-height:1.1;margin:3px 0 3px;font-weight:800}.map-heading p{font-size:11px;color:#5F5A5C;margin:0}
.segment{display:flex;background:#F5F2F3;border-radius:999px;padding:3px;margin-top:2px}.segment button{height:44px;min-width:52px;border:0;background:transparent;border-radius:999px;font-size:12px;font-weight:700}.segment button.active{background:#fff;color:#8E0F3F}
.map-stage{flex:1;min-height:0;position:relative;overflow:hidden;background:#FFF7FA;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.map-fit{position:absolute;left:8px;right:8px;top:0;bottom:calc(var(--welcome-h,0px) + 4px)}.map-canvas{position:absolute;inset:0;transition:transform .25s ease-out}.map-svg{position:absolute;left:0;top:0;display:block;overflow:visible}
.state-shape{fill:#ECE5E8;stroke:#fff;stroke-width:.8px;stroke-linejoin:round;transition:fill .15s ease-out;pointer-events:none}.state-shape.live{fill:#F8D2E1;pointer-events:auto;cursor:pointer;-webkit-tap-highlight-color:transparent}.state-shape.live.selected{fill:#F08DB4}
.map-pin{position:absolute;width:44px;height:44px;padding:0;border:0;border-radius:12px;background:transparent;display:flex;align-items:flex-end;justify-content:center;z-index:2;outline:none;-webkit-tap-highlight-color:transparent}.map-pin:focus{outline:none}.map-pin:focus-visible{outline:2px solid #1F1A1C;outline-offset:1px}
.pin-icon{display:block;fill:#D81B60;stroke:#fff;filter:drop-shadow(0 2px 2px rgba(74,35,51,.35));transform-origin:50% 100%;transition:transform .12s ease-out,fill .15s ease-out;pointer-events:none}.map-pin.selected{z-index:4}.map-pin.selected .pin-icon{fill:#8E0F3F;transform:scale(1.15)}
.map-pin>b{position:absolute;box-sizing:border-box;height:19px;display:flex;align-items:center;padding:0 8px;background:#fff;border:1px solid #E8DDE1;border-radius:999px;color:#4E484B;font-size:10px;font-weight:700;line-height:1;white-space:nowrap;box-shadow:0 2px 6px rgba(75,32,50,.14);pointer-events:none;transition:background .15s ease-out,color .15s ease-out}.map-pin.selected>b{background:#8E0F3F;border-color:#8E0F3F;color:#fff}.no-labels .map-pin:not(.selected):not(.highlight)>b{display:none}
.sheet{position:absolute;left:0;right:0;bottom:0;z-index:6;max-height:85%;background:#fff;border-radius:28px 28px 0 0;overflow:hidden;box-shadow:0 -10px 30px rgba(74,35,51,.14);transform:translateY(100%);visibility:hidden;transition:transform .25s ease-out,height .2s ease-out,visibility 0s linear .25s}.sheet.open{transform:none;visibility:visible;transition:transform .25s ease-out,height .2s ease-out,visibility 0s}.sheet.snap{transition:transform .25s ease-out,visibility 0s!important}
.sheet-inner{display:flex;flex-direction:column;max-height:var(--sheet-max,85vh)}
.sheet-body{position:relative;display:flex;flex-direction:column;flex:1 1 auto;min-height:0}.sheet-scroll.out{position:absolute;left:0;right:0;top:0;overflow:hidden;flex:none;pointer-events:none;animation:sheet-out .18s ease-out forwards}@keyframes sheet-out{to{opacity:0}}
.sheet-close{transition:opacity .18s ease-out,visibility 0s}.welcome-mode .sheet-close{opacity:0;visibility:hidden;pointer-events:none;transition:opacity .18s ease-out,visibility 0s .18s}

.welcome{display:flex;align-items:center;gap:12px;margin:-1px 2px 0}.welcome-icon{flex:none;width:40px;height:40px;border-radius:50%;background:#FDE7F0;color:#D81B60;display:grid;place-items:center}.welcome-text{min-width:0}.welcome-text strong{display:block;text-wrap:balance;font-size:17px;line-height:1.3;font-weight:700;color:#1F1A1C}.welcome-text span{display:block;margin-top:2px;font-size:14px;line-height:1.35;font-weight:400;color:#5F5A5C}
.sheet.dragging{transition:none!important}.grab-zone{height:44px;margin:0 auto -8px;width:calc(100% - 128px);flex:none;display:grid;place-items:center;touch-action:none;cursor:grab}.grab{width:38px;height:4px;border-radius:99px;background:#D8D0D4}.sheet-scroll{padding:5px 18px calc(20px + env(safe-area-inset-bottom));overflow-y:auto;flex:1 1 auto;min-height:0;animation:sheet-content .18s ease-out;scrollbar-width:none}@keyframes sheet-content{from{opacity:0;transform:translateY(7px)}}.surprise-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:52px;min-width:44px;padding:0 26px;border:0;border-radius:999px;background:#D81B60;color:#fff;font-size:15px;font-weight:800;box-shadow:0 10px 24px rgba(216,27,96,.32),0 2px 6px rgba(74,35,51,.16)}.surprise-btn:disabled{background:#E34B83}.surprise-icon{display:grid}.surprise-icon.spinning{animation:spin-icon .9s linear infinite}@keyframes spin-icon{to{transform:rotate(-360deg)}}
.surprise-float{position:absolute;z-index:4;left:50%;bottom:calc(16px + env(safe-area-inset-bottom));transform:translateX(-50%);transition:opacity .2s ease-out,visibility 0s}.sheet-open .surprise-float{opacity:0;visibility:hidden;pointer-events:none;transition:opacity .2s ease-out,visibility 0s .2s}
.dark-button{border:0;border-radius:14px;background:#1F1A1C;color:#fff;width:100%;height:50px;font-weight:800;display:flex;align-items:center;justify-content:center;gap:8px}
.coming-state h2,.selected-state h2,.result-state h2{font-size:22px;line-height:1.15;margin:3px 44px 7px 0}.coming-state p,.selected-state>p{font-size:13px;line-height:1.45;color:#5F5A5C;margin:0}
.sheet-close{position:absolute;z-index:2;right:10px;top:4px;width:44px;height:44px;border-radius:50%;border:0;background:#F5F2F3;display:grid;place-items:center}.meta{font-size:11px;color:#8E0F3F;font-weight:700;margin:8px 0 10px}
.dish-row{display:flex;gap:10px;overflow-x:auto;scrollbar-width:none;padding:1px 3px 6px 1px}.dish-card{border:0;background:#fff;padding:0;width:128px;min-width:128px;text-align:left;border-radius:14px;overflow:hidden;box-shadow:0 4px 14px rgba(74,35,51,.07)}.dish-image{height:84px;border-radius:13px 13px 0 0;background:#FDE7F0;color:#8E0F3F;display:grid;place-items:center;position:relative;overflow:hidden}.dish-image img{width:100%;height:100%;object-fit:cover}.dish-image span{position:absolute;left:6px;bottom:6px;background:#1F1A1C;color:#fff;border-radius:999px;font-size:8px;padding:4px 6px;font-weight:800}.dish-card strong{font-size:12px;line-height:1.2;display:block;padding:8px}
.vote-button{height:48px;width:100%;border:2px solid #8E0F3F;color:#8E0F3F;background:#fff;border-radius:14px;margin-top:15px;font-weight:800}.vote-button.voted{background:#E3DDE0;border-color:transparent;color:#4E484B}
.result-state h2{margin:2px 0 8px}.result-card{display:grid;grid-template-columns:96px 1fr;gap:11px;align-items:center}.result-card .photo{height:100px}.result-card strong{display:block;font-size:16px}.result-card p{font-size:11px;color:#5F5A5C;line-height:1.35;margin:4px 0}.result-card b{font-size:11px;color:#8E0F3F}.dark-button{height:44px;background:#1F1A1C;margin-top:9px}
.state-grid{flex:1;min-height:0;overflow-y:auto;padding:16px 16px calc(92px + env(safe-area-inset-bottom));background:#FFF7FA;scrollbar-width:none;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-content:start}
.sheet-open .state-grid{padding-bottom:calc(var(--sheet-h,55%) + 16px)}
.grid-card{display:flex;flex-direction:column;align-items:stretch;text-align:left;min-width:0;padding:10px;border:1px solid #EDE7EA;border-radius:20px;background:#fff;color:inherit;scroll-margin:12px 0 calc(92px + env(safe-area-inset-bottom));transition:transform .12s ease-out,border-color .12s ease-out}
.grid-card:active{transform:scale(.97)}
.grid-card.selected{border:2px solid #D81B60;padding:9px}
.grid-card.highlight{border:2px solid #FFB300;padding:9px;transform:scale(1.03)}
.grid-image{position:relative;display:grid;place-items:center;aspect-ratio:1/1;border-radius:16px;background:#FDE7F0;color:#E58AAE;overflow:hidden;margin-bottom:10px}
.grid-image img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.grid-badge{position:absolute;left:8px;top:8px;max-width:calc(100% - 16px);background:#1F1A1C;color:#fff;border-radius:999px;padding:4px 9px;font-size:11px;font-weight:700;line-height:1.2;white-space:nowrap}
.grid-card strong{font-size:16px;font-weight:800;line-height:1.2;color:#1F1A1C}
.grid-card small{font-size:13px;line-height:1.35;color:#5F5A5C;margin:4px 0 8px;display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.grid-card em{font-size:12px;font-weight:600;font-style:normal;color:#8E0F3F;margin-top:auto}
.detail-screen{position:relative}.detail-hero{height:240px;position:relative;flex:none}.hero-back{position:absolute;left:16px;top:16px}.gem-badge{position:absolute;left:16px;bottom:14px;background:#1F1A1C;color:#fff;padding:7px 11px;border-radius:999px;font-size:11px;font-weight:800}
.detail-scroll{overflow-y:auto;padding:18px 16px 100px;scrollbar-width:none}.detail-scroll h1{font-size:28px;line-height:1.05;margin:0 0 5px}.pronunciation{font-size:12px;color:#8E0F3F;font-weight:700;margin:0 0 14px}.story{font-size:14px;line-height:1.55;color:#4E484B}.tag-row{display:flex;flex-wrap:wrap;gap:7px;margin:16px 0}.tag-row span{background:#F5F2F3;border-radius:999px;padding:8px 10px;font-size:10px;font-weight:700}.offer{background:#FDE7F0;border-radius:16px;padding:14px;color:#8E0F3F}.offer strong,.offer span{display:block;font-size:13px}.offer span{font-size:12px;margin-top:2px}
.restaurants{margin-top:23px}.restaurants h2,.more-section h2{font-size:19px;margin:0}.restaurants>p{font-size:11px;color:#5F5A5C;margin:3px 0 10px}.restaurant-row{display:grid;grid-template-columns:58px 1fr auto;align-items:center;gap:10px;min-height:82px;border-bottom:1px solid #EDE7EA}.thumb{width:58px;height:58px;background:#FFF1D6;border-radius:13px;overflow:hidden}.thumb img{width:100%;height:100%;object-fit:cover}.restaurant-row strong,.restaurant-row span{display:block}.restaurant-row strong{font-size:12px}.restaurant-row span{font-size:10px;color:#5F5A5C;margin-top:4px}.add-button{width:62px;height:40px;border:2px solid #D81B60;background:#fff;color:#C2185B;border-radius:11px;font-weight:800}.stepper{height:40px;border:2px solid #D81B60;border-radius:11px;display:flex;align-items:center;color:#C2185B;font-weight:800}.stepper button{width:32px;height:36px;border:0;background:transparent;font-weight:800}.stepper span{color:#8E0F3F;margin:0;font-size:12px}.more-section{margin-top:23px}.more-section .chips{margin-top:10px;flex-wrap:wrap}.cart-bar{position:absolute;bottom:14px;left:16px;right:16px;width:calc(100% - 32px);height:56px;border:0;background:#1F1A1C;color:#fff;border-radius:16px;padding:0 18px;display:flex;justify-content:space-between;align-items:center;font-weight:800}
.toast{position:absolute;z-index:10;left:50%;bottom:88px;transform:translateX(-50%);background:#1F1A1C;color:#fff;border-radius:999px;padding:11px 16px;font-size:12px;font-weight:700;white-space:nowrap;animation:toast-in .2s ease-out}@keyframes toast-in{from{opacity:0;transform:translate(-50%,8px)}}
@media (max-width:389px),(max-height:843px){.phone{width:100vw;height:100dvh}}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition:none!important}}
`;
