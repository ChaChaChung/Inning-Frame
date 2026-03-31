import { useState, useEffect, useCallback } from 'react';
import { fetchSchedule } from '../lib/api';
import { Game, TeamId } from '../types';

export function useSchedule(year: number, month: number, filterTeam?: TeamId) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSchedule(year, month);
      setGames(data);
    } catch {
      setError('無法載入賽程，請稍後再試');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = filterTeam
    ? games.filter((g) => g.homeTeam === filterTeam || g.awayTeam === filterTeam)
    : games;

  return { games: filtered, loading, error, reload: load };
}
