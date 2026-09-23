export type View = "home" | "create" | "claim" | "explore" | "profile" | "tip";

export interface LeaderboardEntry {
  address: string;
  total: number;
}
