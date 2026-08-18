import { parseRapidLogEntry } from '~/utils/parseRapidLog'
import { useCardsStore } from '~/stores/cards'

export function useRapidLogInput() {
  const draft = ref('')
  const cards = useCardsStore()
  const { activeTimeFrame } = useBoard()

  function submit() {
    if (!draft.value.trim()) return
    const parsed = parseRapidLogEntry(draft.value)
    cards.addCard(parsed, activeTimeFrame.value)
    draft.value = ''
  }

  return { draft, submit }
}
