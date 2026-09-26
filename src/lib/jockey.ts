export type JockeyBrief = {
  name: string;
  weight: number;
  winRate: number;
  tier: string;
};

export function formatJockey(j: JockeyBrief) {
  return `기수 ${j.name} · ${j.weight}kg · 승률 ${j.winRate}% · ${j.tier}`;
}
