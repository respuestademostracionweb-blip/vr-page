import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import {
  Search, Star, Heart, ShoppingCart, ChevronLeft, RotateCcw,
  ZoomIn, ZoomOut, Check, SlidersHorizontal, X, ShieldCheck,
  Boxes, Sparkles, Play, Pause, Grid3x3, Globe, Zap,
  Trash2, Loader2, CheckCircle2, Minus, Plus, Image as ImageIcon
} from "lucide-react";

/* ============================================================================
   DATA — swap this out for your real catalog / API. Each avatar carries the
   fields the procedural 3D preview + thumbnail glyph use to color themselves.
   Catalog content (names, tags, descriptions) is left in English by design —
   only the app chrome is localized. To use real models: replace
   `buildCharacter()` in <AvatarViewer> with a THREE.GLTFLoader().load(...)
   call — everything else (drag-rotate, zoom, lighting rig) stays the same.
============================================================================ */
const AVATARS = [
  { id: "a1", name: "Mystic Cat", creator: "3D Studio", category: "Anthro", earType: "cat",
    price: 35, rating: 4.8, reviews: 189, platform: ["PC", "Quest"], polycount: "45k tris",
    formats: [".fbx", ".unitypackage"], primary: "#FF8C42", secondary: "#FFD166", accent: "#06D6A0",
    tags: ["Cat", "Fantasy", "Animated"],
    image: "https://res.cloudinary.com/u3yfghgo/image/upload/v1787876425/gato-logo_qjkfli.jpg",
    desc: "A mystical cat avatar with flowing animations and detailed fur textures. Perfect for fantasy worlds and roleplay scenarios." },
  { id: "a2", name: "Cyber Dog", creator: "TechPaws", category: "Cyber", earType: "fox",
    price: 42, rating: 4.6, reviews: 234, platform: ["PC", "Quest"], polycount: "52k tris",
    formats: [".fbx", ".unitypackage"], primary: "#118AB2", secondary: "#073B4C", accent: "#EF476F",
    tags: ["Dog", "Cyberpunk", "Neon"],
    image: "https://res.cloudinary.com/u3yfghgo/image/upload/v1787876425/perro-logo_psvqtk.jpg",
    desc: "High-tech canine companion with glowing cybernetic enhancements and neon accents. Ready for futuristic environments." },
  { id: "a3", name: "Arcane Wizard", creator: "MagicForge", category: "Fantasy", earType: "hair",
    price: 55, rating: 4.9, reviews: 312, platform: ["PC", "Quest"], polycount: "68k tris",
    formats: [".fbx", ".unitypackage", ".blend"], primary: "#7B2CBF", secondary: "#9D4EDD", accent: "#E0AAFF",
    tags: ["Wizard", "Magic", "Detailed"],
    image: "https://res.cloudinary.com/u3yfghgo/image/upload/v1787876425/mago-logo_m2grgd.jpg",
    desc: "Powerful wizard avatar with animated spell effects and detailed robes. Perfect for magic-themed worlds and roleplay." },
  { id: "a4", name: "Battle Robot", creator: "MechWorks", category: "Mecha", earType: "antenna",
    price: 65, rating: 4.7, reviews: 156, platform: ["PC", "Quest"], polycount: "75k tris",
    formats: [".fbx", ".unitypackage"], primary: "#2D3436", secondary: "#636E72", accent: "#00CEC9",
    tags: ["Robot", "Mecha", "Combat"],
    image: "https://res.cloudinary.com/u3yfghgo/image/upload/v1787876425/robot-logo_iehhzb.jpg",
    desc: "Heavy combat robot with articulated joints and metallic finish. Features animated weapon systems and glowing eyes." },
  { id: "a5", name: "Elegant Lady", creator: "StyleMasters", category: "Anthro", earType: "hair",
    price: 38, rating: 4.85, reviews: 278, platform: ["PC", "Quest"], polycount: "48k tris",
    formats: [".fbx", ".unitypackage"], primary: "#F8B195", secondary: "#F67280", accent: "#C06C84",
    tags: ["Human", "Elegant", "Fashion"],
    image: "https://res.cloudinary.com/u3yfghgo/image/upload/v1787876426/mujer_elegante-logo_dm0anu.jpg",
    desc: "Sophisticated lady avatar with flowing dress and elegant animations. Perfect for social worlds and formal events." },
  { id: "a6", name: "Cozy Mug", creator: "CuteObjects", category: "Original", earType: "round",
    price: 25, rating: 4.95, reviews: 445, platform: ["PC", "Quest"], polycount: "12k tris",
    formats: [".fbx", ".unitypackage"], primary: "#FFEAA7", secondary: "#DDA0DD", accent: "#98D8C8",
    tags: ["Object", "Cute", "Low Poly"],
    image: "https://res.cloudinary.com/u3yfghgo/image/upload/v1787876425/taza-logo_vsoahp.jpg",
    desc: "Adorable mug character with cozy vibes and simple animations. Great for casual worlds and as a companion avatar." },
];

const CATEGORIES = ["All", "Anthro", "Cyber", "Fantasy", "Mecha", "Original"];
const PLATFORMS = ["All", "PC", "Quest"];
const SORT_KEYS = ["popular", "newest", "price_low", "price_high", "top_rated"];

// Mapeo de avatares a modelos GLB, servidos vía raw.githubusercontent.com
// (esta ruta sí manda access-control-allow-origin: *, a diferencia de los
// assets de GitHub Releases, que no tienen CORS habilitado).
const BASE_MODEL_URL = "https://raw.githubusercontent.com/respuestademostracionweb-blip/vr-page/main/models";
const AVATAR_MODELS = {
  "a1": `${BASE_MODEL_URL}/gato.glb`,      // Mystic Cat
  "a2": `${BASE_MODEL_URL}/perro.glb`,     // Cyber Dog
  "a3": `${BASE_MODEL_URL}/mago.glb`,      // Arcane Wizard
  "a4": `${BASE_MODEL_URL}/robot.glb`,     // Battle Robot
  "a5": `${BASE_MODEL_URL}/mujer.glb`,     // Elegant Lady
  "a6": `${BASE_MODEL_URL}/taza.glb`,      // Cozy Mug
};

/* ============================================================================
   i18n — app chrome only. Product catalog content stays in English (typical
   marketplace pattern: UI localized, seller-authored listings are not).
============================================================================ */
const STRINGS = {
  en: {
    brand: "AstraAvatars",
    heroTitle1: "Find your next body.",
    heroTitleHighlight: "Handmade",
    heroTitle2: "VRChat avatars, ready to wear.",
    heroSub: (n) => `Browse ${n}+ original avatars from independent creators. Every listing includes full-body files, Quest compatibility notes, and a 3D inspector before you buy.`,
    chipIndependent: "Independent creators",
    chipProtection: "Buyer protection",
    chipQuest: "Quest & PC ready",
    searchPlaceholder: "Search avatars, creators, tags…",
    cart: "Cart",
    filtersBtn: "Filters",
    category: "Category",
    platform: "Platform",
    sortBy: "Sort by",
    all: "All",
    resultsCount: (n) => `${n} avatar${n !== 1 ? "s" : ""}`,
    emptyTitle: "No avatars match those filters.",
    emptySub: "Try a different category or clear your search.",
    by: "by",
    viewAvatar: "View Avatar",
    footerNote: "This is a demo page.",
    backToShop: "Back to shop",
    inCart: "in cart",
    modelInspector: "MODEL INSPECTOR — UNIT",
    view3D: "3D",
    viewPhoto: "Photo",
    dragRotate: "Drag to rotate",
    scrollZoom: "Scroll to zoom",
    reviews: "reviews",
    addToCart: "Add to Cart",
    added: "Added",
    buyNow: "Buy Now",
    tabDescription: "Description",
    tabSpecs: "Specs",
    tabReviews: "Reviews",
    specPolycount: "Polycount",
    specFormats: "File formats",
    specPlatforms: "Platforms",
    specCategory: "Category",
    reviewsSummary: (n, r) => `${n} buyers have rated this avatar ${r}/5. Review threads plug in here once your backend is connected.`,
    buyerProtection: "Buyer protection · files re-delivered free if lost",
    langBtn: "Español",
    cartTitle: "Your Cart",
    cartEmpty: "Your cart is empty.",
    cartEmptySub: "Browse avatars and add your favorites.",
    each: "each",
    total: "Total",
    payWithPaypal: "Pay with PayPal",
    processingPayment: "Processing payment…",
    paymentSuccessTitle: "Payment successful!",
    paymentSuccessSub: (total) => `Your order total of $${total} was processed. This is a demo checkout — no real payment was made.`,
    continueShopping: "Continue shopping",
    remove: "Remove",
    cartCloseAria: "Close cart",
  },
  es: {
    brand: "AstraAvatars",
    heroTitle1: "Encuentra tu próximo cuerpo.",
    heroTitleHighlight: "Avatares",
    heroTitle2: "de VRChat hechos a mano, listos para usar.",
    heroSub: (n) => `Explora más de ${n} avatares originales de creadores independientes. Cada publicación incluye archivos de cuerpo completo, notas de compatibilidad con Quest y un inspector 3D antes de comprar.`,
    chipIndependent: "Creadores independientes",
    chipProtection: "Protección al comprador",
    chipQuest: "Compatible con Quest y PC",
    searchPlaceholder: "Buscar avatares, creadores, etiquetas…",
    cart: "Carrito",
    filtersBtn: "Filtros",
    category: "Categoría",
    platform: "Plataforma",
    sortBy: "Ordenar por",
    all: "Todos",
    resultsCount: (n) => `${n} avatar${n !== 1 ? "es" : ""}`,
    emptyTitle: "Ningún avatar coincide con esos filtros.",
    emptySub: "Prueba otra categoría o borra tu búsqueda.",
    by: "por",
    viewAvatar: "Ver avatar",
    footerNote: "Esta es una página demostrativa.",
    backToShop: "Volver a la tienda",
    inCart: "en el carrito",
    modelInspector: "INSPECTOR DE MODELO — UNIDAD",
    view3D: "3D",
    viewPhoto: "Foto",
    dragRotate: "Arrastra para rotar",
    scrollZoom: "Desplaza para hacer zoom",
    reviews: "reseñas",
    addToCart: "Añadir al carrito",
    added: "Añadido",
    buyNow: "Comprar ahora",
    tabDescription: "Descripción",
    tabSpecs: "Especificaciones",
    tabReviews: "Reseñas",
    specPolycount: "Nº de polígonos",
    specFormats: "Formatos de archivo",
    specPlatforms: "Plataformas",
    specCategory: "Categoría",
    reviewsSummary: (n, r) => `${n} compradores han calificado este avatar con ${r}/5. Los hilos de reseñas se conectarán aquí en cuanto conectes tu backend.`,
    buyerProtection: "Protección al comprador · reenvío gratuito de archivos si se pierden",
    langBtn: "English",
    cartTitle: "Tu carrito",
    cartEmpty: "Tu carrito está vacío.",
    cartEmptySub: "Explora avatares y añade tus favoritos.",
    each: "c/u",
    total: "Total",
    payWithPaypal: "Pagar con PayPal",
    processingPayment: "Procesando pago…",
    paymentSuccessTitle: "¡Pago exitoso!",
    paymentSuccessSub: (total) => `Se procesó tu pedido por un total de $${total}. Este es un checkout de demostración — no se realizó ningún pago real.`,
    continueShopping: "Seguir comprando",
    remove: "Quitar",
    cartCloseAria: "Cerrar carrito",
  },
};

const CATEGORY_LABELS = {
  en: { All: "All", Anthro: "Anthro", Cyber: "Cyber", Fantasy: "Fantasy", Mecha: "Mecha", Original: "Original" },
  es: { All: "Todos", Anthro: "Antropomórfico", Cyber: "Ciber", Fantasy: "Fantasía", Mecha: "Mecha", Original: "Original" },
};
const PLATFORM_LABELS = {
  en: { All: "All", PC: "PC", Quest: "Quest" },
  es: { All: "Todas", PC: "PC", Quest: "Quest" },
};
const SORT_LABELS = {
  en: { popular: "Popular", newest: "Newest", price_low: "Price: Low to High", price_high: "Price: High to Low", top_rated: "Top Rated" },
  es: { popular: "Populares", newest: "Más nuevos", price_low: "Precio: menor a mayor", price_high: "Precio: mayor a menor", top_rated: "Mejor calificados" },
};

/* ============================================================================
   GLOBAL STYLES — two theme namespaces: .store-theme (dark cyberpunk) and
   .detail-theme (textured skeuomorphic / tactile UI)
============================================================================ */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600;700;800;900&family=Rajdhani:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&family=Oswald:wght@400;500;600&display=swap');

    .avmk-root { font-family: 'Manrope', sans-serif; min-height: 100vh; }
    .avmk-root * { box-sizing: border-box; }
    .avmk-root button { font-family: inherit; cursor: pointer; }

    /* ---------------- STORE THEME : Dark Cyberpunk ---------------- */
    .store-theme {
      --bg: #08060f; --bg2: #100a1e; --panel: rgba(18,14,32,.72); --panel-solid:#140f24;
      --ink: #ECE8FF; --ink-soft: #9A8FC4; --ink-dim: #6B6390;
      --cyan: #00F0FF; --magenta: #FF2FD6; --purple: #8A5CFF; --acid: #39FF9E; --amber:#FFC857;
      --border: rgba(0,240,255,.4);
      color: var(--ink);
      background:
        repeating-linear-gradient(180deg, rgba(0,240,255,.025) 0px, rgba(0,240,255,.025) 1px, transparent 1px, transparent 3px),
        radial-gradient(ellipse 700px 420px at 12% -6%, rgba(138,92,255,.35), transparent 60%),
        radial-gradient(ellipse 800px 500px at 100% 8%, rgba(255,47,214,.22), transparent 55%),
        radial-gradient(ellipse 900px 600px at 50% 100%, rgba(0,240,255,.14), transparent 60%),
        linear-gradient(180deg, var(--bg2), var(--bg) 40%);
      position: relative;
    }
    .store-h1, .store-brand, .store-btn, .store-chip { font-family: 'Rajdhani', sans-serif; }
    .store-display { font-family: 'Orbitron', sans-serif; }

    .neo-border { border: 1.5px solid var(--border); border-radius: 16px; }
    .neo-shadow { box-shadow: 0 0 0 1px rgba(0,240,255,.12), 0 0 22px rgba(0,240,255,.16), 0 10px 30px rgba(0,0,0,.5); transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease; backdrop-filter: blur(10px); }
    .neo-shadow:hover { transform: translateY(-3px); box-shadow: 0 0 0 1px rgba(255,47,214,.35), 0 0 30px rgba(255,47,214,.35), 0 14px 34px rgba(0,0,0,.55); border-color: rgba(255,47,214,.6); }
    .neo-press:active { transform: translateY(1px) scale(.98); }

    .store-topbar { position: sticky; top:0; z-index: 40; background: rgba(8,6,15,.78); backdrop-filter: blur(14px); border-bottom: 1px solid rgba(0,240,255,.25); box-shadow: 0 1px 0 rgba(255,47,214,.15); }
    .store-brand { font-weight: 800; font-size: 1.4rem; letter-spacing: .04em; display:flex; align-items:center; gap:.55rem; text-transform: uppercase; }
    .store-brand-badge { background: linear-gradient(135deg, var(--magenta), var(--purple)); border-radius: 12px; width:36px; height:36px; display:flex; align-items:center; justify-content:center; box-shadow: 0 0 18px rgba(255,47,214,.55), 0 0 0 1px rgba(255,255,255,.15) inset; color:#fff; }

    .searchpill { border:1.5px solid var(--border); border-radius: 12px; background: rgba(255,255,255,.03); display:flex; align-items:center; gap:.5rem; padding:.55rem 1.1rem; transition: box-shadow .15s ease, border-color .15s ease; }
    .searchpill:focus-within { border-color: var(--cyan); box-shadow: 0 0 0 1px var(--cyan), 0 0 20px rgba(0,240,255,.35); }
    .searchpill input { border:none; outline:none; background:transparent; font-family:'Manrope'; font-size:.95rem; width:100%; color: var(--ink); }
    .searchpill input::placeholder { color: var(--ink-dim); }

    .store-btn { border:1.5px solid var(--border); border-radius: 10px; padding:.6rem 1.2rem; font-weight:700; letter-spacing:.03em; background: rgba(255,255,255,.02); color: var(--cyan); display:inline-flex; align-items:center; gap:.4rem; transition: all .15s ease; text-transform: uppercase; font-size:.9rem; }
    .store-btn:hover { border-color: var(--cyan); box-shadow: 0 0 16px rgba(0,240,255,.35); }
    .store-btn.primary { background: linear-gradient(135deg, var(--magenta), var(--purple)); color:#fff; border-color: transparent; box-shadow: 0 0 20px rgba(255,47,214,.4); }
    .store-btn.primary:hover { box-shadow: 0 0 28px rgba(255,47,214,.65); }
    .store-btn.ghost { background: transparent; border-color: transparent; }
    .store-btn.ghost:hover { box-shadow:none; text-decoration: underline; color: var(--magenta); }

    .store-chip { border:1.5px solid rgba(0,240,255,.3); border-radius: 8px; padding:.35rem .85rem; font-weight:700; font-size:.82rem; background: rgba(255,255,255,.03); color: var(--ink-soft); white-space:nowrap; letter-spacing:.02em; transition: all .15s ease; }
    .store-chip:hover { border-color: var(--cyan); color: var(--cyan); }
    .store-chip.active { background: linear-gradient(135deg, rgba(0,240,255,.22), rgba(138,92,255,.22)); border-color: var(--cyan); color: var(--ink); box-shadow: 0 0 14px rgba(0,240,255,.3); }

    .store-card { background: var(--panel); border-radius: 16px; overflow:hidden; display:flex; flex-direction:column; }
    .store-card-thumb { aspect-ratio: 1/1; position:relative; display:flex; align-items:center; justify-content:center; border-bottom:1px solid rgba(0,240,255,.2); overflow:hidden; }
    .store-card-thumb::after { content:''; position:absolute; inset:0; background: repeating-linear-gradient(180deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,.12) 3px); pointer-events:none; }
    .store-cardtitle { font-weight:700; font-size:1.02rem; line-height:1.15; color: var(--ink); font-family:'Rajdhani',sans-serif; letter-spacing:.01em; }
    .store-price { font-weight:800; font-size:1.15rem; font-family:'Orbitron',sans-serif; color: var(--acid); text-shadow: 0 0 12px rgba(57,255,158,.5); }
    .fav-btn { position:absolute; top:10px; right:10px; width:34px; height:34px; border-radius:8px; border:1.5px solid rgba(0,240,255,.4); background: rgba(8,6,15,.7); backdrop-filter: blur(4px); display:flex; align-items:center; justify-content:center; }

    .store-sidebar-card { background: var(--panel); border-radius: 14px; }
    .store-filter-label { font-weight:800; font-size:.75rem; text-transform:uppercase; letter-spacing:.1em; color: var(--purple); font-family:'Rajdhani',sans-serif; }

    .store-footer { background: linear-gradient(180deg, transparent, rgba(138,92,255,.08)); border-top: 1px solid rgba(0,240,255,.2); }

    .cyber-line { height:2px; background: linear-gradient(90deg, transparent, var(--cyan), var(--magenta), transparent); opacity:.7; }
    .glow-orb { position:absolute; border-radius:50%; filter: blur(50px); pointer-events:none; }

    /* ---------------- DETAIL THEME : Textured Skeuomorphic / Tactile UI ---------------- */
    .detail-theme {
      --metal-dark:#171512; --metal:#2A2622; --metal-light:#48423A; --walnut:#3B2A20;
      --walnut-light:#5C4130; --brass:#C9A24B; --brass-light:#E7CD8C; --cream:#EFE6D2;
      --glow:#7FE3E0; --panel:#232019;
      color: var(--cream);
      background:
        repeating-linear-gradient(115deg, rgba(255,255,255,.02) 0px, rgba(255,255,255,.02) 1px, transparent 1px, transparent 3px),
        radial-gradient(ellipse at 50% -10%, #38332c 0%, transparent 55%),
        linear-gradient(180deg, var(--metal-dark), #100e0c 65%);
      font-family: 'Manrope', sans-serif;
      min-height:100vh;
    }
    .plate-font { font-family: 'Oswald', sans-serif; letter-spacing:.03em; }

    .brushed-panel {
      background:
        repeating-linear-gradient(100deg, rgba(255,255,255,.035) 0px, rgba(255,255,255,.035) 1px, transparent 1px, transparent 4px),
        linear-gradient(155deg, var(--metal-light), var(--metal) 55%, var(--metal-dark));
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,.06);
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.12),
        inset 0 -6px 14px rgba(0,0,0,.55),
        0 18px 34px rgba(0,0,0,.55);
    }
    .leather-panel {
      background:
        radial-gradient(circle at 20% 15%, rgba(255,255,255,.05), transparent 55%),
        linear-gradient(160deg, var(--walnut-light), var(--walnut) 60%, #2a1c14);
      border-radius: 18px;
      border: 1px solid rgba(0,0,0,.5);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.08), inset 0 -8px 16px rgba(0,0,0,.5), 0 16px 30px rgba(0,0,0,.5);
    }
    .screw { position:absolute; width:10px; height:10px; border-radius:50%; background: radial-gradient(circle at 35% 30%, #857c6c, #2b271f 70%); box-shadow: 0 1px 2px rgba(0,0,0,.6), inset 0 0 2px rgba(0,0,0,.8); }
    .screw::after { content:''; position:absolute; inset:3px; border-top: 1px solid rgba(0,0,0,.7); transform: rotate(35deg); }

    .plate {
      background: linear-gradient(180deg, #d9c690, var(--brass) 55%, #a6812f);
      color: #2a1e0c; border-radius: 8px; box-shadow: 0 2px 0 #6f5420, inset 0 1px 0 rgba(255,255,255,.6), 0 6px 12px rgba(0,0,0,.4);
      font-family: 'Oswald', sans-serif; letter-spacing: .05em;
    }

    .tactile-btn {
      border-radius: 16px; border: 1px solid rgba(0,0,0,.5); font-weight:700; font-family:'Oswald', sans-serif; letter-spacing:.04em;
      background: linear-gradient(180deg, #ff8a5c, #e2582f 55%, #a63f21);
      color:#2a140a; box-shadow: 0 5px 0 #7a2c14, inset 0 1px 0 rgba(255,255,255,.5), 0 10px 18px rgba(230,90,40,.25);
      transition: transform .08s ease, box-shadow .08s ease;
    }
    .tactile-btn:active { transform: translateY(4px); box-shadow: 0 1px 0 #7a2c14, inset 0 1px 0 rgba(255,255,255,.4); }
    .tactile-btn.secondary {
      background: linear-gradient(180deg, #6d655a, #3a352d 55%, #211d17);
      color: var(--cream); box-shadow: 0 5px 0 #111, inset 0 1px 0 rgba(255,255,255,.2), 0 10px 18px rgba(0,0,0,.3);
    }

    .dial-btn {
      width:44px; height:44px; border-radius:50%;
      background: radial-gradient(circle at 32% 28%, #6d655a, #2c2823 70%);
      border: 1px solid rgba(0,0,0,.6); color: var(--cream);
      box-shadow: 0 3px 0 #111, inset 0 1px 1px rgba(255,255,255,.15), 0 6px 10px rgba(0,0,0,.4);
      display:flex; align-items:center; justify-content:center; transition: transform .08s ease;
    }
    .dial-btn:active { transform: translateY(3px); box-shadow: 0 0 0 #111, inset 0 1px 3px rgba(0,0,0,.6); }
    .dial-btn.on { background: radial-gradient(circle at 32% 28%, var(--glow), #1a3a38 70%); color:#0c1f1e; }

    .stitch { border: 2px dashed rgba(239,230,210,.18); border-radius: 14px; }

    .viewer-frame {
      position:relative; border-radius: 22px; overflow:hidden;
      background:
        radial-gradient(circle at 50% 30%, rgba(127,227,224,.10), transparent 60%),
        radial-gradient(ellipse at 50% 100%, rgba(0,0,0,.7), transparent 60%),
        linear-gradient(180deg, #0c0b09, #050504);
      box-shadow: inset 0 0 60px rgba(0,0,0,.85), inset 0 0 0 1px rgba(255,255,255,.05);
    }

    .detail-chip { border:1px solid rgba(239,230,210,.25); border-radius:999px; padding:.3rem .8rem; font-size:.78rem; font-weight:600; background: rgba(255,255,255,.04); }

    ::selection { background: var(--magenta, #FF2FD6); color:#fff; }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @media (max-width: 900px) {
      .store-sidebar { display:none; }
      .store-sidebar.open { display:block; }
      .detail-split { grid-template-columns: 1fr !important; }
    }

    /* ---------------- CART MODAL — self-contained, works over either theme ---------------- */
    @keyframes cart-spin { to { transform: rotate(360deg); } }
    .cart-overlay { position:fixed; inset:0; background: rgba(4,3,10,.75); backdrop-filter: blur(6px); z-index:200; display:flex; align-items:center; justify-content:center; padding:20px; }
    .cart-panel { width:100%; max-width:440px; max-height:86vh; display:flex; flex-direction:column; background: linear-gradient(160deg, rgba(20,15,36,.97), rgba(8,6,15,.98)); border:1.5px solid rgba(0,240,255,.35); border-radius:18px; box-shadow: 0 0 0 1px rgba(0,240,255,.1), 0 0 50px rgba(138,92,255,.25), 0 25px 60px rgba(0,0,0,.6); font-family:'Manrope',sans-serif; color:#ECE8FF; overflow:hidden; }
    .cart-header { display:flex; align-items:center; justify-content:space-between; padding:18px 20px; border-bottom:1px solid rgba(0,240,255,.2); flex-shrink:0; }
    .cart-header h2 { font-family:'Rajdhani',sans-serif; text-transform:uppercase; letter-spacing:.05em; font-size:1.2rem; margin:0; font-weight:800; }
    .cart-close { width:32px; height:32px; border-radius:8px; border:1.5px solid rgba(0,240,255,.3); background:rgba(255,255,255,.03); color:#ECE8FF; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition: all .15s ease; }
    .cart-close:hover { border-color:#00F0FF; box-shadow: 0 0 12px rgba(0,240,255,.4); }
    .cart-items { flex:1; overflow-y:auto; padding:14px 20px; display:flex; flex-direction:column; gap:12px; }
    .cart-item { display:flex; gap:12px; align-items:center; padding:10px; border-radius:12px; background: rgba(255,255,255,.03); border:1px solid rgba(0,240,255,.12); }
    .cart-item img, .cart-item-glyph { width:52px; height:52px; border-radius:8px; object-fit:cover; flex-shrink:0; background: rgba(0,0,0,.3); display:flex; align-items:center; justify-content:center; overflow:hidden; }
    .cart-item-info { flex:1; min-width:0; }
    .cart-item-name { font-weight:700; font-size:.9rem; color:#ECE8FF; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .cart-item-meta { font-size:.78rem; color:#9A8FC4; margin-bottom:4px; }
    .cart-qty { display:flex; align-items:center; gap:6px; }
    .cart-qty button { width:22px; height:22px; border-radius:6px; border:1px solid rgba(0,240,255,.3); background:rgba(255,255,255,.03); color:#00F0FF; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .cart-qty button:hover { border-color:#00F0FF; box-shadow: 0 0 8px rgba(0,240,255,.4); }
    .cart-qty span { font-size:.8rem; min-width:14px; text-align:center; }
    .cart-item-price { font-family:'Orbitron',sans-serif; font-weight:700; color:#39FF9E; font-size:.85rem; white-space:nowrap; }
    .cart-remove { color:#FF2FD6; opacity:.65; background:transparent; border:none; display:flex; align-items:center; justify-content:center; padding:2px; transition: opacity .15s ease; }
    .cart-remove:hover { opacity:1; }
    .cart-footer { padding:16px 20px 20px; border-top:1px solid rgba(0,240,255,.2); display:flex; flex-direction:column; gap:12px; flex-shrink:0; }
    .cart-total-row { display:flex; justify-content:space-between; align-items:center; }
    .cart-total-label { text-transform:uppercase; letter-spacing:.06em; font-weight:700; color:#9A8FC4; font-size:.85rem; font-family:'Rajdhani',sans-serif; }
    .cart-total-value { font-family:'Orbitron',sans-serif; font-size:1.4rem; font-weight:800; color:#39FF9E; text-shadow: 0 0 14px rgba(57,255,158,.5); }
    .paypal-btn { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:.85rem 1rem; border-radius:999px; border:none; background:#FFC439; color:#111; font-weight:800; font-size:1rem; letter-spacing:.01em; cursor:pointer; transition: all .15s ease; box-shadow: 0 6px 18px rgba(255,196,57,.35); font-family:'Manrope',sans-serif; }
    .paypal-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 22px rgba(255,196,57,.5); }
    .paypal-btn:disabled { opacity:.75; cursor:default; transform:none; }
    .paypal-logo { font-style: italic; font-weight:900; font-size:1.05rem; }
    .paypal-logo b { color:#003087; }
    .paypal-logo i { color:#009cde; font-style:italic; }
    .cart-empty { padding:50px 20px; text-align:center; color:#9A8FC4; }
    .cart-success { padding:44px 24px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:10px; }
  `}</style>
);

/* ============================================================================
   LANGUAGE TOGGLE — shared control, styled per theme
============================================================================ */
function LanguageToggle({ lang, setLang, t, variant = "store" }) {
  const isStore = variant === "store";
  return (
    <button
      className={isStore ? "store-btn neo-shadow neo-press" : "tactile-btn secondary"}
      style={isStore ? {} : { padding: ".55rem .9rem", display: "inline-flex", alignItems: "center", gap: 6 }}
      onClick={() => setLang(lang === "en" ? "es" : "en")}
      title="Switch language / Cambiar idioma"
    >
      <Globe size={16} /> {t.langBtn}
    </button>
  );
}

/* ============================================================================
   AVATAR GLYPH — procedural SVG thumbnail art (stand-in for product photos)
============================================================================ */
function AvatarGlyph({ avatar, size = 96 }) {
  const { primary, secondary, accent, earType } = avatar;
  const ears = {
    cat: <path d="M30 28 L22 8 L44 22 Z M70 28 L78 8 L56 22 Z" fill={primary} stroke="#241C13" strokeWidth="2.5" strokeLinejoin="round" />,
    fox: <path d="M28 30 L18 4 L42 24 Z M72 30 L82 4 L58 24 Z" fill={primary} stroke="#241C13" strokeWidth="2.5" strokeLinejoin="round" />,
    round: <><circle cx="26" cy="22" r="13" fill={primary} stroke="#241C13" strokeWidth="2.5" /><circle cx="74" cy="22" r="13" fill={primary} stroke="#241C13" strokeWidth="2.5" /></>,
    horn: <path d="M32 26 C 26 10, 30 -2, 22 -6 C 34 -4, 42 12, 38 28 Z M68 26 C 74 10, 70 -2, 78 -6 C 66 -4, 58 12, 62 28 Z" fill={accent} stroke="#241C13" strokeWidth="2.5" strokeLinejoin="round" />,
    antenna: <><line x1="50" y1="18" x2="50" y2="-4" stroke="#241C13" strokeWidth="3" /><circle cx="50" cy="-6" r="5" fill={accent} stroke="#241C13" strokeWidth="2" /></>,
    hair: <path d="M22 28 C 20 4, 40 -6, 50 2 C 60 -6, 80 4, 78 28 Z" fill={secondary} stroke="#241C13" strokeWidth="2.5" strokeLinejoin="round" />,
  };
  return (
    <svg viewBox="-10 -14 120 120" width={size} height={size} style={{ overflow: "visible" }}>
      <ellipse cx="50" cy="94" rx="30" ry="6" fill="#000" opacity="0.35" />
      {ears[earType] || ears.round}
      <circle cx="50" cy="46" r="34" fill={primary} stroke="#241C13" strokeWidth="2.5" />
      <ellipse cx="50" cy="58" rx="17" ry="13" fill={secondary} opacity="0.9" />
      <circle cx="39" cy="42" r="4.5" fill="#241C13" />
      <circle cx="61" cy="42" r="4.5" fill="#241C13" />
      <circle cx="40.5" cy="40.5" r="1.4" fill="#fff" />
      <circle cx="62.5" cy="40.5" r="1.4" fill="#fff" />
      <circle cx="32" cy="52" r="4.5" fill={accent} opacity="0.55" />
      <circle cx="68" cy="52" r="4.5" fill={accent} opacity="0.55" />
      <path d="M44 60 Q50 65 56 60" stroke="#241C13" strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="30" y="78" width="40" height="22" rx="14" fill={secondary} stroke="#241C13" strokeWidth="2.5" />
    </svg>
  );
}

/* ============================================================================
   CARD THUMB — shows the real product photo when available (a.image),
   falling back to the procedural AvatarGlyph if the image fails to load.
============================================================================ */
function CardThumb({ avatar }) {
  const [failed, setFailed] = useState(false);
  if (avatar.image && !failed) {
    return (
      <img
        src={avatar.image}
        alt={avatar.name}
        loading="lazy"
        onError={() => setFailed(true)}
        style={{ width: "100%", height: "100%", position: "relative", zIndex: 1 }}
      />
    );
  }
  return <AvatarGlyph avatar={avatar} size={128} />;
}

/* ============================================================================
   STAR RATING (shared)
============================================================================ */
function Stars({ value, size = 14, color = "#241C13" }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} fill={value >= i - 0.25 ? color : "none"} color={color} strokeWidth={2} />
      ))}
    </span>
  );
}

/* ============================================================================
   STOREFRONT PAGE — Dark Cyberpunk
============================================================================ */
function Storefront({ onSelect, favorites, toggleFavorite, cartCount, lang, setLang, onOpenCart }) {
  const t = STRINGS[lang];
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [platform, setPlatform] = useState("All");
  const [sort, setSort] = useState("popular");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let list = AVATARS.filter((a) => {
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || a.name.toLowerCase().includes(q) || a.creator.toLowerCase().includes(q) || a.tags.some((tg) => tg.toLowerCase().includes(q));
      const matchesCategory = category === "All" || a.category === category;
      const matchesPlatform = platform === "All" || a.platform.includes(platform);
      return matchesQuery && matchesCategory && matchesPlatform;
    });
    switch (sort) {
      case "newest": list = [...list].reverse(); break;
      case "price_low": list = [...list].sort((a, b) => a.price - b.price); break;
      case "price_high": list = [...list].sort((a, b) => b.price - a.price); break;
      case "top_rated": list = [...list].sort((a, b) => b.rating - a.rating); break;
      default: list = [...list].sort((a, b) => b.reviews - a.reviews);
    }
    return list;
  }, [query, category, platform, sort]);

  return (
    <div className="store-theme avmk-root">
      {/* Top bar */}
      <div className="store-topbar">
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <div className="store-brand">
            <span className="store-brand-badge"><Zap size={18} /></span>
            {t.brand}
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="searchpill">
              <Search size={18} color="#00F0FF" />
              <input placeholder={t.searchPlaceholder} value={query} onChange={(e) => setQuery(e.target.value)} />
              {query && <X size={16} style={{ cursor: "pointer", color: "#9A8FC4" }} onClick={() => setQuery("")} />}
            </div>
          </div>
          <button className="store-btn ghost" style={{ display: window.innerWidth < 900 ? "inline-flex" : "none" }} onClick={() => setShowFilters((s) => !s)}>
            <SlidersHorizontal size={16} /> {t.filtersBtn}
          </button>
          <LanguageToggle lang={lang} setLang={setLang} t={t} variant="store" />
          <button className="store-btn primary neo-shadow neo-press" style={{ position: "relative" }} onClick={onOpenCart}>
            <ShoppingCart size={18} />
            {t.cart}
            {cartCount > 0 && (
              <span style={{ position: "absolute", top: -8, right: -8, background: "#FF2FD6", color: "#fff", borderRadius: 999, fontSize: 11, fontWeight: 800, width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #08060f", boxShadow: "0 0 10px rgba(255,47,214,.7)" }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
        <div className="cyber-line" />
      </div>

      {/* Hero */}
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "44px 20px 8px", position: "relative", overflow: "hidden" }}>
        <div className="glow-orb" style={{ width: 320, height: 320, background: "radial-gradient(circle, rgba(255,47,214,.35), transparent 70%)", top: -80, right: -40 }} />
        <div className="glow-orb" style={{ width: 260, height: 260, background: "radial-gradient(circle, rgba(0,240,255,.3), transparent 70%)", bottom: -60, left: "20%" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="store-chip" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16, borderColor: "rgba(255,47,214,.5)", color: "#FF2FD6" }}>
            <Sparkles size={13} /> {lang === "es" ? "Mercado en vivo" : "Marketplace live"}
          </div>
          <h1 className="store-display" style={{ fontSize: "clamp(2rem, 5vw, 3.1rem)", fontWeight: 800, lineHeight: 1.08, margin: "0 0 14px", maxWidth: 700, textTransform: "uppercase" }}>
            {t.heroTitle1}{" "}
            <span style={{
              background: "linear-gradient(90deg, #00F0FF, #FF2FD6)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
              textShadow: "0 0 30px rgba(0,240,255,.35)",
            }}>{t.heroTitleHighlight}</span>{" "}
            {t.heroTitle2}
          </h1>
          <p style={{ color: "var(--ink-soft)", fontSize: "1.05rem", maxWidth: 580, margin: "0 0 20px" }}>
            {t.heroSub(AVATARS.length)}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span className="store-chip"><Sparkles size={13} style={{ marginRight: 4, verticalAlign: -2 }} />{t.chipIndependent}</span>
            <span className="store-chip"><ShieldCheck size={13} style={{ marginRight: 4, verticalAlign: -2 }} />{t.chipProtection}</span>
            <span className="store-chip">{t.chipQuest}</span>
          </div>
        </div>
      </div>

      {/* Body: sidebar + grid */}
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "24px 20px 60px", display: "grid", gridTemplateColumns: "240px 1fr", gap: 26 }}>
        <aside className={`store-sidebar ${showFilters ? "open" : ""}`} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="store-sidebar-card neo-border neo-shadow" style={{ padding: 18 }}>
            <div className="store-filter-label" style={{ marginBottom: 10 }}>{t.category}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CATEGORIES.map((c) => (
                <button key={c} className={`store-chip ${category === c ? "active" : ""}`} onClick={() => setCategory(c)}>{CATEGORY_LABELS[lang][c]}</button>
              ))}
            </div>
          </div>
          <div className="store-sidebar-card neo-border neo-shadow" style={{ padding: 18 }}>
            <div className="store-filter-label" style={{ marginBottom: 10 }}>{t.platform}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {PLATFORMS.map((p) => (
                <button key={p} className={`store-chip ${platform === p ? "active" : ""}`} onClick={() => setPlatform(p)}>{PLATFORM_LABELS[lang][p]}</button>
              ))}
            </div>
          </div>
          <div className="store-sidebar-card neo-border neo-shadow" style={{ padding: 18 }}>
            <div className="store-filter-label" style={{ marginBottom: 10 }}>{t.sortBy}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SORT_KEYS.map((s) => (
                <button key={s} onClick={() => setSort(s)} className="store-btn ghost" style={{ justifyContent: "flex-start", padding: "6px 4px", fontWeight: sort === s ? 800 : 600, color: sort === s ? "#FF2FD6" : "var(--ink-soft)", textDecoration: sort === s ? "underline" : "none", textTransform: "none" }}>
                  {SORT_LABELS[lang][s]}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <div style={{ fontWeight: 700, color: "var(--ink-soft)", fontFamily: "'Rajdhani',sans-serif", letterSpacing: ".03em" }}>{t.resultsCount(filtered.length)}</div>
          </div>
          {filtered.length === 0 ? (
            <div className="store-sidebar-card neo-border" style={{ padding: 40, textAlign: "center", color: "var(--ink-soft)" }}>
              <Grid3x3 size={28} style={{ marginBottom: 8, color: "#00F0FF" }} />
              <div style={{ fontWeight: 700, color: "var(--ink)" }}>{t.emptyTitle}</div>
              <div style={{ fontSize: ".9rem" }}>{t.emptySub}</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 22 }}>
              {filtered.map((a) => (
                <article key={a.id} className="store-card neo-border neo-shadow">
                  <div className="store-card-thumb" style={{ background: `linear-gradient(155deg, ${a.primary}2e, ${a.secondary}99)` }}>
                    <button
                      className="fav-btn"
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(a.id); }}
                      aria-label="Toggle favorite"
                    >
                      <Heart size={16} fill={favorites.has(a.id) ? "#FF2FD6" : "none"} color={favorites.has(a.id) ? "#FF2FD6" : "#ECE8FF"} />
                    </button>
                    <CardThumb avatar={a} />
                  </div>
                  <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span className="store-chip" style={{ padding: ".18rem .6rem", fontSize: ".72rem" }}>{CATEGORY_LABELS[lang][a.category]}</span>
                      {a.platform.map((p) => <span key={p} className="store-chip" style={{ padding: ".18rem .6rem", fontSize: ".72rem" }}>{p}</span>)}
                    </div>
                    <div className="store-cardtitle">{a.name}</div>
                    <div style={{ color: "var(--ink-dim)", fontSize: ".85rem", fontWeight: 600 }}>{t.by} @{a.creator}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Stars value={a.rating} size={13} color="#FFC857" />
                      <span style={{ fontSize: ".8rem", color: "var(--ink-soft)" }}>{a.rating} ({a.reviews})</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                      <span className="store-price">${a.price}</span>
                      <button className="store-btn primary neo-press" style={{ padding: ".5rem .9rem", fontSize: ".8rem" }} onClick={() => onSelect(a.id)}>
                        {t.viewAvatar}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <footer className="store-footer">
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "34px 20px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div className="store-brand">
            <span className="store-brand-badge"><Zap size={18} /></span> {t.brand}
          </div>
          <div style={{ fontSize: ".85rem", opacity: .6, alignSelf: "center", maxWidth: 460 }}>{t.footerNote}</div>
        </div>
      </footer>
    </div>
  );
}

/* ============================================================================
   3D AVATAR VIEWER — Three.js turntable, drag-to-rotate + zoom controls
============================================================================ */
function loadAvatarModel(avatar, onLoaded, onError, setLoading, setError) {
  const modelUrl = AVATAR_MODELS[avatar.id];

  if (!modelUrl) {
    console.log(`No GLB model found for ${avatar.id}, using procedural model`);
    setLoading(false);
    onLoaded(buildCharacter(avatar));
    return;
  }

  const loader = new GLTFLoader();
  // Necesario en caso de que el .glb esté comprimido con Draco (común al usar
  // `gltf-transform optimize --compress draco`). Si el modelo no usa Draco,
  // este loader simplemente no se activa — no hay ningún costo en dejarlo.
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
  loader.setDRACOLoader(dracoLoader);

  console.log(`Attempting to load ${modelUrl} for ${avatar.name}`);
  setLoading(true);
  setError(false);

  loader.load(
    modelUrl,
    (gltf) => {
      const object = gltf.scene;
      console.log(`Successfully loaded ${modelUrl}`, object);

      // Normalizar el modelo primero
      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // Calcular escala apropiada
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetSize = 2.5; // Tamaño objetivo
      const scale = maxDim > 0 ? targetSize / maxDim : 1;

      // Aplicar escala
      object.scale.set(scale, scale, scale);

      // Centrar el modelo y elevarlo para mejor visibilidad
      object.position.x = -center.x * scale;
      object.position.y = -center.y * scale + 0.5; // Elevado 0.5 unidades
      object.position.z = -center.z * scale;

      // Aplicar materiales con los colores del avatar (conservando texturas si existen)
      object.traverse((child) => {
        if (child.isMesh) {
          // Si el mesh ya tiene materiales con texturas, conservarlos
          if (child.material && child.material.map) {
            console.log(`Keeping original material with texture for ${child.name}`);
          } else {
            // Aplicar nuevo material con colores del avatar
            child.material = new THREE.MeshStandardMaterial({
              color: avatar.primary,
              roughness: 0.5,
              metalness: 0.1,
            });
          }
          // Habilitar sombras
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      setLoading(false);
      onLoaded(object);
    },
    (progress) => {
      if (progress.lengthComputable) {
        const percent = (progress.loaded / progress.total) * 100;
        console.log(`Loading ${modelUrl}: ${percent.toFixed(1)}%`);
      }
    },
    (error) => {
      console.error(`❌ Error loading GLB model "${modelUrl}" for ${avatar.name}:`);
      console.error(error?.message || error);
      console.error("Full error object:", error);
      console.log(`Falling back to procedural model for ${avatar.name}.`);
      setError(true);
      setLoading(false);
      // Fallback al modelo procedural
      onLoaded(buildCharacter(avatar));
    }
  );
}

function buildCharacter(avatar) {
  const group = new THREE.Group();
  const matPrimary = new THREE.MeshStandardMaterial({ color: avatar.primary, roughness: 0.65, metalness: 0.08, flatShading: true });
  const matSecondary = new THREE.MeshStandardMaterial({ color: avatar.secondary, roughness: 0.7, metalness: 0.05, flatShading: true });
  const matAccent = new THREE.MeshStandardMaterial({ color: avatar.accent, roughness: 0.4, metalness: 0.2, emissive: avatar.accent, emissiveIntensity: 0.35, flatShading: true });
  const matDark = new THREE.MeshStandardMaterial({ color: "#20180f", roughness: 0.6 });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.6, 24, 18), matPrimary);
  head.position.y = 1.35;
  group.add(head);

  const patch = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), matSecondary);
  patch.position.set(0, 1.2, 0.48);
  patch.scale.set(1, 0.8, 0.7);
  group.add(patch);

  [-0.22, 0.22].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), matDark);
    eye.position.set(x, 1.4, 0.55);
    group.add(eye);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), matAccent);
    glint.position.set(x, 1.44, 0.6);
    group.add(glint);
  });

  const earType = avatar.earType;
  if (earType === "fox" || earType === "cat") {
    const scale = earType === "cat" ? 0.7 : 1;
    [-1, 1].forEach((side) => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.22 * scale, 0.5 * scale, 4), matPrimary);
      ear.position.set(side * 0.42, 1.9, -0.05);
      ear.rotation.z = side * -0.25;
      ear.rotation.y = Math.PI / 4;
      group.add(ear);
      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.12 * scale, 0.3 * scale, 4), matSecondary);
      inner.position.set(side * 0.42, 1.85, 0.05);
      inner.rotation.z = side * -0.25;
      inner.rotation.y = Math.PI / 4;
      group.add(inner);
    });
  } else if (earType === "round") {
    [-1, 1].forEach((side) => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), matPrimary);
      ear.position.set(side * 0.55, 1.85, 0);
      ear.scale.set(0.6, 1, 1);
      group.add(ear);
    });
  } else if (earType === "horn") {
    [-1, 1].forEach((side) => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.55, 8), matAccent);
      horn.position.set(side * 0.3, 1.95, -0.1);
      horn.rotation.z = side * -0.4;
      group.add(horn);
    });
  } else if (earType === "antenna") {
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), matDark);
    stalk.position.set(0, 2.1, 0);
    group.add(stalk);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), matAccent);
    tip.position.set(0, 2.36, 0);
    group.add(tip);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.16, 0.1), matAccent);
    visor.position.set(0, 1.42, 0.55);
    group.add(visor);
  } else if (earType === "fin") {
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 4), matAccent);
    fin.position.set(0, 2.0, -0.1);
    fin.rotation.x = 0.3;
    group.add(fin);
    [-1, 1].forEach((side) => {
      const gill = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 6, 12), matAccent);
      gill.position.set(side * 0.58, 1.3, 0.1);
      gill.rotation.y = Math.PI / 2;
      group.add(gill);
    });
  } else if (earType === "hair") {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.66, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.7), matSecondary);
    hair.position.set(0, 1.55, -0.02);
    group.add(hair);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.035, 10, 32), matAccent);
    ring.position.set(0, 2.15, 0);
    ring.rotation.x = Math.PI / 2.3;
    group.add(ring);
  }

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.85, 16), matPrimary);
  body.position.y = 0.55;
  group.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10), matSecondary);
  belly.position.set(0, 0.5, 0.32);
  belly.scale.set(1, 1.1, 0.5);
  group.add(belly);

  [-1, 1].forEach((side) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.62, 10), matPrimary);
    arm.position.set(side * 0.52, 0.62, 0);
    arm.rotation.z = side * 0.35;
    group.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), matSecondary);
    hand.position.set(side * 0.72, 0.32, 0);
    group.add(hand);
  });

  [-1, 1].forEach((side) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.12, 0.55, 10), matPrimary);
    leg.position.set(side * 0.2, 0.02, 0);
    group.add(leg);
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), matSecondary);
    foot.position.set(side * 0.2, -0.25, 0.08);
    foot.scale.set(1, 0.7, 1.3);
    group.add(foot);
  });

  if (["fox", "fin"].includes(earType) || avatar.category === "Feral" || avatar.category === "Cyber") {
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.9, 10), matSecondary);
    tail.position.set(0, 0.55, -0.55);
    tail.rotation.x = Math.PI / 2.2;
    group.add(tail);
    const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), matAccent);
    tailTip.position.set(0, 0.85, -1.05);
    group.add(tailTip);
  }

  group.position.y = -0.9;
  return group;
}

function makeShadowTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(0,0,0,0.45)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function AvatarViewer({ avatar, t }) {
  const mountRef = useRef(null);
  const stateRef = useRef({});
  const [autoRotate, setAutoRotate] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, mount.clientWidth / mount.clientHeight, 0.1, 100);
    const distance = { value: 4.4 };
    camera.position.set(0, 1.5, distance.value); // Ajustado para modelo elevado
    camera.lookAt(0, 1.0, 0); // Punto de mira ajustado para modelo elevado

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xfff2df, 0x1a1410, 0.85);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xfff2df, 1.1);
    key.position.set(2.5, 4, 3);
    scene.add(key);
    const rim = new THREE.DirectionalLight(avatar.accent, 1.1);
    rim.position.set(-3, 1.5, -3);
    scene.add(rim);
    const fill = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(fill);

    const shadowTex = makeShadowTexture();
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
    const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -0.02;
    scene.add(shadowMesh);

    // Inicializar stateRef inmediatamente
    stateRef.current = { 
      rotY: 0.4, 
      targetRotY: 0.4, 
      rotX: 0, 
      targetRotX: 0, 
      dragging: false, 
      lastX: 0, 
      lastY: 0, 
      distance: distance, 
      autoRotate: true, 
      wireframe: false, 
      character: null 
    };
    
    let character;
    
    // Cargar modelo GLB o usar modelo procedural
    loadAvatarModel(avatar, (loadedCharacter) => {
      character = loadedCharacter;
      scene.add(character);
      
      stateRef.current.character = character;
      stateRef.current.camera = camera;
      stateRef.current.scene = scene;
      stateRef.current.renderer = renderer;
      stateRef.current.shadowTex = shadowTex;

      const applyWireframe = (val) => {
        character.traverse((obj) => { if (obj.isMesh) obj.material.wireframe = val; });
      };
      stateRef.current.applyWireframe = applyWireframe;
    }, null, setLoading, setError);

    let frameId;
    const animate = () => {
      const s = stateRef.current;
      if (s.autoRotate && !s.dragging) s.targetRotY += 0.0045;
      s.rotY += (s.targetRotY - s.rotY) * 0.12;
      s.rotX += (s.targetRotX - s.rotX) * 0.12;
      if (s.character) {
        s.character.rotation.y = s.rotY;
        s.character.rotation.x = s.rotX;
      }
      camera.position.set(0, 1.25, s.distance.value);
      camera.lookAt(0, 0.75, 0);
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const onPointerDown = (e) => {
      const s = stateRef.current;
      s.dragging = true;
      s.lastX = e.clientX; s.lastY = e.clientY;
      mount.setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e) => {
      const s = stateRef.current;
      if (!s.dragging) return;
      const dx = e.clientX - s.lastX;
      const dy = e.clientY - s.lastY;
      s.lastX = e.clientX; s.lastY = e.clientY;
      s.targetRotY += dx * 0.008;
      s.targetRotX = Math.max(-0.35, Math.min(0.35, s.targetRotX + dy * 0.006));
    };
    const onPointerUp = () => { stateRef.current.dragging = false; };
    const onWheel = (e) => {
      e.preventDefault();
      const s = stateRef.current;
      s.distance.value = Math.max(2.4, Math.min(7, s.distance.value + e.deltaY * 0.0035));
    };

    mount.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    mount.addEventListener("wheel", onWheel, { passive: false });

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      mount.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      mount.removeEventListener("wheel", onWheel);
      
      // Cleanup character if it exists
      if (stateRef.current.character) {
        stateRef.current.character.traverse((obj) => {
          if (obj.isMesh) { 
            obj.geometry.dispose(); 
            obj.material.dispose(); 
          }
        });
      }
      
      shadowTex.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [avatar.id, avatar]);

  useEffect(() => { stateRef.current.autoRotate = autoRotate; }, [autoRotate]);
  useEffect(() => {
    stateRef.current.wireframe = wireframe;
    stateRef.current.applyWireframe?.(wireframe);
  }, [wireframe]);

  const zoom = (dir) => {
    const s = stateRef.current;
    s.distance.value = Math.max(2.4, Math.min(7, s.distance.value + dir * 0.4));
  };
  const resetView = () => {
    const s = stateRef.current;
    s.targetRotY = 0.4; s.targetRotX = 0; s.distance.value = 4.4;
  };

  return (
    <div style={{ width: "100%", aspectRatio: "1 / 1", position: "relative", borderRadius: "16px", overflow: "hidden", background: "radial-gradient(circle at 50% 30%, rgba(127,227,224,.10), transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(0,0,0,.7), transparent 60%), linear-gradient(180deg, #0c0b09, #050504)", boxShadow: "inset 0 0 60px rgba(0,0,0,.85), inset 0 0 0 1px rgba(255,255,255,.05)" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%", cursor: "grab", touchAction: "none" }} />
      
      {/* Loading indicator */}
      {loading && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(8,6,15,0.8)", backdropFilter: "blur(8px)", zIndex: 10 }}>
          <div style={{ textAlign: "center", color: "var(--cyan)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "1rem", animation: "spin 1s linear infinite" }}>⟳</div>
            <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>Cargando modelo...</div>
          </div>
        </div>
      )}
      
      {/* Error indicator */}
      {error && (
        <div style={{ position: "absolute", top: 14, right: 14, zIndex: 10 }}>
          <span className="store-chip" style={{ padding: ".25rem .7rem", fontSize: ".75rem", background: "rgba(255,47,214,.2)", borderColor: "var(--magenta)", color: "var(--magenta)" }}>
            Usando modelo alternativo
          </span>
        </div>
      )}
      
      <div style={{ position: "absolute", top: 14, left: 14, display: "flex", gap: 6, zIndex: 5 }}>
        <span className="store-chip" style={{ padding: ".25rem .7rem", fontSize: ".75rem", background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)" }}>{t.dragRotate}</span>
        <span className="store-chip" style={{ padding: ".25rem .7rem", fontSize: ".75rem", background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)" }}>{t.scrollZoom}</span>
      </div>
      <div style={{ position: "absolute", bottom: 14, right: 14, display: "flex", gap: 10, zIndex: 5 }}>
        <button className={`store-btn ${autoRotate ? "primary" : "ghost"}`} style={{ padding: ".5rem", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setAutoRotate((v) => !v)} title="Toggle auto-rotate">
          {autoRotate ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button className="store-btn ghost" style={{ padding: ".5rem", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => zoom(-1)} title="Zoom in"><ZoomIn size={16} /></button>
        <button className="store-btn ghost" style={{ padding: ".5rem", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => zoom(1)} title="Zoom out"><ZoomOut size={16} /></button>
        <button className="store-btn ghost" style={{ padding: ".5rem", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={resetView} title="Reset view"><RotateCcw size={16} /></button>
        <button className={`store-btn ${wireframe ? "primary" : "ghost"}`} style={{ padding: ".5rem", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setWireframe((v) => !v)} title="Toggle wireframe">
          <Boxes size={16} />
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
   STATIC AVATAR IMAGE — shown in place of the 3D viewer when it's toggled off.
   Falls back to the procedural glyph if no photo is available or it fails.
============================================================================ */
function StaticAvatarImage({ avatar }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="viewer-frame" style={{ width: "100%", aspectRatio: "1 / 1", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {avatar.image && !failed ? (
        <img
          src={avatar.image}
          alt={avatar.name}
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <AvatarGlyph avatar={avatar} size={220} />
      )}
    </div>
  );
}

/* ============================================================================
   DETAIL PAGE — Textured Skeuomorphic / Tactile UI
============================================================================ */
function DetailPage({ avatar, onBack, favorites, toggleFavorite, onAddToCart, cartCount, lang, setLang, onOpenCart }) {
  const t = STRINGS[lang];
  const [tab, setTab] = useState("Description");
  const [show3D, setShow3D] = useState(true);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAddToCart(avatar.id);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="store-theme avmk-root">
      <div className="store-topbar">
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <div className="store-brand">
            <span className="store-brand-badge"><Zap size={18} /></span>
            {t.brand}
          </div>
          <div style={{ flex: 1 }} />
          <button className="store-btn ghost" style={{ display: "inline-flex", alignItems: "center", gap: 6 }} onClick={onBack}>
            <ChevronLeft size={16} /> {t.backToShop}
          </button>
          <LanguageToggle lang={lang} setLang={setLang} t={t} variant="store" />
          <button className="store-btn primary neo-shadow neo-press" style={{ position: "relative" }} onClick={onOpenCart}>
            <ShoppingCart size={18} />
            {t.cart}
            {cartCount > 0 && (
              <span style={{ position: "absolute", top: -8, right: -8, background: "#FF2FD6", color: "#fff", borderRadius: 999, fontSize: 11, fontWeight: 800, width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #08060f", boxShadow: "0 0 10px rgba(255,47,214,.7)" }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
        <div className="cyber-line" />
      </div>

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "30px 20px 60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 26 }}>
          {/* Left: viewer */}
          <div className="store-sidebar-card neo-border neo-shadow" style={{ padding: 18, position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <div className="store-filter-label" style={{ fontSize: ".8rem", letterSpacing: ".08em" }}>
                {t.modelInspector}&nbsp;{avatar.id.toUpperCase()}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  className={`store-chip ${show3D ? "active" : ""}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: ".32rem .75rem" }}
                  onClick={() => setShow3D(true)}
                >
                  <Boxes size={13} /> {t.view3D}
                </button>
                <button
                  className={`store-chip ${!show3D ? "active" : ""}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: ".32rem .75rem" }}
                  onClick={() => setShow3D(false)}
                >
                  <ImageIcon size={13} /> {t.viewPhoto}
                </button>
              </div>
            </div>
            {show3D ? <AvatarViewer avatar={avatar} t={t} /> : <StaticAvatarImage avatar={avatar} />}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
              {avatar.formats.map((f) => <span key={f} className="store-chip" style={{ padding: ".18rem .6rem", fontSize: ".72rem" }}>{f}</span>)}
              <span className="store-chip" style={{ padding: ".18rem .6rem", fontSize: ".72rem" }}>{avatar.polycount}</span>
            </div>
          </div>

          {/* Right: info panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="store-sidebar-card neo-border neo-shadow" style={{ padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div>
                  <span className="store-chip" style={{ marginBottom: 8, display: "inline-block" }}>{avatar.category}</span>
                  <h1 className="store-display" style={{ fontSize: "1.7rem", margin: "0 0 6px", fontWeight: 800, letterSpacing: ".02em" }}>{avatar.name}</h1>
                  <div style={{ fontSize: ".9rem", color: "var(--ink-soft)" }}>{t.by} <strong style={{ color: "var(--ink)" }}>@{avatar.creator}</strong></div>
                </div>
                <button
                  className="store-btn ghost"
                  onClick={() => toggleFavorite(avatar.id)}
                  title="Save to favorites"
                  style={{ padding: ".5rem" }}
                >
                  <Heart size={20} fill={favorites.has(avatar.id) ? "#FF2FD6" : "none"} color={favorites.has(avatar.id) ? "#FF2FD6" : "var(--ink-soft)"} />
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0" }}>
                <Stars value={avatar.rating} size={14} color="#FFC857" />
                <span style={{ fontSize: ".85rem", color: "var(--ink-soft)" }}>{avatar.rating} · {avatar.reviews} {t.reviews}</span>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
                {avatar.tags.map((tg) => <span key={tg} className="store-chip" style={{ padding: ".18rem .6rem", fontSize: ".72rem" }}>{tg}</span>)}
                {avatar.platform.map((p) => <span key={p} className="store-chip" style={{ padding: ".18rem .6rem", fontSize: ".72rem", borderColor: "rgba(57,255,158,.5)", color: "var(--acid)" }}>{p}</span>)}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 16 }}>
                <span className="store-price" style={{ fontSize: "1.5rem" }}>${avatar.price.toFixed(2)}</span>
                <div style={{ display: "flex", gap: 10, flex: 1 }}>
                  <button className="store-btn primary neo-press" style={{ flex: 1, padding: ".7rem 1rem", fontSize: ".95rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={handleAdd}>
                    {added ? <><Check size={17} /> {t.added}</> : <><ShoppingCart size={17} /> {t.addToCart}</>}
                  </button>
                </div>
              </div>
              <button className="store-btn neo-shadow neo-press" style={{ width: "100%", padding: ".7rem 1rem", fontSize: ".95rem", background: "linear-gradient(135deg, rgba(57,255,158,.2), rgba(0,240,255,.2))", borderColor: "var(--acid)", color: "var(--acid)" }}>
                {t.buyNow}
              </button>
            </div>

            {/* Tabs */}
            <div className="store-sidebar-card neo-border neo-shadow" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ display: "flex", borderBottom: "1px solid rgba(0,240,255,.2)" }}>
                {["Description", "Specs", "Reviews"].map((tb) => (
                  <button
                    key={tb}
                    onClick={() => setTab(tb)}
                    className="store-h1"
                    style={{
                      flex: 1, padding: "12px 8px", background: tab === tb ? "rgba(0,240,255,.1)" : "transparent",
                      color: tab === tb ? "var(--cyan)" : "var(--ink-soft)", border: "none",
                      borderBottom: tab === tb ? "2px solid var(--cyan)" : "2px solid transparent", fontSize: ".85rem",
                      fontWeight: tab === tb ? 700 : 600, cursor: "pointer",
                    }}
                  >
                    {tb === "Description" ? t.tabDescription : tb === "Specs" ? t.tabSpecs : t.tabReviews}
                  </button>
                ))}
              </div>
              <div style={{ padding: 20, fontSize: ".92rem", lineHeight: 1.6, color: "var(--ink-soft)" }}>
                {tab === "Description" && <p style={{ margin: 0 }}>{avatar.desc}</p>}
                {tab === "Specs" && (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      {[
                        [t.specPolycount, avatar.polycount],
                        [t.specFormats, avatar.formats.join(", ")],
                        [t.specPlatforms, avatar.platform.join(" / ")],
                        [t.specCategory, avatar.category],
                      ].map(([k, v]) => (
                        <tr key={k} style={{ borderBottom: "1px solid rgba(0,240,255,.15)" }}>
                          <td style={{ padding: "8px 0", opacity: .6, width: "40%", fontWeight: 600 }}>{k}</td>
                          <td style={{ padding: "8px 0", color: "var(--ink)" }}>{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {tab === "Reviews" && (
                  <p style={{ margin: 0, opacity: .7 }}>{t.reviewsSummary(avatar.reviews, avatar.rating)}</p>
                )}
              </div>
            </div>

            <div className="store-chip" style={{ display: "flex", alignItems: "center", gap: 8, alignSelf: "flex-start", borderColor: "rgba(57,255,158,.4)", color: "var(--acid)" }}>
              <ShieldCheck size={14} /> {t.buyerProtection}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   CART MODAL — itemized list, running total, and a mock PayPal checkout flow.
   No real payment is processed; this simulates a successful order for demo
   purposes. Wire handlePay to your real payment provider when ready.
============================================================================ */
function CartModal({ cartIds, onIncrement, onDecrement, onRemoveAll, onClear, onClose, lang }) {
  const t = STRINGS[lang];
  const [status, setStatus] = useState("idle"); // idle | processing | success

  const items = useMemo(() => {
    const counts = new Map();
    cartIds.forEach((id) => counts.set(id, (counts.get(id) || 0) + 1));
    return Array.from(counts.entries())
      .map(([id, qty]) => ({ avatar: AVATARS.find((a) => a.id === id), qty }))
      .filter((it) => it.avatar);
  }, [cartIds]);

  const total = items.reduce((sum, it) => sum + it.avatar.price * it.qty, 0);

  const handlePay = () => {
    setStatus("processing");
    setTimeout(() => setStatus("success"), 1500);
  };

  const handleDone = () => {
    onClear();
    setStatus("idle");
    onClose();
  };

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h2>{t.cartTitle}</h2>
          <button className="cart-close" onClick={onClose} aria-label={t.cartCloseAria}><X size={16} /></button>
        </div>

        {status === "success" ? (
          <div className="cart-success">
            <CheckCircle2 size={48} color="#39FF9E" style={{ filter: "drop-shadow(0 0 14px rgba(57,255,158,.6))" }} />
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: "1.2rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".03em" }}>{t.paymentSuccessTitle}</div>
            <p style={{ color: "#9A8FC4", fontSize: ".9rem", margin: 0 }}>{t.paymentSuccessSub(total.toFixed(2))}</p>
            <button className="store-btn primary neo-press" style={{ marginTop: 10 }} onClick={handleDone}>{t.continueShopping}</button>
          </div>
        ) : items.length === 0 ? (
          <div className="cart-empty">
            <ShoppingCart size={32} style={{ marginBottom: 10, color: "#00F0FF" }} />
            <div style={{ fontWeight: 700, color: "#ECE8FF" }}>{t.cartEmpty}</div>
            <div style={{ fontSize: ".85rem" }}>{t.cartEmptySub}</div>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map(({ avatar, qty }) => (
                <div className="cart-item" key={avatar.id}>
                  {avatar.image ? (
                    <img src={avatar.image} alt={avatar.name} />
                  ) : (
                    <div className="cart-item-glyph"><AvatarGlyph avatar={avatar} size={52} /></div>
                  )}
                  <div className="cart-item-info">
                    <div className="cart-item-name">{avatar.name}</div>
                    <div className="cart-item-meta">${avatar.price} {t.each}</div>
                    <div className="cart-qty">
                      <button onClick={() => onDecrement(avatar.id)} aria-label="-"><Minus size={12} /></button>
                      <span>{qty}</span>
                      <button onClick={() => onIncrement(avatar.id)} aria-label="+"><Plus size={12} /></button>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <span className="cart-item-price">${(avatar.price * qty).toFixed(2)}</span>
                    <button className="cart-remove" onClick={() => onRemoveAll(avatar.id)} title={t.remove}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-footer">
              <div className="cart-total-row">
                <span className="cart-total-label">{t.total}</span>
                <span className="cart-total-value">${total.toFixed(2)}</span>
              </div>
              <button className="paypal-btn" onClick={handlePay} disabled={status === "processing"}>
                {status === "processing" ? (
                  <><Loader2 size={18} style={{ animation: "cart-spin .8s linear infinite" }} /> {t.processingPayment}</>
                ) : (
                  <><span className="paypal-logo"><b>Pay</b><i>Pal</i></span>&nbsp;· {t.payWithPaypal}</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   APP ROOT
============================================================================ */
export default function AvatarMarketApp() {
  const [view, setView] = useState("store");
  const [selectedId, setSelectedId] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [lang, setLang] = useState("es");

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const addToCart = useCallback((id) => setCart((prev) => [...prev, id]), []);
  const decrementCartItem = useCallback((id) => setCart((prev) => {
    const idx = prev.indexOf(id);
    if (idx === -1) return prev;
    const next = [...prev];
    next.splice(idx, 1);
    return next;
  }), []);
  const removeCartItem = useCallback((id) => setCart((prev) => prev.filter((x) => x !== id)), []);
  const clearCart = useCallback(() => setCart([]), []);

  const selectAvatar = (id) => {
    setSelectedId(id);
    setView("detail");
    window.scrollTo?.({ top: 0, behavior: "instant" });
  };
  const backToStore = () => {
    setView("store");
    window.scrollTo?.({ top: 0, behavior: "instant" });
  };

  const selectedAvatar = AVATARS.find((a) => a.id === selectedId);

  return (
    <>
      <GlobalStyles />
      {view === "store" || !selectedAvatar ? (
        <Storefront onSelect={selectAvatar} favorites={favorites} toggleFavorite={toggleFavorite} cartCount={cart.length} lang={lang} setLang={setLang} onOpenCart={() => setCartOpen(true)} />
      ) : (
        <DetailPage avatar={selectedAvatar} onBack={backToStore} favorites={favorites} toggleFavorite={toggleFavorite} onAddToCart={addToCart} cartCount={cart.length} lang={lang} setLang={setLang} onOpenCart={() => setCartOpen(true)} />
      )}
      {cartOpen && (
        <CartModal
          cartIds={cart}
          onIncrement={addToCart}
          onDecrement={decrementCartItem}
          onRemoveAll={removeCartItem}
          onClear={clearCart}
          onClose={() => setCartOpen(false)}
          lang={lang}
        />
      )}
    </>
  );
}
