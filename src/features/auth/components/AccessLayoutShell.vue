<template>
  <main class="auth-shell">
    <section class="auth-brand-panel">
      <div class="relative z-10 flex w-full flex-col justify-between gap-10">
        <div class="max-w-xl">
          <p class="section-label mb-5 border-white/10 bg-white/10 text-white">Team invitation</p>
          <h1 class="display-section max-w-lg text-white md:text-6xl">
            Complete your secure Totistack access.
          </h1>
          <p class="mt-6 max-w-xl text-base leading-8 text-white/72 md:text-lg">
            Your workspace access has been prepared by an administrator. Finish setup once, then enter the system with the right role and permissions.
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <article class="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <p class="text-caption text-white/55">Invite protected</p>
            <p class="mt-2 text-sm font-semibold text-white">Only invited staff can activate access and enter the system.</p>
          </article>
          <article class="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <p class="text-caption text-white/55">Time limited</p>
            <p class="mt-2 text-sm font-semibold text-white">Links can expire, be revoked, or be extended without public registration.</p>
          </article>
          <article class="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <p class="text-caption text-white/55">Role ready</p>
            <p class="mt-2 text-sm font-semibold text-white">Accounts inherit department, role, and permission setup from the invite.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="auth-form-panel bg-hero-gradient">
      <div class="w-full max-w-xl">
        <div class="mb-8 text-center lg:hidden">
          <p class="section-label mb-4">Invitation access</p>
          <h1 class="page-title">Activate your account</h1>
          <p class="page-subtitle mx-auto mt-3">
            This page is only for invited team members.
          </p>
        </div>
        <slot />
      </div>
    </section>
  </main>
</template>
