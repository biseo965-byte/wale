import { addDays, format, startOfDay } from "date-fns";
import { supabase } from "./supabase";

// ── 타입 ──────────────────────────────────────────────────────────────

export type WaveTag = "M1" | "M2" | "M3" | "M4" | "T1" | "T2" | "T6";
export type Difficulty = "초급" | "중급" | "상급";

export interface LessonBlock {
  remaining: number;
  capacity: number;
  cove: "left" | "right" | null;
}

export interface Session {
  id: string;
  time: string;
  difficulty: Difficulty;
  waveTags: WaveTag[];
  leftCove: { remaining: number; capacity: number };
  rightCove: { remaining: number; capacity: number };
  lesson?: LessonBlock;
}

export interface ForecastPoint {
  time: string;
  height: number;
}

export interface SpotCondition {
  status: "좋음" | "보통" | "나쁨";
  bestTime: string;
  waveHeight: number;
  wavePeriod: number;
  windSpeed: number;
  windDirection: string;
  waterTemp: number;
}

export interface SpotForecast {
  condition: SpotCondition;
  forecast: ForecastPoint[];
}

// ── wave 스케줄 (wavepark_seasons.json 과 동기화) ─────────────────────
// 시즌 스케줄 변경 시 wavepark_seasons.json 과 함께 수정

const WAVE_SCHEDULE: Record<"weekday" | "weekend", Record<string, WaveTag[]>> = {
  weekday: {
    "09:00": ["M1", "M2"],
    "10:00": ["M2", "M3"],
    "11:00": ["M3", "T1"],
    "12:00": ["M1", "M2"],
    "13:00": ["M3", "M4"],
    "14:00": ["M4", "T2"],
    "15:00": ["T1", "T2"],
    "16:00": ["M3", "T6"],
    "17:00": ["T2", "T6"],
  },
  weekend: {
    "09:00": ["M2", "M3"],
    "10:00": ["M3", "M4"],
    "11:00": ["M4", "T1"],
    "12:00": ["M2", "M3"],
    "13:00": ["M4", "T2"],
    "14:00": ["T1", "T2"],
    "15:00": ["T2", "T6"],
    "16:00": ["M3", "T6"],
    "17:00": ["T1", "T6"],
  },
};

function getWaveTags(dateStr: string, time: string): WaveTag[] {
  const dow = new Date(dateStr).getDay(); // 0=일, 6=토
  const dayType = dow === 0 || dow === 6 ? "weekend" : "weekday";
  return WAVE_SCHEDULE[dayType][time] ?? [];
}

// ── mock 데이터 생성 ──────────────────────────────────────────────────

const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
];

const DIFFICULTIES: { name: Difficulty; capacity: number }[] = [
  { name: "초급", capacity: 25 },
  { name: "중급", capacity: 25 },
  { name: "상급", capacity: 17 },
];

const windDirs = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateSessions(dateStr: string): Session[] {
  const seed = dateStr.split("-").reduce((a, b) => a + parseInt(b), 0);
  const rand = seededRandom(seed);
  const sessions: Session[] = [];

  for (const time of TIME_SLOTS) {
    const tags = getWaveTags(dateStr, time);

    for (const { name, capacity } of DIFFICULTIES) {
      const leftRemaining  = Math.floor(rand() * (capacity + 1));
      const rightRemaining = Math.floor(rand() * (capacity + 1));

      // 초급 세션에 레슨 블록 (30% 확률)
      let lesson: LessonBlock | undefined;
      if (name === "초급" && rand() < 0.3) {
        const coveOptions: (null | "left" | "right")[] = [null, "left", "right"];
        lesson = {
          remaining: Math.floor(rand() * 15),
          capacity: 15,
          cove: coveOptions[Math.floor(rand() * 3)],
        };
      }

      sessions.push({
        id:         `${dateStr}-${time}-${name}`,
        time,
        difficulty: name,
        waveTags:   tags,
        leftCove:   { remaining: leftRemaining,  capacity },
        rightCove:  { remaining: rightRemaining, capacity },
        lesson,
      });
    }
  }

  return sessions;
}

function generateForecast(spotId: string): SpotForecast {
  const seed = spotId.length * 31 + spotId.charCodeAt(0);
  const rand = seededRandom(seed);

  const statuses: SpotCondition["status"][] = ["좋음", "보통", "나쁨"];
  const bestHour = 6 + Math.floor(rand() * 12);

  const condition: SpotCondition = {
    status:         statuses[Math.floor(rand() * 3)],
    bestTime:       `${bestHour}:00 ~ ${bestHour + 2}:00`,
    waveHeight:     Math.round((0.3 + rand() * 2.5) * 10) / 10,
    wavePeriod:     Math.round((5   + rand() * 10)  * 10) / 10,
    windSpeed:      Math.round((1   + rand() * 15)  * 10) / 10,
    windDirection:  windDirs[Math.floor(rand() * windDirs.length)],
    waterTemp:      Math.round((14  + rand() * 12)  * 10) / 10,
  };

  const forecast: ForecastPoint[] = [];
  const now = startOfDay(new Date());
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h += 6) {
      forecast.push({
        time:   `${format(addDays(now, d), "MM/dd")} ${String(h).padStart(2, "0")}시`,
        height: Math.round((0.2 + rand() * 2.8) * 10) / 10,
      });
    }
  }

  return { condition, forecast };
}

// ── Supabase row → Session 변환 ───────────────────────────────────────

// 난이도별 코브당 고정 최대 정원
const COVE_CAPACITY: Record<string, number> = {
  초급: 25,
  중급: 25,
  상급: 17,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSession(row: any): Session {
  const coveCap = COVE_CAPACITY[row.difficulty as string] ?? (row.left_capacity ?? 25);
  return {
    id:         `${row.pick_datetime}-${row.item_idx}`,
    time:       row.time as string,
    difficulty: row.difficulty as Difficulty,
    waveTags:   (row.wave_tags ?? []) as WaveTag[],
    leftCove:   { remaining: row.left_remaining  ?? 0, capacity: coveCap },
    rightCove:  { remaining: row.right_remaining ?? 0, capacity: coveCap },
    lesson: row.sec_type === "70"
      ? {
          remaining: row.lesson_remaining ?? 0,
          capacity:  row.lesson_capacity  ?? 0,
          cove: row.lesson_cove_side === "좌측" ? "left"
              : row.lesson_cove_side === "우측" ? "right"
              : null,
        }
      : undefined,
  };
}

// ── 공개 API ─────────────────────────────────────────────────────────

/**
 * 세션 조회
 * - Supabase 환경변수 설정 시: DB에서 실데이터
 * - 미설정 시: mock 데이터 (로컬 개발 / Vercel 테스트 배포)
 */
export async function fetchSessions(date: Date): Promise<Session[]> {
  const dateStr = format(date, "yyyy-MM-dd");

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("pick_date", dateStr)
        .order("pick_datetime");

      if (!error && data && data.length > 0) {
        return data.map(rowToSession);
      }
    } catch {
      // Supabase 실패 시 mock으로 fallback
    }
  }

  return generateSessions(dateStr);
}

/**
 * 서핑스팟 예보 조회 (현재 mock 전용)
 */
export function fetchForecast(spotId: string): Promise<SpotForecast> {
  return Promise.resolve(generateForecast(spotId));
}

/**
 * 선택 날짜의 마지막 스크래핑 시각 조회 (ISO string)
 * - Supabase: sessions.scraped_at MAX 값
 * - mock: 현재 시각
 */
export async function fetchLastUpdated(date: Date): Promise<string> {
  const dateStr = format(date, "yyyy-MM-dd");

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("scraped_at")
        .eq("pick_date", dateStr)
        .order("scraped_at", { ascending: false })
        .limit(1)
        .single();

      if (!error && data?.scraped_at) {
        return data.scraped_at as string;
      }
    } catch {
      // fallback to mock
    }
  }

  return new Date().toISOString();
}

/**
 * 데이터가 존재하는 날짜 목록 조회 ("yyyy-MM-dd" 배열)
 * - Supabase: zone_slots 테이블의 distinct pick_date
 * - mock: 오늘부터 14일
 */
export async function fetchAvailableDates(): Promise<string[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("zone_slots")
        .select("pick_date")
        .order("pick_date");

      if (!error && data && data.length > 0) {
        return [...new Set(data.map((r) => r.pick_date as string))];
      }
    } catch {
      // fallback to mock
    }
  }

  // mock: 오늘부터 14일
  return Array.from({ length: 15 }, (_, i) =>
    format(addDays(new Date(), i), "yyyy-MM-dd")
  );
}

// ── 상수 ─────────────────────────────────────────────────────────────

export const SPOTS = [
  "죽도", "인구", "기사문", "송정", "다대포",
  "중문", "이호테우", "만리포", "몽산포", "봉포",
] as const;

export const WAVE_TAG_LEGEND: Record<WaveTag, string> = {
  M1: "머신1 (약한 파도)",
  M2: "머신2 (중간 파도)",
  M3: "머신3 (강한 파도)",
  M4: "머신4 (최강 파도)",
  T1: "튜브1 (약한 튜브)",
  T2: "튜브2 (중간 튜브)",
  T6: "튜브6 (강한 튜브)",
};
