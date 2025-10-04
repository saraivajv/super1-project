<script lang="ts">
  import { goto } from '$app/navigation';
  import { api, type Availability, type Service, type ServiceType, type Variation } from '$lib/api';
  import { authStore } from '$lib/stores/auth.store';
  import { onMount } from 'svelte';

  // --- Tipos de Dados ---
  type VariationFormData = Omit<Variation, 'id'> & { id?: string };

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
  let serviceVariations = $state<VariationFormData[]>([{ name: '', price: 0, duration_minutes: 30 }]);

  let newVariation = $state({ name: '', price: 0, duration_minutes: 30 });

  // --- Estado da Disponibilidade ---
  const weekDays = [
      { name: 'Domingo', number: 0 }, { name: 'Segunda-feira', number: 1 },
      { name: 'Terça-feira', number: 2 }, { name: 'Quarta-feira', number: 3 },
      { name: 'Quinta-feira', number: 4 }, { name: 'Sexta-feira', number: 5 },
      { name: 'Sábado', number: 6 }
  ];

  let scheduleUi = $state(
    weekDays.map(day => ({
      name: day.name,
      number: day.number,
      enabled: false,
      startTime: '09:00',
      endTime: '17:00',
      id: null as string | null
    }))
  );
  
  onMount(() => {
    loadInitialData();
  });

  async function loadInitialData() {
    isLoading = true;
    try {
      const [servicesData, serviceTypesData, availabilitiesData] = await Promise.all([
        api.getProviderServices(),
        api.getServiceTypes(),
        api.getProviderAvailabilities()
      ]);
      services = servicesData;
      serviceTypes = serviceTypesData;
      availabilities = availabilitiesData;
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
              dayUi.startTime = apiAvailability.start_time.substring(0, 5);
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
      serviceVariations = service.variations.map(v => ({...v}));
      newVariation = { name: '', price: 0, duration_minutes: 30 };
    } else {
      editingService = null;
      serviceTitle = '';
      serviceDescription = '';
      serviceTypeId = '';
      serviceVariations = [{ name: '', price: 0, duration_minutes: 30 }];
    }
    showServiceDialog = true;
  }

  async function handleSaveService(event: SubmitEvent) {
    event.preventDefault();
    try {
      const serviceData = {
        title: serviceTitle,
        description: serviceDescription,
        service_type_id: serviceTypeId,
      };

      if (editingService) {
        await api.updateService(editingService.id, serviceData);
      } else {
        const newService = await api.createService(serviceData);
        if (newService && newService.id) {
            for (const variation of serviceVariations) {
              await api.createServiceVariation(newService.id, variation);
            }
        }
      }
      if (!editingService) {
          showServiceDialog = false;
      }
      await loadInitialData();
      alert('Serviço salvo com sucesso!');
    } catch (error) {
      console.error("Erro ao salvar serviço:", error);
      if (error instanceof Error) {
        alert(`Erro ao salvar serviço: ${error.message}`);
      }
    }
  }

  async function deleteService(id: string) {
    if (!confirm('Tem certeza que deseja apagar este serviço e todas as suas variações?')) return;
    try {
      await api.deleteService(id);
      await loadInitialData();
    } catch (error) {
      console.error("Erro ao apagar serviço:", error);
    }
  }

  async function handleUpdateVariation(variationId: string, index: number) {
      const variationData = serviceVariations[index];
      try {
          await api.updateServiceVariation(variationId, variationData);
          alert('Variação atualizada com sucesso!');
          await loadInitialData(); 
      } catch (error) {
          console.error('Erro ao atualizar variação:', error);
          if (error instanceof Error) alert(`Erro: ${error.message}`);
      }
  }

  async function handleDeleteVariation(variationId: string) {
      if (!confirm('Tem certeza que deseja apagar esta variação?')) return;
      try {
          await api.deleteServiceVariation(variationId);
          serviceVariations = serviceVariations.filter(v => v.id !== variationId);
          alert('Variação apagada com sucesso!');
          await loadInitialData();
      } catch (error) {
          console.error('Erro ao apagar variação:', error);
          if (error instanceof Error) alert(`Erro: ${error.message}`);
      }
  }

  async function handleCreateVariation() {
      if (!editingService || !newVariation.name) {
          alert("Por favor, preencha o nome da nova variação.");
          return;
      }
      try {
          const createdVariation = await api.createServiceVariation(editingService.id, newVariation);
          alert('Nova variação adicionada!');
          serviceVariations = [...serviceVariations, createdVariation];
          newVariation = { name: '', price: 0, duration_minutes: 30 };
          await loadInitialData();
          
          const updatedService = services.find(s => s.id === editingService?.id);
          if(updatedService) {
              setTimeout(() => openServiceDialog(updatedService), 50);
          }

      } catch (error) {
          console.error('Erro ao criar variação:', error);
          if (error instanceof Error) alert(`Erro: ${error.message}`);
      }
  }


  async function saveAvailability() {
    try {
        for (const dayUi of scheduleUi) {
            const apiAvailability = availabilities.find(a => a.day_of_week === dayUi.number);
            if (dayUi.enabled && !apiAvailability) {
                await api.createProviderAvailability({
                    day_of_week: dayUi.number,
                    start_time: dayUi.startTime,
                    end_time: dayUi.endTime,
                });
            } else if (!dayUi.enabled && apiAvailability) {
                await api.deleteProviderAvailability(apiAvailability.id);
            }
        }
        alert('Disponibilidade atualizada com sucesso!');
        await loadInitialData();
    } catch (error) {
      console.error("Erro ao salvar disponibilidade:", error);
       if (error instanceof Error) {
        alert(`Erro ao salvar disponibilidade: ${error.message}`);
       }
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

  <main class="flex-1 container mx-auto px-4 py-8">
    <div class="mb-8">
      <h2 class="text-3xl font-bold mb-2">Dashboard do Prestador</h2>
      <p class="text-muted-foreground">Gerencie seus serviços e disponibilidade</p>
    </div>

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
                      <h4 class="text-xl font-bold">{service.title}</h4>
                      <p class="text-sm text-muted-foreground mt-1">{service.description}</p>
                    </div>
                    <span class="rounded-md bg-secondary px-2 py-1 text-xs">{service.service_type.name}</span>
                  </div>
                  
                  <div class="space-y-2 mb-4">
                    <p class="text-sm font-medium">Variações:</p>
                    {#if service.variations && service.variations.length > 0}
                        {#each service.variations as variation}
                          <div class="flex justify-between text-sm">
                            <span>{variation.name}</span>
                            <span class="text-muted-foreground">
                              ${variation.price} • {variation.duration_minutes}min
                            </span>
                          </div>
                        {/each}
                    {:else}
                        <p class="text-sm text-muted-foreground">Nenhuma variação adicionada.</p>
                    {/if}
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
                <div class="flex items-center space-x-2 w-40">
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

{#if showServiceDialog}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-card p-6">
      <h3 class="text-2xl font-bold mb-4">
        {editingService ? 'Editar Serviço' : 'Novo Serviço'}
      </h3>

      <form onsubmit={handleSaveService} class="space-y-4">
        <div class="space-y-2">
          <label for="title" class="text-sm font-medium">Nome do Serviço</label>
          <input id="title" type="text" bind:value={serviceTitle} required class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="ex: Treinamento Pessoal" />
        </div>
        <div class="space-y-2">
          <label for="description" class="text-sm font-medium">Descrição</label>
          <textarea id="description" bind:value={serviceDescription} required rows="3" class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Descreva seu serviço..."></textarea>
        </div>
        <div class="space-y-2">
          <label for="type" class="text-sm font-medium">Tipo de Serviço</label>
          <select id="type" bind:value={serviceTypeId} required class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="" disabled>Selecione um tipo</option>
            {#each serviceTypes as type}
                <option value={type.id}>{type.name}</option>
            {/each}
          </select>
        </div>
        
        <div class="flex justify-end pt-2">
             <button type="submit" class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                {editingService ? 'Atualizar Detalhes' : 'Criar Serviço'}
            </button>
        </div>
      </form>

        {#if editingService}
            <div class="border-t mt-6 pt-6 space-y-4">
                <h4 class="text-lg font-medium">Gerenciar Variações</h4>
                
                {#each serviceVariations as variation, index}
                    <div class="flex gap-2 items-end p-3 border rounded-lg">
                        <div class="flex-1 space-y-2">
                            <label for={`edit-var-name-${index}`} class="text-xs">Nome</label>
                            <input id={`edit-var-name-${index}`} type="text" bind:value={variation.name} required class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" />
                        </div>
                        <div class="w-24 space-y-2">
                            <label for={`edit-var-price-${index}`} class="text-xs">Preço</label>
                            <input id={`edit-var-price-${index}`} type="number" bind:value={variation.price} required class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" />
                        </div>
                        <div class="w-28 space-y-2">
                            <label for={`edit-var-duration-${index}`} class="text-xs">Duração (min)</label>
                            <input id={`edit-var-duration-${index}`} type="number" bind:value={variation.duration_minutes} required class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" />
                        </div>
                        <button type="button" onclick={() => { if(variation.id) handleUpdateVariation(variation.id, index); }} class="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-3 text-sm text-secondary-foreground transition-colors hover:bg-secondary/80">Salvar</button>
                        <button type="button" onclick={() => { if(variation.id) handleDeleteVariation(variation.id); }} class="inline-flex h-9 w-9 items-center justify-center rounded-md bg-destructive text-sm text-destructive-foreground transition-colors hover:bg-destructive/80">×</button>
                    </div>
                {/each}

                <div class="border-t pt-4 mt-4">
                     <h5 class="text-md font-medium mb-2">Adicionar Nova Variação</h5>
                     <div class="flex gap-2 items-end p-3 border rounded-lg bg-muted/20">
                         <div class="flex-1 space-y-2">
                            <label for="new-var-name" class="text-xs">Nome</label>
                            <input id="new-var-name" type="text" bind:value={newVariation.name} placeholder="Ex: Pacote Premium" class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" />
                        </div>
                        <div class="w-24 space-y-2">
                            <label for="new-var-price" class="text-xs">Preço</label>
                            <input id="new-var-price" type="number" bind:value={newVariation.price} class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" />
                        </div>
                        <div class="w-28 space-y-2">
                            <label for="new-var-duration" class="text-xs">Duração (min)</label>
                            <input id="new-var-duration" type="number" bind:value={newVariation.duration_minutes} class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" />
                        </div>
                        <button type="button" onclick={handleCreateVariation} class="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm text-primary-foreground transition-colors hover:bg-primary/80">Adicionar</button>
                     </div>
                </div>
            </div>
        {/if}

        {#if !editingService}
        <div class="space-y-3 pt-4 border-t">
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium">Variações do Serviço</span>
              <button type="button" onclick={addVariation} class="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-sm transition-colors hover:bg-accent">
                + Adicionar Variação
              </button>
          </div>
          {#each serviceVariations as variation, index}
            <div class="flex gap-2 items-end">
              <div class="flex-1 space-y-2">
                <label for={`var-name-${index}`} class="text-sm">Nome</label>
                <input id={`var-name-${index}`} type="text" bind:value={variation.name} required class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" />
              </div>
              <div class="w-28 space-y-2">
                <label for={`var-price-${index}`} class="text-sm">Preço ($)</label>
                <input id={`var-price-${index}`} type="number" min="0" step="0.01" bind:value={variation.price} required class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" />
              </div>
              <div class="w-28 space-y-2">
                <label for={`var-duration-${index}`} class="text-sm">Duração (min)</label>
                <input id={`var-duration-${index}`} type="number" min="15" step="15" bind:value={variation.duration_minutes} required class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" />
              </div>
              {#if serviceVariations.length > 1}
                <button type="button" onclick={() => removeVariation(index)} class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-sm transition-colors hover:bg-accent">×</button>
              {/if}
            </div>
          {/each}
        </div>
        {/if}

      <div class="flex gap-2 pt-6 border-t mt-6">
          <button type="button" onclick={() => showServiceDialog = false} class="flex-1 inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent">
            Fechar
          </button>
        </div>
    </div>
  </div>
{/if}

<style>
    input[type="time"]{
        cursor: pointer;
        position: relative;
        color-scheme: dark;
    }
</style>
