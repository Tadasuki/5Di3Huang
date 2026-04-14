import { useState, useEffect } from 'react';

const leaderFiles = import.meta.glob('/data/leaders/**/*.json', { eager: true });

/**
 * Hook to get a single leader by ID
 */
export function useLeader(id) {
  const [state, setState] = useState({ leader: null, loading: true });

  useEffect(() => {
    if (!id) {
      setState({ leader: null, loading: false });
      return;
    }

    // Search through all loaded leader files
    const match = Object.values(leaderFiles).find(module => {
      const data = module.default || module;
      return data.id === id;
    });

    if (match) {
      setState({ leader: match.default || match, loading: false });
    } else {
      setState({ leader: null, loading: false });
    }
  }, [id]);

  return state;
}
