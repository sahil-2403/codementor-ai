import { connectDB, disconnectDB } from '../config/db.js';
import { ProjectSubmission } from '../models/ProjectSubmission.js';
import { InterviewAttempt } from '../models/InterviewAttempt.js';

const run = async () => {
  await connectDB();

  await ProjectSubmission.collection.createIndex(
    { user: 1, projectTask: 1, attemptNumber: 1 },
    {
      unique: true,
      name: 'project_attempt_slot_unique',
      partialFilterExpression: { attemptNumber: { $type: 'number' } }
    }
  );

  await InterviewAttempt.collection.createIndex(
    { user: 1, question: 1, attemptNumber: 1 },
    {
      unique: true,
      name: 'interview_attempt_slot_unique',
      partialFilterExpression: { attemptNumber: { $type: 'number' } }
    }
  );

  console.log(JSON.stringify({
    migration: 'enforce-attempt-slot-indexes',
    completedAt: new Date().toISOString(),
    indexes: ['project_attempt_slot_unique', 'interview_attempt_slot_unique']
  }, null, 2));
};

run()
  .catch((error) => {
    console.error('Attempt-index migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
