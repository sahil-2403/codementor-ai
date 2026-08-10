import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/db.js';
import { QuizQuestion } from '../models/QuizQuestion.js';
import { ProjectTask } from '../models/ProjectTask.js';

const reconcileFreshSeedIndexes = async () => {
  await connectDB();

  const droppedIndexes = (
    await Promise.all([
      QuizQuestion.syncIndexes(),
      ProjectTask.syncIndexes()
    ])
  ).flat().filter(Boolean);

  if (droppedIndexes.length) {
    console.log(`Removed stale development indexes: ${droppedIndexes.join(', ')}`);
  }
};

const run = async () => {
  await reconcileFreshSeedIndexes();
  await import('./seed.js');
};

run().catch((error) => {
  console.error('Seed preparation failed:', error);
  process.exit(1);
});
