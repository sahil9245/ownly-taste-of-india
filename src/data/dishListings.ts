// Mock restaurant listings for the Dish Listing screen. Generated from the dish name, so every reload shows the same data.

export type Listing = {
  id: string;
  name: string;
  price: number;
  rating: number;
  ratingCount: number;
  otherMin: number;
  otherMax: number;
  veg: boolean;
  image: string;
};

export type Cart = Record<string, { qty: number; price: number }>;

export const MAX_LISTINGS = 10;

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function dishImagePath(dishName: string) {
  return `/images/dishes/${slugify(dishName)}.jpg`;
}

export function formatCount(count: number) {
  if (count < 1000) return String(count);
  return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
}

// [veg, typical Ownly price in Bengaluru, in rupees]
export const DISH_INFO: Record<string, [boolean, number]> = {
  "Masala dosa": [true, 120],
  "Bisi bele bath": [true, 140],
  "Donne biryani": [false, 260],
  "Ragi mudde with soppu saaru": [true, 150],
  "Mangalore buns": [true, 90],
  "Kori rotti": [false, 280],
  "Coorg pandi curry": [false, 340],
  "Appam with stew": [true, 180],
  "Kerala parotta & beef fry": [false, 220],
  "Malabar biryani": [false, 280],
  "Puttu & kadala curry": [true, 150],
  "Kappa & meen curry": [false, 280],
  "Karimeen pollichathu": [false, 420],
  "Pazham pori": [true, 80],
  "Andhra meals": [true, 220],
  "Gongura mutton": [false, 380],
  "Pesarattu": [true, 130],
  "Guntur chilli chicken": [false, 280],
  "Ulavacharu chicken biryani": [false, 320],
  "Natu kodi pulusu": [false, 300],
  "Hyderabadi dum biryani": [false, 290],
  "Haleem (seasonal)": [false, 260],
  "Mirchi ka salan": [true, 160],
  "Double ka meetha": [true, 120],
  "Qubani ka meetha": [true, 140],
  "Irani chai & Osmania biscuit": [true, 90],
  "Chettinad chicken": [false, 300],
  "Kothu parotta": [false, 190],
  "Ven pongal": [true, 120],
  "Idli with podi": [true, 110],
  "Dindigul biryani": [false, 280],
  "Kari dosa": [false, 200],
  "Butter chicken": [false, 320],
  "Chole bhature": [true, 160],
  "Amritsari kulcha": [true, 170],
  "Sarson da saag & makki roti": [true, 220],
  "Dal makhani": [true, 220],
  "Lassi": [true, 90],
  "Vada pav": [true, 60],
  "Misal pav": [true, 120],
  "Pav bhaji": [true, 150],
  "Kolhapuri mutton": [false, 380],
  "Puran poli": [true, 100],
  "Kosha mangsho": [false, 350],
  "Kolkata biryani": [false, 270],
  "Kathi roll": [false, 160],
  "Shorshe ilish": [false, 420],
  "Mishti doi": [true, 90],
  "Galouti kebab": [false, 320],
  "Awadhi biryani": [false, 300],
  "Nihari": [false, 330],
  "Gujarati thali": [true, 280],
  "Khaman dhokla": [true, 100],
};

// Fictional restaurant names per state code.
const NAMES: Record<string, string[]> = {
  KA: ["Malnad Mane", "Kaveri Kitchen", "Mysuru Mane Oota", "Tunga Tiffins", "Hoysala Handi", "Coorg Cauldron", "Sahyadri Oota", "Udupi Uppu Mense", "Basavanagudi Bhojana", "Dharwad Dabba", "Shivamogga Sante", "Chikmagalur Chulha"],
  KL: ["Malabar Kitchen", "Backwater Bhojanam", "Kuttanad Kitchen", "Thalassery Tharavad", "Alleppey Adukkala", "Kochi Kappa House", "Kozhikode Kudumbam", "Palakkad Pachakam", "Nadan Ruchi", "Chera Chatti", "Onam Oottupura", "Periyar Pantry"],
  AP: ["Guntur Ghatu", "Godavari Gharana", "Rayalaseema Ruchulu", "Vizag Vantillu", "Krishna Kitchen", "Amaravati Aroma", "Nellore Nivasam", "Kakinada Kitchen", "Tirupati Thaali", "Vijayawada Vindu", "Konaseema Kitchen", "Ongole Oven"],
  TG: ["Deccan Dastarkhwan", "Charminar Chulha", "Golconda Gharana", "Nizami Nawab Kitchen", "Warangal Vantalu", "Karimnagar Kitchen", "Hyderabadi Handi House", "Secunderabad Sultani", "Banjara Bhojan", "Telangana Tadka", "Dum Pukht Darbar", "Irani Ishq"],
  TN: ["Chettinad Chulha", "Madurai Meenakshi Mess", "Kongu Kitchen", "Thanjavur Thattu", "Nellai Nalam", "Pandian Pantry", "Chola Samayal", "Karaikudi Kitchen", "Salem Sappadu", "Marina Mess", "Tiruchi Tiffin House", "Dindigul Dum House"],
  PB: ["Amritsari Rasoi", "Jalandhar Dhaba", "Patiala Pind Kitchen", "Sarson Da Dera", "Lahori Zaika", "Punjabi Pind", "Desi Tadka Dhaba", "Tandoor Tales", "Gurdaspur Kitchen", "Phulkari Rasoi", "Baisakhi Dhaba", "Haveli Handi"],
  MH: ["Pune Peth Kitchen", "Kolhapur Katta", "Girgaon Chaat Ghar", "Konkan Kitchen", "Nashik Naivedya", "Maratha Mess", "Sahyadri Swad", "Dadar Dabba", "Misal Mandal", "Vidarbha Vaada", "Peshwai Pangat", "Tambda Rassa House"],
  WB: ["Bangali Bhoj", "Howrah Handi", "Ballygunge Bhojan", "Sonar Bangla Kitchen", "Dhakai Dawat", "Maayer Rannaghor", "Hooghly Haat", "Tolly Tiffin", "Kalighat Kitchen", "Bhatiali Bhoj", "Alipore Adda", "Shantiniketan Shaaj"],
  UP: ["Lucknowi Dastarkhwan", "Awadhi Aangan", "Nawabi Nazakat", "Chowk Ka Kebab Ghar", "Kanpur Khaas", "Banaras Bhojanalaya", "Agra Angeethi", "Gomti Gharana", "Rampur Rasoi", "Mughlai Mehfil", "Prayag Pakwaan", "Kakori Kitchen"],
  GJ: ["Amdavadi Thali House", "Surat Swad", "Kathiyawadi Kitchen", "Kutch Kitchen", "Gujju Gharana", "Navratri Nasto", "Baroda Bhojan", "Rajkot Rasoi", "Dhokla Darbar", "Gir Gaon Kitchen", "Khichdi Ghar", "Sabarmati Swad"],
};

function seedFrom(text: string) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const roundTo5 = (n: number) => Math.round(n / 5) * 5;
const ceilTo5 = (n: number) => Math.ceil(n / 5) * 5;

const cache = new Map<string, Listing[]>();

export function getListings(dishName: string, stateCode: string): Listing[] {
  const key = `${stateCode}|${dishName}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const [veg, basePrice] = DISH_INFO[dishName] ?? [false, 220];
  const rand = mulberry32(seedFrom(dishName));
  const pool = [...(NAMES[stateCode] ?? NAMES.KA)];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const image = dishImagePath(dishName);
  const listings = pool.slice(0, MAX_LISTINGS).map((name, index): Listing => {
    const price = Math.max(20, roundTo5(basePrice * (0.86 + rand() * 0.3)));
    const rating = Math.round((3.8 + Math.pow(rand(), 0.7)) * 10) / 10;
    const ratingCount = 8 + Math.floor(Math.pow(rand(), 2.2) * 1992);
    const otherMin = ceilTo5(price * (1.1 + rand() * 0.05));
    const otherMax = Math.max(otherMin + 5, ceilTo5(price * (1.18 + rand() * 0.07)));
    return { id: `${slugify(dishName)}-${index}`, name, price, rating: Math.min(4.8, rating), ratingCount, otherMin, otherMax, veg, image };
  });
  listings.sort((a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount);
  cache.set(key, listings);
  return listings;
}

// Unique restaurants serving any of the given dishes in a state, or null when there is no restaurant data for it.
export function kitchenCount(stateCode: string, dishNames: readonly string[]): number | null {
  if (!NAMES[stateCode]) return null;
  const names = new Set<string>();
  for (const dishName of dishNames) for (const listing of getListings(dishName, stateCode)) names.add(listing.name);
  return names.size || null;
}
