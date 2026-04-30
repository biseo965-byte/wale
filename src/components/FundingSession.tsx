import { useState } from "react";
import { format, parseISO, isSameDay, isToday } from "date-fns";
import { ko } from "date-fns/locale";
import { Users, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Difficulty } from "@/lib/mock-data";

// ── 상수 (DB에 없는 값) ───────────────────────────────────────────────

const CAPACITY_DEFAULT  = 60; // 초급/중급 정원
const CAPACITY_ADVANCED = 40; // 상급 정원
const TARGET_DEFAULT    = 18; // 초급/중급 달성 목표 (정원의 30%)
const TARGET_ADVANCED   = 12; // 상급 달성 목표 (정원의 30%)

// ── DB 타입 ───────────────────────────────────────────────────────────

interface FundingRow {
  id: string;
  pick_date: string;
  pick_datetime: string;
  item_idx: string;
  item_name: string;
  time: string;
  remaining: number;
  scraped_at: string;
}

// ── UI 타입 ───────────────────────────────────────────────────────────

type FundingStatus = "모집중" | "달성" | "마감";

interface FundingItem {
  id: string;
  title: string;
  date: string;
  time: string;
  difficulty: Difficulty;
  current: number;
  target: number;
  capacity: number;
  status: FundingStatus;
}

// ── 변환 함수 ─────────────────────────────────────────────────────────

function parseDifficulty(name: string): Difficulty {
  if (name.includes("초급")) return "초급";
  if (name.includes("상급")) return "상급";
  return "중급";
}

function parseTitle(name: string): string {
  return name.trim();
}

function deriveStatus(current: number, target: number, capacity: number): FundingStatus {
  if (current >= capacity) return "마감";
  if (current >= target)   return "달성";
  return "모집중";
}

function rowToItem(row: FundingRow): FundingItem {
  const difficulty = parseDifficulty(row.item_name);
  const capacity   = difficulty === "상급" ? CAPACITY_ADVANCED : CAPACITY_DEFAULT;
  const target     = difficulty === "상급" ? TARGET_ADVANCED   : TARGET_DEFAULT;
  const current    = capacity - row.remaining;
  return {
    id: row.id,
    title:      parseTitle(row.item_name),
    date:       row.pick_date,
    time:       row.time,
    difficulty,
    current,
    target,
    capacity,
    status:     deriveStatus(current, target, capacity),
  };
}

// ── fetch ─────────────────────────────────────────────────────────────

async function fetchFundingSessions(): Promise<FundingItem[]> {
  if (!supabase) return [];
  const today = format(new Date(), "yyyy-MM-dd");
  const { data, error } = await supabase
    .from("funding_sessions")
    .select("*")
    .gte("pick_date", today)
    .order("pick_date", { ascending: true })
    .order("time",      { ascending: true });
  if (error) throw error;
  return (data as FundingRow[]).map(rowToItem);
}

// ── 스타일 맵 ─────────────────────────────────────────────────────────

const difficultyColor: Record<Difficulty, string> = {
  초급: "bg-ocean-light text-ocean",
  중급: "bg-yellow-light text-yellow",
  상급: "bg-danger-light text-danger",
};

const statusStyle: Record<FundingStatus, string> = {
  모집중: "bg-ocean-light text-ocean",
  달성:   "bg-emerald-light text-emerald",
  마감:   "bg-danger-light text-danger",
};

// ── 서브 컴포넌트 ─────────────────────────────────────────────────────

function ParticipantsBar({ current, target, capacity }: { current: number; target: number; capacity: number }) {
  // progress max = 정원(capacity)
  const fillPct    = capacity > 0 ? Math.min((current / capacity) * 100, 100) : 0;
  const targetPct  = capacity > 0 ? (target / capacity) * 100 : 0;
  const remaining  = target - current;
  const isAchieved = remaining <= 0;
  const barColor   = isAchieved ? "bg-emerald" : "bg-primary";

  return (
    <div className="flex-1">
      {/* 상단: 인원 수 */}
      <div className="flex items-center justify-end mb-4">
        <span className="text-base font-bold">
          <span className="text-foreground">{current}</span>
          <span className="text-muted-foreground font-normal text-sm">/{capacity}명</span>
        </span>
      </div>

      {/* 프로그레스 바 + 목표 마커 */}
      <div className="relative">
        {/* 목표 마커 툴팁 */}
        <div
          className="absolute bottom-full mb-1.5 -translate-x-1/2 pointer-events-none"
          style={{ left: `${targetPct}%` }}
        >
          <div className="bg-foreground text-background text-xs font-bold px-2.5 py-1 rounded-lg whitespace-nowrap">
            {isAchieved ? "🎉 달성!" : `😢 달성까지 ${remaining}명!`}
          </div>
          {/* 말풍선 꼬리 */}
          <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-foreground mx-auto" />
        </div>

        {/* 바 */}
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${fillPct}%` }}
          />
        </div>

        {/* 목표 위치 세로선 */}
        <div
          className="absolute top-0 bottom-0 w-px bg-foreground/40"
          style={{ left: `${targetPct}%` }}
        />
      </div>
    </div>
  );
}

function FundingCard({ item }: { item: FundingItem }) {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
      {/* 헤더 행 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-foreground">{item.time}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${difficultyColor[item.difficulty]}`}>
            {item.difficulty}
          </span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyle[item.status]}`}>
          {item.status}
        </span>
      </div>

      {/* 제목 */}
      <p className="text-sm font-semibold text-foreground mb-3">{item.title}</p>

      {/* 참여 인원 progress */}
      <div className="flex items-center gap-3">
        <Users className="w-4 h-4 text-muted-foreground shrink-0" />
        <ParticipantsBar current={item.current} target={item.target} capacity={item.capacity} />
      </div>
    </div>
  );
}

function FundingCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-12 bg-muted rounded" />
          <div className="h-5 w-10 bg-muted rounded-full" />
        </div>
        <div className="h-5 w-10 bg-muted rounded-full" />
      </div>
      <div className="h-4 w-36 bg-muted rounded mb-3" />
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 bg-muted rounded shrink-0" />
        <div className="flex-1 space-y-1">
          <div className="flex justify-between">
            <div className="h-3 w-24 bg-muted rounded" />
            <div className="h-3 w-16 bg-muted rounded" />
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────

export default function FundingSession() {
  const { data: allItems = [], isLoading } = useQuery({
    queryKey: ["fundingSessions"],
    queryFn:  fetchFundingSessions,
    staleTime: 5 * 60 * 1000,
  });

  // 날짜 목록 추출
  const dates: Date[] = Array.from(
    new Map(allItems.map((item) => [item.date, parseISO(item.date)])).values()
  ).sort((a, b) => a.getTime() - b.getTime());

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const effectiveDate = selectedDate ?? dates[0] ?? null;

  const filtered = effectiveDate
    ? allItems.filter((item) => isSameDay(parseISO(item.date), effectiveDate))
    : [];

  return (
    <div className="flex flex-col gap-3">
      {/* 안내 배너 */}
      <div className="flex items-start gap-2 bg-ocean-light/60 border border-ocean/20 rounded-xl px-3 py-2.5">
        <Info className="w-3.5 h-3.5 text-ocean shrink-0 mt-0.5" />
        <p className="text-[11px] text-ocean leading-relaxed">
          이용일 <span className="font-bold">2일 전 16시</span> 기준 리프서핑 예약률이{" "}
          <span className="font-bold">30% 이상</span>일 시 세션이 오픈됩니다.
        </p>
      </div>

      {/* 날짜 chips */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar py-1 -mx-4 px-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shrink-0 w-12 h-14 bg-muted rounded-xl animate-pulse" />
            ))
          : dates.map((d) => {
              const active    = effectiveDate ? isSameDay(d, effectiveDate) : false;
              const todayChip = isToday(d);
              return (
                <button
                  key={d.toISOString()}
                  data-active={active}
                  onClick={() => setSelectedDate(d)}
                  className={`shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-card text-muted-foreground border border-border hover:border-primary/30"
                  }`}
                >
                  <span>{format(d, "EEE", { locale: ko })}</span>
                  <span className="text-sm font-bold">{format(d, "d")}</span>
                  {todayChip && <span className="w-1 h-1 rounded-full bg-current mt-0.5" />}
                </button>
              );
            })}
      </div>

      {/* 카드 목록 */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <FundingCardSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            해당 날짜의 세션이 없습니다
          </div>
        ) : (
          filtered.map((item) => <FundingCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}
