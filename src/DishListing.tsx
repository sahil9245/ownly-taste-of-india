import { useEffect, useState } from "react";
import DishImage from "./DishImage";
import type { Dispatch, SetStateAction } from "react";
import { MAX_LISTINGS, formatCount, getListings, slugify } from "./data/dishListings";
import type { Listing } from "./data/dishListings";

type Cart = Record<string, number>;

function VegMark({ veg }: { veg: boolean }) {
  const color = veg ? "#1E8E3E" : "#B3261E";
  return (
    <svg className="vm" width="16" height="16" viewBox="0 0 16 16" aria-label={veg ? "Vegetarian" : "Non-vegetarian"} role="img">
      <rect x="1" y="1" width="14" height="14" rx="2.5" fill="#fff" stroke={color} strokeWidth="1.5" />
      {veg ? <circle cx="8" cy="8" r="3.6" fill={color} /> : <path d="M8 4.2 12 11.4H4Z" fill={color} />}
    </svg>
  );
}

function StarMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#16A34A" d="m12 2.6 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.6l1.2-6.5L2.5 9.5l6.6-.9Z" />
    </svg>
  );
}

function BackMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
      <path d="M9 12h10" />
    </svg>
  );
}

function RestaurantCard({ listing, qty, onQty }: { listing: Listing & { dishName: string }; qty: number; onQty: (amount: number) => void }) {
  return (
    <article className="rest-card">
      <button type="button" className="card-hit" aria-label={`${listing.name}, ₹${listing.price}`} />
      <div className="card-media">
        <div className="card-img"><DishImage src={listing.image} /></div>
        {qty === 0 ? (
          <button type="button" className="add-pill" onClick={() => onQty(1)} aria-label={`Add ${listing.name}`}>Add</button>
        ) : (
          <div className="add-pill stepper-pill" role="group" aria-label={`${listing.name} quantity`}>
            <button type="button" aria-label="Remove one" onClick={() => onQty(-1)}>−</button>
            <span aria-live="polite">{qty}</span>
            <button type="button" aria-label="Add one" onClick={() => onQty(1)}>+</button>
          </div>
        )}
      </div>
      <div className="card-body">
        <div className="card-row1"><VegMark veg={listing.veg} /><strong>{listing.dishName}</strong></div>
        <div className="card-row2">
          <span className="price-chip">₹{listing.price}</span>
          <i className="divider" />
          <span className="rating"><StarMark />{listing.rating.toFixed(1)} ({formatCount(listing.ratingCount)})</span>
        </div>
        <div className="card-row3">Other App: ₹{listing.otherMin}–₹{listing.otherMax}</div>
        <div className="card-row4">{listing.name}</div>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="rest-card skeleton" aria-hidden="true">
      <div className="card-img sk" />
      <div className="card-body">
        <div className="sk sk-line" style={{ width: "78%", height: 18 }} />
        <div className="sk sk-line" style={{ width: "58%", height: 20 }} />
        <div className="sk sk-line" style={{ width: "70%" }} />
        <div className="sk sk-line" style={{ width: "52%" }} />
      </div>
    </div>
  );
}

export default function DishListing({
  cuisine,
  stateCode,
  dishName,
  onBack,
  cart,
  setCart,
}: {
  cuisine: string;
  stateCode: string;
  dishName: string;
  onBack: () => void;
  cart: Cart;
  setCart: Dispatch<SetStateAction<Cart>>;
}) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), 300);
    return () => window.clearTimeout(id);
  }, [dishName]);

  const listings = getListings(dishName, stateCode).slice(0, MAX_LISTINGS);
  const cartKey = (listing: Listing) => `listing:${stateCode}:${listing.id}`;
  const totalQty = Object.values(cart).reduce((total, qty) => total + qty, 0);
  const change = (listing: Listing, amount: number) =>
    setCart((old) => {
      const next = Math.max(0, (old[cartKey(listing)] || 0) + amount);
      const copy = { ...old, [cartKey(listing)]: next };
      if (next === 0) delete copy[cartKey(listing)];
      return copy;
    });

  return (
    <div className="screen listing-screen" data-dish={slugify(dishName)}>
      <style>{LISTING_STYLES}</style>
      <header className="listing-header">
        <button type="button" className="circle-button" aria-label="Back" onClick={onBack}>
          <BackMark />
        </button>
        <div className="listing-titles">
          <h1>{dishName}</h1>
          <p>{cuisine} · {listings.length} restaurants near you in Bengaluru</p>
        </div>
      </header>
      <div className={`listing-scroll${totalQty > 0 ? " with-cart" : ""}`}>
        <div className="listing-grid">
          {loading
            ? listings.map((listing) => <SkeletonCard key={listing.id} />)
            : listings.map((listing) => (
                <RestaurantCard key={listing.id} listing={{ ...listing, dishName }} qty={cart[cartKey(listing)] || 0} onQty={(amount) => change(listing, amount)} />
              ))}
        </div>
      </div>
      {totalQty > 0 && (
        <button type="button" className="listing-cart">
          View cart · {totalQty} item{totalQty > 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}

const LISTING_STYLES = String.raw`
.listing-screen{position:relative;background:#fff}
.listing-header{flex:none;display:flex;align-items:center;gap:12px;padding:calc(12px + env(safe-area-inset-top)) 16px 12px}
.listing-titles{min-width:0}
.listing-titles h1{margin:0;font-size:24px;line-height:1.2;font-weight:800;color:#1F1A1C}
.listing-titles p{margin:2px 0 0;font-size:14px;line-height:1.3;color:#5F5A5C;display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.listing-scroll{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:none;scrollbar-width:none;padding:8px 16px calc(24px + env(safe-area-inset-bottom))}
.listing-scroll::-webkit-scrollbar{display:none}
.listing-scroll.with-cart{padding-bottom:calc(92px + env(safe-area-inset-bottom))}
.listing-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.rest-card{position:relative;min-width:0;padding-bottom:6px;transition:transform .12s ease-out;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.rest-card:has(.card-hit:active){transform:scale(.98)}
.card-hit{position:absolute;inset:0;z-index:1;border:0;padding:0;background:transparent;border-radius:16px;-webkit-tap-highlight-color:transparent}
.card-media{position:relative}
.card-img{aspect-ratio:1/1;border-radius:16px;overflow:hidden}
.add-pill{position:absolute;z-index:2;right:8px;bottom:-18px;height:44px;min-width:84px;padding:0 18px;border:3px solid #fff;border-radius:999px;background:#F0287A;color:#fff;font-size:16px;font-weight:800;line-height:1;box-shadow:0 2px 8px rgba(74,35,51,.18);-webkit-tap-highlight-color:transparent;transition:transform .1s ease-out}
button.add-pill:active{transform:scale(.95)}
.stepper-pill{display:flex;align-items:center;justify-content:space-between;padding:0;min-width:96px}
.stepper-pill button{width:44px;height:44px;margin:-3px 0;border:0;background:transparent;color:#fff;font-size:20px;font-weight:800;padding:0;display:grid;place-items:center;-webkit-tap-highlight-color:transparent}
.stepper-pill span{font-size:16px;font-weight:800;min-width:12px;text-align:center}
.card-body{padding:24px 2px 0;min-width:0}
.card-row1{display:flex;align-items:center;gap:6px;min-width:0}
.card-row1 .vm{flex:none}
.card-row1 strong{min-width:0;font-size:17px;line-height:1.25;font-weight:800;color:#1F1A1C;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card-row2{display:flex;align-items:center;gap:7px;margin-top:6px;min-width:0}
.price-chip{flex:none;background:#1E8E3E;color:#fff;font-size:14px;font-weight:800;line-height:1;padding:5px 8px;border-radius:8px}
.divider{flex:none;width:1px;height:16px;background:#D9D3D6}
.rating{display:inline-flex;align-items:center;gap:3px;min-width:0;font-size:14px;font-weight:700;color:#3D3739;white-space:nowrap;overflow:hidden}
.rating svg{flex:none}
.card-row3,.card-row4{color:#6B6467;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card-row3{font-size:14px;margin-top:6px}
.card-row4{font-size:13px;margin-top:3px}
@media (max-width:340px){.card-row3{font-size:12.5px}.card-row1 strong{font-size:16px}.card-row2{gap:5px}.rating{font-size:13px}.price-chip{padding:5px 6px}}
.sk{background:#EEEBEC;border-radius:8px;position:relative;overflow:hidden}
.sk::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,rgba(255,255,255,.65),transparent);animation:sk-shimmer 1.1s ease-in-out infinite}
.skeleton .card-img.sk{background:#EEEBEC;border-radius:16px}
.sk-line{height:14px;margin-top:8px}
@keyframes sk-shimmer{to{transform:translateX(100%)}}
.listing-cart{position:absolute;z-index:5;left:16px;right:16px;bottom:calc(14px + env(safe-area-inset-bottom));height:56px;border:0;border-radius:16px;background:#1F1A1C;color:#fff;font-size:16px;font-weight:800;box-shadow:0 10px 24px rgba(31,26,28,.28)}
@media (prefers-reduced-motion:reduce){.sk::after{animation:none}.rest-card,.add-pill{transition:none}}
`;
