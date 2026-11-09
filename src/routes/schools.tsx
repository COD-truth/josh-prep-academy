import { createFileRoute } from "@tanstack/react-router";
import { Nav, Footer, WhatsAppFab } from "@/components/site/LandingPage";
import { useLang } from "@/lib/i18n";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import "leaflet/dist/leaflet.css";
import { hasSchoolCoordinates, distanceKm } from "@/lib/school-map";
import { withTimeout } from "@/lib/request-timeout";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Search, SlidersHorizontal, School, X, ExternalLink, Phone } from "lucide-react";

export const Route = createFileRoute("/schools")({
  head: () => ({
    meta: [
      { title: "Trouver une École — Josh & Co" },
      {
        name: "description",
        content:
          "Trouvez les écoles primaires, collèges, lycées et universités près de chez vous au Cameroun.",
      },
      { property: "og:title", content: "Recherche d'Écoles — Josh & Co" },
      {
        property: "og:description",
        content: "Carte interactive des établissements scolaires au Cameroun.",
      },
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
  study_fields: string[];
  address: string | null;
  city: string;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  is_public: boolean;
};

const TYPE_LABELS: Record<string, { fr: string; en: string; color: string }> = {
  maternelle: { fr: "Maternelle", en: "Nursery", color: "#c2410c" },
  primaire: { fr: "Primaire", en: "Primary", color: "#14213d" },
  college: { fr: "Collège", en: "College", color: "#23395b" },
  lycee: { fr: "Lycée", en: "High School", color: "#445776" },
  superieur: { fr: "Supérieur", en: "University", color: "#9a3412" },
};

const SECTION_LABELS: Record<string, { fr: string; en: string }> = {
  francophone: { fr: "Francophone", en: "Francophone" },
  anglophone: { fr: "Anglophone", en: "Anglophone" },
  bilingue: { fr: "Bilingue", en: "Bilingual" },
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

function SchoolCard({
  school,
  lang,
  selected,
  onClick,
}: {
  school: School;
  lang: string;
  selected: boolean;
  onClick: () => void;
}) {
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);
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
function SchoolDetail({
  school,
  lang,
  onClose,
}: {
  school: School;
  lang: string;
  onClose: () => void;
}) {
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);
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
          <p className="text-xs text-muted-foreground">
            {school.city} {school.district ? `· ${school.district}` : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <SchoolBadge type={school.type} lang={lang} />
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          {SECTION_LABELS[school.section]?.[lang as "fr" | "en"]}
        </span>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          {school.is_public
            ? tr("Établissement Public", "Public School")
            : tr("Établissement Privé", "Private School")}
        </span>
      </div>

      {school.levels.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            {tr("Niveaux proposés", "Levels offered")}
          </p>
          <div className="flex flex-wrap gap-1">
            {school.levels.slice(0, 8).map((l) => (
              <span
                key={l}
                className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium"
              >
                {l}
              </span>
            ))}
            {school.levels.length > 8 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                +{school.levels.length - 8}
              </span>
            )}
          </div>
        </div>
      )}

      {!!school.study_fields?.length && (
        <div className="mb-3">
          <p className="text-xs font-semibold">{tr("Filières proposées", "Study fields")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{school.study_fields.join(" · ")}</p>
        </div>
      )}
      {school.address && (
        <p className="text-xs text-muted-foreground mb-2 flex items-start gap-1.5">
          <MapPin className="size-3.5 shrink-0 mt-0.5 text-primary" />
          {school.address}, {school.city}
        </p>
      )}
      {school.phone && (
        <a
          href={`tel:${school.phone}`}
          className="text-xs text-primary flex items-center gap-1.5 mb-3"
        >
          <Phone className="size-3.5" /> {school.phone}
        </a>
      )}

      {hasSchoolCoordinates(school) && (
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
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [section, setSection] = useState("");
  const [ownership, setOwnership] = useState("");
  const [city, setCity] = useState("");
  const [field, setField] = useState("");
  const [district, setDistrict] = useState("");
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState("");
  const [locating, setLocating] = useState(false);
  const [radius, setRadius] = useState("");
  const [selected, setSelected] = useState<School | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const layers = useRef<LayerGroup | null>(null);
  const [leaflet, setLeaflet] = useState<typeof import("leaflet") | null>(null);
  const [mapError, setMapError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from("schools" as never)
            .select("*")
            .eq("is_active", true)
            .order("name"),
        );
        if (error) throw error;
        if (alive) setSchools((data ?? []) as unknown as School[]);
      } catch (error) {
        if (alive) setError(error instanceof Error ? error.message : "Schools unavailable");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [loadAttempt]);
  const filtered = useMemo(
    () =>
      schools
        .filter((s) => {
          const text = [s.name, s.name_en, s.city, s.district, s.address, ...(s.study_fields ?? [])]
            .join(" ")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
          const q = search
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
          return (
            (!q || text.includes(q)) &&
            (!type || s.type === type) &&
            (!section || s.section === section) &&
            (!ownership || String(s.is_public) === ownership) &&
            (!city || s.city === city) &&
            (!district || s.district === district) &&
            (!field || (s.study_fields ?? []).includes(field)) &&
            (!radius ||
              !location ||
              (hasSchoolCoordinates(s) && distanceKm(location, s) <= Number(radius)))
          );
        })
        .sort((a, b) =>
          location && hasSchoolCoordinates(a) && hasSchoolCoordinates(b)
            ? distanceKm(location, a) - distanceKm(location, b)
            : a.name.localeCompare(b.name),
        ),
    [schools, search, type, section, city, district, field, radius, location, ownership],
  );
  const cities = [...new Set(schools.map((s) => s.city))].sort();
  const districts = [
    ...new Set(
      schools
        .filter((s) => !city || s.city === city)
        .map((s) => s.district)
        .filter((value): value is string => !!value),
    ),
  ].sort();
  const fields = [...new Set(schools.flatMap((s) => s.study_fields ?? []))].sort();
  useEffect(() => {
    let cancelled = false;
    let local: LeafletMap | null = null;
    let observer: ResizeObserver | null = null;
    import("leaflet")
      .then((L) => {
        if (cancelled || !mapRef.current) return;
        local = L.map(mapRef.current).setView([3.848, 11.502], 12);
        map.current = local;
        layers.current = L.layerGroup().addTo(local);
        const tiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(local);
        let failures = 0;
        tiles.on("tileerror", () => {
          if (++failures >= 3)
            setMapError(
              tr(
                "Le fond de carte est indisponible. La liste et les liens Google Maps restent utilisables.",
                "Map tiles are unavailable. The list and Google Maps links remain usable.",
              ),
            );
        });
        tiles.on("tileload", () => {
          failures = 0;
          setMapError("");
        });
        observer = new ResizeObserver(() => local?.invalidateSize());
        observer.observe(mapRef.current);
        setLeaflet(L);
      })
      .catch(() => {
        if (!cancelled)
          setMapError(
            tr(
              "Impossible de charger la carte. Utilisez la liste.",
              "Unable to load the map. Use the list.",
            ),
          );
      });
    return () => {
      cancelled = true;
      observer?.disconnect();
      local?.remove();
      map.current = null;
      layers.current = null;
    };
    // The map instance is independent of language; marker labels update below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!leaflet || !map.current || !layers.current) return;
    layers.current.clearLayers();
    const points: [number, number][] = [];
    for (const school of filtered) {
      if (!hasSchoolCoordinates(school)) continue;
      points.push([school.latitude, school.longitude]);
      const name = document.createElement("span");
      name.textContent = lang === "en" && school.name_en ? school.name_en : school.name;
      leaflet
        .circleMarker([school.latitude, school.longitude], {
          radius: 9,
          color: "#fff",
          weight: 2,
          fillColor: TYPE_LABELS[school.type]?.color ?? "#f97316",
          fillOpacity: 1,
        })
        .addTo(layers.current)
        .bindTooltip(name)
        .on("click", () => setSelected(school));
    }
    if (points.length)
      map.current.fitBounds(leaflet.latLngBounds(points), { padding: [30, 30], maxZoom: 14 });
  }, [filtered, lang, leaflet]);
  useEffect(() => {
    if (selected && hasSchoolCoordinates(selected) && map.current)
      map.current.flyTo([selected.latitude, selected.longitude], 15);
  }, [selected, leaflet]);
  useEffect(() => {
    if (selected && !filtered.some((s) => s.id === selected.id)) setSelected(null);
  }, [filtered, selected]);
  const locate = () => {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError(
        tr(
          "Localisation non disponible. Choisissez votre ville.",
          "Location unavailable. Choose your city.",
        ),
      );
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        setLocation(point);
        setLocating(false);
        map.current?.setView([point.latitude, point.longitude], 12);
      },
      () => {
        setLocating(false);
        setLocationError(
          tr(
            "Localisation refusée ou indisponible. La recherche par ville reste disponible.",
            "Location denied or unavailable. You can still search by city.",
          ),
        );
      },
      { timeout: 10000, enableHighAccuracy: false, maximumAge: 60000 },
    );
  };
  const control = "mt-2 w-full rounded-xl border border-border bg-card px-3 py-3 text-sm";
  return (
    <div className="min-h-screen bg-background">
      <Nav lang={lang} setLang={setLang} />
      <main>
        <header className="bg-secondary text-white px-4 py-12">
          <div className="max-w-7xl mx-auto">
            <p className="text-accent text-xs font-semibold uppercase tracking-widest">
              {tr("Écoles & orientation", "Schools & guidance")}
            </p>
            <h1 className="mt-3 text-4xl font-semibold">
              {tr(
                "Une école près de vous. Une filière qui vous correspond.",
                "A school nearby. A course that fits.",
              )}
            </h1>
            <p className="mt-4 text-white/70">
              {tr(
                "Comparez la ville, le quartier, le niveau, la section et les filières renseignées dans l’annuaire.",
                "Compare city, district, level, language section and listed study fields.",
              )}
            </p>
          </div>
        </header>
        <section className="max-w-7xl mx-auto px-4 py-8">
          <label className="block text-sm font-semibold">
            {tr("École, ville, quartier ou filière", "School, city, district or study field")}
            <input value={search} onChange={(e) => setSearch(e.target.value)} className={control} />
          </label>
          <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {[
              {
                label: tr("Ville", "City"),
                value: city,
                onChange: (value: string) => {
                  setCity(value);
                  setDistrict("");
                },
                options: cities,
              },
              {
                label: tr("Quartier", "District"),
                value: district,
                onChange: setDistrict,
                options: districts,
              },
              {
                label: tr("Filière", "Study field"),
                value: field,
                onChange: setField,
                options: fields,
              },
            ].map((filter) => (
              <label key={filter.label} className="text-xs font-semibold">
                {filter.label}
                <select
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  className={control}
                >
                  <option value="">{tr("Tous", "All")}</option>
                  {filter.options.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            ))}
            <label className="text-xs font-semibold">
              {tr("Type", "Type")}
              <select value={type} onChange={(e) => setType(e.target.value)} className={control}>
                <option value="">{tr("Tous", "All")}</option>
                {Object.entries(TYPE_LABELS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value[lang]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold">
              {tr("Section", "Language section")}
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className={control}
              >
                <option value="">{tr("Toutes", "All")}</option>
                {Object.entries(SECTION_LABELS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value[lang]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold">
              {tr("Public / privé", "Public / private")}
              <select
                value={ownership}
                onChange={(e) => setOwnership(e.target.value)}
                className={control}
              >
                <option value="">{tr("Tous", "All")}</option>
                <option value="true">{tr("Public", "Public")}</option>
                <option value="false">{tr("Privé", "Private")}</option>
              </select>
            </label>
          </div>
          <div className="mt-5 flex flex-wrap gap-3 items-center">
            <button
              disabled={locating}
              onClick={locate}
              className="rounded-xl bg-primary text-primary-foreground px-4 py-3 text-sm font-semibold disabled:opacity-50"
            >
              {locating
                ? tr("Localisation…", "Locating…")
                : tr("Écoles autour de moi", "Schools near me")}
            </button>
            {location && (
              <>
                <label className="text-sm">
                  {tr("Rayon", "Radius")}
                  <select
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    className="ml-2 rounded-lg border p-2"
                  >
                    <option value="">{tr("Sans limite", "No limit")}</option>
                    {[2, 5, 10, 25, 50].map((value) => (
                      <option key={value} value={value}>
                        {value} km
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  onClick={() => {
                    setLocation(null);
                    setRadius("");
                  }}
                  className="text-sm text-primary underline"
                >
                  {tr("Retirer ma localisation", "Clear my location")}
                </button>
              </>
            )}
            <p className="text-xs text-muted-foreground">
              {tr(
                "Localisation facultative, utilisée seulement dans cette page.",
                "Location is optional and used only on this page.",
              )}
            </p>
          </div>
          {locationError && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {locationError}
            </p>
          )}
          {error && (
            <p role="alert" className="mt-6 rounded-xl border p-4">
              {tr(
                "Annuaire indisponible. Contactez Josh & Co pour être orienté.",
                "Directory unavailable. Contact Josh & Co for guidance.",
              )}
              <button
                type="button"
                onClick={() => setLoadAttempt((value) => value + 1)}
                className="ml-3 font-semibold text-primary underline"
              >
                {tr("Réessayer", "Retry")}
              </button>
            </p>
          )}
          <p role="status" className="mt-6 text-sm text-muted-foreground">
            {loading
              ? tr("Chargement…", "Loading…")
              : error
                ? tr("Résultats indisponibles", "Results unavailable")
                : `${filtered.length} ${tr("établissement(s)", "school(s)")}`}
          </p>
          <div className="mt-4 grid gap-5 lg:grid-cols-[360px_1fr]">
            <div className="space-y-3 max-h-[420px] lg:max-h-[600px] overflow-y-auto">
              {!loading && !error && !filtered.length && (
                <p className="rounded-2xl bg-muted p-6 text-sm">
                  {tr(
                    "Aucun établissement ne correspond. Élargissez vos filtres.",
                    "No school matches. Broaden your filters.",
                  )}
                </p>
              )}
              {filtered.map((school) => (
                <div key={school.id}>
                  <SchoolCard
                    school={school}
                    lang={lang}
                    selected={selected?.id === school.id}
                    onClick={() => setSelected(school)}
                  />
                  {location && hasSchoolCoordinates(school) && (
                    <p className="px-4 pt-1 text-xs text-muted-foreground">
                      {distanceKm(location, school).toFixed(1)} km ·{" "}
                      {tr("à vol d’oiseau", "straight-line distance")}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="relative min-w-0 h-[500px] lg:h-[600px] overflow-hidden rounded-2xl border border-border isolate">
              <div
                ref={mapRef}
                className="h-full w-full"
                aria-label={tr("Carte des écoles", "School map")}
              />
              {mapError && (
                <p
                  role="alert"
                  className="absolute top-3 left-3 right-3 z-[1000] bg-card p-3 rounded-xl text-xs shadow"
                >
                  {mapError}
                </p>
              )}
              {selected && (
                <SchoolDetail school={selected} lang={lang} onClose={() => setSelected(null)} />
              )}
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {tr(
              "Les filières et positions dépendent des informations renseignées. Une absence de résultat ne signifie pas qu’aucune école n’existe dans la zone. Carte : OpenStreetMap.",
              "Study fields and locations depend on directory data. No results does not mean there are no schools in the area. Map: OpenStreetMap.",
            )}
          </p>
        </section>
      </main>
      <Footer lang={lang} />
      <WhatsAppFab />
    </div>
  );
}
