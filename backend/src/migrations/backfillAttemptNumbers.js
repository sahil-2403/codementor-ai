import { connectDB, disconnectDB } from '../config/db.js';
import { ProjectSubmission } from '../models/ProjectSubmission.js';
import { InterviewAttempt } from '../models/InterviewAttempt.js';

const backfillCollection = async ({ model, groupField, label }) => {
  const groups = await model.aggregate([
    {
      $group: {
        _id: { user: '$user', target: `$${groupField}` },
        count: { $sum: 1 }
      }
    },
    { $match: { count: { $gt: 0 } } }
  ]);

  const summary = {
    label,
    groupsChecked: groups.length,
    recordsAssigned: 0,
    overflowGroups: []
  };

  for (const group of groups) {
    const records = await model.find({
      user: group._id.user,
      [groupField]: group._id.target
    }).sort({ createdAt: 1, _id: 1 }).select('_id attemptNumber createdAt');

    const operations = [];
    records.forEach((record, index) => {
      const nextAttemptNumber = index < 2 ? index + 1 : null;
      if (record.attemptNumber !== nextAttemptNumber) {
        operations.push({
          updateOne: {
            filter: { _id: record._id },
            update: { $set: { attemptNumber: nextAttemptNumber } }
          }
        });
      }
    });

    if (operations.length) {
      await model.bulkWrite(operations, { ordered: true });
      summary.recordsAssigned += operations.length;
    }

    if (records.length > 2) {
      summary.overflowGroups.push({
        userId: group._id.user.toString(),
        targetId: group._id.target.toString(),
        totalRecords: records.length,
        overflowRecordIds: records.slice(2).map((record) => record._id.toString())
      });
    }
  }

  return summary;
};

const run = async () => {
  await connectDB();

  const projectSummary = await backfillCollection({
    model: ProjectSubmission,
    groupField: 'projectTask',
    label: 'project submissions'
  });

  const interviewSummary = await backfillCollection({
    model: InterviewAttempt,
    groupField: 'question',
    label: 'interview attempts'
  });

  console.log(JSON.stringify({
    migration: 'backfill-attempt-numbers',
    completedAt: new Date().toISOString(),
    projectSummary,
    interviewSummary,
    requiresManualReview:
      projectSummary.overflowGroups.length > 0 || interviewSummary.overflowGroups.length > 0
  }, null, 2));
};

run()
  .catch((error) => {
    console.error('Attempt-number backfill failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
