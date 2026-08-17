<script setup lang="ts">
const cardsStore = useCardsStore()
const { weekCards, monthCards, isMobile, activeBucket } = useBoard()

onMounted(() => {
  cardsStore.fetchBoard()
})
</script>

<template>
  <div>
    <RapidLogInput />

    <p v-if="cardsStore.error" class="mb-3 text-sm text-red-600">
      {{ cardsStore.error }}
    </p>

    <WeekMonthToggle v-if="isMobile" v-model="activeBucket" />

    <div v-if="isMobile">
      <h2 class="mb-2 text-sm font-medium text-gray-500">
        {{ activeBucket === 'week' ? '本週' : '本月' }}
      </h2>
      <BoardColumn
        :bucket="activeBucket"
        :cards="activeBucket === 'week' ? weekCards : monthCards"
      />
    </div>

    <div v-else class="grid grid-cols-2 gap-4">
      <div>
        <h2 class="mb-2 text-sm font-medium text-gray-500">
          本週
        </h2>
        <BoardColumn bucket="week" :cards="weekCards" />
      </div>
      <div>
        <h2 class="mb-2 text-sm font-medium text-gray-500">
          本月
        </h2>
        <BoardColumn bucket="month" :cards="monthCards" />
      </div>
    </div>
  </div>
</template>
