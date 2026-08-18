<script setup lang="ts">
import { groupCardsByTag } from '~/utils/collections'

const cardsStore = useCardsStore()

onMounted(() => {
  cardsStore.fetchBoard()
})

const groups = computed(() => groupCardsByTag(cardsStore.cards))
const activeTag = ref<string | null>(null)

const activeCards = computed(() => {
  if (!activeTag.value) return []
  return groups.value.find(g => g.tag === activeTag.value)?.cards ?? []
})

watch(groups, (next) => {
  if (activeTag.value && !next.some(g => g.tag === activeTag.value)) activeTag.value = null
  else if (!activeTag.value && next.length) activeTag.value = next[0].tag
}, { immediate: true })
</script>

<template>
  <div>
    <p v-if="cardsStore.error" class="mb-3 text-sm text-red-600">
      {{ cardsStore.error }}
    </p>

    <h1 class="mb-3 text-lg font-semibold text-gray-800">
      索引 · 專題
    </h1>

    <p v-if="!groups.length" class="text-sm text-gray-400">
      還沒有任何 #Tag——在 Rapid Log 輸入時加上 #標籤 就會自動出現在這裡。
    </p>

    <template v-else>
      <div class="mb-4 flex flex-wrap gap-1.5">
        <button
          v-for="group in groups"
          :key="group.tag"
          type="button"
          class="rounded-full px-3 py-1 text-xs font-medium"
          :class="activeTag === group.tag ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          @click="activeTag = group.tag"
        >
          #{{ group.tag }} <span class="opacity-60">{{ group.cards.length }}</span>
        </button>
      </div>

      <div class="space-y-2">
        <BujoCard v-for="card in activeCards" :key="card.id" :card="card" />
      </div>
    </template>
  </div>
</template>
