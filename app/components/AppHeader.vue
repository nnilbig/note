<script setup lang="ts">
import { LogOut, Search, Tags } from '@lucide/vue'
import { formatHeaderDate } from '~/utils/isoWeek'

const supabase = useSupabaseClient()
const cards = useCardsStore()
const { searchQuery } = useBoard()
const headerDate = formatHeaderDate()

async function logout() {
  await supabase.auth.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <header class="border-b border-gray-200 bg-white">
    <div class="mx-auto max-w-3xl px-4 py-3">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs uppercase tracking-wide text-gray-400">
            {{ headerDate }}
          </p>
          <span class="font-semibold text-gray-800">{{ cards.workspace?.name ?? 'WHONEXT' }}</span>
        </div>
        <div class="flex items-center gap-3">
          <NuxtLink to="/collections" class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800" title="索引 · 專題">
            <Tags :size="16" />
          </NuxtLink>
          <button
            type="button"
            class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
            @click="logout"
          >
            <LogOut :size="16" />
            登出
          </button>
        </div>
      </div>
      <div class="relative mt-2">
        <Search :size="14" class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜尋卡片…"
          class="w-full rounded-md border border-gray-200 py-1.5 pl-8 pr-3 text-sm focus:border-gray-400 focus:outline-none"
        >
      </div>
    </div>
  </header>
</template>
