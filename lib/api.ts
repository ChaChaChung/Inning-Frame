import { Game } from '../types';

// 後端 API URL（Cloud Run 部署後填入）
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchSchedule(year: number, month: number): Promise<Game[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/schedule?year=${year}&month=${month}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('fetchSchedule error:', error);
    return [];
  }
}

export async function fetchGameDetail(gameId: string): Promise<Game | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/game/${gameId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('fetchGameDetail error:', error);
    return null;
  }
}
