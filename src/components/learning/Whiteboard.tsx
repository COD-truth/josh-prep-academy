import { useRef, useState } from "react";
import type { PointerEvent } from "react";
import { normalizedPoint, strokeSchema } from "@/lib/learning-model";
import type { LessonEvent } from "@/lib/learning-model";
import type { Lang } from "@/lib/i18n";
type Stroke = {
  color: "#14213d" | "#f97316" | "#ffffff";
  width: number;
  points: [number, number][];
};
export function Whiteboard({
  lang,
  events,
  onStroke,
  onClear,
  canClear,
  disabled,
}: {
  lang: Lang;
  events: LessonEvent[];
  onStroke: (stroke: Stroke) => void;
  onClear: () => void;
  canClear: boolean;
  disabled: boolean;
}) {
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const [color, setColor] = useState<Stroke["color"]>("#14213d");
  const [width, setWidth] = useState(3);
  const [draft, setDraft] = useState<[number, number][]>([]);
  const points = useRef<[number, number][]>([]);
  const pointer = useRef<number | null>(null);
  const lastClear = events.map((e) => e.kind).lastIndexOf("clear");
  const strokes = events
    .slice(lastClear + 1)
    .filter((e) => e.kind === "stroke")
    .flatMap((event) => {
      const result = strokeSchema.safeParse(event.payload);
      return result.success ? [{ ...result.data, id: event.id }] : [];
    });
  const point = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return normalizedPoint(
      event.clientX - rect.left,
      event.clientY - rect.top,
      rect.width,
      rect.height,
    );
  };
  const finish = (event: PointerEvent<SVGSVGElement>) => {
    if (pointer.current !== event.pointerId) return;
    pointer.current = null;
    if (points.current.length) onStroke({ color, width, points: [...points.current] });
    points.current = [];
    setDraft([]);
  };
  const shape = (stroke: Stroke, key: string) =>
    stroke.points.length === 1 ? (
      <circle
        key={key}
        cx={stroke.points[0][0] * 1000}
        cy={stroke.points[0][1] * 600}
        r={stroke.width}
        fill={stroke.color}
      />
    ) : (
      <polyline
        key={key}
        points={stroke.points.map(([x, y]) => `${x * 1000},${y * 600}`).join(" ")}
        stroke={stroke.color}
        strokeWidth={stroke.width}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  return (
    <section className="rounded-2xl border border-border overflow-hidden bg-card">
      <div className="flex flex-wrap gap-3 items-center p-4 border-b">
        <h2 className="font-semibold mr-auto">{tr("Tableau partagé", "Shared whiteboard")}</h2>
        <label className="text-xs">
          {tr("Outil", "Tool")}
          <select
            value={color}
            disabled={disabled}
            onChange={(e) => setColor(e.target.value as Stroke["color"])}
            className="ml-2 rounded border p-2"
          >
            <option value="#14213d">{tr("Stylo bleu nuit", "Navy pen")}</option>
            <option value="#f97316">{tr("Stylo orange", "Orange pen")}</option>
            <option value="#ffffff">{tr("Gomme", "Eraser")}</option>
          </select>
        </label>
        <label className="text-xs">
          {tr("Épaisseur", "Width")}
          <select
            value={width}
            disabled={disabled}
            onChange={(e) => setWidth(Number(e.target.value))}
            className="ml-2 rounded border p-2"
          >
            {[2, 3, 6, 12, 20].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        {canClear && (
          <button
            disabled={disabled}
            onClick={onClear}
            className="text-xs font-semibold text-primary underline"
          >
            {tr("Nouveau tableau", "New board")}
          </button>
        )}
      </div>
      <svg
        viewBox="0 0 1000 600"
        preserveAspectRatio="none"
        role="img"
        aria-label={tr(
          "Tableau blanc collaboratif : utilisez le doigt, le stylet ou la souris",
          "Collaborative whiteboard: use a finger, stylus or mouse",
        )}
        className={`w-full aspect-[5/3] bg-white ${disabled ? "cursor-not-allowed" : "cursor-crosshair"}`}
        style={{ touchAction: disabled ? "auto" : "none" }}
        onPointerDown={(event) => {
          if (disabled || !event.isPrimary || event.button !== 0 || pointer.current !== null)
            return;
          pointer.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          points.current = [point(event)];
          setDraft([...points.current]);
        }}
        onPointerMove={(event) => {
          if (pointer.current !== event.pointerId || points.current.length >= 200) return;
          points.current.push(point(event));
          setDraft([...points.current]);
        }}
        onPointerUp={finish}
        onPointerCancel={(event) => {
          if (pointer.current === event.pointerId) {
            pointer.current = null;
            points.current = [];
            setDraft([]);
          }
        }}
      >
        {strokes.map((stroke) => shape(stroke, stroke.id))}
        {draft.length > 0 && shape({ color, width, points: draft }, "draft")}
      </svg>
      <p className="p-3 text-xs text-muted-foreground">
        {tr(
          "Les tracés sont enregistrés et partagés entre les participants. Les 300 derniers événements sont affichés. Utilisez la discussion pour écrire du texte au clavier.",
          "Strokes are saved and shared between participants. The latest 300 events are displayed. Use the discussion for keyboard text.",
        )}
      </p>
    </section>
  );
}
