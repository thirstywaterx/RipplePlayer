import { usePlayInfoStore } from '@/store/now-playing';
import { useUIStatusStore } from '@/store/ui-display';

export async function storeInfoAndOpenTab(songID: String, collection: any) {
    const playInfoStore = usePlayInfoStore()
    const uiStatusStore = useUIStatusStore()

    for (let item of collection) {
        if (item.id == songID)
            playInfoStore.songInfo = item
    }
    uiStatusStore.isMusicTabShowed = true
}