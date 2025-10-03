<script lang="ts">
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import { authStore } from '$lib/stores/auth.store';
  import { onMount } from 'svelte';

  // --- Tipos de Dados ---
  type Variation = { id: string; name: string; price: number };
  type Service = { 
    id: string; 
    title: string; 
    description: string; 
    service_type: { name: string };
    provider: { name: string };
    variations: Variation[];
  };
  type ServiceType = { id: string; name: string };

  // --- Estado ---
  let allServices = $state<Service[]>([]);
  let filteredServices = $state<Service[]>([]);
  let serviceTypes = $state<ServiceType[]>([]);
  let isLoading = $state(true);
  let searchQuery = $state('');
  let selectedTypeId = $state('all');

  const user = authStore.user;

  onMount(() => {
    loadData();
  });

  async function loadData() {
    isLoading = true;
    try {
      const [servicesData, serviceTypesData] = await Promise.all([
        api.getServices(),
        api.getServiceTypes()
      ]);
      allServices = servicesData;
      filteredServices = servicesData;
      serviceTypes = serviceTypesData;
    } catch (error) {
      console.error('Erro ao carregar dados do marketplace:', error);
    } finally {
      isLoading = false;
    }
  }

  // Correção: Usar $effect para reatividade
  $effect(() => {
    let filtered = allServices;

    if (selectedTypeId !== 'all') {
      // Assumindo que a API não filtra, filtramos no frontend
      // O ideal seria a API fazer isto: api.getServices(selectedTypeId)
      filtered = filtered.filter(service => service.service_type?.id === selectedTypeId);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(service =>
        service.title.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query)
      );
    }
    filteredServices = filtered;
  });

  function getMinPrice(variations: Variation[]) {
    if (!variations || variations.length === 0) return 0;
    return Math.min(...variations.map(v => v.price));
  }

  function logout() {
    authStore.logout();
    goto('/');
  }
</script>

<div class="min-h-screen flex flex-col">
  <!-- Header -->
  <header class="border-b border-border sticky top-0 bg-background z-10">
    <div class="container mx-auto px-4 py-4 flex items-center justify-between">
      <a href="/marketplace">
        <h1 class="text-2xl font-bold">ServiceHub</h1>
      </a>

      <div class="flex items-center gap-4">
        {#if $user}
          {#if $user.role === 'client'}
            <a
              href="/client/bookings"
              class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Minhas Reservas
            </a>
          {/if}
          {#if $user.role === 'provider'}
            <a
              href="/provider/dashboard"
              class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Dashboard
            </a>
          {/if}
          <button
            onclick={logout}
            class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Sair
          </button>
        {:else}
          <a
            href="/login"
            class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Entrar
          </a>
          <a
            href="/register"
            class="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Começar
          </a>
        {/if}
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 container mx-auto px-4 py-8">
    <div class="mb-8">
      <h2 class="text-4xl font-bold mb-2">Descubra Serviços</h2>
      <p class="text-muted-foreground text-lg">Encontre o provedor de serviços perfeito para suas necessidades</p>
    </div>

    <!-- Filters -->
    <div class="flex flex-col md:flex-row gap-4 mb-8">
      <div class="relative flex-1">
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Buscar serviços..."
          class="flex h-10 w-full rounded-md border border-input bg-background pl-4 pr-3 py-2 text-sm"
        />
      </div>
      <select
        bind:value={selectedTypeId}
        class="flex h-10 w-full md:w-64 rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        <option value="all">Todos os Tipos</option>
        {#each serviceTypes as type}
          <option value={type.id}>{type.name}</option>
        {/each}
      </select>
    </div>

    <!-- Services Grid -->
    {#if isLoading}
      <div class="text-center py-12">Carregando serviços...</div>
    {:else if filteredServices.length === 0}
      <div class="rounded-lg border border-border bg-card p-12 text-center">
        <p class="text-muted-foreground">Nenhum serviço encontrado com os critérios selecionados</p>
      </div>
    {:else}
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {#each filteredServices as service}
          <a
            href={`/service/${service.id}`}
            class="rounded-lg border border-border bg-card transition-colors hover:border-primary"
          >
            <div class="p-6">
              <div class="flex justify-between items-start mb-2">
                <span class="rounded-md bg-secondary px-2 py-1 text-xs">
                  {service.service_type?.name || 'Sem Categoria'}
                </span>
                <span class="text-sm text-muted-foreground">por {service.provider?.name || 'Provedor'}</span>
              </div>
              <!-- Correção: service.title em vez de service.name -->
              <h3 class="text-xl font-bold mb-1">{service.title}</h3>
              <p class="text-sm text-muted-foreground line-clamp-2 mb-4">{service.description}</p>
              
              <div class="space-y-4">
                <div>
                  <p class="text-sm text-muted-foreground mb-2">A partir de</p>
                  <p class="text-2xl font-bold">${getMinPrice(service.variations)}</p>
                </div>
                <div
                  class="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Ver Detalhes
                </div>
              </div>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </main>
</div>
