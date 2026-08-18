<script setup lang="ts">
import { TIME_FRAME_LABELS } from '~/utils/timeFrameLabel'

const cardsStore = useCardsStore()
const habitsStore = useHabitsStore()
const { activeTimeFrame, activeCards } = useBoard()

onMounted(() => {
  cardsStore.fetchBoard()
})

const openCardCount = computed(() =>
  activeCards.value.filter(c => c.bujo_symbol === 'task' || c.bujo_symbol === 'priority').length
)
const showAssistant = ref(false)
</script>

<template>
  <div>
    <p v-if="cardsStore.error" class="mb-3 text-sm text-red-600">
      {{ cardsStore.error }}
    </p>
    <p v-if="habitsStore.error" class="mb-3 text-sm text-red-600">
      {{ habitsStore.error }}
    </p>

    <LogTabs v-model="activeTimeFrame" />

    <button
      type="button"
      class="mb-3 flex w-full items-center justify-between rounded-md border border-dashed border-gray-200 px-3 py-1.5 text-xs text-gray-400 hover:border-gray-300 hover:text-gray-600"
      @click="showAssistant = true"
    >
      <span>{{ TIME_FRAME_LABELS[activeTimeFrame] }}結算助手</span>
      <span v-if="openCardCount">{{ openCardCount }} 項待處理</span>
    </button>

    <DailyTimeBlockView v-if="activeTimeFrame === 'daily'" :cards="activeCards" />
    <MonthlyLogView v-else-if="activeTimeFrame === 'monthly'" :cards="activeCards" />
    <template v-else>
      <BucketProgressSummary :time-frame="activeTimeFrame" :cards="activeCards" />
      <BoardColumn :time-frame="activeTimeFrame" :cards="activeCards" />
    </template>

    <RapidLogInput />

    <MigrationAssistant
      v-if="showAssistant"
      :time-frame="activeTimeFrame"
      :cards="cardsStore.cards"
      @close="showAssistant = false"
    />
  </div>
</template>
