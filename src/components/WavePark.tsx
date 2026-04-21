import { useState, useEffect, useRef } from "react";
import { format, isToday, isSameDay, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { Users, BookOpen, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchSessions, fetchAvailableDates, fetchLastUpdated, Session, WaveTag } from "@/lib/mock-data";

// 난이도별 배지 색상
const difficultyColor: Record<string, string> = {
  초급: "bg-ocean-light text-ocean",
  중급: "bg-yellow-light text-yellow",
  상급: "bg-danger-light text-danger",
};

const waveTagStyle: Record<WaveTag, string> = {
  M1: "bg-sky-50   border border-sky-200  text-sky-500",
  M2: "bg-sky-100  border border-sky-300  text-sky-600",
  M3: "bg-blue-100 border border-blue-300 text-blue-600",
  M4: "bg-blue-200 border border-blue-400 text-blue-700",
  T1: "bg-orange-50  border border-orange-200 text-orange-500",
  T2: "bg-orange-100 border border-orange-300 text-orange-600",
  T6: "bg-orange-200 border border-orange-400 text-orange-700",
};

interface WaveParkProps {
  onDateChange?: (date: Date) => void;
}

function addOneHour(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function mergeAndFilterSessions(raw: Session[]): Session[] {
  const lessonSessions = raw.filter((s) => s.lesson !== undefined);
  const freeSurfs      = raw.filter((s) => s.lesson === undefined);

  return freeSurfs.map((session) => {
    if (session.difficulty !== "초급") return session;

    const mergeLesson = lessonSessions.find(
      (l) => addOneHour(l.time) === session.time
    );
    if (!mergeLesson?.lesson) return session;

    return {
      ...session,
      lesson: mergeLesson.lesson,
      leftCove: {
        remaining: mergeLesson.lesson.remaining,
        capacity:  mergeLesson.lesson.capacity,
      },
    };
  });
}

function StatusBadge({ remaining, capacity }: { remaining: number; capacity: number }) {
  if (remaining === 0) return <span className="text-base font-bold text-danger">마감</span>;
  return (
    <span className="text-base font-bold">
      <span className="text-foreground">{remaining}</span>
      <span className="text-muted-foreground font-normal text-sm">/{capacity}</span>
    </span>
  );
}

function CoveBar({ label, remaining, capacity }: { label: string; remaining: number; capacity: number }) {
  const pct      = capacity > 0 ? ((capacity - remaining) / capacity) * 100 : 0;
  const barColor = remaining === 0 ? "bg-danger" : "bg-primary";
  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <StatusBadge remaining={remaining} capacity={capacity} />
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LessonCoveBar({ lesson }: { lesson: NonNullable<Session["lesson"]> }) {
  const pct = lesson.capacity > 0
    ? ((lesson.capacity - lesson.remaining) / lesson.capacity) * 100
    : 0;
  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <BookOpen className="w-3 h-3 text-emerald" />
          <span className="text-xs text-emerald font-medium">라인업레슨</span>
        </div>
        <StatusBadge remaining={lesson.remaining} capacity={lesson.capacity} />
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all bg-emerald"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SessionCard({ session }: { session: Session }) {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-foreground">{session.time}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${difficultyColor[session.difficulty] ?? ""}`}>
            {session.difficulty}
          </span>
        </div>
        <div className="flex gap-1 flex-wrap justify-end">
          {session.waveTags.map((tag) => (
            <span
              key={tag}
              className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold tracking-wide ${waveTagStyle[tag]}`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Users className="w-4 h-4 text-muted-foreground shrink-0" />
        {session.lesson ? (
          <>
            <LessonCoveBar lesson={session.lesson} />
            <CoveBar label="우코브" remaining={session.rightCove.remaining} capacity={session.rightCove.capacity} />
          </>
        ) : (
          <>
            <CoveBar label="좌코브" remaining={session.leftCove.remaining} capacity={session.leftCove.capacity} />
            <CoveBar label="우코브" remaining={session.rightCove.remaining} capacity={session.rightCove.capacity} />
          </>
        )}
      </div>
    </div>
  );
}

function SessionSkeleton() {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-12 bg-muted rounded" />
          <div className="h-5 w-10 bg-muted rounded-full" />
        </div>
        <div className="flex gap-1">
          <div className="h-5 w-8 bg-muted rounded-md" />
          <div className="h-5 w-8 bg-muted rounded-md" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 bg-muted rounded shrink-0" />
        <div className="flex-1 space-y-1">
          <div className="flex justify-between">
            <div className="h-3 w-10 bg-muted rounded" />
            <div className="h-3 w-8 bg-muted rounded" />
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex justify-between">
            <div className="h-3 w-10 bg-muted rounded" />
            <div className="h-3 w-8 bg-muted rounded" />
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full" />
        </div>
      </div>
    </div>
  );
}

// 마지막 세션(17:00) + 2시간 = 19:00 이후엔 오늘 숨김, 과거 날짜도 숨김
const LAST_SESSION_HOUR = 17;
const HIDE_AFTER_OFFSET = 2; // hours

function getVisibleDates(dates: Date[]): Date[] {
  const now      = new Date();
  const todayStr = format(now, "yyyy-MM-dd");

  const cutoff = new Date(now);
  cutoff.setHours(LAST_SESSION_HOUR + HIDE_AFTER_OFFSET, 0, 0, 0);
  const todayExpired = now >= cutoff;

  return dates.filter((d) => {
    const dStr = format(d, "yyyy-MM-dd");
    if (dStr < todayStr) return false;
    if (dStr === todayStr && todayExpired) return false;
    return true;
  });
}

export default function WavePark({ onDateChange }: WaveParkProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 데이터 있는 날짜 목록 — 새로고침 전까지 캐시 유지
  const { data: rawDates = [] } = useQuery({
    queryKey: ["availableDates"],
    queryFn: async () => {
      const dateStrs = await fetchAvailableDates();
      return dateStrs.map((s) => parseISO(s));
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // 과거 날짜 및 당일 마감 후 필터링
  const availableDates = getVisibleDates(rawDates);

  // 초기 날짜 설정
  useEffect(() => {
    if (availableDates.length === 0 || selectedDate) return;
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const initial  = availableDates.find((d) => format(d, "yyyy-MM-dd") === todayStr)
      ?? availableDates[0];
    if (initial) {
      setSelectedDate(initial);
      onDateChange?.(initial);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableDates]);

  const dateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;

  // 세션 — 날짜별 캐시 유지
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["sessions", dateKey],
    queryFn: async () => {
      const raw = await fetchSessions(selectedDate!);
      return mergeAndFilterSessions(raw);
    },
    enabled: !!selectedDate,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // 갱신시각 — 5분마다 자동 재조회 (스크래퍼 갱신 주기와 동기화)
  const { data: lastUpdated } = useQuery({
    queryKey: ["lastUpdated", dateKey],
    queryFn: () => fetchLastUpdated(selectedDate!),
    enabled: !!selectedDate,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const handleDateSelect = (d: Date) => {
    setSelectedDate(d);
    onDateChange?.(d);
  };

  // 선택 날짜로 스크롤
  useEffect(() => {
    if (!scrollRef.current || !selectedDate) return;
    const active = scrollRef.current.querySelector("[data-active='true']") as HTMLElement;
    if (active) active.scrollIntoView({ inline: "center", block: "nearest", behavior: "instant" });
  }, [availableDates, selectedDate]);

  const updatedLabel = lastUpdated
    ? format(new Date(lastUpdated), "M/d HH:mm", { locale: ko })
    : null;

  if (availableDates.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
        날짜 정보를 불러오는 중...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 날짜 chips */}
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto hide-scrollbar py-1 -mx-4 px-4">
        {availableDates.map((d) => {
          const active    = selectedDate ? isSameDay(d, selectedDate) : false;
          const todayChip = isToday(d);
          return (
            <button
              key={d.toISOString()}
              data-active={active}
              onClick={() => handleDateSelect(d)}
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

      {/* 선택 날짜 + 마지막 갱신시각 */}
      <div className="flex items-center justify-between px-1">
        {/* 선택된 날짜 */}
        <div className="flex flex-col leading-tight">
          {selectedDate && (
            <>
              <span className="text-sm font-bold text-foreground">
                {format(selectedDate, "M월 d일 (EEE)", { locale: ko })}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {format(selectedDate, "yyyy")}
              </span>
            </>
          )}
        </div>
        {/* 갱신 시각 */}
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
          <RefreshCw className="w-3 h-3" />
          {updatedLabel
            ? <span>갱신 {updatedLabel}</span>
            : <span className="animate-pulse">불러오는 중...</span>
          }
        </div>
      </div>

      {/* Session cards */}
      <div className="flex flex-col gap-3">
        {sessionsLoading ? (
          // 로딩 스켈레톤
          Array.from({ length: 4 }).map((_, i) => <SessionSkeleton key={i} />)
        ) : sessions.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            세션 정보가 없습니다
          </div>
        ) : (
          sessions.map((s) => <SessionCard key={s.id} session={s} />)
        )}
      </div>
    </div>
  );
}
