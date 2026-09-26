export async function sendToPlayer(action: string, payload: Record<string, any> = {}) {
  await browser.runtime.sendMessage({
    target: 'background',
    action: 'ENSURE_OFFSCREEN'
  });

  return await browser.runtime.sendMessage({
    target: 'offscreen-player',
    action,
    ...payload
  });
}