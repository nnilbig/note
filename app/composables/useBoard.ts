import { useCardsStore } from '~/stores/cards'

export function useBoard() {
  const cards = useCardsStore()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const activeBucket = ref<'week' | 'month'>('week')

  return {
    weekCards: computed(() => cards.weekCards),
    monthCards: computed(() => cards.monthCards),
    isMobile,
    activeBucket
  }
}
