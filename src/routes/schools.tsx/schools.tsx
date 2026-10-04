import { createFileRoute } from "@tanstack/react-router";
import { Nav, Footer, WhatsAppFab } from "@/components/site/LandingPage";
import { useLang } from "@/lib/i18n";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Search, SlidersHorizontal, School, X, ExternalLink, Phone } from "lucide-react";

export const Route = createFileRoute("/schools")({
  head: () => ({
    meta: [
      { title: "Trouver une École — Josh & Co" },
      { name: "description", content: "Trouvez les écoles primaires, collèges, lycées et universités près de chez vous au Cameroun." },
      { property: "og:title", content: "Recherche d'Écoles — Josh & Co" },
      { property: "og:description", content: "Carte interactive des établissements scolaires au Cameroun." },
    ],
  }),
  component: SchoolsPage,
});

type School = {
  id: string;
  name: string;
  name_en: string | null;
  type: "maternelle" | "primaire" | "college" | "lycee" | "superieur";
  section: "francophone" | "anglophone" | "bilingue";
  levels: string[];
  address: string | null;
  city: string;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  is_public: boolean;
};

const TYPE_LABELS: Record<string, { fr: string; en: string; color: string }> = {
  maternelle: { fr: "Maternelle", en: "Nursery", color: "#f59e0b" },
  primaire:   { fr: "Primaire",   en: "Primary",  color: "#10b981" },
  college:    { fr: "Collège",    en: "College",   color: "#3b82f6" },
  lycee:      { fr: "Lycée",      en: "High School", color: "#8b5cf6" },
  superieur:  { fr: "Supérieur",  en: "University", color: "#ef4444" },
};

const SECTION_LABELS: Record<string, { fr: string; en: string }> = {
  francophone: { fr: "Francophone", en: "Francophone" },
  anglophone:  { fr: "Anglophone",  en: "Anglophone"  },
  bilingue:    { fr: "Bilingue",    en: "Bilingual"   },
};

function SchoolBadge({ type, lang }: { type: string; lang: string }) {
  const info = TYPE_LABELS[type];
  if (!info) return null;
  return (
    <span
      className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
      style={{ backgroundColor: info.color }}
    >
      {lang === "fr" ? info.fr : info.en}
    </span>
  );
}

function SchoolCard({ school, lang, selected, onClick }: {
  school: School;
  lang: string;
  selected: boolean;
  onClick: () => void;
}) {
  const tr = (fr: string, en: string) => lang === "fr" ? fr : en;
  const name = lang === "en" && school.name_en ? school.name_en : school.name;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl p-4 border transition-all ${
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/30"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 size-10 rounded-xl shrink-0 flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: TYPE_LABELS[school.type]?.color || "#6b7280" }}
        >
          <School className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-snug truncate">{name}</p>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <SchoolBadge type={school.type} lang={lang} />
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {SECTION_LABELS[school.section]?.[lang as "fr" | "en"] ?? school.section}
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {school.is_public ? tr("Public", "Public") : tr("Privé", "Private")}
            </span>
          </div>
          {school.address && (
            <p className="mt-1.5 text-xs text-muted-foreground truncate">
              📍 {school.address}, {school.city}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

// Detail popup
function SchoolDetail({ school, lang, onClose }: { school: School; lang: string; onClose: () => void }) {
  const tr = (fr: string, en: string) => lang === "fr" ? fr : en;
  const name = lang === "en" && school.name_en ? school.name_en : school.name;

  return (
    <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-card rounded-3xl shadow-2xl p-5 z-[1000] ring-1 ring-border">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 size-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"
      >
        <X className="size-4" />
      </button>
      <div className="flex items-center gap-3 mb-3">
        <div
          className="size-12 rounded-2xl shrink-0 flex items-center justify-center text-white"
          style={{ backgroundColor: TYPE_LABELS[school.type]?.color || "#6b7280" }}
        >
          <School className="size-6" />
        </div>
        <div>
          <p className="font-bold leading-snug">{name}</p>
          <p className="text-xs text-muted-foreground">{school.city} {school.district ? `· ${school.district}` : ""}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <SchoolBadge type={school.type} lang={lang} />
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          {SECTION_LABELS[school.section]?.[lang as "fr" | "en"]}
        </span>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          {school.is_public ? tr("Établissement Public", "Public School") : tr("Établissement Privé", "Private School")}
        </span>
      </div>

      {school.levels.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            {tr("Niveaux proposés", "Levels offered")}
          </p>
          <div className="flex flex-wrap gap-1">
            {school.levels.slice(0, 8).map(l => (
              <span key={l} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{l}</span>
            ))}
            {school.levels.length > 8 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">+{school.levels.length - 8}</span>
            )}
          </div>
        </div>
      )}

      {school.address && (
        <p className="text-xs text-muted-foreground mb-2 flex items-start gap-1.5">
          <MapPin className="size-3.5 shrink-0 mt-0.5 text-primary" />
          {school.address}, {school.city}
        </p>
      )}
      {school.phone && (
        <a href={`tel:${school.phone}`} className="text-xs text-primary flex items-center gap-1.5 mb-3">
          <Phone className="size-3.5" /> {school.phone}
        </a>
      )}

      {school.latitude && school.longitude && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${school.latitude},${school.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary text-primary-foreground text-sm font-semibold py-2.5 hover:opacity-95 transition-opacity"
        >
          <ExternalLink className="size-4" />
          {tr("Voir sur Google Maps", "View on Google Maps")}
        </a>
      )}
    </div>
  );
}

function SchoolsPage() {
  const { lang, setLang } = useLang();
  const tr = (fr: string, en: string) => lang === "fr" ? fr : en;

  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterPublic, setFilterPublic] = useState<"" | "true" | "false">("");

  const [selected, setSelected] = useState<School | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMap = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);

  // Fetch schools from Supabase
  useEffect(() => {
    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("schools")
        .select("*")
        .eq("is_active", true)
        .order("city")
        .order("name");
      if (!error && data) setSchools(data as School[]);
      setLoading(false);
    }
    load();
  }, []);

  // Filtered list
  const filtered = schools.filter(s => {
    const q = search.toLowerCase();
    const name = (lang === "en" && s.name_en ? s.name_en : s.name).toLowerCase();
    if (q && !name.includes(q) && !s.city.toLowerCase().includes(q) && !(s.address ?? "").toLowerCase().includes(q)) return false;
    if (filterType && s.type !== filterType) return false;
    if (filterSection && s.section !== filterSection) return false;
    if (filterCity && s.city !== filterCity) return false;
    if (filterPublic === "true" && !s.is_public) return false;
    if (filterPublic === "false" && s.is_public) return false;
    return true;
  });

  const cities = Array.from(new Set(schools.map(s => s.city))).sort();

  // Init Leaflet map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    // Load Leaflet CSS dynamically
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = (window as any).L;
      const map = L.map(mapRef.current).setView([3.848, 11.502], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      leafletMap.current = map;
    };
    document.head.appendChild(script);

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  // Update markers when filtered changes
  useEffect(() => {
    if (!leafletMap.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L;
    if (!L) return;

    // Remove old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    filtered.forEach(school => {
      if (!school.latitude || !school.longitude) return;
      const color = TYPE_LABELS[school.type]?.color || "#6b7280";

      const icon = L.divIcon({
        html: `<div style="
          width:28px;height:28px;border-radius:50% 50% 50% 0;
          background:${color};border:2px solid white;
          transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.3);
          display:flex;align-items:center;justify-content:center;
        "></div>`,
        className: "",
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      const name = lang === "en" && school.name_en ? school.name_en : school.name;
      const marker = L.marker([school.latitude, school.longitude], { icon })
        .addTo(leafletMap.current)
        .bindTooltip(name, { permanent: false, direction: "top" })
        .on("click", () => setSelected(school));

      markersRef.current.push(marker);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, lang]);

  // Pan to selected school
  useEffect(() => {
    if (selected && leafletMap.current && selected.latitude && selected.longitude) {
      leafletMap.current.flyTo([selected.latitude, selected.longitude], 15, { duration: 1 });
    }
  }, [selected]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Nav lang={lang} setLang={setLang} />

      {/* Hero */}
      <section className="bg-primary/5 border-b border-border py-10 px-4">
        <div className="mx-auto max-w-5xl">
          <span className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
            {tr("Annuaire Scolaire", "School Directory")}
          </span>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold">
            {tr("Trouvez une école au Cameroun", "Find a school in Cameroon")}
          </h1>
          <p className="mt-2 text-muted-foreground max-w-xl">
            {tr(
              "Carte interactive des établissements scolaires — maternelle, primaire, collège, lycée et supérieur.",
              "Interactive map of educational institutions — nursery, primary, college, high school and university."
            )}
          </p>

          {/* Search bar */}
          <div className="mt-5 flex gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={tr("Nom d'école, ville, quartier...", "School name, city, district...")}
                className="w-full rounded-xl bg-card ring-1 ring-border pl-9 pr-4 py-2.5 text-sm"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="size-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="flex items-center gap-2 rounded-xl bg-card ring-1 ring-border px-4 py-2.5 text-sm font-medium hover:ring-primary/40 transition-colors"
            >
              <SlidersHorizontal className="size-4" />
              {tr("Filtres", "Filters")}
            </button>
          </div>
        </div>
      </section>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 280px)", minHeight: 500 }}>

        {/* Left: filters + list */}
        {sidebarOpen && (
          <div className="w-full md:w-80 lg:w-96 shrink-0 flex flex-col border-r border-border overflow-hidden">
            {/* Filters */}
            <div className="px-4 py-3 border-b border-border bg-muted/30 grid gap-2">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="rounded-lg bg-card ring-1 ring-border px-3 py-2 text-xs"
                >
                  <option value="">{tr("Tous les types", "All types")}</option>
                  {Object.entries(TYPE_LABELS).map(([key, val]) => (
                    <option key={key} value={key}>{lang === "fr" ? val.fr : val.en}</option>
                  ))}
                </select>
                <select
                  value={filterSection}
                  onChange={e => setFilterSection(e.target.value)}
                  className="rounded-lg bg-card ring-1 ring-border px-3 py-2 text-xs"
                >
                  <option value="">{tr("Toutes sections", "All sections")}</option>
                  {Object.entries(SECTION_LABELS).map(([key, val]) => (
                    <option key={key} value={key}>{lang === "fr" ? val.fr : val.en}</option>
                  ))}
                </select>
                <select
                  value={filterCity}
                  onChange={e => setFilterCity(e.target.value)}
                  className="rounded-lg bg-card ring-1 ring-border px-3 py-2 text-xs"
                >
                  <option value="">{tr("Toutes les villes", "All cities")}</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  value={filterPublic}
                  onChange={e => setFilterPublic(e.target.value as "" | "true" | "false")}
                  className="rounded-lg bg-card ring-1 ring-border px-3 py-2 text-xs"
                >
                  <option value="">{tr("Public & Privé", "Public & Private")}</option>
                  <option value="true">{tr("Public", "Public")}</option>
                  <option value="false">{tr("Privé", "Private")}</option>
                </select>
              </div>
              <p className="text-xs text-muted-foreground">
                {filtered.length} {tr("établissement(s) trouvé(s)", "school(s) found")}
              </p>
            </div>

            {/* School list */}
            <div className="flex-1 overflow-y-auto p-3 grid gap-2">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  {tr("Chargement...", "Loading...")}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <School className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">
                    {tr("Aucun établissement trouvé", "No school found")}
                  </p>
                  <button
                    onClick={() => { setSearch(""); setFilterType(""); setFilterSection(""); setFilterCity(""); setFilterPublic(""); }}
                    className="mt-2 text-xs text-primary underline"
                  >
                    {tr("Réinitialiser les filtres", "Reset filters")}
                  </button>
                </div>
              ) : (
                filtered.map(s => (
                  <SchoolCard
                    key={s.id}
                    school={s}
                    lang={lang}
                    selected={selected?.id === s.id}
                    onClick={() => setSelected(prev => prev?.id === s.id ? null : s)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Right: Map */}
        <div className="relative flex-1">
          <div ref={mapRef} className="w-full h-full" />

          {/* Legend */}
          <div className="absolute top-3 left-3 bg-card/95 backdrop-blur rounded-2xl shadow-lg p-3 z-[999] ring-1 ring-border">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              {tr("Légende", "Legend")}
            </p>
            <div className="grid gap-1">
              {Object.entries(TYPE_LABELS).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setFilterType(prev => prev === key ? "" : key)}
                  className={`flex items-center gap-2 text-xs rounded-lg px-2 py-1 transition-colors ${
                    filterType === key ? "bg-muted font-bold" : "hover:bg-muted/50"
                  }`}
                >
                  <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: val.color }} />
                  {lang === "fr" ? val.fr : val.en}
                </button>
              ))}
            </div>
          </div>

          {/* Selected school detail */}
          {selected && (
            <SchoolDetail school={selected} lang={lang} onClose={() => setSelected(null)} />
          )}
        </div>
      </div>

      {/* Type counts strip */}
      <div className="border-t border-border bg-card px-4 py-3 hidden md:block">
        <div className="mx-auto max-w-5xl flex flex-wrap gap-4">
          {Object.entries(TYPE_LABELS).map(([key, val]) => {
            const count = schools.filter(s => s.type === key).length;
            return (
              <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: val.color }} />
                {lang === "fr" ? val.fr : val.en}: <span className="font-bold text-foreground">{count}</span>
              </div>
            );
          })}
          <div className="ml-auto text-xs text-muted-foreground">
            {tr("Données : OpenStreetMap · Contributez", "Data: OpenStreetMap · Contribute")}
          </div>
        </div>
      </div>

      <Footer lang={lang} />
      <WhatsAppFab />
    </div>
  );
}
