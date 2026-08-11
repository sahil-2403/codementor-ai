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

  actionRef.current = action;
  successRef.current = onSuccess;
  errorRef.current = onError;

  const execute = useCallback(async (variables, callbacks = {}) => {
    setIsPending(true);
    setError(null);

    try {
      const result = await actionRef.current(variables);
      setData(result);
      if (refresh) refreshData();
      await successRef.current?.(result, variables);
      await callbacks.onSuccess?.(result, variables);
      return result;
    } catch (actionError) {
      setError(actionError);
      await errorRef.current?.(actionError, variables);
      await callbacks.onError?.(actionError, variables);
      throw actionError;
    } finally {
      setIsPending(false);
      await callbacks.onSettled?.();
    }
  }, [refresh, refreshData]);

  const mutate = useCallback((variables, callbacks = {}) => {
    void execute(variables, callbacks).catch(() => {});
  }, [execute]);

  const reset = useCallback(() => {
    setData(undefined);
    setError(null);
    setIsPending(false);
  }, []);

  return { data, error, isPending, mutate, mutateAsync: execute, reset };
}
