import { roadmapApi } from '../api/roadmapApi.js';
import { useAsyncData } from '../hooks/useAsyncData.js';

export const useRoadmap = () => useAsyncData(roadmapApi.current);
