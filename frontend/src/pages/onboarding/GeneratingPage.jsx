import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock3, RotateCw, XCircle } from "lucide-react";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import Badge from "../../components/common/Badge.jsx";
import Loader from "../../components/common/Loader.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import OnboardingShell from "../../components/onboarding/OnboardingShell.jsx";
import OnboardingInsightCard from "../../components/onboarding/OnboardingInsightCard.jsx";
import { roadmapApi } from "../../api/roadmapApi.js";
import { onboardingApi } from "../../api/onboardingApi.js";
import { queryKeys } from "../../constants/queryKeys.js";

const statusMeta = {
  completed: {
    icon: CheckCircle2,
    title: "Roadmap is ready",
    iconClass: "bg-emerald-50 text-emerald-700",
  },
  failed: {
    icon: XCircle,
    title: "Roadmap setup needs attention",
    iconClass: "bg-rose-50 text-rose-700",
  },
  processing: {
    icon: RotateCw,
    title: "Preparing roadmap",
    iconClass: "bg-indigo-50 text-indigo-700",
  },
  queued: {
    icon: Clock3,
    title: "Roadmap is queued",
    iconClass: "bg-sky-50 text-sky-700",
  },
};

export default function GeneratingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const jobId = searchParams.get("jobId");
  const startedRef = useRef(false);
  const redirectedRef = useRef(false);

  const [localError, setLocalError] = useState("");

  const onboardingStatusQuery = useQuery({
    queryKey: queryKeys.onboardingStatus,
    queryFn: onboardingApi.status,
    retry: false
  });
  const onboardingStatus = onboardingStatusQuery.data;
  const [showSlowHint, setShowSlowHint] = useState(false);

  const generateMutation = useMutation({
    mutationFn: roadmapApi.generateOrGet,
  });

  const retryMutation = useMutation({
    mutationFn: roadmapApi.retryJob,
  });

  const refreshLearningQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.onboardingStatus }),
      queryClient.invalidateQueries({ queryKey: queryKeys.roadmap }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
    ]);
  };

  const redirectToDashboard = async () => {
    if (redirectedRef.current) return;

    redirectedRef.current = true;
    await refreshLearningQueries();
    navigate("/dashboard", { replace: true });
  };

  useEffect(() => {
    if (jobId || startedRef.current || onboardingStatusQuery.isLoading) return;

    if (onboardingStatus?.state === 'completed' || onboardingStatus?.hasActiveCourse) {
      redirectToDashboard();
      return;
    }

    const existingJob = onboardingStatus?.roadmapJob;
    if (existingJob?._id && ['queued', 'processing'].includes(existingJob.status)) {
      navigate(`/onboarding/generating?jobId=${existingJob._id}`, { replace: true });
      return;
    }

    if (!['roadmap_pending', 'roadmap_failed'].includes(onboardingStatus?.state)) {
      setLocalError('Finish the current onboarding step before generating a roadmap.');
      return;
    }

    startedRef.current = true;
    setLocalError("");

    generateMutation.mutate(undefined, {
      onSuccess: async (result) => {
        if (
          result?.course ||
          result?.mode === "existing" ||
          result?.mode === "sync"
        ) {
          await redirectToDashboard();
          return;
        }

        if (result?.job?._id) {
          navigate(`/onboarding/generating?jobId=${result.job._id}`, {
            replace: true,
          });
          return;
        }

        setLocalError(
          "Roadmap setup started, but no status was returned. Please try again.",
        );
      },
      onError: (error) => {
        setLocalError(
          error?.message || "Could not start roadmap setup. Please try again.",
        );
      },
    });
  }, [jobId, onboardingStatus?.state, onboardingStatus?.roadmapJob?._id, onboardingStatusQuery.isLoading]);

  const currentRoadmapQuery = useQuery({
    queryKey: queryKeys.roadmap,
    queryFn: roadmapApi.current,
    refetchInterval: 2000,
    retry: false,
  });

  const currentCourse = currentRoadmapQuery.data?.course;

  const jobQuery = useQuery({
    queryKey: ["roadmap-job", jobId],
    queryFn: () => roadmapApi.jobStatus(jobId),
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.job?.status;
      return status === "completed" || status === "failed" ? false : 2000;
    },
    retry: false,
  });

  const job = jobQuery.data?.job;
  const jobCourse = jobQuery.data?.course;

  useEffect(() => {
    if (currentCourse || jobCourse || job?.status === "completed") {
      redirectToDashboard();
    }
  }, [currentCourse?._id, jobCourse?._id, job?.status]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSlowHint(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  const meta = useMemo(
    () => statusMeta[job?.status] || statusMeta.processing,
    [job?.status],
  );
  const Icon = meta.icon;

  if (onboardingStatusQuery.isLoading || (!jobId && generateMutation.isPending)) {
    return <Loader label="Preparing your roadmap..." />;
  }

  return (
    <OnboardingShell
      current="roadmap"
      eyebrow="Step 4 · Roadmap setup"
      title="Preparing your learning roadmap."
      description="We are setting up your lessons, quizzes, projects, and practice flow. You will move to the dashboard automatically when it is ready."
      aside={
        <>
          <OnboardingInsightCard
            title="What happens here?"
            badge="Roadmap"
            items={[
              {
                title: "Course structure",
                description:
                  "Your modules, lessons, quizzes, and practice tasks are connected to your selected path.",
              },
              {
                title: "Safe fallback",
                description:
                  "If personalization is unavailable, a reliable template roadmap is used so you can start learning immediately.",
              },
            ]}
          />
          <Card>
            <p className="font-black text-slate-950">Almost ready</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              When setup finishes, your dashboard will show your first lesson,
              recommendations, revisions, projects, and interview practice.
            </p>
          </Card>
        </>
      }
    >
      <Card className="text-center">
        <div
          className={`mx-auto grid h-16 w-16 place-items-center rounded-3xl ${meta.iconClass}`}
        >
          <Icon
            className={
              job?.status === "processing" || !job?.status ? "animate-spin" : ""
            }
          />
        </div>

        <h2 className="mt-5 text-3xl font-black text-slate-950">
          {meta.title}
        </h2>

        <p className="mt-3 text-slate-600">
          {job
            ? `Current status: ${job.status}`
            : "Roadmap setup has started. Please wait a moment."}
        </p>

        <ErrorMessage
          message={
            localError ||
            generateMutation.error?.message ||
            retryMutation.error?.message ||
            jobQuery.error?.message
          }
        />

        {job ? (
          <div className="mt-6 rounded-[2rem] bg-slate-50 p-5 text-left">
            <div className="flex items-center justify-between">
              <b>Setup status</b>
              <Badge>{job.status}</Badge>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Type: {job.type} · Attempts: {job.attempts || 0}
            </p>

            {job.error && (
              <p className="mt-3 rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">
                {job.error}
              </p>
            )}
          </div>
        ) : null}

        {showSlowHint && !currentCourse && job?.status !== "failed" ? (
          <div className="mt-6 rounded-3xl bg-indigo-50 p-4 text-left text-sm leading-6 text-indigo-900">
            Still preparing your roadmap. If this takes too long, refresh once
            or make sure background roadmap queues are disabled unless you are
            also running the worker.
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {currentCourse || jobCourse || job?.status === "completed" ? (
            <Button onClick={redirectToDashboard}>Open dashboard</Button>
          ) : null}

          {job?.status === "failed" ? (
            <>
              <Button
                disabled={retryMutation.isPending}
                onClick={() => {
                  setLocalError("");
                  retryMutation.mutate(job._id, {
                    onSuccess: async (result) => {
                      if (result?.course || result?.mode === "existing" || result?.mode === "sync") {
                        await redirectToDashboard();
                        return;
                      }

                      const nextJobId = result?.job?._id || job._id;
                      queryClient.setQueryData(["roadmap-job", nextJobId], {
                        job: result?.job || { ...job, status: result?.mode || "processing", error: "" },
                        course: result?.course || null
                      });
                      await refreshLearningQueries();
                      navigate(`/onboarding/generating?jobId=${nextJobId}`, { replace: true });
                    },
                    onError: (error) => {
                      setLocalError(error?.message || "Could not retry roadmap setup.");
                    }
                  });
                }}
              >
                {retryMutation.isPending ? "Retrying..." : "Retry roadmap setup"}
              </Button>
              <Link to="/onboarding/preferences">
                <Button variant="secondary">Back to setup</Button>
              </Link>
            </>
          ) : null}
        </div>
      </Card>
    </OnboardingShell>
  );
}
