<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />
    <OfflineBanner />
    <main class="mx-auto max-w-3xl px-4 pb-28 pt-6">
      <slot />
    </main>
  </div>
</template>
