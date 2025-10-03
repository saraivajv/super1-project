<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
// CORREÇÃO: Importar a store do local correto.
  import { api } from '$lib/api';
  import { authStore } from '$lib/stores/auth.store';

  // --- Tipos de Dados (para alinhar com a nossa API) ---
  type Variation = {
    id?: string;
    name: string;
    price: number;
    duration_minutes: number;
  };
  type Service = {
    id: string;
    title: string;
    description: string;
    service_type: { id: string; name: string };
    variations: Variation[];
  };
  type ServiceType = {
    id: string;
    name: string;
  };
  type Availability = {
    id: string;
    day_of_week: number; // 0 (Domingo) a 6 (Sábado)
    start_time: string;
    end_time: string;
  };

  // --- Estado da Página ---
  let activeTab = $state<'services' | 'availability'>('services');
  let services = $state<Service[]>([]);
  let serviceTypes = $state<ServiceType[]>([]);
  let availabilities = $state<Availability[]>([]);
  let isLoading = $state(true);
  
  // --- Estado do Modal de Serviço ---
  let showServiceDialog = $state(false);
  let editingService = $state<Service | null>(null);
  let serviceTitle = $state('');
  let serviceDescription = $state('');
  let serviceTypeId = $state('');
  let serviceVariations = $state<Variation[]>([{ name: '', price: 0, duration_minutes: 30 }]);

  // --- Estado da Disponibilidade ---
  // Mapeia o dia da semana para o formato da nossa UI
  const weekDays = [
      { name: 'Domingo', number: 0 }, { name: 'Segunda-feira', number: 1 },
      { name: 'Terça-feira', number: 2 }, { name: 'Quarta-feira', number: 3 },
      { name: 'Quinta-feira', number: 4 }, { name: 'Sexta-feira', number: 5 },
      { name: 'Sábado', number: 6 }
  ];

  // Estrutura de dados para a UI da agenda
  let scheduleUi = $state(
    weekDays.map(day => ({
      name: day.name,
      number: day.number,
      enabled: false,
      startTime: '09:00',
      endTime: '17:00',
      id: null as string | null // Para guardar o ID da disponibilidade existente
    }))
  );
  
  onMount(() => {
    loadInitialData();
  });

  async function loadInitialData() {
    isLoading = true;
    try {
      // Carrega tudo em paralelo para maior performance
      const [servicesData, serviceTypesData, availabilitiesData] = await Promise.all([
        api.getProviderServices(),
        api.getServiceTypes(),
        api.getProviderAvailabilities()
      ]);
      services = servicesData;
      serviceTypes = serviceTypesData;
      availabilities = availabilitiesData;

      // Sincroniza a agenda da API com a nossa UI
      updateScheduleUiFromApi();

    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      isLoading = false;
    }
  }

  function updateScheduleUiFromApi() {
      scheduleUi.forEach(dayUi => {
          const apiAvailability = availabilities.find(a => a.day_of_week === dayUi.number);
          if (apiAvailability) {
              dayUi.enabled = true;
              dayUi.startTime = apiAvailability.start_time.substring(0, 5); // Formata para HH:mm
              dayUi.endTime = apiAvailability.end_time.substring(0, 5);
              dayUi.id = apiAvailability.id;
          } else {
              dayUi.enabled = false;
              dayUi.id = null;
          }
      });
  }

  function openServiceDialog(service: Service | null = null) {
    if (service) {
      editingService = service;
      serviceTitle = service.title;
      serviceDescription = service.description;
      serviceTypeId = service.service_type.id;
      // Clona as variações para evitar mutação direta
      serviceVariations = service.variations.map(v => ({...v}));
    } else {
      editingService = null;
      serviceTitle = '';
      serviceDescription = '';
      serviceTypeId = '';
      serviceVariations = [{ name: '', price: 0, duration_minutes: 30 }];
    }
    showServiceDialog = true;
  }

  async function saveService() {
    try {
      const serviceData = {
        title: serviceTitle,
        description: serviceDescription,
        service_type_id: serviceTypeId,
      };

      if (editingService) {
        // Atualiza o serviço principal
        await api.updateService(editingService.id, serviceData);
        // Lógica para atualizar/adicionar/remover variações seria mais complexa.
        // Por simplicidade, vamos apenas recarregar os dados.
      } else {
        // Cria o novo serviço
        const newService = await api.createService(serviceData);
        // Cria cada variação associada ao novo serviço
        for (const variation of serviceVariations) {
          await api.createServiceVariation(newService.id, variation);
        }
      }
      showServiceDialog = false;
      await loadInitialData(); // Recarrega tudo para mostrar as mudanças
    } catch (error) {
      console.error("Erro ao salvar serviço:", error);
      alert(`Erro ao salvar serviço: ${error.message}`);
    }
  }

  async function deleteService(id: string) {
    if (!confirm('Tem certeza que deseja apagar este serviço e todas as suas variações?')) return;
    try {
      await api.deleteService(id);
      await loadInitialData(); // Recarrega os dados
    } catch (error) {
      console.error("Erro ao apagar serviço:", error);
    }
  }

  async function saveAvailability() {
    try {
        // CORREÇÃO: Lógica para sincronizar a UI com a API
        // Percorremos cada dia da semana na UI
        for (const dayUi of scheduleUi) {
            const apiAvailability = availabilities.find(a => a.day_of_week === dayUi.number);

            if (dayUi.enabled) {
                // Se o dia está marcado na UI
                if (apiAvailability) {
                    // E já existe na API, não fazemos nada (poderíamos implementar update aqui)
                } else {
                    // Se não existe na API, criamos
                    await api.createProviderAvailability({
                        day_of_week: dayUi.number,
                        start_time: dayUi.startTime,
                        end_time: dayUi.endTime,
                    });
                }
            } else {
                // Se o dia NÃO está marcado na UI
                if (apiAvailability) {
                    // Mas existe na API, então apagamos
                    await api.deleteProviderAvailability(apiAvailability.id);
                }
            }
        }
        alert('Disponibilidade atualizada com sucesso!');
        await loadInitialData(); // Recarrega para obter os novos IDs
    } catch (error) {
      console.error("Erro ao salvar disponibilidade:", error);
      alert(`Erro ao salvar disponibilidade: ${error.message}`);
    }
  }

  function addVariation() {
    serviceVariations = [...serviceVariations, { name: '', price: 0, duration_minutes: 30 }];
  }

  function removeVariation(index: number) {
    serviceVariations = serviceVariations.filter((_, i) => i !== index);
  }

  function logout() {
    authStore.logout();
    goto('/');
  }
</script>

<div class="min-h-screen flex flex-col">
  <!-- Header -->
  <header class="border-b border-border">
    <div class="container mx-auto px-4 py-4 flex items-center justify-between">
      <h1 class="text-2xl font-bold">ServiceHub</h1>
      <div class="flex items-center gap-4">
        <a
          href="/provider/bookings"
          class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Reservas
        </a>
        <button
          onclick={logout}
          class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Sair
        </button>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 container mx-auto px-4 py-8">
    <div class="mb-8">
      <h2 class="text-3xl font-bold mb-2">Dashboard do Prestador</h2>
      <p class="text-muted-foreground">Gerencie seus serviços e disponibilidade</p>
    </div>

    <!-- Tabs -->
    <div class="mb-6">
      <div class="flex gap-2 border-b border-border">
        <button
          onclick={() => activeTab = 'services'}
          class={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'services'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Serviços
        </button>
        <button
          onclick={() => activeTab = 'availability'}
          class={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'availability'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Disponibilidade
        </button>
      </div>
    </div>

    <!-- Services Tab -->
    {#if activeTab === 'services'}
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="text-2xl font-bold">Seus Serviços</h3>
            <p class="text-muted-foreground">Gerencie os serviços que você oferece</p>
          </div>
          <button
            onclick={() => openServiceDialog()}
            class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            + Adicionar Serviço
          </button>
        </div>

        {#if isLoading}
          <div class="text-center py-8">Carregando serviços...</div>
        {:else if services.length === 0}
          <div class="rounded-lg border border-border bg-card p-12 text-center">
            <p class="text-muted-foreground mb-4">Você ainda não adicionou nenhum serviço</p>
            <button
              onclick={() => openServiceDialog()}
              class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              + Adicionar seu primeiro serviço
            </button>
          </div>
        {:else}
          <div class="grid gap-4 md:grid-cols-2">
            {#each services as service}
              <div class="rounded-lg border border-border bg-card">
                <div class="p-6">
                  <div class="flex justify-between items-start mb-4">
                    <div>
                      <!-- CORREÇÃO: Usar 'title' -->
                      <h4 class="text-xl font-bold">{service.title}</h4>
                      <p class="text-sm text-muted-foreground mt-1">{service.description}</p>
                    </div>
                    <span class="rounded-md bg-secondary px-2 py-1 text-xs">{service.service_type.name}</span>
                  </div>
                  
                  <div class="space-y-2 mb-4">
                    <p class="text-sm font-medium">Variações:</p>
                    {#each service.variations as variation}
                      <div class="flex justify-between text-sm">
                        <span>{variation.name}</span>
                        <span class="text-muted-foreground">
                          <!-- CORREÇÃO: Usar 'duration_minutes' -->
                          ${variation.price} • {variation.duration_minutes}min
                        </span>
                      </div>
                    {/each}
                  </div>

                  <div class="flex gap-2">
                    <button
                      onclick={() => openServiceDialog(service)}
                      class="flex-1 inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      Editar
                    </button>
                    <button
                      onclick={() => deleteService(service.id)}
                      class="flex-1 inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium text-destructive transition-colors hover:bg-accent hover:text-destructive-foreground"
                    >
                      Apagar
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Availability Tab -->
    {#if activeTab === 'availability'}
      <div class="space-y-6">
        <div>
          <h3 class="text-2xl font-bold">Agenda Semanal</h3>
          <p class="text-muted-foreground">Defina os dias e horários que você está disponível</p>
        </div>
        <div class="rounded-lg border border-border bg-card p-6">
          <div class="space-y-4">
            {#each scheduleUi as day, index}
              <div class="flex items-center gap-4 p-4 border border-border rounded-lg">
                <div class="flex items-center space-x-2 w-32">
                  <input
                    type="checkbox"
                    id={`day-${index}`}
                    bind:checked={day.enabled}
                    class="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                  <label for={`day-${index}`} class="text-sm font-medium cursor-pointer">
                    {day.name}
                  </label>
                </div>

                {#if day.enabled}
                  <div class="flex items-center gap-4 flex-1">
                    <div class="flex items-center gap-2">
                      <label for={`start-${index}`} class="text-sm text-muted-foreground">De</label>
                      <input
                        id={`start-${index}`}
                        type="time"
                        bind:value={day.startTime}
                        class="flex h-9 w-32 rounded-md border border-input bg-background px-3 py-1 text-sm"
                      />
                    </div>
                    <div class="flex items-center gap-2">
                      <label for={`end-${index}`} class="text-sm text-muted-foreground">Até</label>
                      <input
                        id={`end-${index}`}
                        type="time"
                        bind:value={day.endTime}
                        class="flex h-9 w-32 rounded-md border border-input bg-background px-3 py-1 text-sm"
                      />
                    </div>
                  </div>
                {/if}
              </div>
            {/each}
            <div class="pt-4">
              <button
                onclick={saveAvailability}
                class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Salvar Disponibilidade
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </main>
</div>

<!-- Service Dialog -->
{#if showServiceDialog}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-card p-6">
      <h3 class="text-2xl font-bold mb-4">
        {editingService ? 'Editar Serviço' : 'Novo Serviço'}
      </h3>

      <form onsubmit|preventDefault={saveService} class="space-y-4">
        <div class="space-y-2">
          <label for="title" class="text-sm font-medium">Nome do Serviço</label>
          <input
            id="title"
            type="text"
            bind:value={serviceTitle}
            required
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="ex: Treinamento Pessoal"
          />
        </div>

        <div class="space-y-2">
          <label for="description" class="text-sm font-medium">Descrição</label>
          <textarea
            id="description"
            bind:value={serviceDescription}
            required
            rows="3"
            class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Descreva seu serviço..."
          ></textarea>
        </div>

        <div class="space-y-2">
          <label for="type" class="text-sm font-medium">Tipo de Serviço</label>
          <select
            id="type"
            bind:value={serviceTypeId}
            required
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="" disabled>Selecione um tipo</option>
            <!-- CORREÇÃO: Popular dinamicamente -->
            {#each serviceTypes as type}
                <option value={type.id}>{type.name}</option>
            {/each}
          </select>
        </div>

        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium">Variações do Serviço</span>
            <button
              type="button"
              onclick={addVariation}
              class="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-sm transition-colors hover:bg-accent"
            >
              + Adicionar Variação
            </button>
          </div>

          {#each serviceVariations as variation, index}
            <div class="flex gap-2 items-end">
              <div class="flex-1 space-y-2">
                <label for={`var-name-${index}`} class="text-sm">Nome</label>
                <input
                  id={`var-name-${index}`}
                  type="text"
                  bind:value={variation.name}
                  required
                  class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  placeholder="ex: Básico, Premium"
                />
              </div>
              <div class="w-28 space-y-2">
                <label for={`var-price-${index}`} class="text-sm">Preço ($)</label>
                <input
                  id={`var-price-${index}`}
                  type="number"
                  min="0"
                  step="0.01"
                  bind:value={variation.price}
                  required
                  class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                />
              </div>
              <div class="w-28 space-y-2">
                <!-- CORREÇÃO: Usar 'duration_minutes' -->
                <label for={`var-duration-${index}`} class="text-sm">Duração (min)</label>
                <input
                  id={`var-duration-${index}`}
                  type="number"
                  min="15"
                  step="15"
                  bind:value={variation.duration_minutes}
                  required
                  class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                />
              </div>
              {#if serviceVariations.length > 1}
                <button
                  type="button"
                  onclick={() => removeVariation(index)}
                  class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-sm transition-colors hover:bg-accent"
                >
                  ×
                </button>
              {/if}
            </div>
          {/each}
        </div>

        <div class="flex gap-2 pt-4">
          <button
            type="button"
            onclick={() => showServiceDialog = false}
            class="flex-1 inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="flex-1 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {editingService ? 'Atualizar' : 'Criar'} Serviço
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

