<template>
  <div class="page-container">

    <div id="top-bar">

      <h1>Subsonic Server</h1>

      <s-icon-button @click="openAddDialog" id="add-button">
        <s-icon>
          <ms-icon name="add"></ms-icon>
        </s-icon>
        <AddServerDIalog v-model:name="name" v-model:rawURL="rawURL" v-model:username="username"
          v-model:password="password" v-model:opened="isDialogOpened" :title="editingIndex === null ? 'Add Server' : 'Edit Server'" @confirm="saveServer()"></AddServerDIalog>
      </s-icon-button>

    </div>

    <div id="options-container">
      <s-card class="server-option-container" v-for="(item, index) in serverInfoStore.serverInfo" :key="index" clickable @click="useServer(index)">
        <p>{{ item.name }}</p>
        <p style="color: var(--s-color-outline);">{{ item.url }}</p>

        <s-picker class="region-picker" variant="text" @click.stop>
          <s-icon slot="end">
            <ms-icon name="more_vert"></ms-icon>
          </s-icon>
          <s-picker-item text="Edit" @click.stop="editServer(index)">Edit</s-picker-item>
          <s-picker-item text="Delete" @click.stop="deleteServer(index)">Delete</s-picker-item>
        </s-picker>
      </s-card>
    </div>

  </div>
</template>

<script lang="ts" setup>
import 'ms-icon/add'
import 'ms-icon/more_vert'

import { authAndUseAPI, encrypt } from '@/utils/auth'
import { showAlert } from '@/utils/float-alert'
import type { ServerInfo } from '@/store/server-info'
import { router } from '@/entrypoints/popup/router'
import { useServerInfoStore } from '@/store/server-info'
import AddServerDIalog from '@/components/encapsulation/AddServerDIalog.vue'

const serverInfoStore = useServerInfoStore()

if (window.localStorage.getItem('username')) {
  // router.replace('/home')
}

const name = ref<string>('')
const rawURL = ref<string>('')
const username = ref<string>('')
const password = ref<string>('')
const isDialogOpened = ref(false)
const editingIndex = ref<number | null>(null)

const clearForm = () => {
  name.value = ''
  rawURL.value = ''
  username.value = ''
  password.value = ''
}

const openAddDialog = () => {
  editingIndex.value = null
  clearForm()
  isDialogOpened.value = true
}

const editServer = (index: number) => {
  const server = serverInfoStore.serverInfo[index]
  if (!server) return

  editingIndex.value = index
  name.value = server.name
  rawURL.value = server.url.href
  username.value = server.username
  password.value = ''
  isDialogOpened.value = true
}

const useServer = (index: number) => {
  const server = serverInfoStore.serverInfo[index]
  if (!server) return

  serverInfoStore.nowUsingIndex = index
  window.localStorage.setItem('username', server.username || server.name)
  router.push('/home')
}

const deleteServer = (index: number) => {
  const wasUsingDeletedServer = serverInfoStore.nowUsingIndex === index
  serverInfoStore.serverInfo.splice(index, 1)

  if (serverInfoStore.serverInfo.length === 0) {
    serverInfoStore.nowUsingIndex = 0
    window.localStorage.removeItem('username')
    router.replace('/addserver')
    return
  }

  if (wasUsingDeletedServer) {
    serverInfoStore.nowUsingIndex = Math.min(index, serverInfoStore.serverInfo.length - 1)
  } else if (serverInfoStore.nowUsingIndex > index) {
    serverInfoStore.nowUsingIndex -= 1
  }

  const activeServer = serverInfoStore.serverInfo[serverInfoStore.nowUsingIndex]
  if (activeServer) window.localStorage.setItem('username', activeServer.username || activeServer.name)
}

const saveServer = async () => {
  const serverName = name.value?.trim() || 'New Server'
  const serverURL = rawURL.value?.trim()
  const serverUsername = username.value?.trim() || ''
  const serverPassword = password.value || ''

  if (!serverURL) {
    showAlert({
      content: 'Please enter the server URL',
      type: 'error',
    })
    return
  }

  let normalizedURL: URL

  try {
    normalizedURL = new URL(serverURL)
  } catch {
    showAlert({
      content: 'The server URL is invalid',
      type: 'error',
    })
    return
  }

  const targetIndex = editingIndex.value
  const previousIndex = serverInfoStore.nowUsingIndex
  const previousServer = targetIndex === null ? undefined : serverInfoStore.serverInfo[targetIndex]

  if (targetIndex === null && !serverPassword) {
    showAlert({
      content: 'Please enter the server password',
      type: 'error',
    })
    return
  }

  const updatedServer: ServerInfo = {
    name: serverName,
    url: new URL('/rest/', normalizedURL),
    username: serverUsername,
    ...(previousServer && !serverPassword
      ? { token: previousServer.token, salt: previousServer.salt, password: previousServer.password }
      : { password: serverPassword }),
  }

  if (targetIndex === null) {
    serverInfoStore.serverInfo.push(updatedServer)
  } else {
    serverInfoStore.serverInfo[targetIndex] = updatedServer
  }
  const serverIndex = targetIndex ?? serverInfoStore.serverInfo.length - 1
  serverInfoStore.nowUsingIndex = serverIndex

  try {
    if (serverPassword || targetIndex === null) {
      await encrypt(serverIndex)
    }
    const saveResult = await authAndUseAPI('ping')

    if (saveResult?.message === 'authenticated') {
      showAlert({
        content: targetIndex === null ? 'The server has been added successfully' : 'The server has been updated successfully',
        type: 'success',
      })

      serverInfoStore.nowUsingIndex = targetIndex === null ? serverIndex : previousIndex
      const activeServer = serverInfoStore.serverInfo[serverInfoStore.nowUsingIndex]
      if (activeServer) window.localStorage.setItem('username', activeServer.username || activeServer.name)
      clearForm()
      editingIndex.value = null
      isDialogOpened.value = false
      return
    }

    if (targetIndex === null) {
      serverInfoStore.serverInfo.splice(serverIndex, 1)
    } else if (previousServer) {
      serverInfoStore.serverInfo[targetIndex] = previousServer
    }
    serverInfoStore.nowUsingIndex = previousIndex
    showAlert({
      content: 'Failed to verify the server settings',
      type: 'error',
    })
  } catch (error) {
    if (targetIndex === null) {
      serverInfoStore.serverInfo.splice(serverIndex, 1)
    } else if (previousServer) {
      serverInfoStore.serverInfo[targetIndex] = previousServer
    }
    serverInfoStore.nowUsingIndex = previousIndex
    showAlert({
      content: 'Failed to save server settings',
      type: 'error',
    })
  }
}
</script>

<style scoped>
h1 {
  font-size: 1.3rem;
  margin-top: 20px;
}

.page-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 101;
  background-color: var(--s-color-surface-container-lowest);
  width: 100vw;
  height: 100vh;
}

#top-bar {
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 20px 0 20px;
  margin-top: 10px;
  align-items: center;
  box-sizing: border-box;
}

.region-picker {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  margin-right: 10px;
}

#options-container {
  padding-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.server-option-container {
  width: 90vw;
  height: 60px;
  position: relative;
  background-color: transparent;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding-left: 10px;
}

.server-option-container p {
  margin: 0;
  line-height: 1.2;
}
</style>
