"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MLMap, GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP } from "@/lib/site-config";
import { Reveal } from "@/components/Reveal";
import { MapPin } from "lucide-react";

type LL = [number, number]; // [lat, lng]
type C = [number, number]; // [lng, lat]

const THEME = {
  bg: "#F4F0FA",
  land: "#7335e8",
  water: "#C7B6F5",
  park: "#DDEFB0",
  building: "#E4DBF3",
  road: "#FFFFFF",
  roadCasing: "#2a1260",
  text: "#2A1260",
  halo: "#fff",
};
const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

const OU: LL = [10.7797, 106.6887]; // 97 Võ Văn Tần
const PARKINGS = {
  cung: { short: "Cung VH Lao động", sub: "55B Nguyễn Thị Minh Khai", pos: [10.779, 106.693] as LL, color: "#5B149C" },
  taodan: { short: "Công viên Tao Đàn", sub: "Trương Định", pos: [10.7745, 106.6925] as LL, color: "#5B149C" },
};
type ParkingId = keyof typeof PARKINGS;

const ORIGINS: { id: string; group: string; label: string; points: LL[] }[] = [
  { id: "Cách mạng tháng 8-q10", group: "Cách mạng tháng 8", label: "Từ Quận 10 → ngã tư giao Nguyễn Thị Minh Khai", points: [[10.7733, 106.6797]] },
  { id: "Cách mạng tháng 8-pd", group: "Cách mạng tháng 8", label: "Từ vòng xoay Phù Đổng → lên Nguyễn Thị Minh Khai", points: [[10.7735, 106.6975]] },
  { id: "Nguyễn Thị Minh Khai-tn", group: "Nguyễn Thị Minh Khai", label: "Từ cầu Thị Nghè", points: [[10.7915, 106.7045]] },
  { id: "Nguyễn Thị Minh Khai-td", group: "Nguyễn Thị Minh Khai", label: "Từ BV Từ Dũ qua", points: [[10.7695, 106.6905]] },
  { id: "Võ Văn Tần-hcr", group: "Võ Văn Tần", label: "Từ Hồ Con Rùa ra", points: [[10.7812, 106.6925]] },
  { id: "Võ Văn Tần-Cách mạng tháng 8", group: "Võ Văn Tần", label: "Từ Cách mạng tháng 8 rẽ vào", points: [[10.779, 106.6882]] },
];
const GROUPS = ["Cách mạng tháng 8", "Nguyễn Thị Minh Khai", "Võ Văn Tần"];

const toC = (p: LL): C => [p[1], p[0]];
const rad = (x: number) => (x * Math.PI) / 180;
const EMPTY = { type: "FeatureCollection", features: [] } as const;

function dist(a: C, b: C) {
  const dLat = rad(b[1] - a[1]), dLng = rad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

function cumulative(c: C[]) {
  const cum = [0];
  for (let i = 1; i < c.length; i++) cum.push(cum[i - 1] + dist(c[i - 1], c[i]));
  return cum;
}
function pointAt(c: C[], cum: number[], d: number): { p: C; i: number } {
  const total = cum[cum.length - 1];
  if (d <= 0) return { p: c[0], i: 0 };
  if (d >= total) return { p: c[c.length - 1], i: c.length - 2 };
  let i = 1;
  while (cum[i] < d) i++;
  const t = (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
  return { p: [c[i - 1][0] + (c[i][0] - c[i - 1][0]) * t, c[i - 1][1] + (c[i][1] - c[i - 1][1]) * t], i: i - 1 };
}
function bearing(a: C, b: C) {
  const y = Math.sin(rad(b[0] - a[0])) * Math.cos(rad(b[1]));
  const x = Math.cos(rad(a[1])) * Math.sin(rad(b[1])) - Math.sin(rad(a[1])) * Math.cos(rad(b[1])) * Math.cos(rad(b[0] - a[0]));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
const shortest = (d: number) => ((d + 540) % 360) - 180;
const fmtDist = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.max(10, Math.round(m / 10) * 10)} m`);

const VERB: Record<string, string> = {
  left: "Rẽ trái", right: "Rẽ phải", "slight left": "Chếch sang trái", "slight right": "Chếch sang phải",
  "sharp left": "Rẽ gắt sang trái", "sharp right": "Rẽ gắt sang phải", straight: "Đi thẳng", uturn: "Quay đầu",
};
function stepText(s: any): string {
  const { type, modifier } = s.maneuver ?? {};
  const name = s.name ? ` ${s.name}` : "";
  if (type === "depart") return `Xuất phát${s.name ? " trên" + name : ""}`;
  if (type === "arrive") return "Đến nơi";
  if (type === "roundabout" || type === "rotary") return `Vào vòng xoay${s.name ? ", ra" + name : ""}`;
  if (type === "continue" || type === "new name" || modifier === "straight") return `Đi tiếp${s.name ? " trên" + name : ""}`;
  return `${VERB[modifier] ?? "Đi tiếp"}${s.name ? " vào" + name : ""}`;
}

function applyBrandStyle(map: MLMap) {
  const T = THEME;
  for (const l of map.getStyle().layers as any[]) {
    const id: string = l.id;
    try {
      if (l.type === "background") map.setPaintProperty(id, "background-color", T.bg);
      else if (l.type === "fill") {
        if (/water/.test(id)) map.setPaintProperty(id, "fill-color", T.water);
        else if (/park|wood|forest|grass|green|garden|cemetery|golf|pitch|nature/.test(id)) map.setPaintProperty(id, "fill-color", T.park);
        else if (/building/.test(id)) map.setPaintProperty(id, "fill-color", T.building);
        else if (/landuse|landcover|residential|aeroway/.test(id)) map.setPaintProperty(id, "fill-color", T.land);
      } else if (l.type === "line") {
        if (/water/.test(id)) map.setPaintProperty(id, "line-color", T.water);
        else if (/casing|outline/.test(id)) map.setPaintProperty(id, "line-color", T.roadCasing);
        else if (/road|highway|street|bridge|tunnel|motorway|service|link|minor|major|trunk|path/.test(id)) map.setPaintProperty(id, "line-color", T.road);
      } else if (l.type === "symbol") {
        map.setPaintProperty(id, "text-color", T.text);
        map.setPaintProperty(id, "text-halo-color", T.halo);
        if (l.layout?.["text-field"]) map.setLayoutProperty(id, "text-field", ["coalesce", ["get", "name:vi"], ["get", "name"], ["get", "name:latin"]]);
      }
    } catch { }
  }
}

const isDev = process.env.NODE_ENV !== "production";

const DISPLAY = "font-display font-black uppercase leading-[0.95]";
const EXPANDED = { fontStretch: "125%" } as const;

export function MapSection() {
  const [parkingId, setParkingId] = useState<ParkingId>("cung");
  const [originId, setOriginId] = useState(ORIGINS[0].id);
  const [custom, setCustom] = useState<{ label: string; pos: LL } | null>(null);
  const [steps, setSteps] = useState<{ text: string; dist: number }[]>([]);
  const [meta, setMeta] = useState<{ km: number; min: number } | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [ready, setReady] = useState(false);
  const [replay, setReplay] = useState(0);
  const [addr, setAddr] = useState("");
  const [addrMsg, setAddrMsg] = useState("");
  const [pick, setPick] = useState(false);
  const [picked, setPicked] = useState("");

  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const mlRef = useRef<any>(null);
  const vehicleRef = useRef<any>(null);
  const startRef = useRef<any>(null);
  const raf = useRef(0);
  const token = useRef(0);
  const pickRef = useRef(false);
  pickRef.current = pick;

  const parking = PARKINGS[parkingId];
  const origin = originId === "custom" && custom ? null : ORIGINS.find((o) => o.id === originId) ?? ORIGINS[0];
  const startPoints: LL[] = origin ? origin.points : [custom!.pos];

  useEffect(() => {
    let disposed = false;
    (async () => {
      const maplibregl = await import("maplibre-gl");
      if (disposed || !el.current || typeof maplibregl.Map !== "function") return;
      mlRef.current = maplibregl;

      const workerUrl = new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url);
      maplibregl.config.WORKER_URL = workerUrl.href;

      const map = new maplibregl.Map({
        container: el.current,
        style: STYLE_URL,
        center: toC(OU),
        zoom: 15.3,
        pitch: 38,
        bearing: -12,
        cooperativeGestures: true,
        attributionControl: { compact: true },
      });
      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
      map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

      map.on("load", () => {
        applyBrandStyle(map);
        map.addSource("route", { type: "geojson", data: EMPTY as any });
        map.addLayer({ id: "route-casing", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#FFFFFF", "line-width": 13 } });
        map.addLayer({ id: "route-line", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#7335E8", "line-width": 7 } });

        const mk = (html: string, anchor: "center" | "bottom" = "center") => {
          const d = document.createElement("div");
          d.innerHTML = html;
          return new maplibregl.Marker({ element: d.firstElementChild as HTMLElement, anchor });
        };

        mk(`<div class="ou-wrap"><div class="ou-pulse font-display"><span>97</span></div><div class="ou-label font-display">Đại Học Mở · 97 Võ Văn Tần</div></div>`)
            .setLngLat(toC(OU)).addTo(map);

        (Object.keys(PARKINGS) as ParkingId[]).forEach((id) => {
          const p = PARKINGS[id];
          mk(`<div class="p-pin font-display" style="background:${p.color}">P</div>`).setLngLat(toC(p.pos)).addTo(map);
        });

        startRef.current = mk(`<div class="start-dot"></div>`).setLngLat(toC(OU));
        vehicleRef.current = mk(`<div class="vehicle"><span></span></div>`).setLngLat(toC(OU));

        setReady(true);
      });

      map.on("click", (e) => {
        if (!pickRef.current) return;
        const s = `${e.lngLat.lat.toFixed(5)}, ${e.lngLat.lng.toFixed(5)}`;
        setPicked(s);
        navigator.clipboard?.writeText(s).catch(() => {});
      });

      mapRef.current = map;
    })();
    return () => {
      disposed = true;
      cancelAnimationFrame(raf.current);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current, ml = mlRef.current;
    if (!ready || !map || !ml) return;
    const myToken = ++token.current;
    cancelAnimationFrame(raf.current);
    const ctrl = new AbortController();
    setStatus("loading");

    const pts = [...startPoints, parking.pos];
    const url = `https://router.project-osrm.org/route/v1/driving/${pts.map((p) => `${p[1]},${p[0]}`).join(";")}?overview=full&geometries=geojson&steps=true`;
    const src = map.getSource("route") as GeoJSONSource;
    src.setData(EMPTY as any);
    map.setPaintProperty("route-line", "line-color", parking.color);
    vehicleRef.current?.remove();

    fetch(url, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((data) => {
          const route = data.routes?.[0];
          if (!route || myToken !== token.current) throw new Error("no route");
          const coords: C[] = route.geometry.coordinates;
          const cum = cumulative(coords);
          const total = cum[cum.length - 1];

          const rawSteps = route.legs.flatMap((lg: any) => lg.steps).map((s: any) => ({ text: stepText(s), dist: s.distance }));
          const filteredSteps = rawSteps.filter((s: any, idx: number) => s.text !== "Đến nơi" || idx === rawSteps.length - 1);

          setSteps(filteredSteps);
          setMeta({ km: route.distance / 1000, min: Math.max(1, Math.round(route.duration / 60)) });
          setStatus("ok");

          startRef.current?.setLngLat(coords[0]).addTo(map);

          const bounds = coords.reduce((b, c) => b.extend(c), new ml.LngLatBounds(coords[0], coords[0]));
          bounds.extend(toC(OU));
          const fit = (duration: number) => map.fitBounds(bounds, { padding: 70, pitch: 0, bearing: 0, duration, maxZoom: 17 });
          const line = (c: C[]) => ({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: c } });

          if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            src.setData(line(coords) as any);
            fit(0);
            return;
          }

          const durMs = Math.min(10000, Math.max(4500, total * 2.2));
          let cur = bearing(coords[0], pointAt(coords, cum, 80).p);
          let t0 = 0;
          vehicleRef.current?.setLngLat(coords[0]).addTo(map);

          const tick = (now: number) => {
            if (myToken !== token.current) return;
            if (!t0) t0 = now;
            const t = Math.min((now - t0) / durMs, 1);
            const d = t * total;
            const { p, i } = pointAt(coords, cum, d);
            src.setData(line([...coords.slice(0, i + 1), p]) as any);
            vehicleRef.current?.setLngLat(p);
            const look = pointAt(coords, cum, Math.min(total, d + 70)).p;
            cur = (cur + shortest(bearing(p, look) - cur) * 0.07 + 360) % 360;
            map.jumpTo({ center: p, zoom: 16.2, pitch: 55, bearing: cur });
            if (t < 1) raf.current = requestAnimationFrame(tick);
            else fit(1400);
          };

          map.flyTo({ center: coords[0], zoom: 16.2, pitch: 55, bearing: cur, duration: 1100, essential: true });
          map.once("moveend", () => {
            if (myToken === token.current) raf.current = requestAnimationFrame(tick);
          });
        })
        .catch((e) => {
          if (e.name === "AbortError") return;
          setSteps([]); setMeta(null); setStatus("error");
        });

    return () => ctrl.abort();
  }, [ready, originId, parkingId, custom, replay]);

  async function submitAddress(e: React.FormEvent) {
    e.preventDefault();
    const q = addr.trim();
    if (!q) return;
    setAddrMsg("Đang tìm địa chỉ…");
    try {
      const u = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
        format: "jsonv2", limit: "1", countrycodes: "vn", "accept-language": "vi",
        viewbox: "106.45,11.05,106.95,10.55", q: /hồ chí minh|hcm|sài gòn/i.test(q) ? q : `${q}, Thành phố Hồ Chí Minh`,
      })}`;
      const res = await (await fetch(u)).json();
      if (!res[0]) return setAddrMsg("Không tìm thấy địa chỉ này.");
      setCustom({ label: res[0].display_name.split(",").slice(0, 2).join(","), pos: [parseFloat(res[0].lat), parseFloat(res[0].lon)] });
      setOriginId("custom");
      setAddrMsg("");
    } catch {
      setAddrMsg("Lỗi tìm địa chỉ.");
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) return setAddrMsg("Trình duyệt không hỗ trợ định vị.");
    setAddrMsg("Đang lấy vị trí…");
    navigator.geolocation.getCurrentPosition(
        (g) => { setCustom({ label: "Vị trí của bạn", pos: [g.coords.latitude, g.coords.longitude] }); setOriginId("custom"); setAddrMsg(""); },
        () => setAddrMsg("Không lấy được vị trí."),
        { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const gmaps = `https://www.google.com/maps/dir/?${new URLSearchParams({
    api: "1", origin: startPoints[0].join(","), destination: parking.pos.join(","), travelmode: "driving",
    ...(startPoints.length > 1 ? { waypoints: startPoints.slice(1).map((p) => p.join(",")).join("|") } : {}),
  })}`;

  const chip = (on: boolean) =>
      `rounded-lg border px-3 py-2 text-left font-sans text-xs font-semibold transition ${on ? "border-brand bg-brand text-white" : "border-hero bg-white text-brand"}`;

  return (
      <section id="map" className="min-h-svh bg-white font-sans text-brand">
        <style>{`
      .ou-wrap{display:flex;flex-direction:column;align-items:center;gap:6px;transform:translateY(-6px)}
      .ou-pulse{width:46px;height:46px;border-radius:50%;background:#2A1260;border:3px solid #7335e8;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-stretch:125%;font-size:15px;animation:ouPulse 1.8s infinite}
      .ou-label{background:#2A1260;color:#fff;font-weight:900;font-stretch:125%;text-transform:uppercase;letter-spacing:.02em;font-size:11px;padding:5px 10px;border-radius:999px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.3)}
      @keyframes ouPulse{0%{box-shadow:0 0 0 0 rgba(115,53,232,.75)}70%{box-shadow:0 0 0 20px rgba(115,53,232,0)}100%{box-shadow:0 0 0 0 rgba(115,53,232,0)}}
      .p-pin{width:30px;height:30px;border-radius:50%;color:#fff;border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-stretch:125%;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,.35)}
      .start-dot{width:18px;height:18px;border-radius:50%;background:#fff;border:5px solid #2A1260;box-shadow:0 0 0 4px rgba(42,18,96,.2)}
      .vehicle{width:24px;height:24px;border-radius:50%;background:#2A1260;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center}
      .vehicle span{width:8px;height:8px;border-radius:50%;background:#7335e8}
    `}</style>

        <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col justify-center gap-8 px-6 py-24 md:px-10">
          <Reveal>
            <h2
                className={`${DISPLAY} text-[clamp(2rem,5vw,3.5rem)]`}
                style={EXPANDED}
            >
              Đi lại &amp; bãi xe
            </h2>
          </Reveal>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <Reveal className="min-w-0">
              <div className="relative overflow-hidden rounded-xl border border-lilac/30">
                <div ref={el} className="h-[440px] w-full md:h-[580px]" />
                {status === "loading" && (
                    <span className="absolute left-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1.5 font-sans text-[10px] font-semibold uppercase text-ink">
                Đang tìm đường…
              </span>
                )}
                <div className="absolute bottom-3 right-3 z-10 flex gap-2">
                  <button type="button" onClick={() => setReplay((n) => n + 1)} className="rounded-full bg-white/90 px-3 py-1.5 font-sans text-[11px] font-bold text-ink hover:bg-white">↻ Xem lại</button>
                  {isDev && (
                      <button type="button" onClick={() => setPick((v) => !v)} className={`rounded-full px-3 py-1.5 font-sans text-[11px] font-bold ${pick ? "bg-brand text-white" : "bg-white/90 text-ink"}`}>
                        {pick ? "Đang lấy tọa độ" : "Lấy tọa độ"}
                      </button>
                  )}
                </div>
                {isDev && pick && picked && <span className="absolute bottom-3 left-3 z-10 rounded-md bg-ink px-3 py-1.5 font-mono text-xs text-signal">{picked} (đã copy)</span>}
              </div>
            </Reveal>

            <Reveal delay={120} className="flex min-w-0 flex-col gap-4">
              <form onSubmit={submitAddress} className="flex flex-col gap-2">
                <label
                    htmlFor="addr"
                    className={`${DISPLAY} text-[clamp(9px,1.3vw,13px)] text-brand`}
                    style={EXPANDED}
                >
                  Nhập địa chỉ của bạn
                </label>
                <div className="flex gap-2">
                  <input
                      id="addr"
                      value={addr}
                      onChange={(e) => setAddr(e.target.value)}
                      placeholder="VD: 20 Lê Lợi, Quận 1"
                      className="min-w-0 flex-1 rounded-full border border-brand/20 bg-transparent px-4 py-3 font-sans text-sm text-brand placeholder:text-brand/50 focus:border-brand focus:outline-none"
                  />
                  <button type="submit" className="rounded-full bg-brand px-5 font-sans text-sm font-bold text-white hover:brightness-105">Đi</button>
                </div>

                <div className="mt-1 flex flex-col gap-2">
                  <button type="button" onClick={useMyLocation} className="inline-flex items-center self-start font-sans text-xs font-semibold underline-offset-4 hover:underline">
                    Dùng vị trí hiện tại của tôi
                  </button>
                  {addrMsg && <p className="font-sans text-xs text-brand/80">{addrMsg}</p>}
                  {custom && (
                      <button type="button" onClick={() => setOriginId("custom")} className={`${chip(originId === "custom")} inline-flex items-center gap-1.5`}>
                        <MapPin className="size-4 shrink-0" />
                        <span>{custom.label}</span>
                      </button>
                  )}
                </div>
              </form>

              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(PARKINGS) as ParkingId[]).map((id) => (
                    <button
                        key={id}
                        type="button"
                        aria-pressed={parkingId === id}
                        onClick={() => setParkingId(id)}
                        className={`rounded-xl border p-3 text-left transition ${parkingId === id ? "border-brand bg-brand text-white" : "border-brand/20 bg-white/5 hover:bg-white/10"}`}
                    >
                <span
                    className="mb-1 flex h-6 w-6 items-center justify-center rounded-full font-display text-xs font-black text-white"
                    style={{ backgroundColor: PARKINGS[id].color, ...EXPANDED }}
                >
                  P
                </span>
                      <span className={`${DISPLAY} block text-[12px]`} style={EXPANDED}>
                  {PARKINGS[id].short}
                </span>
                      <span className="mt-1 block font-sans text-[11px] font-medium opacity-70">{PARKINGS[id].sub}</span>
                    </button>
                ))}
              </div>

              <div className="space-y-3">
                {GROUPS.map((g) => (
                    <div key={g}>
                      <p className={`${DISPLAY} mb-1.5 text-[10px] text-brand`} style={EXPANDED}>
                        Đường {g}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {ORIGINS.filter((o) => o.group === g).map((o) => (
                            <button key={o.id} type="button" aria-pressed={originId === o.id} onClick={() => setOriginId(o.id)} className={chip(originId === o.id)}>
                              {o.label}
                            </button>
                        ))}
                      </div>
                    </div>
                ))}
              </div>

              <div className="rounded-xl border border-brand/15 bg-brand/10 p-5">
                {meta && (
                    <p className={`${DISPLAY} mb-3 text-[11px] text-brand/70`} style={EXPANDED}>
                      {meta.km.toFixed(1)} km · khoảng {meta.min} phút
                    </p>
                )}
                <ol className="max-h-56 space-y-2.5 overflow-y-auto pr-1">
                  {steps.map((s, i) => (
                      <li key={i} className="flex gap-3 font-sans text-sm leading-relaxed text-brand/90">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-signal font-display text-xs font-black text-ink" style={EXPANDED}>
                    {i + 1}
                  </span>
                        <span>
                    {s.text}
                          {s.dist > 0 && <span className="text-brand/60"> · {fmtDist(s.dist)}</span>}
                  </span>
                      </li>
                  ))}
                </ol>
              </div>

              <a
                  href={gmaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${DISPLAY} inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-4 text-[13px] text-white transition hover:brightness-105`}
                  style={EXPANDED}
              >
                Mở tuyến trên Google Maps
              </a>
            </Reveal>
          </div>
        </div>
      </section>
  );
}