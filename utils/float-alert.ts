import { createVNode, render } from 'vue'
import AlertDialog from '@/components/encapsulation/FloatAlert.vue'

interface DialogOptions {
  onClose?: () => void;
  [key: string]: any; 
}

export function showAlert(options: DialogOptions) {
  const container = document.createElement('div')
  
  const destroy = () => {
    render(null, container)
    container.remove()
  }

  const vnode = createVNode(AlertDialog, {
    ...options,
    onClose: () => {
      if (options.onClose) options.onClose()
      destroy()
    }
  })

  render(vnode, container)
  document.body.appendChild(container)

  return { destroy }
}