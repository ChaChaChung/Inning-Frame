import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { TicketRecord, UserStats, TeamId } from '../types';

const TICKETS_COL = 'tickets';
const USERS_COL = 'users';

// 取得使用者 profile
export async function getUserProfile(userId: string): Promise<{ favoriteTeam?: TeamId; nickname?: string } | null> {
  const snap = await getDoc(doc(db, USERS_COL, userId));
  if (!snap.exists()) return null;
  return snap.data() as { favoriteTeam?: TeamId; nickname?: string };
}

// 設定最愛球隊
export async function setFavoriteTeam(userId: string, teamId: TeamId): Promise<void> {
  await setDoc(doc(db, USERS_COL, userId), { favoriteTeam: teamId }, { merge: true });
}

// 設定暱稱
export async function setNickname(userId: string, nickname: string): Promise<void> {
  await setDoc(doc(db, USERS_COL, userId), { nickname }, { merge: true });
}

// 移除物件中所有 undefined 欄位（Firestore 不接受 undefined）
function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  );
}

// 新增票根
export async function addTicket(ticket: Omit<TicketRecord, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, TICKETS_COL), stripUndefined({
    ...ticket,
    createdAt: Timestamp.now().toDate().toISOString(),
  } as Record<string, unknown>));
  return docRef.id;
}

// 取得使用者所有票根
export async function getUserTickets(userId: string): Promise<TicketRecord[]> {
  const q = query(
    collection(db, TICKETS_COL),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const tickets = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as TicketRecord));
  // 在 app 端依日期降序排列，不需要 Firestore 複合索引
  return tickets.sort((a, b) => b.date.localeCompare(a.date));
}

// 更新票根
export async function updateTicket(id: string, data: Partial<TicketRecord>): Promise<void> {
  await updateDoc(doc(db, TICKETS_COL, id), data as Record<string, unknown>);
}

// 刪除票根
export async function deleteTicket(id: string): Promise<void> {
  await deleteDoc(doc(db, TICKETS_COL, id));
}

// 計算個人統計
export function computeStats(tickets: TicketRecord[]): UserStats {
  const stats: UserStats = {
    totalGames: tickets.length,
    wins: 0,
    losses: 0,
    ties: 0,
    totalSpent: 0,
    teamCount: {} as Record<TeamId, number>,
    stadiumCount: {},
    monthlyCount: {},
  };

  for (const t of tickets) {
    if (t.result === 'win') stats.wins++;
    else if (t.result === 'lose') stats.losses++;
    else if (t.result === 'tie') stats.ties++;

    stats.totalSpent += (t.ticketPrice ?? 0) + (t.otherExpenses ?? 0);

    const team = t.supportTeam;
    stats.teamCount[team] = (stats.teamCount[team] ?? 0) + 1;

    stats.stadiumCount[t.stadium] = (stats.stadiumCount[t.stadium] ?? 0) + 1;

    const month = t.date.slice(0, 7); // "YYYY-MM"
    stats.monthlyCount[month] = (stats.monthlyCount[month] ?? 0) + 1;
  }

  return stats;
}
