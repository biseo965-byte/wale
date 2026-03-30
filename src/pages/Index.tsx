import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Waves, MapPin, Car, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import WavePark from "@/components/WavePark";

export default function Index() {
  const [tab, setTab]               = useState<"wavepark">("wavepark");
  const [displayDate, setDisplayDate] = useState<Date>(new Date());

  const handleComingSoon = (name: string) => {
    toast(`${name}은 추후 오픈 예정이에요`, {
      description: "조금만 기다려 주세요!",
      duration: 2500,
    });
  };

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-border">
          {/* 로고 + 타이틀 */}
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="웨일 로고"
              className="w-10 h-10 rounded-xl object-cover"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] text-muted-foreground font-medium tracking-wide">
                서퍼를 위한
              </span>
              <span className="text-lg font-bold text-foreground leading-none">
                웨일
              </span>
            </div>
          </div>

          {/* 선택된 날짜 — 날짜 칩 선택 시 업데이트 */}
          <div className="text-right">
            <span className="text-sm font-medium text-foreground">
              {format(displayDate, "M월 d일 (EEE)", { locale: ko })}
            </span>
            <br />
            <span className="text-[11px] text-muted-foreground">
              {format(displayDate, "yyyy")}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
          <WavePark onDateChange={setDisplayDate} />
        </main>

        {/* Bottom tabs */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/90 backdrop-blur-md border-t border-border z-30">
          <div className="flex">
            {/* 웨이브파크 탭 */}
            <button
              onClick={() => setTab("wavepark")}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors ${
                tab === "wavepark" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Waves className="w-5 h-5" />
              <span className="text-xs font-medium">웨이브파크</span>
            </button>

            {/* 서핑스팟 탭 — 비활성화 */}
            <button
              onClick={() => handleComingSoon("서핑스팟")}
              className="flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors text-muted-foreground/40"
            >
              <MapPin className="w-5 h-5" />
              <span className="text-xs font-medium">서핑스팟</span>
            </button>

            {/* 카풀 탭 — 비활성화 */}
            <button
              onClick={() => handleComingSoon("카풀")}
              className="flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors text-muted-foreground/40"
            >
              <Car className="w-5 h-5" />
              <span className="text-xs font-medium">카풀</span>
            </button>

            {/* 중고 장터 탭 — 비활성화 */}
            <button
              onClick={() => handleComingSoon("중고 장터")}
              className="flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors text-muted-foreground/40"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-xs font-medium">중고 장터</span>
            </button>
          </div>
          {/* Safe area padding */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
      </div>
    </div>
  );
}
