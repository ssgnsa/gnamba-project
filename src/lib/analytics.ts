const isEnabled = false;

export const analytics = {
  isEnabled,
  track: (..._args: unknown[]) => {
    if (!isEnabled) return;
  },
  identify: (..._args: unknown[]) => {
    if (!isEnabled) return;
  },
  setUserId: (..._args: unknown[]) => {
    if (!isEnabled) return;
  },
  reset: (..._args: unknown[]) => {
    if (!isEnabled) return;
  },
};
