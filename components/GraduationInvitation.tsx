"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import styles from "./GraduationInvitation.module.css";

type Contact = { name: string; phone: string };

type GraduationInvitationProps = {
    headline?: string[];
    scriptTitle?: string;
    greeting?: string;
    recipient?: string;
    messageLines?: string[];
    dateTop?: string;
    dateBottom?: string;
    parkingTitle?: string;
    parkingItems?: string[];
    address?: string;
    district?: string;
    eventTime?: string;
    contacts?: Contact[];

    fitHeadline?: boolean;

    images?: {
        outside?: string;
        paper?: string;
        panel?: string;
    };

    fonts?: { sans?: string; display?: string; script?: string };

    colors?: {
        outside?: string;
        paper?: string;
        panel?: string;
        ink?: string;
        script?: string;
        accent?: string;
    };
};

type Vars = Record<`--${string}`, string | number>;
const vars = (v: Vars) => v as CSSProperties;

const SPARKLES: [number, number, number, number, string][] = [
    [6, 3.5, 2.6, 1.4, "✦"],
    [72, 3, 2, 2.2, "✧"],
    [74, 30, 3.2, 0.6, "✦"],
    [4, 38, 2, 3.1, "✧"],
    [13, 62, 2.6, 2.0, "✦"],
    [66, 63, 2.2, 3.6, "✧"],
    [75, 44, 2, 1.7, "✧"],
    [3, 46, 1.8, 2.7, "✦"],
];

const toCssUrl = (path?: string) =>
    path ? `url("${path.replace(/["\\]/g, "\\$&")}")` : "none";

const T = {
    stamp: 0,
    head: 350,
    script: 1300,
    greet: 1700,
    name: 1900,
    msg: 2150,
    date: 2500,
    foot: 3300,
};

const SCRAMBLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function useScramble(text: string, trigger: number, delay: number, duration = 1000) {
    const [out, setOut] = useState(text);

    useEffect(() => {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!trigger || reduced) {
            setOut(text);
            return;
        }
        let raf = 0;
        let t0 = 0;
        const chars = [...text];
        const tick = (now: number) => {
            if (!t0) t0 = now;
            const p = Math.min((now - t0) / duration, 1);
            const done = Math.floor(p * chars.length);
            setOut(
                chars
                    .map((c, i) =>
                        c === " " || i < done ? c : SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)],
                    )
                    .join(""),
            );
            if (p < 1) raf = requestAnimationFrame(tick);
            else setOut(text);
        };
        setOut(chars.map((c) => (c === " " ? c : SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)])).join(""));
        const timer = window.setTimeout(() => (raf = requestAnimationFrame(tick)), delay);
        return () => {
            window.clearTimeout(timer);
            cancelAnimationFrame(raf);
        };
    }, [text, trigger, delay, duration]);

    return out;
}

function Chars({ text, start }: { text: string; start: number }) {
    return (
        <>
            {[...text].map((ch, i) => (
                <span key={i} className={styles.char} style={vars({ "--i": start + i })} aria-hidden="true">
          <span className={styles.glyph}>{ch}</span>
        </span>
            ))}
        </>
    );
}

function Roll({ text, delay }: { text: string; delay: number }) {
    return (
        <span className={styles.roll} aria-hidden="true" style={vars({ "--d": `${delay}ms` })}>
      {[...text].map((ch, i) => {
          if (!/\d/.test(ch)) {
              return (
                  <span key={i} className={styles.rollStatic}>
              {ch}
            </span>
              );
          }
          const final = Number(ch);
          const n = 8 + i * 4;
          const strip = Array.from({ length: n + 1 }, (_, k) => (((final - (n - k)) % 10) + 10) % 10);
          return (
              <span key={i} className={styles.rollCol}>
            <span className={styles.rollStrip} style={vars({ "--n": n, "--i": i })}>
              {strip.map((d, k) => (
                  <span key={k}>{d}</span>
              ))}
            </span>
          </span>
          );
      })}
    </span>
    );
}

export function GraduationInvitation({
                                         headline = ["LỄ", "TỐT", "NGHIỆP"],
                                         scriptTitle = "Uyên Như",
                                         greeting = "Thân Mời",
                                         recipient = "Gia đình và những người \n bạn thân thương",
                                         messageLines = ["Đến cùng em/mình ghi lại khoảnh khắc đáng nhớ trong", "ngày lễ tốt nghiệp."],
                                         dateTop = "22.11",
                                         dateBottom = "2026",
                                         parkingTitle = "Địa điểm gửi xe",
                                         parkingItems = ["Cung văn hóa lao động", "Công viên Tao Đàn", "Các bãi xe lân cận"],
                                         address = "97 Võ Văn Tần,",
                                         district = "P. Xuân Hòa, TP. HCM",
                                         eventTime = "16h00 - 17h30",
                                         contacts = [
                                             { phone: "0961.079.917", name: "Như" },
                                             { phone: "0388.458.504", name: "Quang" },
                                         ],
                                         fitHeadline = true,
                                         images,
                                         fonts,
                                         colors,
                                     }: GraduationInvitationProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const tiltRef = useRef<HTMLDivElement>(null);
    const headlineRef = useRef<HTMLHeadingElement>(null);
    const [started, setStarted] = useState(false);
    const [inView, setInView] = useState(false);
    const [run, setRun] = useState(0);

    const scrambled = useScramble(recipient, started ? run + 1 : 0, T.name, 1000);

    useEffect(() => {
        const el = rootRef.current;
        if (!el) return;
        const io = new IntersectionObserver(
            ([e]) => {
                setInView(e.isIntersecting);
                if (e.isIntersecting) setStarted(true);
            },
            { threshold: 0.4 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    useEffect(() => {
        if (!fitHeadline) return;
        const h = headlineRef.current;
        const wrap = h?.parentElement;
        if (!h || !wrap) return;
        const fit = () => {
            h.style.setProperty("--fit", "1");
            const natural = h.offsetWidth;
            if (natural > 0) h.style.setProperty("--fit", String(wrap.clientWidth / natural));
        };
        fit();
        document.fonts?.ready.then(fit);
        document.fonts?.addEventListener?.("loadingdone", fit);
        const ro = new ResizeObserver(fit);
        ro.observe(wrap);
        return () => {
            document.fonts?.removeEventListener?.("loadingdone", fit);
            ro.disconnect();
        };
    }, [fitHeadline, headline, run]);

    const onMove = (e: PointerEvent<HTMLDivElement>) => {
        if (e.pointerType !== "mouse" || !tiltRef.current) return;
        const r = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        tiltRef.current.style.setProperty("--ry", `${x * 7}deg`);
        tiltRef.current.style.setProperty("--rx", `${-y * 7}deg`);
    };
    const onLeave = () => {
        tiltRef.current?.style.setProperty("--ry", "0deg");
        tiltRef.current?.style.setProperty("--rx", "0deg");
    };

    const cssVariables = vars({
        "--outside-image": toCssUrl(images?.outside),
        "--paper-image": toCssUrl(images?.paper),
        "--panel-image": toCssUrl(images?.panel),
        "--font-sans": fonts?.sans ?? 'Inter, "DM Sans", system-ui, sans-serif',
        "--font-display": fonts?.display ?? '"Teko", Impact, sans-serif',
        "--font-script": fonts?.script ?? '"Great Vibes", cursive',
        "--c-outside": colors?.outside ?? "#5b149c",
        "--c-paper": colors?.paper ?? "#f1f4e4",
        "--c-panel": colors?.panel ?? "#5a14a0",
        "--c-ink": colors?.ink ?? "#64cdc0",
        "--c-script": colors?.script ?? "#f2f1c2",
        "--c-accent": colors?.accent ?? "#e8805a",
    });

    let charStart = 0;

    return (
        <section id="invitation" className={styles.stage} style={cssVariables}>
            <div
                ref={rootRef}
                className={styles.poster}
                data-play={started && inView}
                data-panel={images?.panel ? "image" : "grid"}
                aria-label="Thiệp mời lễ tốt nghiệp"
                onPointerMove={onMove}
                onPointerLeave={onLeave}
            >
                <div key={run} ref={tiltRef} className={styles.tilt}>
                    <article className={styles.ticket}>
                        <div className={styles.panel}>

                            <div className={styles.headlineWrap}>
                                <h2
                                    ref={headlineRef}
                                    className={styles.headline}
                                    aria-label={headline.join(" ")}
                                    style={vars({ "--d": `${T.head}ms` })}
                                >
                                    {headline.map((word, wi) => {
                                        const start = charStart;
                                        charStart += [...word].length;
                                        return (
                                            <span key={wi} className={styles.word}>
                        <Chars text={word} start={start} />
                      </span>
                                        );
                                    })}
                                </h2>
                            </div>

                            <p className={styles.script} style={vars({ "--d": `${T.script}ms` })}>
                                <span className={styles.scriptInk}>{scriptTitle}</span>
                            </p>

                            <p className={styles.greeting} style={vars({ "--d": `${T.greet}ms` })}>
                                {greeting}
                            </p>

                            <p className={styles.recipient} style={vars({ "--d": `${T.name}ms` })}>
                                <span className={styles.scrWrap}>
                  <span className={styles.ghost}>{recipient}</span>
                  <span className={styles.scr} aria-hidden="true">
                    {scrambled}
                  </span>
                </span>
                            </p>

                            <p className={styles.message}>
                                {messageLines.map((line, i) => (
                                    <span key={`${i}-${line}`} style={vars({ "--d": `${T.msg + i * 140}ms` })}>
                    {line}
                  </span>
                                ))}
                            </p>

                            <div
                                className={styles.date}
                                aria-label={`Ngày ${dateTop} năm ${dateBottom}`}
                                style={vars({ "--d": `${T.date}ms` })}
                            >
                                <Roll text={dateTop} delay={T.date} />
                                <Roll text={dateBottom} delay={T.date + 250} />
                            </div>

                            <div className={styles.details}>
                                <div className={styles.footerLeft} style={vars({ "--d": `${T.foot}ms` })}>
                                    <p className={styles.footerLabel}>
                                        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="m18 14-1-3"/><path d="m3 9 6 2a2 2 0 0 1 2-2h2a2 2 0 0 1 1.99 1.81"/><path d="M8 17h3a1 1 0 0 0 1-1 6 6 0 0 1 6-6 1 1 0 0 0 1-1v-.75A5 5 0 0 0 17 5"/><circle cx="19" cy="17" r="3"/><circle cx="5" cy="17" r="3"/>
                                        </svg>
                                        <span>{parkingTitle}</span>
                                    </p>
                                    <p className={styles.parkingList}>
                                        {parkingItems.map((item, i) => (
                                            <span className={styles.parkingItem} key={`${i}-${item}`}>
                        {item}
                      </span>
                                        ))}
                                    </p>
                                </div>

                                <div className={styles.footerCenter} style={vars({ "--d": `${T.foot + 120}ms` })}>
                                    <p className={styles.address}>{address}</p>
                                    <p className={styles.district}>{district}</p>
                                    <p className={styles.time}>{eventTime}</p>
                                </div>

                                <div className={styles.footerRight} style={vars({ "--d": `${T.foot + 240}ms` })}>
                                    <p className={styles.footerLabel}>
                                        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M21 16.5v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 10 18a19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 1.9 3.2a2 2 0 0 1 2-2.2h3a2 2 0 0 1 2 1.7c.14 1 .37 2 .7 2.9a2 2 0 0 1-.45 2.1L7.9 9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.45c.94.33 1.92.56 2.9.69a2 2 0 0 1 1.8 2.46Z" />
                                        </svg>
                                        <span>Liên hệ</span>
                                    </p>
                                    {contacts.map((c) => (
                                        <p className={styles.phoneNumber} key={`${c.phone}-${c.name}`}>
                                            {c.phone} ({c.name})
                                        </p>
                                    ))}
                                </div>
                            </div>

                            {SPARKLES.map(([x, y, s, d, ch], i) => (
                                <span
                                    key={i}
                                    className={styles.sparkle}
                                    aria-hidden="true"
                                    style={{ left: `${x}cqw`, top: `${y}cqw`, fontSize: `${s}cqw`, animationDelay: `${d}s` }}
                                >
                                    {ch}
                                </span>
                            ))}
                        </div>
                    </article>
                </div>

                <button type="button" className={styles.replay} onClick={() => setRun((n) => n + 1)}>
                    ↻ Xem lại
                </button>
            </div>
        </section>
    );
}