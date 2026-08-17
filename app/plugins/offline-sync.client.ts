export default defineNuxtPlugin(() => {
  const cards = useCardsStore()
  cards.hydratePendingQueue()
  window.addEventListener('online', () => cards.flushOfflineQueue())
})
