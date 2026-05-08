declare module "react-turnstile" {
  import * as React from "react";

  interface TurnstileProps {
    siteKey: string;
    onVerify?: (token: string) => void;
    onExpire?: () => void;
    onError?: () => void;
    options?: Record<string, unknown>;
  }

  const Turnstile: React.FC<TurnstileProps>;
  export default Turnstile;
}
