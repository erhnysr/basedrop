export type View = "home" | "create" | "claim" | "explore" | "profile";

export interface LeaderboardEntry {
  address: string;
  total: number;
}
