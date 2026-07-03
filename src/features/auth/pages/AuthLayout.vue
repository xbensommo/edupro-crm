<template>
  <main class="auth-shell">
    <section class="auth-brand-panel">
      <div class="relative z-10 flex w-full flex-col justify-between">
        <div class="max-w-xl">
          <p class="section-label mb-5 border-white/10 bg-white/10 text-white">
              EduPro LIC
          </p>
          <h1 class="display-section max-w-lg text-white md:text-6xl">
            Secure access for EduPro LIC Team.
          </h1>
          <p class="mt-6 max-w-xl text-base leading-8 text-white/72 md:text-lg">
            Secured <a href="https://www.totisoft.com" target="_blank" rel="canonical" class="underline">www.totisoft.com</a>.
          </p>
          <div class="grid gap-4 md:grid-cols-3 mt-10">
          
          <article class="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <p class="text-caption text-white/55">Maintained BY</p>
            <p class="mt-2 text-sm font-semibold text-white">
              <a href="https://www.totisoft.com" target="_blank">TotiSoft Cc</a>
            </p>
          </article>
        </div>
        </div>
      </div>
    </section>

    <section class="auth-form-panel bg-hero-gradient">
      <div class="w-full max-w-xl">
        <div class="mb-8 text-center lg:hidden">
          <p class="section-label mb-4">Authentication</p>
          <h1 class="page-title">Sign in to your account</h1>
        </div>
        <RouterView />
      </div>
    </section>
  </main>
</template>

<script setup>
import { RouterView } from 'vue-router';
</script>