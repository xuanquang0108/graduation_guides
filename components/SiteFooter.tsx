"use client";

const EVENT = {
    title: "Lễ tốt nghiệp Uyên Như",
    start: "20261122T090000Z",
    end: "20261122T103000Z",
    place: "97 Võ Văn Tần, P. Xuân Hòa, TP. HCM",
};

const CONTACTS = [
    { name: "Như", phone: "0961.079.917" },
    { name: "Quang", phone: "0388.458.504" },
];

const display = "font-display font-black uppercase leading-[0.95]";
const stretch = { fontStretch: "125%" } as const;

function jump(id: string) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
}

function downloadIcs() {
    const stamp = new Date().toISOString().replace(/[-:]|\.\d{3}/g, "");
    const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Tot nghiep Uyen Nhu//VI",
        "BEGIN:VEVENT",
        "UID:tot-nghiep-uyen-nhu-2026@invitation",
        `DTSTAMP:${stamp}`,
        `DTSTART:${EVENT.start}`,
        `DTEND:${EVENT.end}`,
        `SUMMARY:${EVENT.title}`,
        `LOCATION:${EVENT.place.replace(/,/g, "\\,")}`,
        "END:VEVENT",
        "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "tot-nghiep-uyen-nhu.ics";
    a.click();
    URL.revokeObjectURL(url);
}

export function SiteFooter() {
    return (
        <footer id="footer" className="bg-hero text-white">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16 md:px-10 md:py-24">
                <div className="flex flex-col items-start gap-8">
                    <p className={`${display} text-[clamp(2.25rem,8vw,6.5rem)] text-foreground`} style={stretch}>
                        Hẹn gặp bạn
                        <br />
                        ngày 22.11
                    </p>
                </div>

                <div className="grid gap-8 font-sans text-sm leading-relaxed text-white/85 sm:grid-cols-3">
                    <div>
                        <p className="font-semibold text-white">22.11.2026</p>
                        <p>16h00 – 17h30</p>
                    </div>

                    <div className="sm:text-center">
                        <p className="font-semibold text-white">97 Võ Văn Tần,</p>
                        <p>P. Xuân Hòa, TP. HCM</p>
                        <a
                            href="#map"
                            onClick={(e) => {
                                e.preventDefault();
                                jump("map");
                            }}
                            className="mt-2 inline-block underline underline-offset-4"
                        >
                            Xem đường đi và bãi xe
                        </a>
                    </div>

                    <div className="sm:text-right">
                        {CONTACTS.map((c) => (
                            <a key={c.phone} href={`tel:${c.phone.replace(/\D/g, "")}`} className="block py-0.5 hover:underline">
                                <span className="font-semibold text-white">{c.phone}</span> ({c.name})
                            </a>
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/20 pt-6 font-sans text-xs text-white/70">
                    <span>Uyên Như · Tốt nghiệp 2026</span>
                    <a
                        href="#hero"
                        onClick={(e) => {
                            e.preventDefault();
                            jump("hero");
                        }}
                        className="hover:underline"
                    >
                        Lên đầu trang ↑
                    </a>
                </div>
            </div>
        </footer>
    );
}