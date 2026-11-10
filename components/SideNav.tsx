"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronUp } from "lucide-react";

type Item = { id: string; label: string };

export function SideNav({ items }: { items: Item[] }) {
    const [active, setActive] = useState(0);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLElement>(null);
    const key = items.map((i) => i.id).join();

    useEffect(() => {
        const els = key.split(",").map((id) => document.getElementById(id));
        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (e.isIntersecting) setActive(els.indexOf(e.target as HTMLElement));
                }
            },
            { rootMargin: "-50% 0px -50% 0px" },
        );
        els.forEach((el) => el && io.observe(el));
        return () => io.disconnect();
    }, [key]);

    useEffect(() => {
        if (!open) return;
        const close = (e: PointerEvent) => {
            if (!ref.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("pointerdown", close);
        return () => document.removeEventListener("pointerdown", close);
    }, [open]);

    const go = (i: number) => {
        const el = document.getElementById(items[i]?.id);
        if (!el) return;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
        setOpen(false);
    };

    const arrow =
        "grid size-7 place-items-center rounded-full text-ink transition hover:bg-white/70 disabled:opacity-30 disabled:hover:bg-transparent";

    return (
        <nav ref={ref} aria-label="Điều hướng các phần" className="fixed right-0 top-2/3 z-50 -translate-y-1/2 sm:right-4">
            <button
                type="button"
                aria-label="Mở điều hướng"
                aria-expanded={open}
                onClick={() => setOpen(true)}
                className={`${open ? "hidden" : "grid"} glass-panel h-12 w-5 place-items-center rounded-l-full rounded-r-none border-r-0 sm:hidden`}
            >
                <ChevronLeft className="size-3.5 text-ink" />
            </button>

            <div className={`${open ? "flex" : "hidden sm:flex"} glass-panel mr-2 flex-col items-stretch gap-0.5 rounded-3xl p-1 sm:mr-0 sm:items-center sm:rounded-full`}>
                <button type="button" aria-label="Phần trước" disabled={active === 0} onClick={() => go(active - 1)} className={`${arrow} self-center`}>
                    <ChevronUp className="size-4" />
                </button>

                {items.map((it, i) => (
                    <button
                        key={it.id}
                        type="button"
                        aria-label={it.label}
                        aria-current={active === i ? "true" : undefined}
                        onClick={() => go(i)}
                        className="group relative flex h-8 items-center gap-2 rounded-full px-2.5 sm:size-7 sm:justify-center sm:p-0"
                    >
            <span className="grid size-3 place-items-center">
              <span className={`block rounded-full transition-all duration-300 ${active === i ? "h-5 w-2 bg-brand" : "size-2 bg-ink/40 group-hover:bg-ink"}`} />
            </span>
                        <span className={`font-sans text-[12px] font-semibold sm:hidden ${active === i ? "text-ink" : "text-ink/70"}`}>{it.label}</span>
                        <span className="glass-panel pointer-events-none absolute right-full mr-2 hidden whitespace-nowrap rounded-full px-2.5 py-1 font-sans text-[11px] font-semibold text-ink opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100 sm:block">
              {it.label}
            </span>
                    </button>
                ))}

                <button type="button" aria-label="Phần sau" disabled={active === items.length - 1} onClick={() => go(active + 1)} className={`${arrow} self-center`}>
                    <ChevronDown className="size-4" />
                </button>
            </div>
        </nav>
    );
}