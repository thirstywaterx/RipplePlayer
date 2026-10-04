import { usePlayInfoStore } from '@/store/now-playing';
import { usePlayQueueStore } from '@/store/play-queue';

let latestPlayRequestId = 0

async function playMusic() {
    const playInfoStore = usePlayInfoStore()
    const playQueueStore = usePlayQueueStore()
    const songId = playInfoStore.songInfo.id
    const requestId = ++latestPlayRequestId
    const position = playInfoStore.currentTime
    const response = await authAndUseAPI("stream", ["id", String(songId)])

    const isCurrentRequest = () =>
        requestId === latestPlayRequestId && playInfoStore.songInfo.id === songId
    if (!isCurrentRequest()) return

    await sendToPlayer('PLAY', {
        url: response?.data,
        position,
        songInfo: { ...playInfoStore.songInfo },
        songsQueue: playQueueStore.songsQueue.map(song => ({ ...song })),
        shuffleRemaining: [...playQueueStore.shuffleRemaining],
        isUIActive: { ...playQueueStore.isUIActive },
    }, isCurrentRequest)
    if (isCurrentRequest()) playInfoStore.isPlaying = true
}

function syncQueueContext() {
    const playQueueStore = usePlayQueueStore()
    void browser.runtime.sendMessage({
        target: 'offscreen-player',
        action: 'SYNC_QUEUE_CONTEXT',
        songsQueue: playQueueStore.songsQueue.map(song => ({ ...song })),
        shuffleRemaining: [...playQueueStore.shuffleRemaining],
        isUIActive: { ...playQueueStore.isUIActive },
    }).catch(() => {})
}

function getNowIndex() {
    const playInfoStore = usePlayInfoStore()
    const playQueueStore = usePlayQueueStore()
    const nowID = playInfoStore.songInfo.id
    return playQueueStore.songsQueue.findIndex(item => item.id === nowID);
}

export function shuffleSongIds(songIds: string[]) {
    for (let index = songIds.length - 1; index > 0; index--) {
        const randomIndex = Math.floor(Math.random() * (index + 1))
        const songId = songIds[index]!
        songIds[index] = songIds[randomIndex]!
        songIds[randomIndex] = songId
    }
    return songIds
}

function refreshShuffleRemaining() {
    const playInfoStore = usePlayInfoStore()
    const playQueueStore = usePlayQueueStore()

    playQueueStore.shuffleRemaining = playQueueStore.isUIActive.isRandomActive
        ? shuffleSongIds([...new Set(playQueueStore.songsQueue.map(song => song.id))]
            .filter(songId => songId !== playInfoStore.songInfo.id))
        : []
}

async function changePlayStatus() {
    const playInfoStore = usePlayInfoStore()

    if (playInfoStore.isPlaying) {
        await sendToPlayer('PAUSE')
        playInfoStore.isPlaying = false
        return
    }

    if (playInfoStore.duration > 0) {
        const response = await sendToPlayer('RESUME')
        if (response?.status === 'unavailable') {
            await playMusic()
            return
        }
        playInfoStore.isPlaying = true
        return
    }

    await playMusic()
}

function nextSong() {
    const playInfoStore = usePlayInfoStore()
    const playQueueStore = usePlayQueueStore()

    if (playQueueStore.isUIActive.isRandomActive) {
        const currentSongId = playInfoStore.songInfo.id
        playQueueStore.shuffleRemaining = playQueueStore.shuffleRemaining.filter(
            songId => songId !== currentSongId
        )

        if (playQueueStore.shuffleRemaining.length === 0 && playQueueStore.isUIActive.repeatMode === "all") {
            const songIds = [...new Set(playQueueStore.songsQueue.map(song => song.id))]
                .filter(songId => songId !== currentSongId)
            playQueueStore.shuffleRemaining = shuffleSongIds(songIds)
        }

        const nextSongId = playQueueStore.shuffleRemaining.shift()
        const randomSong = playQueueStore.songsQueue.find(song => song.id === nextSongId)
        if (!randomSong && playQueueStore.isUIActive.repeatMode === "all") {
            const currentSong = playQueueStore.songsQueue.find(song => song.id === currentSongId)
            if (currentSong) {
                playInfoStore.songInfo = currentSong
                return true
            }
        }
        if (randomSong) {
            playInfoStore.songInfo = randomSong
            return true
        }
        return false
    }

    const index = getNowIndex()
    const nextTrack = playQueueStore.songsQueue[index + 1]
    if (nextTrack) {
        playInfoStore.songInfo = nextTrack
        return true
    }

    if (playQueueStore.isUIActive.repeatMode === "all" && playQueueStore.songsQueue.length > 0) {
        playInfoStore.songInfo = playQueueStore.songsQueue[0]!
        return true
    }

    return false
}

function previousSong() {
    const playInfoStore = usePlayInfoStore()
    const playQueueStore = usePlayQueueStore()
    let index = getNowIndex()
    const previousSong = playQueueStore.songsQueue[--index]
    if (previousSong) playInfoStore.songInfo = previousSong
}

function changeRandomStatus() {
    const playQueueStore = usePlayQueueStore()
    playQueueStore.isUIActive.isRandomActive = !playQueueStore.isUIActive.isRandomActive
    refreshShuffleRemaining()
    syncQueueContext()
}

function changeRepeatMode() {
    const playQueueStore = usePlayQueueStore()
    const modes = ["off", "all", "one"] as const
    const currentIndex = modes.indexOf(playQueueStore.isUIActive.repeatMode)
    playQueueStore.isUIActive.repeatMode = modes[(currentIndex + 1) % modes.length]!
    syncQueueContext()
}

export {
    playMusic,
    nextSong,
    previousSong,
    changeRandomStatus,
    changeRepeatMode,
    refreshShuffleRemaining,
    changePlayStatus
}