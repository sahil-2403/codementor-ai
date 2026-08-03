import { AIJob } from "../models/AIJob.js";
import { CoursePlan } from "../models/CoursePlan.js";
import { addRoadmapJob, roadmapQueue } from "../jobs/roadmap.queue.js";
import { createCourseFromTemplate } from "./roadmap.service.js";
import { logActivity } from "./activityLog.service.js";
import { makeSearchRegex } from "../utils/pagination.js";
import { listWithPagination } from "./listQuery.service.js";
import { ApiError } from "../utils/ApiError.js";
import { isQueueEnabled } from "../config/env.js";

const shouldUseRoadmapQueue = () => Boolean(roadmapQueue && isQueueEnabled());

export const createRoadmapGenerationJobOrRun = async ({
  userId,
  payload,
  req = null,
  idempotent = false,
}) => {
  const canQueue = shouldUseRoadmapQueue();

  if (idempotent) {
    const activeCourse = await CoursePlan.findOne({
      user: userId,
      status: "active",
      isActive: true,
    }).sort({ createdAt: -1 });
    if (activeCourse)
      return { mode: "existing", course: activeCourse, job: null };

    const existingJob = await AIJob.findOne({
      user: userId,
      type: "roadmap_generation",
      status: { $in: ["queued", "processing"] },
    }).sort({ createdAt: -1 });

    if (existingJob && canQueue) return { mode: "queued", job: existingJob };

    if (existingJob && !canQueue) {
      existingJob.status = "failed";
      existingJob.error =
        "Roadmap queue was not enabled. Recovered by generating synchronously.";
      existingJob.completedAt = new Date();
      await existingJob.save();
    }
  } else {
    const existingJob = await AIJob.findOne({
      user: userId,
      type: "roadmap_generation",
      status: { $in: ["queued", "processing"] },
    }).sort({ createdAt: -1 });

    if (existingJob && canQueue) {
      throw new ApiError(
        409,
        "A roadmap generation job is already in progress. Please wait for it to finish.",
      );
    }

    if (existingJob && !canQueue) {
      existingJob.status = "failed";
      existingJob.error =
        "Roadmap queue was not enabled. Recovered by generating synchronously.";
      existingJob.completedAt = new Date();
      await existingJob.save();
    }
  }

  const aiJob = await AIJob.create({
    user: userId,
    type: "roadmap_generation",
    status: canQueue ? "queued" : "processing",
    input: payload,
    attempts: 0,
  });

  if (canQueue) {
    const bullJob = await addRoadmapJob({
      ...payload,
      aiJobId: aiJob._id.toString(),
    });
    aiJob.output = {
      bullJobId: bullJob?.id || null,
      queue: "roadmap-generation",
    };
    await aiJob.save();

    await logActivity({
      user: userId,
      action: "roadmap_job_queued",
      entityType: "AIJob",
      entityId: aiJob._id,
      message: "Roadmap generation job queued",
      metadata: {
        bullJobId: bullJob?.id || null,
        roadmapType: payload.roadmapType,
      },
      req,
    });

    return { mode: "queued", job: aiJob };
  }

  try {
    const course = await createCourseFromTemplate(payload);

    aiJob.status = "completed";
    aiJob.output = { coursePlanId: course._id, mode: "sync" };
    aiJob.completedAt = new Date();
    aiJob.attempts = 1;
    await aiJob.save();

    await logActivity({
      user: userId,
      action: "roadmap_job_completed_sync",
      entityType: "CoursePlan",
      entityId: course._id,
      message: "Roadmap generated synchronously",
      metadata: {
        jobId: aiJob._id,
        version: course.version,
        roadmapType: course.roadmapType,
      },
      req,
    });

    return { mode: "sync", job: aiJob, course };
  } catch (error) {
    aiJob.status = "failed";
    aiJob.error = error.message;
    aiJob.completedAt = new Date();
    aiJob.attempts = 1;
    await aiJob.save();
    throw error;
  }
};

export const getJobForUser = async ({ userId, jobId, isAdmin = false }) => {
  const filter = { _id: jobId };
  if (!isAdmin) filter.user = userId;

  const job = await AIJob.findOne(filter).populate("user", "name email role");
  if (!job) throw new ApiError(404, "Job not found");

  let course = null;

  if (job.output?.coursePlanId) {
    course = await CoursePlan.findById(job.output.coursePlanId).select(
      "_id title version status isActive roadmapType",
    );
  }

  if (!course) {
    course = await CoursePlan.findOne({
      user: job.user?._id || userId,
      status: "active",
      isActive: true,
    })
      .select("_id title version status isActive roadmapType")
      .sort({ createdAt: -1 });
  }

  return { job, course };
};

export const listJobs = async (query = {}) => {
  const search = makeSearchRegex(query.search);
  const filter = {};

  if (search)
    filter.$or = [{ type: search }, { status: search }, { error: search }];
  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;
  if (query.user) filter.user = query.user;

  return listWithPagination({
    model: AIJob,
    filter,
    query,
    populate: [{ path: "user", select: "name email role" }],
  });
};
