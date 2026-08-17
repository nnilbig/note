<script setup lang="ts">
const cardsStore = useCardsStore()
const { activeBucket, activeCards } = useBoard()

onMounted(() => {
  cardsStore.fetchBoard()
})
</script>

<template>
  <div>
    <p v-if="cardsStore.error" class="mb-3 text-sm text-red-600">
      {{ cardsStore.error }}
    </p>

    <LogTabs v-model="activeBucket" />

    <BucketProgressSummary :bucket="activeBucket" :cards="activeCards" />

    <BoardColumn :bucket="activeBucket" :cards="activeCards" />

    <RapidLogInput />
  </div>
</template>
