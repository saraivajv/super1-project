<script lang="ts">
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';

  onMount(() => {
    if (get(authStore.isAuthenticated)) {
      if (authStore.isProvider()) {
        goto('/provider/dashboard', { replaceState: true });
      } else {
        goto('/marketplace', { replaceState: true });
      }
    }
  });
</script>

<div class="flex min-h-screen flex-col items-center justify-center p-4">
  <div class="w-full max-w-md space-y-8 text-center">
    <div class="space-y-2">
      <h1 class="text-4xl font-bold tracking-tight">Marketplace de Serviços</h1>
      <p class="text-lg text-muted-foreground">
        Conecte-se com profissionais qualificados ou ofereça seus serviços
      </p>
    </div>

    <div class="flex flex-col gap-4 pt-8">
      <a
        href="/login"
        class="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Entrar
      </a>
      <a
        href="/register"
        class="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        Criar Conta
      </a>
      <a
        href="/marketplace"
        class="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Explorar serviços sem cadastro
      </a>
    </div>
  </div>
</div>
