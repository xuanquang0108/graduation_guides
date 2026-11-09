import { HeroSection } from "@/components/HeroSection";
import { EventSection } from "@/components/EventSection";
import { MapSection } from "@/components/MapSection";
import { ClosingSection } from "@/components/ClosingSection";
import { GraduationInvitation } from "@/components/GraduationInvitation";

export default function Home() {
  return (
      <main>
        <HeroSection />
        <GraduationInvitation
            images={{
                panel: "/images/panel-bg.png", // Dùng dấu phẩy (,) ở cuối
                // outside: "/images/outside-bg.jpg", // (nếu có)
                // paper: "/images/paper-bg.jpg",     // (nếu có)
            }}
        />
        <MapSection />
      </main>
  );
}
