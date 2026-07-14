export const createEmbedding = async (text) => {
  if (process.env.ENABLE_RAG !== 'true') {
    return null;
  }
  // Placeholder for future embedding provider integration.
  return null;
};
