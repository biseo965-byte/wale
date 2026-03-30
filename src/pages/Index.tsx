import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Waves, MapPin } from "lucide-react";
import WavePark from "@/components/WavePark";
import SurfSpot from "@/components/SurfSpot";

type Tab = "wavepark" | "surfspot";

export default function Index() {
  const [tab, setTab] = useState<Tab>("wavepark");

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-border">
          <h1 className="text-xl font-bold text-foreground">웨일 🐋</h1>
          <span className="text-sm text-muted-foreground">
            {format(new Date(), "yyyy년 M월 d일 (EEE)", { locale: ko })}
          </span>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
          {tab === "wavepark" ? <WavePark /> : <SurfSpot />}
        </main>

        {/* Bottom tabs */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/90 backdrop-blur-md border-t border-border z-30">
          <div className="flex">
            {[
              { id: "wavepark" as Tab, label: "웨이브파크", icon: Waves },
              { id: "surfspot" as Tab, label: "서핑스팟", icon: MapPin },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors ${
                  tab === id ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
          {/* Safe area padding */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
      </div>
    </div>
  );
}
