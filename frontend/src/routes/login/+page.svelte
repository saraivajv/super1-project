<script lang="ts">
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import { authStore } from '$lib/stores/auth.store';

  let email = $state('');
  let password = $state('');
  let isLoading = $state(false);
  let error = $state('');

  async function handleSubmit(e: Event) {
    e.preventDefault();
    isLoading = true;
    error = '';

    try {
      const response = await api.login(email, password);
      authStore.login(response.user, response.token);

      if (response.user.role === 'provider') {
        goto('/provider/dashboard', { replaceState: true });
      } else {
        goto('/marketplace', { replaceState: true });
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Erro ao fazer login';
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="flex min-h-screen items-center justify-center p-4">
  <div class="w-full max-w-md space-y-8">
    <div class="space-y-2 text-center">
      <h1 class="text-3xl font-bold">Entrar</h1>
      <p class="text-muted-foreground">Entre com suas credenciais para acessar sua conta</p>
    </div>

    <form onsubmit={handleSubmit} class="space-y-6">
      {#if error}
        <div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      {/if}

      <div class="space-y-2">
        <label for="email" class="text-sm font-medium">Email</label>
        <input
          id="email"
          type="email"
          bind:value={email}
          required
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="seu@email.com"
        />
      </div>

      <div class="space-y-2">
        <label for="password" class="text-sm font-medium">Senha</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          required
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        class="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
      >
        {isLoading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>

    <div class="text-center text-sm text-muted-foreground">
      Não tem uma conta?
      <a href="/register" class="text-primary hover:underline">Cadastre-se</a>
    </div>
  </div>
</div>
