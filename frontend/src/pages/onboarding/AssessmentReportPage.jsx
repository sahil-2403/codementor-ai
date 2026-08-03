import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import { assessmentApi } from "../../api/assessmentApi.js";
import { roadmapApi } from "../../api/roadmapApi.js";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import Badge from "../../components/common/Badge.jsx";
import Loader from "../../components/common/Loader.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import OnboardingShell from "../../components/onboarding/OnboardingShell.jsx";
import OnboardingInsightCard from "../../components/onboarding/OnboardingInsightCard.jsx";
import { queryKeys } from "../../constants/queryKeys.js";

export default function AssessmentReportPage() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const isPersonalizeFlow = searchParams.get("personalize") === "true";
  const personalizeQuery = isPersonalizeFlow ? "?personalize=true" : "";

  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["assessment-report", assessmentId],
    queryFn: () => assessmentApi.report(assessmentId),
    enabled: Boolean(assessmentId),
  });

  const report = data?.report;

  const refreshLearningState = async (course = null) => {
    if (course) {
      queryClient.setQueryData(queryKeys.onboardingStatus, (old = {}) => ({
        ...old,
        hasActiveCourse: true,
        activeCourse: course,
      }));

      queryClient.setQueryData(queryKeys.roadmap, { course });
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.onboardingStatus }),
      queryClient.invalidateQueries({ queryKey: queryKeys.roadmap }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
    ]);
  };

  const generateRoadmap = async () => {
    if (creating) return;

    try {
      setCreating(true);
      setError("");

      const learningGoalId = report?.learningGoalId;

      if (!learningGoalId) {
        setError("Learning goal was not found. Please restart onboarding.");
        return;
      }

      const result = await roadmapApi.fromAssessment({
        learningGoalId,
        assessmentId,
        forceNewVersion: isPersonalizeFlow,
      });

      if (result?.mode === "queued" && result?.job?._id) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.onboardingStatus,
        });
        navigate(
          `/onboarding/generating?jobId=${result.job._id}${personalizeQuery ? "&personalize=true" : ""}`,
          {
            replace: true,
          },
        );
        return;
      }

      if (
        result?.course ||
        result?.mode === "existing" ||
        result?.mode === "sync"
      ) {
        await refreshLearningState(result?.course || null);
        navigate("/dashboard", { replace: true });
        return;
      }

      await refreshLearningState();
      navigate("/onboarding/generating", { replace: true });
    } catch (err) {
      setError(
        err?.message || "Could not generate your roadmap. Please try again.",
      );
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) return <Loader label="Preparing diagnostic report..." />;

  return (
    <OnboardingShell
      current="roadmap"
      eyebrow="Step 4 · Diagnostic report"
      title={`Your assessment score is ${report?.score || 0}%`}
      description={
        report?.summary ||
        "Review your strengths and weak topics before generating the personalized roadmap."
      }
      backTo={`/onboarding/assessment${personalizeQuery}`}
      aside={
        <>
          <OnboardingInsightCard
            title="Roadmap recommendation"
            badge={report?.recommendedLevel}
            items={[
              {
                title: String(report?.suggestedRoadmapType || "").replaceAll(
                  "_",
                  " ",
                ),
                description:
                  "This roadmap type is based on your assessment score and weak-topic distribution.",
              },
              {
                title: "Roadmap version",
                description: isPersonalizeFlow
                  ? "This will create a newer personalized roadmap version while keeping your previous roadmap history."
                  : "This will create your active roadmap and take you to your learner dashboard.",
              },
            ]}
          />

          <Card className="bg-indigo-50">
            <BarChart3 className="text-indigo-700" />
            <p className="mt-3 font-black text-indigo-950">
              Report before roadmap
            </p>
            <p className="mt-2 text-sm leading-6 text-indigo-900">
              Your report helps explain why certain topics appear earlier in
              your roadmap.
            </p>
          </Card>
        </>
      }
    >
      <ErrorMessage message={error} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
            <BarChart3 size={20} /> Category scores
          </h2>

          <div className="mt-5 space-y-4">
            {(report?.categoryScores || []).map((item) => (
              <div key={item.topic} className="rounded-3xl bg-slate-50 p-4">
                <div className="mb-2 flex justify-between text-sm font-semibold">
                  <span>{item.topic}</span>
                  <span>{item.score}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-slate-950"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
              <AlertTriangle size={20} /> Weak topics to prioritize
            </h2>

            <div className="mt-4 flex flex-wrap gap-2">
              {report?.weakTopics?.length ? (
                report.weakTopics.map((item) => (
                  <Badge key={item.topic} className="bg-rose-50 text-rose-700">
                    {item.topic} · {item.score}%
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  No major weak topic detected.
                </p>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
              <CheckCircle2 size={20} /> Strong topics
            </h2>

            <div className="mt-4 flex flex-wrap gap-2">
              {report?.strongTopics?.length ? (
                report.strongTopics.map((item) => (
                  <Badge
                    key={item.topic}
                    className="bg-emerald-50 text-emerald-700"
                  >
                    {item.topic} · {item.score}%
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  Complete more questions to identify strong areas.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Card className="flex flex-col gap-4 border border-indigo-100 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black">Generate personalized roadmap</h2>
          <p className="mt-2 text-slate-600">
            Your roadmap will be created from this diagnostic report. You will
            move to the dashboard automatically when it is ready.
          </p>
        </div>

        <Button
          className="px-6 py-3"
          onClick={generateRoadmap}
          disabled={creating}
        >
          {creating ? (
            "Generating..."
          ) : (
            <>
              Generate roadmap <ArrowRight className="ml-2" size={18} />
            </>
          )}
        </Button>
      </Card>
    </OnboardingShell>
  );
}
