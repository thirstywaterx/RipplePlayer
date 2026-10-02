import { usePlayInfoStore } from '@/store/now-playing';
import { useUIStatusStore } from '@/store/ui-status';
import { usePlayQueueStore } from '@/store/play-queue';
import { loadCovers } from '@/utils/cover/get-cover';
import { refreshShuffleRemaining } from '@/utils/player/controller';

export async function storeInfoAndOpenTab(songID: String, collection: any) {
    const playInfoStore = usePlayInfoStore()
    const uiStatusStore = useUIStatusStore()
    const playQueueStore = usePlayQueueStore()

    for (let item of collection) {
        if (item.id == songID)
            playInfoStore.songInfo = item
    }

    uiStatusStore.isMusicTabShowed = true

    if (playQueueStore.beforeLevel == "listOrAlbum") {
        playQueueStore.songsQueue = Array.isArray(collection) ? collection : []
        refreshShuffleRemaining()
    } else if (playQueueStore.beforeLevel == "empty") {
        const response = await authAndUseAPI("getRandomSongs") as any
        const randomSongs = response?.data?.randomSongs?.song
        if (Array.isArray(randomSongs)) {
            await loadCovers(randomSongs)
            playQueueStore.songsQueue = randomSongs
            refreshShuffleRemaining()
        } else {
            playQueueStore.songsQueue = []
            refreshShuffleRemaining()
        }
    }
}