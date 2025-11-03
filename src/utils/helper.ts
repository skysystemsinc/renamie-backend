export const formatDate = (date?: Date): string => {
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const randomGenerator = () => {
  return Math.random().toString(20).slice(-8);
};
