import { usePlayInfoStore } from '@/store/now-playing';
import { usePlayQueueStore } from '@/store/play-queue';

async function playMusic(playRequestId: number) {
    const playInfoStore = usePlayInfoStore()
    const songId = playInfoStore.songInfo.id
    const requestId = ++playRequestId
    const position = playInfoStore.currentTime
    const response = await authAndUseAPI("stream", ["id", String(songId)])

    if (requestId !== playRequestId || playInfoStore.songInfo.id !== songId) return

    await sendToPlayer('PLAY', {
        url: response?.data,
        position,
    })
    playInfoStore.isPlaying = true
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

async function changePlayStatus(playRequestId: number) {
    const playInfoStore = usePlayInfoStore()

    if (playInfoStore.isPlaying) {
        await sendToPlayer('PAUSE')
        playInfoStore.isPlaying = false
        return
    }

    if (playInfoStore.duration > 0) {
        const response = await sendToPlayer('RESUME')
        if (response?.status === 'unavailable') {
            await playMusic(playRequestId)
            return
        }
        playInfoStore.isPlaying = true
        return
    }

    await playMusic(playRequestId)
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
}

function changeRepeatMode() {
    const playQueueStore = usePlayQueueStore()
    const modes = ["off", "all", "one"] as const
    const currentIndex = modes.indexOf(playQueueStore.isUIActive.repeatMode)
    playQueueStore.isUIActive.repeatMode = modes[(currentIndex + 1) % modes.length]!
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