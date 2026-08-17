<script setup lang="ts">
const { isOnline } = useOnlineStatus()
const cards = useCardsStore()
</script>

<template>
  <div
    v-if="!isOnline || cards.pendingCards.length"
    class="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800"
  >
    <span v-if="!isOnline">離線中，顯示上次同步的資料</span>
    <span v-if="cards.pendingCards.length"> · {{ cards.pendingCards.length }} 筆卡片待同步</span>
    <button
      v-if="isOnline && cards.pendingCards.length"
      type="button"
      class="ml-2 underline"
      @click="cards.flushOfflineQueue()"
    >
      重試
    </button>
  </div>
</template>
