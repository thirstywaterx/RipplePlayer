import { usePlayInfoStore } from "@/store/now-playing"
import { authAndUseAPI } from "@/utils/auth"

export async function downloadSong() {
    const playInfoStore = usePlayInfoStore()
    const songInfo = playInfoStore.songInfo
    const songId = songInfo.id

    if (songId == null) return

    const response = await authAndUseAPI("download", ["id", String(songId)])
    if (!response?.data) return

    const link = document.createElement("a")
    const title = typeof songInfo.title === "string" ? songInfo.title : String(songId)
    const suffix = typeof songInfo.suffix === "string" ? songInfo.suffix : ""
    link.href = response.data
    link.download = suffix ? `${title}.${suffix}` : title
    link.click()

    window.setTimeout(() => URL.revokeObjectURL(response.data), 1000)
}