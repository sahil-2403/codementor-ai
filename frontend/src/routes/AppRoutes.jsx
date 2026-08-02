import { Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout.jsx";
import AppLayout from "../layouts/AppLayout.jsx";
import AdminLayout from "../layouts/AdminLayout.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import RoleRoute from "./RoleRoute.jsx";
import OnboardingGuard from "./OnboardingGuard.jsx";

import LandingPage from "../pages/public/LandingPage.jsx";
import LoginPage from "../pages/public/LoginPage.jsx";
import RegisterPage from "../pages/public/RegisterPage.jsx";
import VerifyEmailPage from "../pages/public/VerifyEmailPage.jsx";
import ForgotPasswordPage from "../pages/public/ForgotPasswordPage.jsx";
import ResetPasswordPage from "../pages/public/ResetPasswordPage.jsx";
import GoalPage from "../pages/onboarding/GoalPage.jsx";
import LevelPage from "../pages/onboarding/LevelPage.jsx";
import PreferencesPage from "../pages/onboarding/PreferencesPage.jsx";
import AssessmentIntroPage from "../pages/onboarding/AssessmentIntroPage.jsx";
import AssessmentPage from "../pages/onboarding/AssessmentPage.jsx";
import AssessmentReportPage from "../pages/onboarding/AssessmentReportPage.jsx";
import GeneratingPage from "../pages/onboarding/GeneratingPage.jsx";
import DashboardPage from "../pages/learner/DashboardPage.jsx";
import RoadmapPage from "../pages/learner/RoadmapPage.jsx";
import LessonPage from "../pages/learner/LessonPage.jsx";
import QuizPage from "../pages/learner/QuizPage.jsx";
import QuizResultPage from "../pages/learner/QuizResultPage.jsx";
import MentorPage from "../pages/learner/MentorPage.jsx";
import ProgressPage from "../pages/learner/ProgressPage.jsx";
import ReportsPage from "../pages/learner/ReportsPage.jsx";
import ProfilePage from "../pages/learner/ProfilePage.jsx";
import ProjectsPage from "../pages/learner/ProjectsPage.jsx";
import ProjectTaskPage from "../pages/learner/ProjectTaskPage.jsx";
import InterviewPage from "../pages/learner/InterviewPage.jsx";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage.jsx";
import TopicsPage from "../pages/admin/TopicsPage.jsx";
import LessonsPage from "../pages/admin/LessonsPage.jsx";
import QuestionsPage from "../pages/admin/QuestionsPage.jsx";
import TemplatesPage from "../pages/admin/TemplatesPage.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route element={<OnboardingGuard mode="needs-onboarding" />}>
            <Route path="/onboarding/goal" element={<GoalPage />} />
            <Route path="/onboarding/level" element={<LevelPage />} />
            <Route path="/onboarding/preferences" element={<PreferencesPage />} />
            <Route path="/onboarding/assessment-intro" element={<AssessmentIntroPage />} />
            <Route path="/onboarding/assessment" element={<AssessmentPage />} />
            <Route path="/onboarding/assessment-report/:assessmentId" element={<AssessmentReportPage />} />
            <Route path="/onboarding/generating" element={<GeneratingPage />} />
          </Route>
          <Route element={<OnboardingGuard mode="needs-course" />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/lessons/:lessonId" element={<LessonPage />} />
            <Route path="/quizzes/:moduleId" element={<QuizPage />} />
            <Route path="/quizzes/result/:attemptId" element={<QuizResultPage />} />
            <Route path="/mentor" element={<MentorPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:taskId" element={<ProjectTaskPage />} />
            <Route path="/interview" element={<InterviewPage />} />
          </Route>
        </Route>

        <Route element={<RoleRoute role="admin" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/topics" element={<TopicsPage />} />
            <Route path="/admin/lessons" element={<LessonsPage />} />
            <Route path="/admin/questions" element={<QuestionsPage />} />
            <Route path="/admin/templates" element={<TemplatesPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
