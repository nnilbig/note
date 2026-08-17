<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const user = useSupabaseUser()
const route = useRoute()

const errorDescription = computed(() => {
  const raw = route.query.error_description
  return typeof raw === 'string' ? raw.replace(/\+/g, ' ') : null
})

watch(user, (value) => {
  if (value) navigateTo('/')
}, { immediate: true })
</script>

<template>
  <div class="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
    <template v-if="errorDescription">
      <p class="mb-3 text-sm text-red-600">
        {{ errorDescription }}
      </p>
      <NuxtLink to="/login" class="text-sm font-medium text-gray-900 underline">
        重新申請登入連結
      </NuxtLink>
    </template>
    <p v-else class="text-sm text-gray-500">
      登入中…
    </p>
  </div>
</template>
