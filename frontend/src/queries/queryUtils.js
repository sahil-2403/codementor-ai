import { useMutation, useQueryClient } from '@tanstack/react-query';

export const invalidateMany = (queryClient, queryKeys) => {
  queryKeys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
};

export const removeMany = (queryClient, queryKeys) => {
  queryKeys.forEach((queryKey) => queryClient.removeQueries({ queryKey }));
};

export const useInvalidatingMutation = (mutationFn, queryKeys, options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    ...options,
    onSuccess: async (...args) => {
      await options.onSuccess?.(...args);
      invalidateMany(queryClient, queryKeys);
    }
  });
};
