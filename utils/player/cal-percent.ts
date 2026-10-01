import { usePlayInfoStore } from '@/store/now-playing';

export function updateSliderValue() {
    const playInfoStore = usePlayInfoStore()
    return playInfoStore.duration > 0
        ? Math.min(100, Math.max(0, playInfoStore.currentTime /  playInfoStore.duration * 100))
        : 0
}