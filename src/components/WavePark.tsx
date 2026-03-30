import { useState, useEffect, useRef } from "react";
import { addDays, format, isToday, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronDown, ChevronUp, Users, BookOpen } from "lucide-react";
import { fetchSessions, Session, WAVE_TAG_LEGEND, WaveTag } from "@/lib/mock-data";

const difficultyColor: Record<string, string> = {
  초급: "bg-emerald-light text-emerald",
  중급: "bg-ocean-light text-ocean",
  상급: "bg-danger-light text-danger",
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
        <div className="flex gap-1">
          {session.waveTags.map((tag) => (
            <span key={tag} className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono font-medium text-muted-foreground">
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
  const today = new Date();
  const dates = Array.from({ length: 15 }, (_, i) => addDays(today, i - 7));
  const [selectedDate, setSelectedDate] = useState(today);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [legendOpen, setLegendOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions(selectedDate).then(setSessions);
  }, [selectedDate]);

  useEffect(() => {
    if (scrollRef.current) {
      const active = scrollRef.current.querySelector("[data-active='true']") as HTMLElement;
      if (active) {
        active.scrollIntoView({ inline: "center", block: "nearest", behavior: "instant" });
      }
    }
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {/* Date chips */}
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto hide-scrollbar py-1 -mx-4 px-4">
        {dates.map((d) => {
          const active = isSameDay(d, selectedDate);
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

      {/* Wave tag legend */}
      <button
        onClick={() => setLegendOpen(!legendOpen)}
        className="flex items-center gap-1 text-xs text-muted-foreground self-start"
      >
        파도 타입 범례
        {legendOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {legendOpen && (
        <div className="bg-card rounded-2xl p-3 border border-border grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
          {(Object.entries(WAVE_TAG_LEGEND) as [WaveTag, string][]).map(([tag, desc]) => (
            <div key={tag} className="flex items-center gap-1.5">
              <span className="font-mono font-semibold text-foreground">{tag}</span>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      )}

      {/* Session cards */}
      <div className="flex flex-col gap-3">
        {sessions.map((s) => (
          <SessionCard key={s.id} session={s} />
        ))}
      </div>
    </div>
  );
}
