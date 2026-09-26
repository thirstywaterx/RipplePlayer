export default defineBackground(() => {
  async function ensureOffscreen() {
    const hasDoc = await browser.offscreen.hasDocument();
    if (!hasDoc) {
      await browser.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: [browser.offscreen.Reason.AUDIO_PLAYBACK],
        justification: 'play music in the background',
      });
    }
  }

  ensureOffscreen()

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.target === 'background' && message.action === 'ENSURE_OFFSCREEN') {
      ensureOffscreen().then(() => sendResponse({ status: 'ready' }));
      return true;
    }
  });
});
