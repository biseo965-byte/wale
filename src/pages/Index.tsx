import { useState } from "react";
import { Waves, MapPin, Car, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";
import WavePark from "@/components/WavePark";
import FundingSession from "@/components/FundingSession";
import wavelessLogo from "@/waleless.jpg";
import hmcLogo from "@/hmc_logo.jpg";

// ── 스폰서 데이터 ─────────────────────────────────────────────────────

interface Sponsor {
  id: string;
  logo: string;
  alt: string;
  title: string;
  desc: string;
}

const SPONSORS: Sponsor[] = [
  {
    id: "waveless",
    logo: wavelessLogo,
    alt: "Waveless",
    title: "Waveless 아일랜드",
    desc: "",
  },
  {
    id: "hmc",
    logo: hmcLogo,
    alt: "HMC",
    title: "Help Me Club",
    desc: "초보 서퍼들의 좌충우돌 모임",
  },
];

// ── 스폰서 모달 ───────────────────────────────────────────────────────

function SponsorModal({ sponsor, onClose }: { sponsor: Sponsor; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* 딤 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* 카드 */}
      <div
        className="relative z-10 w-72 bg-card rounded-2xl shadow-xl border border-border p-6 flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 로고 이미지 */}
        <img
          src={sponsor.logo}
          alt={sponsor.alt}
          className="w-40 h-40 object-contain rounded-xl"
        />

        {/* 텍스트 */}
        <div className="text-center">
          <p className="text-base font-bold text-foreground mb-1">{sponsor.title}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{sponsor.desc}</p>
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────

export default function Index() {
  const [tab, setTab]               = useState<"wavepark" | "funding">("wavepark");
  const [displayDate, setDisplayDate] = useState<Date>(new Date());
  const [activeSponsor, setActiveSponsor] = useState<Sponsor | null>(null);

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

          {/* 스폰서 로고 */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground/60 font-medium">sponsored by.</span>
            {SPONSORS.map((sponsor) => (
              <button
                key={sponsor.id}
                onClick={() => setActiveSponsor(sponsor)}
                className="transition-opacity hover:opacity-70 active:opacity-50"
              >
                <img
                  src={sponsor.logo}
                  alt={sponsor.alt}
                  className="h-9 w-auto object-contain rounded-sm"
                />
              </button>
            ))}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
          {tab === "wavepark" && <WavePark onDateChange={setDisplayDate} />}
          {tab === "funding" && <FundingSession />}
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

            {/* 펀딩세션 탭 */}
            <button
              onClick={() => setTab("funding")}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors ${
                tab === "funding" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <MapPin className="w-5 h-5" />
              <span className="text-xs font-medium">펀딩세션</span>
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

      {/* 스폰서 모달 */}
      {activeSponsor && (
        <SponsorModal sponsor={activeSponsor} onClose={() => setActiveSponsor(null)} />
      )}
    </div>
  );
}
