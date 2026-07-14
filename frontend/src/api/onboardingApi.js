import api from "./axiosInstance.js";
export const onboardingApi = {
  status: () => api.get("/onboarding/status").then((res) => res.data.data),
  createGoal: (payload) =>
    api.post("/onboarding/goal", payload).then((res) => res.data.data),
  savePreferences: (payload) =>
    api.post("/onboarding/preferences", payload).then((res) => res.data.data),
  skipAssessment: (payload) =>
    api
      .post("/onboarding/assessment/skip", payload)
      .then((res) => res.data.data),
};
