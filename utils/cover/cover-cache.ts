const COVER_CACHE_KEY = 'navidrome-cover-cache-v1'
const COVER_CACHE_TTL_MS = 5 * 60 * 1000

type CoverCacheEntry = {
    data: string
    expiresAt: number
}

function readCoverCache(): Record<string, CoverCacheEntry> {
    try {
        const raw = window.sessionStorage.getItem(COVER_CACHE_KEY)
        if (!raw) return {}

        const parsed = JSON.parse(raw) as Record<string, CoverCacheEntry>
        return parsed
    } catch {
        return {}
    }
}

function writeCoverCache(cache: Record<string, CoverCacheEntry>) {
    try {
        window.sessionStorage.setItem(COVER_CACHE_KEY, JSON.stringify(cache))
    } catch {
        // Ignore storage quota errors and keep runtime behavior working.
    }
}

function pruneExpiredCoverCache(cache: Record<string, CoverCacheEntry>) {
    const now = Date.now()
    const next: Record<string, CoverCacheEntry> = {}

    for (const [id, entry] of Object.entries(cache)) {
        if (entry.expiresAt > now) {
            next[id] = entry
        }
    }

    writeCoverCache(next)
    return next
}

async function loadCover(item: any) {
    const cached = getCoverFromCache(item.id)
    if (cached) {
        item.cover = cached
        return cached
    }

    const imageURL = await authAndUseAPI("getCoverArt", ["id", item.id])
    const data = imageURL?.data

    if (data) {
        setCoverToCache(item.id, data)
        item.cover = data
    }

    return data
}

function getCoverFromCache(id: string): string | null {
    const cache = pruneExpiredCoverCache(readCoverCache())
    const cached = cache[id]

    if (!cached) return null
    return cached.data
}

function setCoverToCache(id: string, data: string, ttlMs = COVER_CACHE_TTL_MS) {
    const cache = readCoverCache()
    cache[id] = {
        data,
        expiresAt: Date.now() + ttlMs,
    }
    writeCoverCache(cache)
}

export {
    loadCover,
    getCoverFromCache,
    setCoverToCache
}
