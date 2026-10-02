import { useEffect, useRef, useState } from "react";

export default function useCountdown(initialSeconds, isActive, onExpire) {
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!isActive || remainingSeconds <= 0) return undefined;

    const intervalId = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isActive, remainingSeconds]);

  useEffect(() => {
    if (isActive && remainingSeconds === 0 && !expiredRef.current) {
      expiredRef.current = true;
      onExpireRef.current?.();
    }
  }, [isActive, remainingSeconds]);

  return remainingSeconds;
}
