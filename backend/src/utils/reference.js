export const referenceId = (value) => value?._id || value;

export const referenceString = (value) => referenceId(value)?.toString?.() || '';

export const sameReference = (left, right) => {
  const leftValue = referenceString(left);
  return Boolean(leftValue && leftValue === referenceString(right));
};
