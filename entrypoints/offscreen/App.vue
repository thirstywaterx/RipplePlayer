<script setup lang="ts">
import { Howl, Howler } from 'howler';
import { usePlayInfoStore } from '@/store/now-playing';
import { usePlayQueueStore } from '@/store/play-queue';
import { authAndUseAPI } from '@/utils/auth';
import { nextSong } from '@/utils/player/controller';

const currentSound = ref<Howl | null>(null);

let timerId: number | null = null;
let activePlaybackId = 0;
let progressSequence = 0;

function publishPlaybackProgress(playbackId = activePlaybackId) {
  const sound = currentSound.value;
  if (!sound || playbackId !== activePlaybackId) return;

  void browser.runtime.sendMessage({
    target: 'popup-player',
    action: 'PLAYBACK_PROGRESS',
    playbackId,
    sequence: ++progressSequence,
    currentTime: sound.seek() as number,
    duration: sound.duration(),
    isPlaying: sound.playing(),
  }).catch(() => {});
}

function startSound(
  url: string,
  position = 0,
  volume = 0.8,
  onStarted?: (playbackId: number) => void,
) {
  if (timerId) clearInterval(timerId);
  timerId = null;
  activePlaybackId = Math.max(Date.now(), activePlaybackId + 1);
  progressSequence = 0;
  const playbackId = activePlaybackId;
  const initialPosition = Math.max(0, Number(position) || 0);

  Howler.stop();
  if (currentSound.value) currentSound.value.unload();

  const sound = new Howl({
    src: [url],
    html5: true,
    autoplay: false,
    volume,
    onload: () => {
      if (playbackId === activePlaybackId && initialPosition > 0) sound.seek(initialPosition);
    },
    onplay: () => {
      if (playbackId !== activePlaybackId) return;
      if (timerId) clearInterval(timerId);
      usePlayInfoStore().isPlaying = true;
      publishPlaybackProgress(playbackId);
      timerId = window.setInterval(() => publishPlaybackProgress(playbackId), 250);
      onStarted?.(playbackId);
    },
    onend: () => {
      if (playbackId !== activePlaybackId) return;
      if (timerId) clearInterval(timerId);
      timerId = null;
      publishPlaybackProgress(playbackId);
      void handleMusicEnded();
    },
    onloaderror: (id, error) => {
      if (playbackId === activePlaybackId) console.error('load failed:', error);
    },
    onplayerror: (id, error) => {
      if (playbackId === activePlaybackId) console.error('play failed:', error);
    },
  });

  currentSound.value = sound;
  sound.play();
  return playbackId;
}

async function handleMusicEnded() {
  const playInfoStore = usePlayInfoStore();
  const playQueueStore = usePlayQueueStore();

  if (playQueueStore.isUIActive.repeatMode === 'one') {
    playInfoStore.currentTime = 0;
  } else if (!nextSong()) {
    playInfoStore.isPlaying = false;
    return;
  }

  playInfoStore.currentTime = 0;
  playInfoStore.duration = 0;
  try {
    const response = await authAndUseAPI('stream', ['id', String(playInfoStore.songInfo.id)]);
    if (!response?.data) throw new Error('No stream URL returned for the next track.');

    startSound(response.data, 0, 0.8, (playbackId) => {
      void browser.runtime.sendMessage({
        target: 'popup-player',
        action: 'PLAYER_TRACK_CHANGED',
        playbackId,
        sequence: progressSequence,
        songInfo: { ...playInfoStore.songInfo },
      }).catch(() => {});
    });
  } catch (error) {
    playInfoStore.isPlaying = false;
    console.error('next track playback failed:', error);
  }
}

function handlePlayerMessage(message: any, sender: any, sendResponse: (response?: any) => void) {
  if (message.target !== 'offscreen-player') return;

  switch (message.action) {
      case 'SYNC_QUEUE_CONTEXT': {
        const playQueueStore = usePlayQueueStore();
        if (Array.isArray(message.songsQueue)) playQueueStore.songsQueue = message.songsQueue;
        if (Array.isArray(message.shuffleRemaining)) playQueueStore.shuffleRemaining = message.shuffleRemaining;
        if (message.isUIActive) playQueueStore.isUIActive = message.isUIActive;
        sendResponse({ status: 'synced' });
        break;
      }

      case 'PLAY': {
        const playInfoStore = usePlayInfoStore();
        const playQueueStore = usePlayQueueStore();
        if (message.songInfo) playInfoStore.songInfo = message.songInfo;
        if (Array.isArray(message.songsQueue)) playQueueStore.songsQueue = message.songsQueue;
        if (Array.isArray(message.shuffleRemaining)) playQueueStore.shuffleRemaining = message.shuffleRemaining;
        if (message.isUIActive) playQueueStore.isUIActive = message.isUIActive;
        playInfoStore.currentTime = Math.max(0, Number(message.position) || 0);
        playInfoStore.duration = 0;

        const playbackId = startSound(message.url, message.position, message.volume ?? 0.8);
        sendResponse({ status: 'playing', playbackId });
        break;
      }

      case 'PAUSE':
        if (currentSound.value) {
          currentSound.value.pause();
          if (timerId) clearInterval(timerId);
          timerId = null;
          publishPlaybackProgress();
          sendResponse({ status: 'paused' });
        } else {
          sendResponse({ status: 'unavailable' });
        }
        break;

      case 'RESUME':
        if (currentSound.value) {
          currentSound.value.play();
          sendResponse({ status: 'playing' });
        } else {
          sendResponse({ status: 'unavailable' });
        }
        break;

      case 'STOP':
        if (timerId) clearInterval(timerId);
        timerId = null;
        activePlaybackId = Math.max(Date.now(), activePlaybackId + 1);
        Howler.stop();
        if (currentSound.value) {
          currentSound.value.unload();
          currentSound.value = null;
        }
        sendResponse({ status: 'stopped' });
        break;

      case 'SEEK': {
        const sound = currentSound.value;
        if (!sound) {
          sendResponse({ status: 'unavailable' });
          break;
        }

        const position = Math.min(sound.duration(), Math.max(0, Number(message.position) || 0));
        sound.seek(position);
        publishPlaybackProgress();
        sendResponse({
          status: 'seeked',
          playbackId: activePlaybackId,
          sequence: progressSequence,
          currentTime: position,
          duration: sound.duration(),
          isPlaying: sound.playing(),
        });
        break;
      }

      case 'FADE':
        if (currentSound.value) {
          const fromVol = currentSound.value.volume();
          currentSound.value.fade(fromVol, message.targetVolume, 2000);
          sendResponse({ status: 'fading' });
        }
        break;

      case 'SET_GLOBAL_VOLUME':
        Howler.volume(message.volume);
        sendResponse({ status: 'global_volume_updated' });
        break;
  }
}

onMounted(() => browser.runtime.onMessage.addListener(handlePlayerMessage));
onUnmounted(() => browser.runtime.onMessage.removeListener(handlePlayerMessage));
</script>

<template>
  <div>Howler Player Engine Active</div>
</template>