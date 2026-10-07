// Environment variables for tree-shaking safe environment variable access

const requiredEnv = (name: string, value: string | undefined): string => {
  const v = value?.trim();
  if (!v) {
    throw new Error(`${name} is required`);
  }
  return v;
};

export { requiredEnv };