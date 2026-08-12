import { useCallback, useRef, useState } from 'react';
import { useDataRefresh } from '../context/DataRefreshContext.jsx';

export function useAsyncAction(action, { refresh = true, onSuccess, onError } = {}) {
  const { refreshData } = useDataRefresh();
  const actionRef = useRef(action);
  const successRef = useRef(onSuccess);
  const errorRef = useRef(onError);
  const [data, setData] = useState(undefined);
  const [error, setError] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const [variables, setVariables] = useState(undefined);

  actionRef.current = action;
  successRef.current = onSuccess;
  errorRef.current = onError;

  const execute = useCallback(async (nextVariables, callbacks = {}) => {
    setVariables(nextVariables);
    setIsPending(true);
    setError(null);

    try {
      const result = await actionRef.current(nextVariables);
      setData(result);
      if (refresh) refreshData();
      await successRef.current?.(result, nextVariables);
      await callbacks.onSuccess?.(result, nextVariables);
      return result;
    } catch (actionError) {
      setError(actionError);
      await errorRef.current?.(actionError, nextVariables);
      await callbacks.onError?.(actionError, nextVariables);
      throw actionError;
    } finally {
      setIsPending(false);
      await callbacks.onSettled?.();
    }
  }, [refresh, refreshData]);

  const mutate = useCallback((nextVariables, callbacks = {}) => {
    void execute(nextVariables, callbacks).catch(() => {});
  }, [execute]);

  const reset = useCallback(() => {
    setData(undefined);
    setError(null);
    setIsPending(false);
    setVariables(undefined);
  }, []);

  return { data, error, isPending, variables, mutate, mutateAsync: execute, reset };
}
