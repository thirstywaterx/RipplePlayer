const COVER_CACHE_DB = 'navidrome-cover-cache-v1'
const COVER_CACHE_STORE = 'covers'
const COVER_CACHE_TTL_MS = 5 * 60 * 1000

type CoverCacheEntry = {
    blob: Blob
    expiresAt: number
}

const coverObjectURLs = new Map<string, { url: string; expiresAt: number }>()
let coverDatabase: Promise<IDBDatabase> | undefined

function getCacheId(id: string) {
    return `${window.localStorage.getItem('URL') ?? ''}:${id}`
}

function openCoverDatabase() {
    if (!coverDatabase) {
        coverDatabase = new Promise((resolve, reject) => {
            const request = window.indexedDB.open(COVER_CACHE_DB, 1)
            request.onupgradeneeded = () => {
                request.result.createObjectStore(COVER_CACHE_STORE)
            }
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(request.error)
        })
    }

    return coverDatabase
}

async function readCachedCover(cacheId: string): Promise<CoverCacheEntry | undefined> {
    const database = await openCoverDatabase()
    return new Promise((resolve, reject) => {
        const request = database.transaction(COVER_CACHE_STORE, 'readonly')
            .objectStore(COVER_CACHE_STORE)
            .get(cacheId)
        request.onsuccess = () => resolve(request.result as CoverCacheEntry | undefined)
        request.onerror = () => reject(request.error)
    })
}

async function deleteCachedCover(cacheId: string) {
    const database = await openCoverDatabase()
    await new Promise<void>((resolve, reject) => {
        const request = database.transaction(COVER_CACHE_STORE, 'readwrite')
            .objectStore(COVER_CACHE_STORE)
            .delete(cacheId)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
    })
}

async function loadCover(item: any) {
    const cached = await getCoverFromCache(item.id)
    if (cached) {
        item.cover = cached
        return cached
    }

    const imageURL = await authAndUseAPI("getCoverArt", ["id", item.id])
    const data = imageURL?.data

    if (data) {
        await setCoverToCache(item.id, data)
        item.cover = data
    }

    return data
}

async function getCoverFromCache(id: string): Promise<string | null> {
    const cacheId = getCacheId(id)
    const inMemoryURL = coverObjectURLs.get(cacheId)
    if (inMemoryURL && inMemoryURL.expiresAt > Date.now()) return inMemoryURL.url
    if (inMemoryURL) {
        URL.revokeObjectURL(inMemoryURL.url)
        coverObjectURLs.delete(cacheId)
    }

    try {
        const cached = await readCachedCover(cacheId)
        if (!cached) return null
        if (cached.expiresAt <= Date.now()) {
            await deleteCachedCover(cacheId)
            return null
        }

        const objectURL = URL.createObjectURL(cached.blob)
        coverObjectURLs.set(cacheId, { url: objectURL, expiresAt: cached.expiresAt })
        return objectURL
    } catch {
        return null
    }
}

async function setCoverToCache(id: string, data: string, ttlMs = COVER_CACHE_TTL_MS) {
    if (!data.startsWith('blob:')) return

        const blob = await (await fetch(data)).blob()
        const database = await openCoverDatabase()
        const cacheId = getCacheId(id)
        await new Promise<void>((resolve, reject) => {
            const request = database.transaction(COVER_CACHE_STORE, 'readwrite')
                .objectStore(COVER_CACHE_STORE)
                .put({ blob, expiresAt: Date.now() + ttlMs } satisfies CoverCacheEntry, cacheId)
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
        })
        coverObjectURLs.set(cacheId, { url: data, expiresAt: Date.now() + ttlMs })
}

export {
    loadCover,
    getCoverFromCache,
    setCoverToCache
}
