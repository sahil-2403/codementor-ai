import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Loader from '../components/common/Loader.jsx';
import PublicLayout from '../layouts/PublicLayout.jsx';
import AppLayout from '../layouts/AppLayout.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import RoleRoute from './RoleRoute.jsx';
import OnboardingGuard from './OnboardingGuard.jsx';

const LandingPage = lazy(() => import('../pages/public/LandingPage.jsx'));
const LoginPage = lazy(() => import('../pages/public/LoginPage.jsx'));
const RegisterPage = lazy(() => import('../pages/public/RegisterPage.jsx'));
const VerifyEmailPage = lazy(() => import('../pages/public/VerifyEmailPage.jsx'));
const ForgotPasswordPage = lazy(() => import('../pages/public/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('../pages/public/ResetPasswordPage.jsx'));
const CatalogPage = lazy(() => import('../pages/onboarding/CatalogPage.jsx'));
const LevelPage = lazy(() => import('../pages/onboarding/LevelPage.jsx'));
const PreferencesPage = lazy(() => import('../pages/onboarding/PreferencesPage.jsx'));
const AssessmentIntroPage = lazy(() => import('../pages/onboarding/AssessmentIntroPage.jsx'));
const AssessmentPage = lazy(() => import('../pages/onboarding/AssessmentPage.jsx'));
const AssessmentReportPage = lazy(() => import('../pages/onboarding/AssessmentReportPage.jsx'));
const GeneratingPage = lazy(() => import('../pages/onboarding/GeneratingPage.jsx'));
const DashboardPage = lazy(() => import('../pages/learner/DashboardPage.jsx'));
const RoadmapPage = lazy(() => import('../pages/learner/RoadmapPage.jsx'));
const LessonPage = lazy(() => import('../pages/learner/LessonPage.jsx'));
const QuizPage = lazy(() => import('../pages/learner/QuizPage.jsx'));
const QuizResultPage = lazy(() => import('../pages/learner/QuizResultPage.jsx'));
const MentorPage = lazy(() => import('../pages/learner/MentorPage.jsx'));
const ProgressPage = lazy(() => import('../pages/learner/ProgressPage.jsx'));
const ReportsPage = lazy(() => import('../pages/learner/ReportsPage.jsx'));
const ProfilePage = lazy(() => import('../pages/learner/ProfilePage.jsx'));
const ProjectsPage = lazy(() => import('../pages/learner/ProjectsPage.jsx'));
const ProjectTaskPage = lazy(() => import('../pages/learner/ProjectTaskPage.jsx'));
const InterviewPage = lazy(() => import('../pages/learner/InterviewPage.jsx'));

const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage.jsx'));
const AdminCatalogPage = lazy(() => import('../pages/admin/AdminCatalogPage.jsx'));
const TechnologiesPage = lazy(() => import('../pages/admin/TechnologiesPage.jsx'));
const TechnologyEditorPage = lazy(() => import('../pages/admin/TechnologyEditorPage.jsx'));
const CoursesPage = lazy(() => import('../pages/admin/CoursesPage.jsx'));
const CourseEditorPage = lazy(() => import('../pages/admin/CourseEditorPage.jsx'));
const CourseWorkspacePage = lazy(() => import('../pages/admin/CourseWorkspacePage.jsx'));
const LearningPathsPage = lazy(() => import('../pages/admin/LearningPathsPage.jsx'));
const LearningPathEditorPage = lazy(() => import('../pages/admin/LearningPathEditorPage.jsx'));
const CourseTopicsPage = lazy(() => import('../pages/admin/CourseTopicsPage.jsx'));
const CourseTopicEditorPage = lazy(() => import('../pages/admin/CourseTopicEditorPage.jsx'));
const CourseLessonsPage = lazy(() => import('../pages/admin/CourseLessonsPage.jsx'));
const CourseLessonEditorPage = lazy(() => import('../pages/admin/CourseLessonEditorPage.jsx'));
const QuestionsPage = lazy(() => import('../pages/admin/QuestionsPage.jsx'));
const CourseQuestionBankPage = lazy(() => import('../pages/admin/CourseQuestionBankPage.jsx'));
const CourseQuestionEditorPage = lazy(() => import('../pages/admin/CourseQuestionEditorPage.jsx'));
const CourseInterviewQuestionsPage = lazy(() => import('../pages/admin/CourseInterviewQuestionsPage.jsx'));
const CourseInterviewQuestionEditorPage = lazy(() => import('../pages/admin/CourseInterviewQuestionEditorPage.jsx'));
const CourseProjectsPage = lazy(() => import('../pages/admin/CourseProjectsPage.jsx'));
const CourseProjectEditorPage = lazy(() => import('../pages/admin/CourseProjectEditorPage.jsx'));
const TemplatesPage = lazy(() => import('../pages/admin/TemplatesPage.jsx'));
const TemplateEditorPage = lazy(() => import('../pages/admin/TemplateEditorPage.jsx'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage.jsx'));

export default function AppRoutes() {
  return <Suspense fallback={<Loader label="Loading page..." />}>
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
            <Route path="/onboarding/catalog" element={<CatalogPage />} />
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
            <Route path="/admin/catalog" element={<AdminCatalogPage />} />

            <Route path="/admin/technologies" element={<TechnologiesPage />} />
            <Route path="/admin/technologies/new" element={<TechnologyEditorPage />} />
            <Route path="/admin/technologies/:technologyId/edit" element={<TechnologyEditorPage />} />

            <Route path="/admin/courses" element={<CoursesPage />} />
            <Route path="/admin/courses/new" element={<CourseEditorPage />} />
            <Route path="/admin/courses/:courseId/edit" element={<CourseEditorPage />} />
            <Route path="/admin/courses/:courseId/workspace" element={<CourseWorkspacePage />} />

            <Route path="/admin/learning-paths" element={<LearningPathsPage />} />
            <Route path="/admin/learning-paths/new" element={<LearningPathEditorPage />} />
            <Route path="/admin/learning-paths/:pathId/edit" element={<LearningPathEditorPage />} />

            <Route path="/admin/topics" element={<CourseTopicsPage />} />
            <Route path="/admin/topics/new" element={<CourseTopicEditorPage />} />
            <Route path="/admin/topics/:topicId/edit" element={<CourseTopicEditorPage />} />

            <Route path="/admin/lessons" element={<CourseLessonsPage />} />
            <Route path="/admin/lessons/new" element={<CourseLessonEditorPage />} />
            <Route path="/admin/lessons/:lessonId/edit" element={<CourseLessonEditorPage />} />

            <Route path="/admin/questions" element={<QuestionsPage />} />
            <Route path="/admin/questions/quiz" element={<CourseQuestionBankPage bank="quiz" />} />
            <Route path="/admin/questions/quiz/new" element={<CourseQuestionEditorPage bank="quiz" />} />
            <Route path="/admin/questions/quiz/:questionId/edit" element={<CourseQuestionEditorPage bank="quiz" />} />
            <Route path="/admin/questions/skill-checks" element={<CourseQuestionBankPage bank="skill_check" />} />
            <Route path="/admin/questions/skill-checks/new" element={<CourseQuestionEditorPage bank="skill_check" />} />
            <Route path="/admin/questions/skill-checks/:questionId/edit" element={<CourseQuestionEditorPage bank="skill_check" />} />
            <Route path="/admin/questions/interview" element={<CourseInterviewQuestionsPage />} />
            <Route path="/admin/questions/interview/new" element={<CourseInterviewQuestionEditorPage />} />
            <Route path="/admin/questions/interview/:questionId/edit" element={<CourseInterviewQuestionEditorPage />} />

            <Route path="/admin/project-tasks" element={<CourseProjectsPage />} />
            <Route path="/admin/project-tasks/new" element={<CourseProjectEditorPage />} />
            <Route path="/admin/project-tasks/:projectId/edit" element={<CourseProjectEditorPage />} />

            <Route path="/admin/templates" element={<TemplatesPage />} />
            <Route path="/admin/templates/new" element={<TemplateEditorPage />} />
            <Route path="/admin/templates/:templateId/edit" element={<TemplateEditorPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Suspense>;
}
