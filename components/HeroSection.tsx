"use client";

import { useEffect, useRef, useState } from "react";
import { HERO_LINES, HERO_META } from "@/lib/site-config";

interface Glyph {
    ch: string;
    left: number;
    width: number;
    asc: number;
    desc: number;
}

interface Scene {
    pattern: string;
    hold: number;
    weights: number[][];
}

const CONFIG = {
    lines: [...HERO_LINES],
    colors: { tile: "#b09dd6", ink: "#fff" },
    font: {
        family: 'Archivo, "Arial Black", Arial, sans-serif',
        weight: 900,
        stretch: "expanded" as const,
    },

    tilePadding: 0.07,
    tileGap: 2,
    lineGap: 4,
    maxFontSize: 220,

    big: 2.4,
    small: 0.35,
    jitter: 0.15,
    randomPicks: 3,

    transition: 0.25,
    easing: (t: number) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,

    sequence: [
        { pattern: "rest", hold: 0.4 },
        { pattern: "center", hold: 0.5 },
        { pattern: "edges", hold: 0.45 },
        { pattern: "random", hold: 0.4 },
        { pattern: "center", hold: 0.45 },
        { pattern: "edges", hold: 0.45 },
        { pattern: "random", hold: 0.35 },
    ],
};

/* --------------------------- Pure logic --------------------------- */

const position = (i: number, n: number) => (n === 1 ? 0 : (i / (n - 1)) * 2 - 1);

const jitter = (amount: number) => 1 + (Math.random() * 2 - 1) * amount;

function makeWeights(pattern: string, n: number): number[] {
    const { big, small, jitter: j, randomPicks } = CONFIG;
    const mix = (k: number) => (small + (big - small) * k) * jitter(j);

    if (pattern === "random") {
        const w = Array(n).fill(1);
        const picked = [...w.keys()]
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(randomPicks, n));
        picked.forEach((i) => {
            w[i] = Math.random() < 0.6 ? big * jitter(j) : small * jitter(j);
        });
        return w;
    }

    return Array.from({ length: n }, (_, i) => {
        const d = Math.abs(position(i, n));
        if (pattern === "center") return mix(Math.pow(1 - d, 1.2));
        if (pattern === "edges") return mix(Math.pow(d, 1.8));
        return 1;
    });
}

function buildScenes(lines: string[]): Scene[] {
    return CONFIG.sequence.map((s) => ({
        pattern: s.pattern,
        hold: s.hold,
        weights: lines.map((text) => makeWeights(s.pattern, text.length)),
    }));
}

const loopLength = () =>
    CONFIG.sequence.reduce((s, x) => s + x.hold + CONFIG.transition, 0);

function weightsAt(t: number, scenes: Scene[]): number[][] {
    let start = 0;
    for (let s = 0; s < scenes.length; s++) {
        const cur = scenes[s];
        const next = scenes[(s + 1) % scenes.length];
        if (t < start + cur.hold) return cur.weights;
        if (t < start + cur.hold + CONFIG.transition) {
            const k = CONFIG.easing((t - start - cur.hold) / CONFIG.transition);
            return cur.weights.map((line, li) =>
                line.map((w, i) => w + (next.weights[li][i] - w) * k),
            );
        }
        start += cur.hold + CONFIG.transition;
    }
    return scenes[0].weights;
}

/* --------------------------- Component --------------------------- */

function MetaLines({ lines }: { lines: readonly string[] }) {
    return (
        <>
            {lines.map((line) => (
                <span key={line} className="block">
          {line}
        </span>
            ))}
        </>
    );
}

export function HeroSection() {
    const stageRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const replayRef = useRef<() => void>(() => {});
    const pausedRef = useRef(false);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        pausedRef.current = paused;
    }, [paused]);

    useEffect(() => {
        const cv = canvasRef.current;
        const stage = stageRef.current;
        if (!cv || !stage) return;
        const ctx = cv.getContext("2d");
        if (!ctx) return;

        const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;

        let glyphs: Glyph[][] = [];
        let scenes: Scene[] = [];
        let F = 100;
        let W = 0;
        let H = 0;
        let dpr = 1;
        let restH = 0;
        let clock = 0;
        let loopIndex = 0;
        let last = performance.now();
        let raf = 0;
        let lastW = 0;
        let visible = true;

        const setFont = (px: number) => {
            const f = CONFIG.font;
            ctx.font = `${f.weight} ${px}px ${f.family}`;
            const c = ctx as CanvasRenderingContext2D & { fontStretch?: string };
            if ("fontStretch" in ctx) c.fontStretch = f.stretch;
            ctx.textBaseline = "alphabetic";
        };

        const measureGlyphs = () => {
            setFont(100);
            glyphs = CONFIG.lines.map((text) =>
                [...text].map((ch) => {
                    const m = ctx.measureText(ch);
                    return {
                        ch,
                        left: m.actualBoundingBoxLeft / 100,
                        width:
                            (m.actualBoundingBoxLeft + m.actualBoundingBoxRight) / 100,
                        asc: m.actualBoundingBoxAscent / 100,
                        desc: m.actualBoundingBoxDescent / 100,
                    };
                }),
            );
        };

        const naturalWidth = (g: Glyph) => g.width + 2 * CONFIG.tilePadding;

        const lineAnchor = (i: number, n: number) => {
            const mid = (n - 1) / 2;
            const step = restH + CONFIG.lineGap;
            if (i < mid)
                return {
                    mode: "bottom" as const,
                    y: H / 2 - (mid - i) * step + restH / 2,
                };
            if (i > mid)
                return {
                    mode: "top" as const,
                    y: H / 2 + (i - mid) * step - restH / 2,
                };
            return { mode: "center" as const, y: H / 2 };
        };

        const draw = () => {
            if (!scenes.length || !glyphs.length) return;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, W, H);
            const pad = CONFIG.tilePadding;
            const weights = reduced
                ? scenes[0].weights
                : weightsAt(clock % loopLength(), scenes);

            glyphs.forEach((line, li) => {
                const anchor = lineAnchor(li, glyphs.length);
                const baseTotal = line.reduce((s, g) => s + naturalWidth(g) * F, 0);
                const raw = line.map((g, i) => naturalWidth(g) * weights[li][i]);
                const sum = raw.reduce((a, b) => a + b, 0);
                let x = (W - (baseTotal + CONFIG.tileGap * (line.length - 1))) / 2;

                line.forEach((g, i) => {
                    const w = (baseTotal * raw[i]) / sum;
                    const fs = w / naturalWidth(g);
                    const h = (g.asc + g.desc + 2 * pad) * fs;
                    const top =
                        anchor.mode === "bottom"
                            ? anchor.y - h
                            : anchor.mode === "top"
                                ? anchor.y
                                : anchor.y - h / 2;

                    ctx.fillStyle = CONFIG.colors.tile;
                    ctx.fillRect(x, top, w, h);

                    setFont(fs);
                    ctx.fillStyle = CONFIG.colors.ink;
                    ctx.fillText(g.ch, x + (pad + g.left) * fs, top + (pad + g.asc) * fs);
                    x += w + CONFIG.tileGap;
                });
            });
        };

        const layout = () => {
            if (!glyphs.length) return;
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            W = stage.clientWidth;
            lastW = W;

            const widest = Math.max(
                ...glyphs.map((l) => l.reduce((s, g) => s + naturalWidth(g), 0)),
            );
            const maxN = Math.max(...glyphs.map((l) => l.length));
            const wF =
                (W - CONFIG.tileGap * (maxN - 1)) / widest;

            // Giữ canvas vừa khung hình: chừa chỗ cho meta + lời mời + CTA.
            const availH = Math.max(240, window.innerHeight - 240);
            const restMax =
                (availH - glyphs.length * CONFIG.lineGap) / (glyphs.length + 3);
            const hF = restMax / (0.72 + 2 * CONFIG.tilePadding);

            F = Math.min(wF, hF, CONFIG.maxFontSize);
            restH = F * (0.72 + 2 * CONFIG.tilePadding);
            H = Math.round(
                glyphs.length * (restH + CONFIG.lineGap) + restH * 3,
            );
            cv.width = Math.round(W * dpr);
            cv.height = Math.round(H * dpr);
            cv.style.height = `${H}px`;
            draw();
        };

        const tick = (now: number) => {
            const dt = Math.min((now - last) / 1000, 0.1);
            last = now;
            if (!pausedRef.current && visible) {
                clock += dt;
                const loop = Math.floor(clock / loopLength());
                if (loop !== loopIndex) {
                    loopIndex = loop;
                    scenes = buildScenes(CONFIG.lines);
                }
                draw();
            }
            raf = requestAnimationFrame(tick);
        };

        replayRef.current = () => {
            clock = 0;
            loopIndex = 0;
            scenes = buildScenes(CONFIG.lines);
            draw();
        };

        const start = () => {
            measureGlyphs();
            scenes = buildScenes(CONFIG.lines);
            layout();
            if (!reduced) raf = requestAnimationFrame(tick);
        };

        const onResize = () => {
            if (stage.clientWidth !== lastW) layout();
        };
        window.addEventListener("resize", onResize);
        const io = new IntersectionObserver(([e]) => {
            visible = e.isIntersecting;
        });
        io.observe(stage);

        const f = CONFIG.font;
        const fontReady = document.fonts?.load
            ? document.fonts.load(
                `${f.weight} 100px Archivo`,
                CONFIG.lines.join(""),
            )
            : Promise.resolve();
        fontReady.then(start, start);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", onResize);
            io.disconnect();
        };
    }, []);

    const metaClass =
        "font-display font-black uppercase leading-[0.95] text-white";

    return (
        <section id="hero" className="relative min-h-svh bg-hero">
            <div className="flex min-h-svh flex-col p-[clamp(10px,2vw,22px)]">
                <header
                    className={`${metaClass} grid grid-cols-[1fr_1.5fr_1fr] items-start gap-2 text-[clamp(9px,1.3vw,15px)]`}
                    style={{ fontStretch: "125%" }}
                >
                    <div>
                        <MetaLines lines={HERO_META.top.left} />
                    </div>
                    <div className="text-center text-[clamp(11px,1.8vw,20px)]">
                        <MetaLines lines={HERO_META.top.center} />
                    </div>
                    <div className="text-right">
                        <MetaLines lines={HERO_META.top.right} />
                    </div>
                </header>

                <div ref={stageRef} className="my-auto w-full">
                    <h1 className="sr-only">
                        Uyên Như tốt nghiệp 2026
                    </h1>
                    <canvas
                        ref={canvasRef}
                        role="img"
                        aria-label="Kinetic"
                        className="block w-full"
                    />
                </div>

                <footer
                    className={`${metaClass} mt-8 grid grid-cols-[1fr_1.5fr_1fr] items-end gap-2 text-[clamp(9px,1.3vw,15px)]`}
                    style={{ fontStretch: "125%" }}
                >
                    <div>
                        <MetaLines lines={HERO_META.bottom.left} />
                    </div>
                    <div className="text-center text-[clamp(11px,1.8vw,20px)]">
                        <MetaLines lines={HERO_META.bottom.center} />
                    </div>
                    <div className="text-right">
                        <MetaLines lines={HERO_META.bottom.right} />
                    </div>
                </footer>
            </div>
        </section>
    );
}