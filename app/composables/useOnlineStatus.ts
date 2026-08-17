export function useOnlineStatus() {
  const online = ref(import.meta.client ? navigator.onLine : true)

  if (import.meta.client) {
    useEventListener(window, 'online', () => { online.value = true })
    useEventListener(window, 'offline', () => { online.value = false })
  }

  return { isOnline: online }
}
