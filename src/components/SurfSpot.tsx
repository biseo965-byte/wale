import { useState, useEffect } from "react";
import { Waves, Wind, Thermometer, Clock, Droplets } from "lucide-react";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { fetchForecast, SPOTS, SpotForecast } from "@/lib/mock-data";

const statusStyles: Record<string, string> = {
  좋음: "bg-emerald-light text-emerald",
  보통: "bg-warning-light text-warning",
  나쁨: "bg-danger-light text-danger",
};

function DetailCard({ icon: Icon, label, value }: { icon: typeof Waves; label: string; value: string }) {
  return (
    <div className="bg-card rounded-2xl p-3.5 border border-border flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="w-4 h-4" />
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-lg font-bold text-foreground">{value}</span>
    </div>
  );
}

export default function SurfSpot() {
  const [spotId, setSpotId] = useState<string>(SPOTS[0]);
  const [data, setData] = useState<SpotForecast | null>(null);

  useEffect(() => {
    fetchForecast(spotId).then(setData);
  }, [spotId]);

  if (!data) return null;
  const { condition, forecast } = data;

  return (
    <div className="flex flex-col gap-4">
      {/* Spot selector */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 py-1">
        {SPOTS.map((spot) => (
          <button
            key={spot}
            onClick={() => setSpotId(spot)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              spot === spotId
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card text-muted-foreground border border-border hover:border-primary/30"
            }`}
          >
            {spot}
          </button>
        ))}
      </div>

      {/* Condition summary */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">오늘의 컨디션</h3>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusStyles[condition.status]}`}>
            {condition.status}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>최고 파도 시간대: <strong className="text-foreground">{condition.bestTime}</strong></span>
        </div>
      </div>

      {/* Area chart */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-3">7일 파도 높이 예보</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecast} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: "hsl(220, 10%, 50%)" }}
                interval={3}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(220, 10%, 50%)" }}
                axisLine={false}
                tickLine={false}
                unit="m"
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "0.75rem",
                  border: "1px solid hsl(220, 13%, 91%)",
                  fontSize: "12px",
                }}
                formatter={(val: number) => [`${val}m`, "파고"]}
              />
              <Area
                type="monotone"
                dataKey="height"
                stroke="hsl(199, 89%, 48%)"
                strokeWidth={2}
                fill="url(#waveGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-2 gap-3">
        <DetailCard icon={Waves} label="파고" value={`${condition.waveHeight}m`} />
        <DetailCard icon={Droplets} label="주기" value={`${condition.wavePeriod}s`} />
        <DetailCard icon={Wind} label="풍속 / 풍향" value={`${condition.windSpeed}m/s ${condition.windDirection}`} />
        <DetailCard icon={Thermometer} label="수온" value={`${condition.waterTemp}°C`} />
      </div>
    </div>
  );
}
