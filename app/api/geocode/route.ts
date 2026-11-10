import { NextRequest, NextResponse } from "next/server";

type Hit = { label: string; lat: number; lng: number };

const UA = process.env.GEOCODE_USER_AGENT ?? "graduation-invitation-site/1.0";

async function nominatim(q: string): Promise<Hit | null> {
    const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
        format: "jsonv2",
        limit: "1",
        countrycodes: "vn",
        "accept-language": "vi",
        viewbox: "106.45,11.05,106.95,10.55",
        q,
    })}`;
    const r = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" });
    if (!r.ok) throw new Error(`nominatim ${r.status}`);
    const [h] = await r.json();
    if (!h) return null;
    return { label: h.display_name.split(",").slice(0, 2).join(","), lat: parseFloat(h.lat), lng: parseFloat(h.lon) };
}

async function photon(q: string): Promise<Hit | null> {
    const url = `https://photon.komoot.io/api/?${new URLSearchParams({
        q,
        limit: "1",
        lat: "10.7769",
        lon: "106.7009",
        bbox: "106.45,10.55,106.95,11.05",
    })}`;
    const r = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" });
    if (!r.ok) throw new Error(`photon ${r.status}`);
    const f = (await r.json()).features?.[0];
    if (!f) return null;
    const [lng, lat] = f.geometry.coordinates;
    return { label: q, lat, lng };
}

export async function GET(req: NextRequest) {
    const raw = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (!raw || raw.length > 200) return NextResponse.json({ error: "bad_query" }, { status: 400 });

    const withCity = /hồ chí minh|hcm|sài gòn/i.test(raw) ? raw : `${raw}, Hồ Chí Minh`;
    const noNumber = withCity.replace(/^\s*\d+[A-Za-z]?([/-]\d+[A-Za-z]?)*[,\s]+/, "");
    const queries = noNumber !== withCity ? [withCity, noNumber] : [withCity];

    let tries = 0;
    let failed = 0;
    for (const q of queries) {
        for (const search of [nominatim, photon]) {
            tries++;
            try {
                const hit = await search(q);
                if (hit) return NextResponse.json(hit);
            } catch {
                failed++;
            }
        }
    }
    if (failed === tries) return NextResponse.json({ error: "upstream" }, { status: 502 });
    return NextResponse.json(null);
}