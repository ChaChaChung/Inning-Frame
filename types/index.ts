// 球隊
export type TeamId =
  | 'brothers'    // 中信兄弟
  | 'lions'       // 統一獅
  | 'monkeys'     // 樂天桃猿
  | 'guardians'   // 富邦悍將
  | 'dragons'     // 味全龍
  | 'eagles';     // 台鋼雄鷹

// 賽程
export interface Game {
  id: string;
  date: string;          // ISO 格式 "2025-04-01"
  time: string;          // "18:05"
  homeTeam: TeamId;
  awayTeam: TeamId;
  stadium: string;       // 球場名稱
  homeScore?: number;
  awayScore?: number;
  status: 'scheduled' | 'live' | 'final' | 'postponed';
}

// 支出項目
export interface ExpenseItem {
  category: string;   // 'ticket' | 'food' | 'transport' | 'hotel' | 'other'
  label: string;      // 顯示用名稱
  amount: number;
}

// 票根記錄
export interface TicketRecord {
  id: string;
  userId: string;
  gameId?: string;
  date: string;
  homeTeam: TeamId;
  awayTeam: TeamId;
  stadium: string;
  seatSection: string;
  homeScore?: number;
  awayScore?: number;
  ticketPrice?: number;
  expenseItems?: ExpenseItem[];   // 詳細支出明細
  otherExpenses?: number;         // 支出明細總計（快速計算用）
  notes?: string;
  photoUrl?: string;              // base64 或遠端 URL
  supportTeam: TeamId;
  result?: 'win' | 'lose' | 'tie';
  createdAt: string;
}

// 使用者
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  favoriteTeam?: TeamId;
}

// 統計
export interface UserStats {
  totalGames: number;
  wins: number;
  losses: number;
  ties: number;
  totalSpent: number;
  teamCount: Record<TeamId, number>;
  stadiumCount: Record<string, number>;
  monthlyCount: Record<string, number>;
}
