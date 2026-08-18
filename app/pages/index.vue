<script setup lang="ts">
const cardsStore = useCardsStore()
const habitsStore = useHabitsStore()
const { activeTimeFrame, activeCards } = useBoard()

onMounted(() => {
  cardsStore.fetchBoard()
})
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

    <DailyTimeBlockView v-if="activeTimeFrame === 'daily'" :cards="activeCards" />
    <MonthlyLogView v-else-if="activeTimeFrame === 'monthly'" :cards="activeCards" />
    <template v-else>
      <BucketProgressSummary :time-frame="activeTimeFrame" :cards="activeCards" />
      <BoardColumn :time-frame="activeTimeFrame" :cards="activeCards" />
    </template>

    <RapidLogInput />
  </div>
</template>
