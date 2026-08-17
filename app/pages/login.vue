<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const supabase = useSupabaseClient()
const email = ref('')
const password = ref('')
const mode = ref<'signin' | 'signup'>('signin')
const error = ref<string | null>(null)
const loading = ref(false)

async function submit() {
  if (!email.value.trim() || !password.value) return
  loading.value = true
  error.value = null

  const { error: authError } = mode.value === 'signin'
    ? await supabase.auth.signInWithPassword({ email: email.value.trim(), password: password.value })
    : await supabase.auth.signUp({ email: email.value.trim(), password: password.value })

  loading.value = false
  if (authError) {
    error.value = authError.message
    return
  }
  await navigateTo('/')
}
</script>

<template>
  <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <h1 class="mb-1 text-lg font-semibold text-gray-800">
      WHONEXT
    </h1>
    <p class="mb-4 text-sm text-gray-500">
      {{ mode === 'signin' ? '登入你的帳號' : '建立新帳號' }}
    </p>

    <input
      v-model="email"
      type="email"
      placeholder="you@example.com"
      class="mb-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
    >
    <input
      v-model="password"
      type="password"
      placeholder="密碼(至少 6 碼)"
      class="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
      @keyup.enter="submit"
    >
    <button
      type="button"
      class="w-full rounded-md bg-gray-900 py-2 text-sm font-medium text-white disabled:opacity-50"
      :disabled="loading"
      @click="submit"
    >
      {{ loading ? '處理中…' : (mode === 'signin' ? '登入' : '註冊') }}
    </button>

    <button
      type="button"
      class="mt-3 w-full text-center text-xs text-gray-500 underline"
      @click="mode = mode === 'signin' ? 'signup' : 'signin'; error = null"
    >
      {{ mode === 'signin' ? '還沒有帳號？註冊一個' : '已經有帳號？登入' }}
    </button>

    <p v-if="error" class="mt-2 text-sm text-red-600">
      {{ error }}
    </p>
  </div>
</template>
