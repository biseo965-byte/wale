import { addDays, format, startOfDay } from "date-fns";

export type WaveTag = "M1" | "M2" | "M3" | "M4" | "T1" | "T2" | "T6";
export type Difficulty = "초급" | "중급" | "상급";

export interface LessonBlock {
  remaining: number;
  capacity: number;
  cove: "left" | "right" | null; // null = 미정
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

const waveTags: WaveTag[] = ["M1", "M2", "M3", "M4", "T1", "T2", "T6"];
const difficulties: Difficulty[] = ["초급", "중급", "상급"];
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

  const sessionCount = 8 + Math.floor(rand() * 3);
  const sessions: Session[] = [];
  const startHour = 8;

  for (let i = 0; i < sessionCount; i++) {
    const hour = startHour + i;
    const diff = difficulties[Math.floor(rand() * 3)];
    const capacity = diff === "상급" ? 17 : 25;
    const tagCount = 1 + Math.floor(rand() * 3);
    const tags: WaveTag[] = [];
    for (let t = 0; t < tagCount; t++) {
      const tag = waveTags[Math.floor(rand() * waveTags.length)];
      if (!tags.includes(tag)) tags.push(tag);
    }

    const leftRemaining = Math.floor(rand() * (capacity + 1));
    const rightRemaining = Math.floor(rand() * (capacity + 1));

    let lesson: LessonBlock | undefined;
    if (diff === "초급" && rand() < 0.35) {
      const lessonRemaining = Math.floor(rand() * 16);
      const coveOptions: (null | "left" | "right")[] = [null, "left", "right"];
      const cove = coveOptions[Math.floor(rand() * 3)];
      lesson = { remaining: lessonRemaining, capacity: 15, cove };
    }

    sessions.push({
      id: `${dateStr}-${i}`,
      time: `${hour.toString().padStart(2, "0")}:00`,
      difficulty: diff,
      waveTags: tags,
      leftCove: { remaining: leftRemaining, capacity },
      rightCove: { remaining: rightRemaining, capacity },
      lesson,
    });
  }

  return sessions;
}

function generateForecast(spotId: string): SpotForecast {
  const seed = spotId.length * 31 + spotId.charCodeAt(0);
  const rand = seededRandom(seed);

  const statuses: SpotCondition["status"][] = ["좋음", "보통", "나쁨"];
  const status = statuses[Math.floor(rand() * 3)];
  const bestHour = 6 + Math.floor(rand() * 12);

  const condition: SpotCondition = {
    status,
    bestTime: `${bestHour}:00 ~ ${bestHour + 2}:00`,
    waveHeight: Math.round((0.3 + rand() * 2.5) * 10) / 10,
    wavePeriod: Math.round((5 + rand() * 10) * 10) / 10,
    windSpeed: Math.round((1 + rand() * 15) * 10) / 10,
    windDirection: windDirs[Math.floor(rand() * windDirs.length)],
    waterTemp: Math.round((14 + rand() * 12) * 10) / 10,
  };

  const forecast: ForecastPoint[] = [];
  const now = startOfDay(new Date());
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h += 6) {
      const date = addDays(now, d);
      forecast.push({
        time: `${format(date, "MM/dd")} ${h.toString().padStart(2, "0")}시`,
        height: Math.round((0.2 + rand() * 2.8) * 10) / 10,
      });
    }
  }

  return { condition, forecast };
}

export function fetchSessions(date: Date): Promise<Session[]> {
  const dateStr = format(date, "yyyy-MM-dd");
  return Promise.resolve(generateSessions(dateStr));
}

export function fetchForecast(spotId: string): Promise<SpotForecast> {
  return Promise.resolve(generateForecast(spotId));
}

export const SPOTS = [
  "죽도", "인구", "기사문", "송정", "다대포", "중문", "이호테우", "만리포", "몽산포", "봉포",
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
