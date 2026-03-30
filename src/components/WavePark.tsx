import { useState, useEffect, useRef } from "react";
import { format, isToday, isSameDay, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { Users, BookOpen } from "lucide-react";
import { fetchSessions, fetchAvailableDates, Session, WaveTag } from "@/lib/mock-data";

// 난이도별 배지 색상: 초급=파랑, 중급=노랑, 상급=빨강
const difficultyColor: Record<string, string> = {
  초급: "bg-ocean-light text-ocean",
  중급: "bg-yellow-light text-yellow",
  상급: "bg-danger-light text-danger",
};

// wave tag 색상: M(머신)=파랑 계열, T(튜브)=주황 계열, 숫자가 클수록 진함
const waveTagStyle: Record<WaveTag, string> = {
  M1: "bg-sky-50   border border-sky-200  text-sky-500",
  M2: "bg-sky-100  border border-sky-300  text-sky-600",
  M3: "bg-blue-100 border border-blue-300 text-blue-600",
  M4: "bg-blue-200 border border-blue-400 text-blue-700",
  T1: "bg-orange-50  border border-orange-200 text-orange-500",
  T2: "bg-orange-100 border border-orange-300 text-orange-600",
  T6: "bg-orange-200 border border-orange-400 text-orange-700",
};

function StatusBadge({ remaining, capacity }: { remaining: number; capacity: number }) {
  if (remaining === 0) return <span className="text-xs font-semibold text-danger">마감</span>;
  if (remaining <= 5) return <span className="text-xs font-semibold text-warning">마감임박</span>;
  return <span className="text-xs text-muted-foreground">{remaining}/{capacity}</span>;
}

function CoveBar({ label, remaining, capacity }: { label: string; remaining: number; capacity: number }) {
  const pct = ((capacity - remaining) / capacity) * 100;
  const barColor = remaining === 0 ? "bg-danger" : remaining <= 5 ? "bg-warning" : "bg-primary";
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

function LessonInfo({ lesson }: { lesson: NonNullable<Session["lesson"]> }) {
  const coveText = lesson.cove
    ? `${lesson.cove === "left" ? "좌코브" : "우코브"} 진행`
    : "레슨 예정(코브 미정)";

  return (
    <div className="mt-2 p-2.5 rounded-xl bg-emerald-light/50 border border-emerald/20">
      <div className="flex items-center gap-1.5 mb-1">
        <BookOpen className="w-3.5 h-3.5 text-emerald" />
        <span className="text-xs font-semibold text-emerald">라인업 레슨</span>
      </div>
      <div className="flex items-center justify-between text-xs text-foreground">
        <span>{coveText}</span>
        <span className="text-muted-foreground">
          {lesson.remaining}/{lesson.capacity}명
          {lesson.cove && " · 실질 정원 10명"}
        </span>
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
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${difficultyColor[session.difficulty]}`}>
            {session.difficulty}
          </span>
        </div>
        <div className="flex gap-1 flex-wrap justify-end">
          {session.waveTags.map((tag) => (
            <span
              key={tag}
              className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono font-bold tracking-wide ${waveTagStyle[tag]}`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Users className="w-4 h-4 text-muted-foreground shrink-0" />
        <CoveBar label="좌코브" remaining={session.leftCove.remaining} capacity={session.leftCove.capacity} />
        <CoveBar label="우코브" remaining={session.rightCove.remaining} capacity={session.rightCove.capacity} />
      </div>

      {session.lesson && <LessonInfo lesson={session.lesson} />}
    </div>
  );
}

export default function WavePark() {
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 데이터 있는 날짜 로드
  useEffect(() => {
    fetchAvailableDates().then((dateStrs) => {
      const dates = dateStrs.map((s) => parseISO(s));
      setAvailableDates(dates);

      // 오늘이 목록에 있으면 오늘 선택, 없으면 첫 번째 날짜 선택
      const today = new Date();
      const todayStr = format(today, "yyyy-MM-dd");
      const initial = dateStrs.includes(todayStr) ? today : dates[0] ?? null;
      setSelectedDate(initial);
    });
  }, []);

  // 선택 날짜 변경 시 세션 로드
  useEffect(() => {
    if (!selectedDate) return;
    fetchSessions(selectedDate).then(setSessions);
  }, [selectedDate]);

  // 선택 날짜로 스크롤
  useEffect(() => {
    if (!scrollRef.current || !selectedDate) return;
    const active = scrollRef.current.querySelector("[data-active='true']") as HTMLElement;
    if (active) active.scrollIntoView({ inline: "center", block: "nearest", behavior: "instant" });
  }, [availableDates, selectedDate]);

  if (availableDates.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
        날짜 정보를 불러오는 중...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 데이터 있는 날짜 chips */}
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto hide-scrollbar py-1 -mx-4 px-4">
        {availableDates.map((d) => {
          const active    = selectedDate ? isSameDay(d, selectedDate) : false;
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

      {/* Session cards */}
      <div className="flex flex-col gap-3">
        {sessions.length === 0 && selectedDate ? (
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
