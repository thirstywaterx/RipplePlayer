import { getColorSync } from 'colorthief'

self.addEventListener('message', (event: MessageEvent<{ requestId: number; bitmap: ImageBitmap }>) => {
  const { requestId, bitmap } = event.data

  try {
    const scale = Math.min(1, 128 / bitmap.width, 128 / bitmap.height)
    const canvas = new OffscreenCanvas(
      Math.max(1, Math.round(bitmap.width * scale)),
      Math.max(1, Math.round(bitmap.height * scale)),
    )
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Unable to create cover canvas')
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    const color = getColorSync(canvas)
    if (!color) throw new Error('Cover contains no readable colors')
    self.postMessage({ requestId, color: color.hex() })
  } catch (error) {
    self.postMessage({
      requestId,
      error: error instanceof Error ? error.message : String(error),
    })
  } finally {
    bitmap.close()
  }
})