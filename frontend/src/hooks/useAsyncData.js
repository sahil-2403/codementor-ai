import { useCallback, useEffect, useRef, useState } from 'react';
import { useDataRefresh } from '../context/DataRefreshContext.jsx';

export function useAsyncData(load, dependencies = [], { enabled = true } = {}) {
  const { version } = useDataRefresh();
  const loadRef = useRef(load);
  const requestRef = useRef(0);
  const [data, setData] = useState(undefined);
  const [error, setError] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  loadRef.current = load;

  const refetch = useCallback(async () => {
    if (!enabled) return undefined;
    const requestId = ++requestRef.current;
    setIsFetching(true);
    setError(null);

    try {
      const result = await loadRef.current();
      if (requestId === requestRef.current) setData(result);
      return result;
    } catch (requestError) {
      if (requestId === requestRef.current) setError(requestError);
      throw requestError;
    } finally {
      if (requestId === requestRef.current) setIsFetching(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setIsFetching(false);
      return undefined;
    }

    let active = true;
    const requestId = ++requestRef.current;
    setIsFetching(true);
    setError(null);

    Promise.resolve(loadRef.current())
      .then((result) => {
        if (active && requestId === requestRef.current) setData(result);
      })
      .catch((requestError) => {
        if (active && requestId === requestRef.current) setError(requestError);
      })
      .finally(() => {
        if (active && requestId === requestRef.current) setIsFetching(false);
      });

    return () => {
      active = false;
    };
  }, [enabled, version, ...dependencies]);

  return {
    data,
    error,
    isLoading: enabled && data === undefined && isFetching,
    isFetching,
    refetch,
    setData
  };
}
