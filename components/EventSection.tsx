import { EVENT } from "@/lib/site-config";
import { Reveal } from "@/components/Reveal";

const details = [
  { label: "Địa điểm", value: EVENT.venue },
];

export function EventSection() {
  return (
    <section id="event" className="min-h-svh bg-[#F6F1FF]">
      <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col justify-center gap-10 px-6 py-24 md:px-10">
        <Reveal>
          <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-black leading-[0.95] text-ink">
            {EVENT.title}
          </h2>
        </Reveal>

        <div className="grid items-start gap-10 md:grid-cols-2 md:gap-16">
          <Reveal>
            <div className="font-display font-black leading-[0.82]">
              <span className="block text-[clamp(4.5rem,16vw,10rem)] text-brand">
                {EVENT.dateBig}
              </span>
              <span className="mt-3 block text-[clamp(1.25rem,3vw,2rem)] text-ink">
                {EVENT.year} · {EVENT.time}
              </span>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <dl>
              {details.map((d) => (
                <div
                  key={d.label}
                  className="border-t border-ink/15 py-5 first:border-t-0 first:pt-0"
                >
                  <dt className="text-xs font-bold uppercase text-mist">
                    {d.label}
                  </dt>
                  <dd className="mt-2 text-lg leading-snug text-ink md:text-xl">
                    {d.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
