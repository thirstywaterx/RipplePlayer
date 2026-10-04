<template>
    <s-dialog attached :opened="opened" @close="opened = false">
            <div slot="title">{{ title }}</div>
            <div class="fields-container">
                <div class="field-item" v-for="item in fields" :key="item.icon">
                    <s-icon><ms-icon :name="item.icon"></ms-icon></s-icon>
                    <s-text-field :label="item.label" :type="item.type"
                        :showPasswordToggle="item.isPasswordToggleShowed" :placeholder="item.placeholder"
                        v-model="item.value.value"></s-text-field>
                </div>
            </div>
            <s-button slot="action" variant="text" @click="opened = false">Cancel</s-button>
            <s-button slot="action" variant="text" @click="emit('confirm')">Confirm</s-button>
    </s-dialog>
</template>

<script setup lang="ts">
import 'ms-icon/dns'
import 'ms-icon/person'
import 'ms-icon/password'
import 'ms-icon/label'


const name = defineModel<string>('name', { default: '' })
const rawURL = defineModel<string>('rawURL', { default: '' })
const username = defineModel<string>('username', { default: '' })
const password = defineModel<string>('password', { default: '' })
const opened = defineModel<boolean>('opened', { default: false })
defineProps<{ title: string }>()
const emit = defineEmits(['confirm'])
type password = 'password';

const fields = [
    {
        icon: 'label',
        label: 'Server Name',
        placeholder: 'My server',
        value: name,
    },
    {
        icon: 'dns',
        label: 'Server URL',
        placeholder: 'https://example.com:4533/',
        value: rawURL,
    },
    {
        icon: 'person',
        label: 'Username',
        value: username,
    },
    {
        icon: 'password',
        label: 'Password',
        value: password,
        type: 'password' as password,
        isPasswordToggleShowed: 'true' as any,
    },
]
</script>

<style scoped>
s-dialog {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.fields-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
  width: min(85%, 420px);
  margin-inline: auto;
}

s-text-field {
  flex: 1;
  min-width: 0;
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
  flex: 0 0 24px;
  align-items: center;
  justify-content: center;
}

s-button {
  margin-top: 50px;
}
</style>