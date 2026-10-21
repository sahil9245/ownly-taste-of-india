import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { ExtendedFeature, ExtendedFeatureCollection, GeoGeometryObjects } from "d3-geo";
import DishListing from "./DishListing";
import DishImage from "./DishImage";
import { dishImagePath, kitchenCount, slugify } from "./data/dishListings";
import type { Cart } from "./data/dishListings";
import "./app.css";

type Dish = { name: string; description: string; gem?: boolean };
type StateData = {
  name: string;
  cuisine: string;
  tagline: string;
  image?: string;
  dishes: Dish[];
};
type Screen =
  | { type: "home" }
  | { type: "map" }
  | { type: "listing"; dish: Dish; stateCode: string };
const DEPTH: Record<Screen["type"], number> = { home: 0, map: 1, listing: 2 };

// All editable product content lives here.
const DATA = {
  states: {
    KA: {
      name: "Karnataka",
      cuisine: "Kannadiga",
      tagline: "Ragi, rice and a coastline full of spice.",
      image: "",
      dishes: [
        { name: "Masala dosa", description: "Crisp, golden rice-and-lentil crêpe folded around spiced potato, served with coconut chutney and sambar." },
        { name: "Bisi bele bath", description: "Hot, tangy one-pot rice and lentils cooked with vegetables and a special spice blend, finished with ghee." },
        { name: "Donne biryani", description: "Bengaluru's own biryani, made with short-grain rice and a fresh green herb masala, served in a leaf bowl." },
        { name: "Ragi mudde with soppu saaru", description: "Soft finger-millet balls eaten with a rustic leafy-greens and lentil curry. A hearty Karnataka staple.", gem: true },
        { name: "Mangalore buns", description: "Soft, slightly sweet fried puris made with ripe banana. A teatime favourite from the coast.", gem: true },
        { name: "Kori rotti", description: "Spicy Mangalorean chicken curry poured over crisp, wafer-thin dried rice rotis.", gem: true },
        { name: "Coorg pandi curry", description: "Kodava-style pork curry, dark and tangy with kachampuli vinegar and roasted spices.", gem: true },
      ],
    },
    KL: {
      name: "Kerala",
      cuisine: "Kerala",
      tagline: "Coconut, curry leaves and slow backwater simmers.",
      image: "",
      dishes: [
        { name: "Appam with stew", description: "Lacy rice hoppers with soft centres, paired with a mild, fragrant coconut milk stew." },
        { name: "Kerala parotta & beef fry", description: "Flaky, layered parotta with dry-roasted beef, coconut slivers, curry leaves and black pepper." },
        { name: "Malabar biryani", description: "Fragrant short-grain rice layered with mildly spiced chicken, fried onions and ghee." },
        { name: "Puttu & kadala curry", description: "Steamed rice-flour and coconut cylinders with a spicy black chickpea curry. A classic Kerala breakfast.", gem: true },
        { name: "Kappa & meen curry", description: "Soft mashed tapioca paired with a fiery red fish curry. Kerala comfort food at its best.", gem: true },
        { name: "Karimeen pollichathu", description: "Pearl spot fish coated in spices and roasted in banana leaf. A backwaters speciality.", gem: true },
        { name: "Pazham pori", description: "Ripe plantain slices in a light batter, fried golden. Kerala's favourite teatime snack.", gem: true },
      ],
    },
    AP: {
      name: "Andhra Pradesh",
      cuisine: "Andhra",
      tagline: "Fiery, tangy and unapologetically bold.",
      image: "",
      dishes: [
        { name: "Andhra meals", description: "A full rice spread with dal, curries, rasam, curd, spicy podi, pickles and ghee." },
        { name: "Gongura mutton", description: "Tender mutton cooked with tangy sorrel (gongura) leaves. Sour, spicy and very Andhra.", gem: true },
        { name: "Pesarattu", description: "Thin green moong dal crêpe with ginger and chilli, often stuffed with upma.", gem: true },
        { name: "Guntur chilli chicken", description: "Fiery dry chicken tossed with Guntur's famous red chillies and curry leaves." },
        { name: "Ulavacharu chicken biryani", description: "Biryani made with ulavacharu, a rich horse-gram broth that gives it a deep, earthy flavour.", gem: true },
        { name: "Natu kodi pulusu", description: "Country chicken slow-cooked in a tangy, spicy tamarind gravy.", gem: true },
      ],
    },
    TG: {
      name: "Telangana",
      cuisine: "Hyderabadi",
      tagline: "Nawabi kitchens and Deccan chai.",
      image: "",
      dishes: [
        { name: "Hyderabadi dum biryani", description: "Basmati rice and marinated meat sealed and slow-cooked on dum, fragrant with saffron and fried onions." },
        { name: "Haleem (seasonal)", description: "Wheat, lentils and meat slow-cooked and pounded into a rich, silky stew. A Ramzan special.", gem: true },
        { name: "Mirchi ka salan", description: "Long green chillies in a nutty peanut, sesame and tamarind gravy. Biryani's classic partner." },
        { name: "Double ka meetha", description: "Fried bread soaked in saffron-cardamom milk and topped with nuts. Hyderabad's bread pudding." },
        { name: "Qubani ka meetha", description: "Stewed dried apricots in a sweet syrup, served with cream. A Nizami wedding dessert.", gem: true },
        { name: "Irani chai & Osmania biscuit", description: "Thick, creamy tea with Hyderabad's buttery, sweet-and-salty Osmania biscuits.", gem: true },
      ],
    },
    TN: {
      name: "Tamil Nadu",
      cuisine: "Tamil",
      tagline: "Temple-town breakfasts and Chettinad pepper.",
      image: "",
      dishes: [
        { name: "Chettinad chicken", description: "Chicken in a bold, peppery gravy of freshly roasted spices from Tamil Nadu's Chettinad region." },
        { name: "Kothu parotta", description: "Shredded parotta tossed on a hot griddle with egg, spicy salna and onions. Loud, fast street food.", gem: true },
        { name: "Ven pongal", description: "Creamy rice and moong dal tempered with ghee, black pepper, cumin and cashews." },
        { name: "Idli with podi", description: "Soft steamed rice cakes dusted with spicy lentil podi and a drizzle of ghee or sesame oil." },
        { name: "Dindigul biryani", description: "Peppery biryani from Dindigul, made with short-grain seeraga samba rice and tender meat.", gem: true },
        { name: "Kari dosa", description: "Madurai's thick dosa topped with egg and spicy minced mutton.", gem: true },
      ],
    },
    PB: {
      name: "Punjab",
      cuisine: "Punjabi",
      tagline: "Butter, tandoor and big-hearted portions.",
      image: "",
      dishes: [
        { name: "Butter chicken", description: "Tandoori chicken simmered in a velvety tomato, butter and cream gravy. Rich, mild and comforting." },
        { name: "Chole bhature", description: "Spicy chickpea curry with big, fluffy fried bhature. A Punjabi weekend favourite." },
        { name: "Amritsari kulcha", description: "Crisp, flaky tandoor bread stuffed with spiced potato, served with chole and butter.", gem: true },
        { name: "Sarson da saag & makki roti", description: "Slow-cooked mustard greens with corn-flour flatbread, white butter and jaggery. A winter classic.", gem: true },
        { name: "Dal makhani", description: "Black lentils and kidney beans slow-cooked for hours with butter and cream." },
        { name: "Lassi", description: "Thick, chilled churned yoghurt drink, sweet or salted, often topped with malai." },
      ],
    },
    MH: {
      name: "Maharashtra",
      cuisine: "Maharashtrian",
      tagline: "Street-smart snacks and Kolhapuri heat.",
      image: "",
      dishes: [
        { name: "Vada pav", description: "Spiced potato fritter in a soft pav with garlic and green chutneys. Mumbai's favourite snack." },
        { name: "Misal pav", description: "Spicy sprouted-bean curry topped with crunchy farsan, onions and lemon, eaten with pav.", gem: true },
        { name: "Pav bhaji", description: "Buttery mashed vegetable curry with toasted pav, chopped onions and lemon." },
        { name: "Kolhapuri mutton", description: "Fiery mutton curry from Kolhapur with a dark, roasted-spice masala.", gem: true },
        { name: "Puran poli", description: "Soft flatbread stuffed with sweet chana dal and jaggery, best with a spoon of ghee.", gem: true },
      ],
    },
    WB: {
      name: "West Bengal",
      cuisine: "Bengali",
      tagline: "Mustard, fish and always a sweet ending.",
      image: "",
      dishes: [
        { name: "Kosha mangsho", description: "Slow-cooked Bengali mutton, dark and rich, best with luchi or rice.", gem: true },
        { name: "Kolkata biryani", description: "Lightly spiced, fragrant biryani with tender meat, egg and the famous potato." },
        { name: "Kathi roll", description: "Flaky paratha rolled around skewered meat or paneer, onions and chutney. Kolkata street food." },
        { name: "Shorshe ilish", description: "Hilsa fish cooked in a sharp mustard sauce with green chillies. A Bengali favourite.", gem: true },
        { name: "Mishti doi", description: "Sweet, caramelised set yoghurt, traditionally served in clay pots." },
      ],
    },
    UP: {
      name: "Uttar Pradesh",
      cuisine: "Awadhi",
      tagline: "Slow-cooked Awadhi elegance from Lucknow.",
      image: "",
      dishes: [
        { name: "Galouti kebab", description: "Melt-in-the-mouth minced meat kebabs from Lucknow, delicately spiced and pan-fried.", gem: true },
        { name: "Awadhi biryani", description: "Aromatic Lucknowi biryani cooked on dum, gentle on spice and rich in fragrance." },
        { name: "Nihari", description: "Slow-cooked, richly spiced meat stew, traditionally eaten for breakfast with naan.", gem: true },
      ],
    },
    GJ: {
      name: "Gujarat",
      cuisine: "Gujarati",
      tagline: "Sweet, savoury and served on a thali.",
      image: "",
      dishes: [{ name: "Gujarati thali", description: "A sweet-and-savoury spread of dal, kadhi, sabzis, rotli, rice, farsan and a dessert." }, { name: "Khaman dhokla", description: "Soft, spongy steamed gram-flour cakes tempered with mustard seeds and green chillies." }],
    },
  } satisfies Record<string, StateData>,
  spinOrder: ["KA", "KL", "AP", "TG", "TN", "PB", "MH", "WB", "UP", "GJ"],
} as const;

function Icon({
  name,
  size = 20,
}: {
  name: "back" | "spin" | "close";
  size?: number;
}) {
  const paths: Record<string, React.ReactNode> = {
    back: <><path d="m15 18-6-6 6-6" /><path d="M9 12h10" /></>,
    spin: <><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 5v6h-6" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
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
const BASE_TITLE = "Ownly · Taste of India";

type GeoCollection = ExtendedFeatureCollection<ExtendedFeature<GeoGeometryObjects, { name: string }>>;
let loadedGeo: GeoCollection | null = null;
let geoPromise: Promise<GeoCollection> | null = null;

// The India outline is ~190 KB, so it loads as its own chunk and is warmed up while the home screen is showing.
function loadGeo() {
  geoPromise ??= import("./data/india-states.json").then(
    (module) => (loadedGeo = module.default as unknown as GeoCollection),
  );
  return geoPromise;
}

function useIndiaGeo() {
  const [geo, setGeo] = useState(loadedGeo);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (geo) return;
    let alive = true;
    loadGeo().then(
      (loaded) => alive && setGeo(loaded),
      () => alive && setFailed(true),
    );
    return () => {
      alive = false;
    };
  }, [geo]);
  return { geo, failed };
}

export default function App() {
  const [stack, setStack] = useState<Screen[]>(
    INITIAL_LISTING ? [{ type: "home" }, { type: "map" }, { type: "listing", ...INITIAL_LISTING }] : [{ type: "home" }],
  );
  const [exiting, setExiting] = useState(false);
  const [slideIn, setSlideIn] = useState(false);
  const [selected, setSelected] = useState<string | null>(INITIAL_LISTING?.stateCode ?? null);
  const [viewMode, setViewMode] = useState<"map" | "grid">("map");
  const [toast, setToast] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [result, setResult] = useState<{ code: string; dish: Dish } | null>(null);
  const [cart, setCart] = useState<Cart>({});
  const timers = useRef<number[]>([]);
  const toastTimer = useRef(0);
  const backing = useRef(false);
  const current = stack[stack.length - 1];
  const reducedMotion = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  const clearTimers = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  };

  const showToast = useCallback((message: string) => {
    window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(""), 2200);
  }, []);

  useEffect(
    () => () => {
      clearTimers();
      window.clearTimeout(toastTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (current.type !== "map") {
      clearTimers();
      setSpinning(false);
      setHighlighted(null);
    }
  }, [current.type]);
  useEffect(() => {
    document.title = current.type === "listing" ? `${current.dish.name} · ${BASE_TITLE}` : BASE_TITLE;
  }, [current]);

  const push = (screen: Screen) => {
    setExiting(false);
    setSlideIn(true);
    setStack((old) => [...old, screen]);
  };

  const popTo = (depth: number) => {
    if (exiting || stack.length <= depth + 1) return;
    clearTimers();
    setExiting(true);
    window.setTimeout(() => {
      setStack((old) => old.slice(0, depth + 1));
      setExiting(false);
      setSlideIn(false);
    }, reducedMotion ? 0 : 190);
  };

  // Every screen below home has a history entry, so the Android back button and iOS edge-swipe step back one screen.
  const back = () => {
    if (backing.current || exiting) return;
    if (window.history.state?.ownly) {
      backing.current = true;
      window.history.back();
    } else {
      popTo(stack.length - 2);
    }
  };

  const openMap = () => {
    setViewMode("map");
    window.history.pushState({ ownly: "map" }, "", "/");
    push({ type: "map" });
  };

  const openListing = (dish: Dish, stateCode: string) => {
    window.history.pushState({ ownly: "listing" }, "", listingPath(stateCode, dish.name));
    push({ type: "listing", dish, stateCode });
  };

  const router = useRef({ current, popTo, push });
  router.current = { current, popTo, push };

  useEffect(() => {
    if (INITIAL_LISTING) {
      if (window.history.state?.ownly !== "listing") {
        window.history.replaceState({ ownly: "home" }, "", "/");
        window.history.pushState({ ownly: "map" }, "", "/");
        window.history.pushState({ ownly: "listing" }, "", listingPath(INITIAL_LISTING.stateCode, INITIAL_LISTING.dish.name));
      }
    } else if (window.history.state?.ownly) {
      window.history.replaceState(null, "", "/");
    }
    const onPop = () => {
      backing.current = false;
      const { current: now, popTo, push } = router.current;
      const target = parseListingPath(window.location.pathname);
      const want: Screen["type"] = target ? "listing" : window.history.state?.ownly === "map" ? "map" : "home";
      if (DEPTH[want] < DEPTH[now.type]) {
        popTo(DEPTH[want]);
        return;
      }
      if (DEPTH[want] === DEPTH[now.type]) return;
      if (now.type === "home") push({ type: "map" });
      if (target) {
        setSelected(target.stateCode);
        setResult(null);
        push({ type: "listing", ...target });
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const finishSpin = (code: string) => {
    const state: StateData = DATA.states[code as keyof typeof DATA.states];
    const gems = state.dishes.filter((dish) => dish.gem);
    const choices = gems.length ? gems : state.dishes;
    const dish = choices[Math.floor(Math.random() * choices.length)];
    setSpinning(false);
    setHighlighted(null);
    setSelected(code);
    setResult({ code, dish });
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

  return (
    <main className={`stage${current.type === "home" ? " stage-home" : ""}`}>
      <div className="phone">
        <div key={stack.length} className={`page${exiting ? " page-exit" : slideIn ? " page-enter" : ""}`}>
          {current.type === "home" && <Home onOpenTaste={openMap} />}
          {current.type === "map" && (
            <MapScreen
              onBack={back}
              selected={selected}
              highlighted={highlighted}
              spinning={spinning}
              result={result}
              viewMode={viewMode}
              onViewMode={setViewMode}
              onSelect={selectState}
              onClose={() => {
                setSelected(null);
                setResult(null);
              }}
              onSpin={startSpin}
              onDish={openListing}
            />
          )}
          {current.type === "listing" && (
            <DishListing
              cuisine={DATA.states[current.stateCode as keyof typeof DATA.states].cuisine}
              stateCode={current.stateCode}
              dishName={current.dish.name}
              description={current.dish.description}
              onBack={back}
              cart={cart}
              setCart={setCart}
              onCart={() => showToast("Checkout is coming soon")}
            />
          )}
        </div>
        <div role="status" aria-live="polite">{toast && <div className="toast">{toast}</div>}</div>
      </div>
    </main>
  );
}

const DEBUG_TAP_AREA = new URLSearchParams(window.location.search).get("debug") === "1";

let homeScrollTop = 0;
let tapHintShown = false;

function Home({ onOpenTaste }: { onOpenTaste: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hint] = useState(() => !tapHintShown);
  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = homeScrollTop;
  }, []);
  useEffect(() => {
    tapHintShown = true;
    const id = window.setTimeout(() => loadGeo().catch(() => {}), 400);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <div className="screen home-screen" ref={ref} onScroll={(event) => { homeScrollTop = event.currentTarget.scrollTop; }}>
      <div className="home-frame">
        <img className="home-image" src="/images/home.png" width={780} height={2000} alt="Ownly home screen" draggable={false} decoding="async" fetchPriority="high" />
        <button type="button" className={`home-tap${hint ? " hint" : ""}${DEBUG_TAP_AREA ? " debug" : ""}`} aria-label="Open Taste of India" onClick={onOpenTaste} />
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
  viewMode: "map" | "grid";
  onViewMode: (mode: "map" | "grid") => void;
  onSelect: (code: string) => void;
  onClose: () => void;
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
  WB: [87.9, 24.0],
};

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

const LABEL_FONT = '700 10px "Figtree", system-ui, sans-serif';
let measureCtx: CanvasRenderingContext2D | null | undefined;
function labelWidth(text: string) {
  if (measureCtx === undefined) {
    try {
      measureCtx = document.createElement("canvas").getContext("2d");
      if (measureCtx) measureCtx.font = LABEL_FONT;
    } catch {
      measureCtx = null;
    }
  }
  const textW = measureCtx ? measureCtx.measureText(text).width : text.length * 5.8;
  return Math.ceil(textW) + 18;
}

const overlaps = (a: Rect, b: Rect) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;

function buildGeo(collection: GeoCollection, w: number, h: number): MapGeo {
  const ps = Math.min(1, Math.max(0.85, w / 359));
  const pw = PIN_W * ps;
  const ph = PIN_H * ps;
  const projection = geoMercator().fitSize([w, h], collection);
  const path = geoPath(projection);
  const paths = collection.features.map((feature) => ({
    name: feature.properties.name,
    code: STATE_CODE_BY_NAME[feature.properties.name] ?? null,
    d: path(feature) ?? "",
  }));
  const bounds = path.bounds(collection);

  const codes = Object.keys(PIN_COORDS);
  const pins: Record<string, PinPlace> = {};
  const pinRects: Record<string, Rect> = {};
  for (const code of codes) {
    const [x, y] = projection(PIN_COORDS[code]) ?? [0, 0];
    pins[code] = { x, y, side: "r", dy: 0, labelW: labelWidth(DATA.states[code as keyof typeof DATA.states].cuisine) };
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
  const { geo: collection, failed } = useIndiaGeo();
  const [fontsReady, setFontsReady] = useState(() => !document.fonts || document.fonts.check(LABEL_FONT));
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

  // Pin labels are sized from measured text, so wait (briefly) for the font before laying them out.
  useEffect(() => {
    if (fontsReady) return;
    const done = () => setFontsReady(true);
    const timer = window.setTimeout(done, 500);
    document.fonts.load(LABEL_FONT).then(done, done);
    return () => window.clearTimeout(timer);
  }, [fontsReady]);

  const fitW = dims?.fitW ?? 0;
  const fitH = dims?.fitH ?? 0;
  const geo = useMemo(
    () => (collection && fontsReady && fitW > 0 && fitH > 0 ? buildGeo(collection, fitW, fitH) : null),
    [collection, fontsReady, fitW, fitH],
  );
  const offsetY = dims && geo ? mapOffset(dims, sheetH, geo, selected, open) : 0;

  return (
    <div
      ref={screenRef}
      className={`screen map-screen${open ? " sheet-open" : ""}`}
      style={dims ? ({ "--sheet-max": `${dims.screenH * SHEET_MAX_RATIO}px`, "--sheet-h": `${sheetH}px`, "--welcome-h": `${welcomeH}px` } as React.CSSProperties) : undefined}
    >
      <header className="map-header">
        <button type="button" className="circle-button" aria-label="Back" onClick={props.onBack}><Icon name="back" /></button>
        <div className="map-heading"><h1>Taste of India</h1><p>{Object.keys(DATA.states).length} regional cuisines, cooked in Bengaluru</p></div>
        <div className="segment" role="group" aria-label="View">
          <button type="button" className={viewMode === "map" ? "active" : ""} aria-pressed={viewMode === "map"} onClick={() => !spinning && props.onViewMode("map")}>Map</button>
          <button type="button" className={viewMode === "grid" ? "active" : ""} aria-pressed={viewMode === "grid"} onClick={() => props.onViewMode("grid")}>Grid</button>
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
            {geo && <IndiaMap selected={selected} onSelect={props.onSelect} geo={geo} width={fitW} height={fitH} offsetY={offsetY} />}
          </div>
          {failed && (
            <div className="map-note">
              <span>The map couldn’t load. Check your connection, or browse in Grid view.</span>
              <button type="button" className="ghost-button" onClick={() => window.location.reload()}>Reload</button>
            </div>
          )}
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
        onClose={onClose}
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

let pinsIntroDone = false;

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
  const [intro] = useState(() => !pinsIntroDone);
  useEffect(() => {
    pinsIntroDone = true;
  }, []);
  return (
    <div className={`map-canvas${geo.labelsFit ? "" : " no-labels"}${intro ? " intro" : ""}`} style={{ transform: `translateY(${offsetY}px)` }}>
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
            style={{ left: pin.x - PIN_BOX / 2, top: pin.y - PIN_BOX, "--i": ordered.indexOf(code) } as React.CSSProperties}
            aria-label={`${DATA.states[code as keyof typeof DATA.states].cuisine} cuisine – explore its dishes`}
            aria-pressed={isSelected}
            onClick={() => onSelect(code)}
          >
            <PinIcon scale={geo.ps} />
            <b style={labelStyle}>{DATA.states[code as keyof typeof DATA.states].cuisine}</b>
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
        const favourites = plural(state.dishes.length, `${state.cuisine} favourite`, `${state.cuisine} favourites`);
        const isSelected = selected === code && !spinning;
        const isHighlight = highlighted === code && spinning;
        return (
          <button
            type="button"
            key={code}
            data-code={code}
            className={`grid-card${isSelected ? " selected" : ""}${isHighlight ? " highlight" : ""}`}
            aria-label={`${state.cuisine} cuisine – explore its dishes`}
            aria-pressed={isSelected}
            onClick={() => onSelect(code)}
          >
            <span className="grid-image">
              <DishImage src={state.image ?? ""} />
              {gems > 0 && <span className="grid-badge">{plural(gems, "hidden gem", "hidden gems")}</span>}
            </span>
            <strong>{state.cuisine}</strong>
            <span className="grid-state">{state.name}</span>
            <small>{state.tagline}</small>
            <em>{favourites}</em>
            <span className="grid-kitchens">{state.cuisine} kitchens near you</span>
          </button>
        );
      })}
    </div>
  );
}

type SheetProps = Pick<MapProps, "selected" | "result" | "onClose" | "onDish"> & {
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

  const liveState: StateData | null = selected && selected in DATA.states ? DATA.states[selected as keyof typeof DATA.states] : null;

  const node = welcome ? (
    <div className="welcome">
      <span className="welcome-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" fill="currentColor" /><circle cx="12" cy="10" r="2.6" fill="#FDE7F0" /></svg>
      </span>
      <div className="welcome-text">
        <strong>Taste India without leaving Bengaluru.</strong>
        <span>Tap a state to find its best dishes at restaurants near you.</span>
      </div>
    </div>
  ) : result ? (
    <ResultCard result={result} onDish={props.onDish} />
  ) : liveState && selected ? (
    <div className="selected-state">
      <h2>{liveState.cuisine} <span className="title-state">{liveState.name}</span></h2>
      <p>{liveState.tagline}</p>
      <div className="meta">{sheetCounts(selected, liveState)}</div>
      <div className="dish-row">
        {liveState.dishes.map((dish, i) => (
          <button type="button" className="dish-card" key={dish.name} style={{ "--i": i } as React.CSSProperties} onClick={() => props.onDish(dish, selected)}>
            <div className="dish-image"><DishImage src={dishImagePath(dish.name)} size={36} />{dish.gem && <span>Hidden gem</span>}</div>
            <strong>{dish.name}</strong>
            <span className="dish-desc">{dish.description}</span>
          </button>
        ))}
      </div>
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

function sheetCounts(code: string, state: StateData) {
  const dishes = plural(state.dishes.length, "dish", "dishes");
  const kitchens = kitchenCount(code, state.dishes.map((dish) => dish.name));
  return kitchens ? `${dishes} · ${plural(kitchens, "kitchen", "kitchens")} near you` : dishes;
}

function ResultCard({ result, onDish }: { result: { code: string; dish: Dish }; onDish: (dish: Dish, code: string) => void }) {
  const state = DATA.states[result.code as keyof typeof DATA.states];
  return (
    <div className="result-state">
      <span className="eyebrow">INDIA PICKED</span>
      <h2>{state.cuisine}</h2>
      <div className="result-card">
        <div className="photo"><DishImage src={dishImagePath(result.dish.name)} alt={result.dish.name} size={36} /></div>
        <div><strong>{result.dish.name}</strong><p>{result.dish.description}</p><b>First-try offer: [OFFER]</b></div>
      </div>
      <button type="button" className="dark-button" onClick={() => onDish(result.dish, result.code)}>See where to order</button>
    </div>
  );
}
