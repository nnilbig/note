import { parseRapidLogEntry } from '~/utils/parseRapidLog'
import { useCardsStore } from '~/stores/cards'

export function useRapidLogInput() {
  const draft = ref('')
  const cards = useCardsStore()

  function submit() {
    if (!draft.value.trim()) return
    const parsed = parseRapidLogEntry(draft.value)
    cards.addCard(parsed)
    draft.value = ''
  }

  return { draft, submit }
}
