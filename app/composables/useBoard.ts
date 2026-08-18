import type { TimeFrame } from '~/types/card'
import { useCardsStore } from '~/stores/cards'

export function useBoard() {
  const cards = useCardsStore()
  // useState (not a plain ref) so AppHeader's search box and the board page
  // share the same reactive state -- useBoard() is called from both.
  const activeTimeFrame = useState<TimeFrame>('board-active-time-frame', () => 'daily')
  const searchQuery = useState<string>('board-search-query', () => '')

  const activeCards = computed(() => {
    const list = cards.cardsInTimeFrame(activeTimeFrame.value)
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) return list
    return list.filter(card => card.title.toLowerCase().includes(query))
  })

  return {
    activeTimeFrame,
    activeCards,
    searchQuery
  }
}
