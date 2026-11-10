import { HeroSection } from "@/components/HeroSection";
import { MapSection } from "@/components/MapSection";
import { GraduationInvitation } from "@/components/GraduationInvitation";
import { SideNav } from "@/components/SideNav";
import { SiteFooter } from "@/components/SiteFooter";

export default function Home() {
    return (
        <main>
            <SideNav
                items={[
                    { id: "hero", label: "Mở đầu" },
                    { id: "invitation", label: "Thiệp mời" },
                    { id: "map", label: "Đường đi" },
                ]}
            />
            <HeroSection />
            <GraduationInvitation
                images={{
                    panel: "/images/panel-bg.png", // Dùng dấu phẩy (,) ở cuối
                    // outside: "/images/outside-bg.jpg", // (nếu có)
                    // paper: "/images/paper-bg.jpg",     // (nếu có)
                }}
            />
            <MapSection />
            <SiteFooter/>
        </main>
    );
}