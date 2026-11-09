import { CLOSING } from "@/lib/site-config";
import { Reveal } from "@/components/Reveal";

export function ClosingSection() {
  return (
    <section id="closing" className="min-h-svh bg-white">
      <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col justify-center gap-12 px-6 py-24 md:px-10">
        <Reveal>
          <h2 className="whitespace-pre-line font-display text-[clamp(2.75rem,10vw,7.5rem)] font-black leading-[0.92] text-ink">
            {CLOSING.statement}
          </h2>
        </Reveal>

        <Reveal delay={120}>
          <div className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="max-w-md text-lg leading-relaxed text-mist">
                {CLOSING.thanks}
              </p>
              <p className="mt-3 font-display text-xl font-black text-brand">
                {CLOSING.signature}
              </p>
            </div>

            <a
              href="#hero"
              className="glass-strong inline-flex items-center gap-2 rounded-full px-7 py-4 text-sm font-bold text-ink transition-transform hover:-translate-y-0.5"
            >
              {CLOSING.backToTop}
              <span aria-hidden="true">↑</span>
            </a>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <p className="border-t border-ink/10 pt-6 text-xs uppercase text-mist">
            {CLOSING.stamp}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
