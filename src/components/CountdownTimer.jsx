import useCountdown from "../hooks/useCountdown";
import { formatCountdown, getCountdownTone } from "../utils/countdown";

export default function CountdownTimer({
  duration = 600,
  isActive = true,
  onExpire,
}) {
  const remainingSeconds = useCountdown(duration, isActive, onExpire);
  const tone = getCountdownTone(remainingSeconds);

  return (
    <div
      className={`countdown countdown--${tone}`}
      data-testid="countdown"
      data-tone={tone}
      aria-live="polite"
      aria-label={`Thời gian giữ chỗ còn lại ${formatCountdown(remainingSeconds)}`}
    >
      {formatCountdown(remainingSeconds)}
    </div>
  );
}
