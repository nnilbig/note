<script setup lang="ts">
import { LogOut } from '@lucide/vue'

const supabase = useSupabaseClient()
const cards = useCardsStore()

async function logout() {
  await supabase.auth.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <header class="border-b border-gray-200 bg-white">
    <div class="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
      <span class="font-semibold text-gray-800">{{ cards.workspace?.name ?? 'WHONEXT' }}</span>
      <button
        type="button"
        class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        @click="logout"
      >
        <LogOut :size="16" />
        登出
      </button>
    </div>
  </header>
</template>
