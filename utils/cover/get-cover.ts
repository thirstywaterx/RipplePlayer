import { authAndUseAPI } from '@/utils/auth'
import { loadCover } from '@/utils/cover/cover-cache'

function getNestedValue(obj: any, path: string) {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((prev, curr) => prev?.[curr], obj);
}

//if it already has the data that needs to load the cover, use this function
export async function loadCovers(...lists: any[][]) {
    const items = lists.flat()
    await Promise.all(items.map((item) => loadCover(item)))
    return lists
}

export async function getCover(
    apiName: string,
    keys: string[],
    ...args: [string, string | null][]
) {
    const infoResponse = await authAndUseAPI(apiName, ...args)
    if (!infoResponse?.data) return

    const resultList: any[] = []

    for (const key of keys) {
        const list = getNestedValue(infoResponse.data, key) ?? []
        for (const item of list) {
            resultList.push(item)
        }
    }

    await loadCovers(resultList)
    return resultList
}