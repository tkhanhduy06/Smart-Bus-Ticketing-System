export function formatCountdown(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function getCountdownTone(seconds) {
  if (seconds <= 60) return "danger";
  if (seconds <= 300) return "warning";
  return "safe";
}
