const amplitudeApiKey = import.meta.env.VITE_AMPLITUDE_API_KEY as string | undefined;

const isEnabled = Boolean(amplitudeApiKey);

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
