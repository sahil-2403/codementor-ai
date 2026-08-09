import { connectDB, disconnectDB } from '../config/db.js';
import { QuizQuestion } from '../models/QuizQuestion.js';

const isNamespaceMissing = (error) => error?.code === 26 || error?.codeName === 'NamespaceNotFound';

const hasParallelArchiveArrays = (index = {}) => {
  const keys = index.key || {};
  return Object.prototype.hasOwnProperty.call(keys, 'archivedByTopics')
    && Object.prototype.hasOwnProperty.call(keys, 'archivedByLessons');
};

const run = async () => {
  await connectDB();

  let indexes = [];
  try {
    indexes = await QuizQuestion.collection.indexes();
  } catch (error) {
    if (!isNamespaceMissing(error)) throw error;
  }

  const droppedIndexes = [];
  for (const index of indexes.filter(hasParallelArchiveArrays)) {
    if (!index.name || index.name === '_id_') continue;
    await QuizQuestion.collection.dropIndex(index.name);
    droppedIndexes.push(index.name);
  }

  const topicArchiveIndex = await QuizQuestion.collection.createIndex({ archivedByTopics: 1, status: 1 });
  const lessonArchiveIndex = await QuizQuestion.collection.createIndex({ archivedByLessons: 1, status: 1 });

  console.log(JSON.stringify({
    migration: 'fix-question-archive-indexes',
    completedAt: new Date().toISOString(),
    droppedIndexes,
    indexes: [topicArchiveIndex, lessonArchiveIndex]
  }, null, 2));
};

run()
  .catch((error) => {
    console.error('Question-archive-index migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
