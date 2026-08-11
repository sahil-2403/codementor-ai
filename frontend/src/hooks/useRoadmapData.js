import { roadmapApi } from '../api/roadmapApi.js';
import { useAsyncData } from './useAsyncData.js';

export const useRoadmap = () => useAsyncData(roadmapApi.current);
