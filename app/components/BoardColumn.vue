<script setup lang="ts">
import draggable from 'vuedraggable'
import type { Card, TimeFrame } from '~/types/card'

const props = defineProps<{ timeFrame: TimeFrame, cards: Card[] }>()
const cardsStore = useCardsStore()

const localItems = ref<Card[]>([...props.cards])

watch(() => props.cards, (next) => {
  localItems.value = [...next]
})

function onChange() {
  const orderedIds = localItems.value.map(c => c.id)
  cardsStore.reorderCards(props.timeFrame, orderedIds)
}
</script>

<template>
  <draggable
    v-model="localItems"
    item-key="id"
    group="cards"
    handle=".drag-handle"
    :force-fallback="true"
    class="min-h-[80px] space-y-2"
    @change="onChange"
  >
    <template #item="{ element }">
      <BujoCard :card="element" />
    </template>
  </draggable>
</template>
