import { useState, useEffect } from 'react';
import type { Level } from '../types/game.types';

const API_URL = import.meta.env.VITE_API_URL;

export function useLevels() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/levels`)
      .then((r) => r.json())
      .then((data) => {
        setLevels(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { levels, loading };
}