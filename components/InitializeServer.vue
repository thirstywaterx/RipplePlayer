<template>
  <div class="page-container">

    <h1>Subsonic Server</h1>

    <div class="fields-container">
      <span class="field-item" v-for="item in fields" :key="item.icon">
        <s-icon><ms-icon :name="item.icon"></ms-icon></s-icon>
        <s-text-field :label="item.label" :type="item.type" :showPasswordToggle="item.isPasswordToggleShowed"
          :placeholder="item.placeholder"
          @input="(e: any) => item.value.value = e.target?.value ?? e.detail ?? e"></s-text-field>
      </span>
    </div>

    <s-button @click="handleApply">
      <s-icon slot="start"><ms-icon name="check"></ms-icon></s-icon>
      Apply
    </s-button>
  </div>
</template>

<script lang="ts" setup>
import 'ms-icon/dns'
import 'ms-icon/person'
import 'ms-icon/password'
import 'ms-icon/check'

import { authAndUseAPI, encrypt } from '@/utils/auth'
import type { ServerInfo } from '@/utils/auth'
import { router } from '@/entrypoints/popup/router'

//judge if it has initialized
if (window.localStorage.getItem("username")) {
  router.replace('/home')
}

type password = 'password';

const rawURL = ref<string>()
const username = ref<string>()
const password = ref<string>()

const fields = [
  {
    icon: "dns",
    label: "Server URL",
    placeholder: "https://example.com:4533/",
    value: rawURL
  },
  {
    icon: "person",
    label: "Username",
    value: username
  },
  {
    icon: "password",
    label: "Password",
    value: password,
    type: "password" as password,
    isPasswordToggleShowed: "true" as any
  }
]

addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    handleApply()
  }
})

const handleApply = async () => {
  const serverInfo: ServerInfo = {
    URL: new URL('/rest/', (rawURL as any)?.value) || '',
    username: (username as any)?.value || '',
    password: (password as any)?.value || ''
  }

  window.localStorage.setItem("URL", serverInfo.URL.href)

  await encrypt(serverInfo)
  const addResult = await authAndUseAPI("ping")

  if (addResult?.message === "authenticated") {
    showAlert({
      content: "The server has been added successfully",
      type: "success"
    })

      router.replace('/home')
  }

}
</script>

<style scoped>
h1 {
  position: absolute;
  font-size: 1.3rem;
  margin-top: 20px;
}

.page-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.fields-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 80px;
  width: 85%;
}

s-text-field {
  width: 100%;
  height: auto;
  margin-top: 0;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

s-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

s-button {
  margin-top: 50px;
}
</style>
