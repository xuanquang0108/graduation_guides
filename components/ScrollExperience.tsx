"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function ScrollExperience() {
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) return;

    const sections = gsap.utils.toArray<HTMLElement>("main > section");
    if (sections.length < 2) return;

    const doc = document.documentElement;
    const vh = () => window.innerHeight;
    const maxScroll = () => Math.max(0, doc.scrollHeight - vh());

    const snapPoints = () => {
      const pts = new Set<number>();
      for (const s of sections) {
        const top = s.getBoundingClientRect().top + window.scrollY;
        pts.add(Math.round(top));
        const h = s.offsetHeight;
        if (h > vh()) pts.add(Math.round(top + h - vh()));
      }
      pts.add(Math.round(maxScroll()));
      return Array.from(pts).sort((a, b) => a - b);
    };

    const snapTo = (progress: number) => {
      const max = maxScroll();
      if (max <= 0) return 0;
      const target = progress * max;
      let best = 0;
      let bestDist = Infinity;
      for (const p of snapPoints()) {
        const d = Math.abs(p - target);
        if (d < bestDist) {
          bestDist = d;
          best = p;
        }
      }
      return gsap.utils.clamp(0, 1, best / max);
    };

    const trigger = ScrollTrigger.create({
      start: 0,
      end: "max",
      snap: {
        snapTo,
        duration: { min: 0.35, max: 0.8 },
        ease: "power2.inOut",
        delay: 0.08,
      },
    });

    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      trigger.kill();
    };
  }, []);

  return null;
}
