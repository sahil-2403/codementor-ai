import { useQuery } from '@tanstack/react-query';
import { roadmapApi } from '../api/roadmapApi.js';
import { queryKeys } from '../constants/queryKeys.js';
export const useRoadmap = () => useQuery({ queryKey: queryKeys.roadmap, queryFn: roadmapApi.current, staleTime: 1000 * 60 });
