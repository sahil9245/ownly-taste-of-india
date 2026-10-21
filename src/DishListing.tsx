import { useEffect, useState } from "react";
import DishImage from "./DishImage";
import type { Dispatch, SetStateAction } from "react";
import { MAX_LISTINGS, formatCount, getListings, slugify } from "./data/dishListings";
import type { Cart, Listing } from "./data/dishListings";

function VegMark({ veg }: { veg: boolean }) {
  const color = veg ? "#17803A" : "#B3261E";
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
    <article className="rest-card" aria-label={`${listing.name}, ${listing.dishName}, ₹${listing.price}`}>
      <button type="button" className="card-hit" tabIndex={-1} aria-hidden="true" />
      <div className="card-media">
        <div className="card-img"><DishImage src={listing.image} /></div>
        {qty === 0 ? (
          <button type="button" className="add-pill" onClick={() => onQty(1)} aria-label={`Add ${listing.name}`}>Add</button>
        ) : (
          <div className="add-pill stepper-pill" role="group" aria-label={`${listing.name} quantity`}>
            <button type="button" aria-label="Remove one" onClick={() => onQty(-1)}>−</button>
            <span aria-live="polite" aria-label={`${qty} in cart`}>{qty}</span>
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

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
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
  description,
  onBack,
  onCart,
  cart,
  setCart,
}: {
  cuisine: string;
  stateCode: string;
  dishName: string;
  description: string;
  onBack: () => void;
  onCart: () => void;
  cart: Cart;
  setCart: Dispatch<SetStateAction<Cart>>;
}) {
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), 180);
    return () => window.clearTimeout(id);
  }, [dishName]);

  const listings = getListings(dishName, stateCode).slice(0, MAX_LISTINGS);
  const cartKey = (listing: Listing) => `listing:${stateCode}:${listing.id}`;
  const lines = Object.values(cart);
  const totalQty = lines.reduce((total, line) => total + line.qty, 0);
  const totalPrice = lines.reduce((total, line) => total + line.qty * line.price, 0);
  const change = (listing: Listing, amount: number) => {
    if (amount > 0) navigator.vibrate?.(8);
    setCart((old) => {
      const key = cartKey(listing);
      const next = Math.max(0, (old[key]?.qty ?? 0) + amount);
      const copy = { ...old };
      if (next === 0) delete copy[key];
      else copy[key] = { qty: next, price: listing.price };
      return copy;
    });
  };

  return (
    <div className="screen listing-screen" data-dish={slugify(dishName)}>
      <header className={`listing-header${scrolled ? " scrolled" : ""}`}>
        <button type="button" className="circle-button" aria-label="Back" onClick={onBack}>
          <BackMark />
        </button>
        <div className="listing-titles">
          <h1>{dishName}</h1>
          <p>{cuisine} · {plural(listings.length, "restaurant", "restaurants")} near you in Bengaluru</p>
        </div>
        <p className="listing-desc">{description}</p>
      </header>
      <div className={`listing-scroll${totalQty > 0 ? " with-cart" : ""}`} onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}>
        {!loading && listings.length === 0 && <p className="listing-empty">No {cuisine} kitchens are serving {dishName} near you just yet. Try another dish.</p>}
        <div className="listing-grid">
          {loading
            ? listings.map((listing) => <SkeletonCard key={listing.id} />)
            : listings.map((listing) => (
                <RestaurantCard key={listing.id} listing={{ ...listing, dishName }} qty={cart[cartKey(listing)]?.qty ?? 0} onQty={(amount) => change(listing, amount)} />
              ))}
        </div>
      </div>
      {totalQty > 0 && (
        <button type="button" className="listing-cart" onClick={onCart}>
          <span>View cart · {plural(totalQty, "item", "items")}</span>
          <b key={totalPrice} className="bump">₹{totalPrice}</b>
        </button>
      )}
    </div>
  );
}
