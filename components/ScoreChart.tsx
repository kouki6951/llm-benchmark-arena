"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ScoreDatum {
  name: string;
  total: number;
}

const COLORS = ["#39FF14", "#2FB8FF", "#FF8A00", "#B388FF", "#FF3B30"];

/** モデル別総合点の棒グラフ（HUD配色） */
export function ScoreChart({ data }: { data: ScoreDatum[] }) {
  if (data.length === 0) {
    return (
      <div className="py-8 text-center">
        <span className="hud-label text-xs text-text-muted">NO SCORE DATA</span>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 16, left: -8, bottom: 4 }}>
        <CartesianGrid stroke="#1E2630" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: "#7C8A93", fontSize: 11 }}
          stroke="#2A333D"
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "#7C8A93", fontSize: 11 }}
          stroke="#2A333D"
        />
        <Tooltip
          cursor={{ fill: "rgba(57,255,20,0.06)" }}
          contentStyle={{
            background: "#12161C",
            border: "1px solid #2A333D",
            borderRadius: 0,
            color: "#E6F0E8",
            fontSize: 12,
          }}
        />
        <Bar dataKey="total" maxBarSize={56}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
