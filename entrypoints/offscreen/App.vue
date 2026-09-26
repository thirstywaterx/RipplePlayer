<script setup lang="ts">
import { Howl, Howler } from 'howler';

const currentSound = ref<Howl | null>(null);

let timerId: number | null = null;

function publishPlaybackProgress(isPlaying = Boolean(currentSound.value?.playing())) {
  const sound = currentSound.value;
  if (!sound) return;

  void browser.runtime.sendMessage({
    target: 'popup-player',
    action: 'PLAYBACK_PROGRESS',
    currentTime: sound.seek() as number,
    duration: sound.duration(),
    isPlaying,
  }).catch(() => {});
}

function handlePlayerMessage(message: any, sender: any, sendResponse: (response?: any) => void) {
  if (message.target !== 'offscreen-player') return;

  switch (message.action) {
      case 'PLAY': {
        Howler.stop();
        if (currentSound.value) {
          currentSound.value.unload();
        }
        const initialPosition = Math.max(0, Number(message.position) || 0);
        const sound = new Howl({
          src: [message.url],
          html5: true,
          autoplay: false,
          volume: message.volume ?? 0.8,
          onload: () => {
            if (initialPosition > 0) sound.seek(initialPosition);
          },
          onplay: () => {
            if (timerId) clearInterval(timerId);
            publishPlaybackProgress(true);
            timerId = window.setInterval(() => publishPlaybackProgress(true), 250);
          },
          onend: () => {
            if (timerId) clearInterval(timerId);
            timerId = null;
            publishPlaybackProgress(false);
            console.log('play ended');
            browser.runtime.sendMessage({ action: 'MUSIC_ENDED' });
          },
          onloaderror: (id, err) => {
            console.error('load failed:', err);
          }
        });
        currentSound.value = sound;
        sound.play();
        sendResponse({ status: 'playing' });
        break;
      }

      case 'PAUSE':
        if (currentSound.value) {
          currentSound.value.pause();
          if (timerId) clearInterval(timerId);
          timerId = null;
          publishPlaybackProgress(false);
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

      case 'GET_STATE': {
        const sound = currentSound.value;
        sendResponse({
          currentTime: sound ? sound.seek() as number : 0,
          duration: sound?.duration() ?? 0,
          isPlaying: Boolean(sound?.playing()),
        });
        break;
      }

      case 'SEEK': {
        const sound = currentSound.value;
        if (!sound) {
          sendResponse({ status: 'unavailable' });
          break;
        }

        const position = Math.min(sound.duration(), Math.max(0, Number(message.position) || 0));
        sound.seek(position);
        publishPlaybackProgress(Boolean(sound.playing()));
        sendResponse({ status: 'seeked', currentTime: position });
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