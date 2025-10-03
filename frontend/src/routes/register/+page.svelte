<script lang="ts">
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import { authStore } from '$lib/stores/auth.store';

  let name = $state('');
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let role = $state<'client' | 'provider'>('client');
  let isLoading = $state(false);
  let error = $state('');

  async function handleSubmit(e: Event) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      error = 'As senhas não coincidem';
      return;
    }

    isLoading = true;
    error = '';

    try {
      await api.register(name, email, password, role);

      const loginResponse = await api.login(email, password);
      
      authStore.login(loginResponse.user, loginResponse.token);

      if (role === 'provider') {
        goto('/provider/dashboard', { replaceState: true });
      } else {
        goto('/marketplace', { replaceState: true });
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Erro ao criar conta';
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="flex min-h-screen items-center justify-center p-4">
  <div class="w-full max-w-md space-y-8">
    <div class="space-y-2 text-center">
      <h1 class="text-3xl font-bold">Criar Conta</h1>
      <p class="text-muted-foreground">Preencha os dados para começar</p>
    </div>

    <form onsubmit={handleSubmit} class="space-y-6">
      {#if error}
        <div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      {/if}

      <div class="space-y-2">
        <label for="name" class="text-sm font-medium">Nome Completo</label>
        <input
          id="name"
          type="text"
          bind:value={name}
          required
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="João Silva"
        />
      </div>

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

      <div class="space-y-2">
        <label for="confirmPassword" class="text-sm font-medium">Confirmar Senha</label>
        <input
          id="confirmPassword"
          type="password"
          bind:value={confirmPassword}
          required
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div class="space-y-2">
        <fieldset class="space-y-2">
          <legend class="text-sm font-medium">Eu quero</legend>
          <div class="space-y-2">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                bind:group={role}
                value="client"
                class="h-4 w-4 border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              <span class="text-sm">Contratar serviços</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                bind:group={role}
                value="provider"
                class="h-4 w-4 border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              <span class="text-sm">Oferecer serviços</span>
            </label>
          </div>
        </fieldset>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        class="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
      >
        {isLoading ? 'Criando conta...' : 'Criar Conta'}
      </button>
    </form>

    <div class="text-center text-sm text-muted-foreground">
      Já tem uma conta?
      <a href="/login" class="text-primary hover:underline">Entrar</a>
    </div>
  </div>
</div>

