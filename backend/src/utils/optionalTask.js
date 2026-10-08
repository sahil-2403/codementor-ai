export const runOptionalTask = async (label, action) => {
  try {
    await action();
  } catch (error) {
    console.error(`${label} failed:`, error.message);
  }
};
