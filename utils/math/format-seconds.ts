export function formatSeconds(totalSeconds: number) {
    const secondsInt = Math.max(0, Math.floor(totalSeconds));

    const hours = Math.floor(secondsInt / 3600);
    const minutes = Math.floor((secondsInt % 3600) / 60);
    const seconds = secondsInt % 60;

    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');

    if (hours > 0) {
        const hh = String(hours).padStart(2, '0');
        return `${hh}:${mm}:${ss}`;
    }

    return `${mm}:${ss}`;
}