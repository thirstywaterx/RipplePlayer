export async function sendToPlayer(
  action: string,
  payload: Record<string, any> = {},
  shouldSend: () => boolean = () => true,
) {
  await browser.runtime.sendMessage({
    target: 'background',
    action: 'ENSURE_OFFSCREEN'
  });

  if (!shouldSend()) return;

  return await browser.runtime.sendMessage({
    target: 'offscreen-player',
    action,
    ...payload
  });
}