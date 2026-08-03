import { connectDB, disconnectDB } from '../config/db.js';
import { AIJob } from '../models/AIJob.js';
import { CoursePlan } from '../models/CoursePlan.js';

const run = async () => {
  await connectDB();

  await AIJob.collection.createIndex(
    { user: 1, type: 1, idempotencyKey: 1 },
    {
      unique: true,
      name: 'ai_job_idempotency_unique',
      partialFilterExpression: { idempotencyKey: { $type: 'string' } }
    }
  );

  await AIJob.collection.createIndex(
    { user: 1, lockKey: 1 },
    {
      unique: true,
      name: 'ai_job_active_lock_unique',
      partialFilterExpression: { lockKey: { $type: 'string' } }
    }
  );

  await CoursePlan.collection.createIndex(
    { generationJob: 1 },
    {
      unique: true,
      name: 'course_generation_job_unique',
      partialFilterExpression: { generationJob: { $type: 'objectId' } }
    }
  );

  await CoursePlan.collection.createIndex(
    { user: 1, generationKey: 1 },
    {
      unique: true,
      name: 'course_generation_key_unique',
      partialFilterExpression: { generationKey: { $type: 'string' } }
    }
  );

  console.log(JSON.stringify({
    migration: 'enforce-roadmap-idempotency-indexes',
    completedAt: new Date().toISOString(),
    indexes: [
      'ai_job_idempotency_unique',
      'ai_job_active_lock_unique',
      'course_generation_job_unique',
      'course_generation_key_unique'
    ]
  }, null, 2));
};

run()
  .catch((error) => {
    console.error('Roadmap-index migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
