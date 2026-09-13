<template>
  <div ref="dialogRef" class="alert-dialog" :class="{ closeAnimation: isClosing }">
    <s-alert :variant="props.type" closable @close="close()">
      <s-icon><ms-icon :name="alertIcon"></ms-icon></s-icon>
      {{ props.content }}
    </s-alert>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import 'ms-icon/info'
import 'ms-icon/check_circle'
import 'ms-icon/warning'

type AlertType = "info" | "error" | "warning" | "success"

const props = defineProps<{
  content: string
  type?: AlertType
  onClose?: () => void
}>()

const dialogRef = ref<HTMLElement | null>(null)
const isClosing = ref(false)

const alertIcon = computed(() => {
  switch (props.type) {
    case "warning": return "warning"
    case "success": return "check_circle"
    default: return "info"
  }
})

// 2. 修改 close 函数
const close = () => {
  if (isClosing.value) return
  isClosing.value = true

  if (dialogRef.value) {
    dialogRef.value.addEventListener(
      'animationend',
      () => {
        props.onClose?.()
      },
      { once: true }
    )
  } else {
    props.onClose?.()
  }
}

setTimeout(()=> close(),3000)
</script>

<style scoped>
.alert-dialog {
  position: fixed;
  width: 90%;
  left: 50%;
  bottom: -20px;
  transform: translate(-50%, -50%);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  animation: appear 0.2s ease-in-out forwards;
  opacity: 0;
  word-break: break-all;
}


.closeAnimation {
  animation: close 0.2s ease-in-out forwards;
}

@keyframes appear {
  from {
    bottom: -20px;
    opacity: 0;
  }
  to {
    bottom: 0%;
    opacity: 1;
  }
}

@keyframes close {
  from {
    bottom: 0%;
    opacity: 1;
  }
  to {
    bottom: -20px;
    opacity: 0;
  }
}
</style>