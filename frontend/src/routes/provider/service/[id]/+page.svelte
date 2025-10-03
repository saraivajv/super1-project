<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { api, type AvailabilitySlot, type Service, type Variation } from '$lib/api';
  import { authStore } from '$lib/stores/auth.store';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';

  // --- Estado ---
  let service = $state<Service | null>(null);
  let isLoading = $state(true);
  
  // --- Estado do Modal de Reserva ---
  let showBookingDialog = $state(false);
  let selectedVariation = $state<Variation | null>(null);
  let selectedDate = $state<Date | null>(null);
  let selectedTime = $state('');
  let availableSlots = $state<AvailabilitySlot[]>([]);
  let isBooking = $state(false);

  const user = authStore.user;

  onMount(() => {
    const id = get(page).params.id;
    if (id) {
        loadService(id);
    }
  });

  async function loadService(id: string) {
    isLoading = true;
    try {
      const data = await api.getService(id);
      service = data;
    } catch (error) {
      console.error("Erro ao carregar serviço:", error);
    } finally {
      isLoading = false;
    }
  }

  async function loadAvailabilitySlots(providerId: string, date: Date) {
    try {
        const dateString = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        const data = await api.getProviderAvailabilityForDate(providerId, dateString);
        availableSlots = data;
    } catch (error) {
        console.error("Erro ao carregar horários:", error);
        availableSlots = [];
    }
  }

  function openBookingDialog(variation: Variation) {
    if (!$user) {
      alert('Por favor, faça login para reservar este serviço');
      goto('/login');
      return;
    }

    if ($user.role !== 'client') {
      alert('Apenas clientes podem reservar serviços');
      return;
    }

    selectedVariation = variation;
    selectedDate = null;
    selectedTime = '';
    availableSlots = [];
    showBookingDialog = true;
  }

  function handleDateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.value && service?.provider?.id) {
        const [year, month, day] = input.value.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        selectedDate = date;
        selectedTime = '';
        loadAvailabilitySlots(service.provider.id, date);
    }
  }

  async function confirmBooking() {
    if (!selectedDate || !selectedTime || !selectedVariation) {
      alert('Por favor, selecione data e horário');
      return;
    }
    isBooking = true;
    try {
        const [year, month, day] = selectedDate.toISOString().split('T')[0].split('-').map(Number);
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const startTime = new Date(Date.UTC(year, month - 1, day, hours, minutes));

        await api.createBooking({
            service_variation_id: selectedVariation.id,
            start_time: startTime.toISOString(),
        });

        alert('Reserva criada com sucesso!');
        showBookingDialog = false;
        goto('/client/bookings');
    } catch (error) {
      console.error("Erro ao criar reserva:", error);
      if (error instanceof Error) {
        alert(`Erro ao criar reserva: ${error.message}`);
      }
    } finally {
        isBooking = false;
    }
  }

  function logout() {
    authStore.logout();
    goto('/');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      showBookingDialog = false;
    }
  }

  function stopPropagation(event: MouseEvent) {
    event.stopPropagation();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

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
            <a href="/client/bookings" class="text-sm font-medium hover:underline">
              Minhas Reservas
            </a>
          {/if}
          <button onclick={logout} class="text-sm font-medium hover:underline">
            Sair
          </button>
        {:else}
          <a href="/login" class="text-sm font-medium hover:underline">
            Entrar
          </a>
        {/if}
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 container mx-auto px-4 py-8">
    {#if isLoading}
      <div class="text-center py-12">Carregando detalhes do serviço...</div>
    {:else if !service}
      <div class="text-center py-12">
        <p class="text-muted-foreground mb-4">Serviço não encontrado</p>
        <a href="/marketplace" class="text-primary hover:underline">
          Voltar ao Marketplace
        </a>
      </div>
    {:else}
      <a href="/marketplace" class="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
        ← Voltar ao Marketplace
      </a>

      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Service Info -->
        <div class="lg:col-span-2 space-y-6">
          <div class="rounded-lg border bg-card p-6">
            <span class="rounded-md bg-secondary px-2 py-1 text-xs">{service.service_type.name}</span>
            <h2 class="text-3xl font-bold mt-2 mb-2">{service.title}</h2>
            <p class="text-base text-muted-foreground">{service.description}</p>
          </div>
          <div class="rounded-lg border bg-card p-6">
            <h3 class="text-xl font-bold mb-4">Sobre o Prestador</h3>
            <p class="font-medium">{service.provider?.name || 'Prestador'}</p>
            <p class="text-sm text-muted-foreground">{service.provider?.email || ''}</p>
          </div>
        </div>

        <!-- Booking Options -->
        <div class="space-y-6">
          <div class="rounded-lg border bg-card p-6">
            <h3 class="text-xl font-bold mb-4">Opções de Serviço</h3>
            <div class="space-y-4">
              {#each service.variations as variation}
                <div class="border-t pt-4 first:border-t-0 first:pt-0">
                  <h4 class="font-semibold text-lg">{variation.name}</h4>
                  <div class="text-sm text-muted-foreground mt-1">
                    <span>{variation.duration_minutes} minutos</span>
                  </div>
                  <div class="flex items-end justify-between mt-2">
                    <p class="text-3xl font-bold">${variation.price}</p>
                    <button onclick={() => openBookingDialog(variation)} class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                      Reservar Agora
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    {/if}
  </main>
</div>

<!-- Booking Dialog -->
{#if showBookingDialog && selectedVariation}
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    role="dialog"
    aria-modal="true"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    onclick={() => showBookingDialog = false}
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="w-full max-w-lg rounded-lg border bg-card p-6" onclick={stopPropagation}>
      <h3 class="text-2xl font-bold mb-2">Reservar {service?.title}</h3>
      <p class="text-sm text-muted-foreground mb-6">
        {selectedVariation.name} - ${selectedVariation.price} ({selectedVariation.duration_minutes} minutos)
      </p>

      <div class="space-y-6">
        <div class="space-y-2">
          <label for="date" class="text-sm font-medium">Selecione a Data</label>
          <input
            id="date"
            type="date"
            min={new Date().toISOString().split('T')[0]}
            onchange={handleDateChange}
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        {#if selectedDate}
          <div class="space-y-2">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="text-sm font-medium">Selecione o Horário</label>
            {#if availableSlots.length > 0}
                <div class="grid grid-cols-4 gap-2">
                  {#each availableSlots as slot}
                    <button
                      type="button"
                      onclick={() => selectedTime = slot.time}
                      disabled={!slot.available}
                      class:bg-primary={selectedTime === slot.time}
                      class:text-primary-foreground={selectedTime === slot.time}
                      class="py-2 px-3 rounded-md border text-sm transition-colors hover:bg-accent disabled:opacity-50"
                    >
                      {slot.time}
                    </button>
                  {/each}
                </div>
            {:else}
                 <div class="text-center py-4 text-sm text-muted-foreground">
                    Nenhum horário disponível para esta data.
                 </div>
            {/if}
          </div>
        {/if}
      </div>

      <div class="flex gap-2 pt-6">
        <button onclick={() => showBookingDialog = false} class="flex-1 inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent">
          Cancelar
        </button>
        <button onclick={confirmBooking} disabled={!selectedDate || !selectedTime || isBooking} class="flex-1 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
          {isBooking ? 'A confirmar...' : 'Confirmar Reserva'}
        </button>
      </div>
    </div>
  </div>
{/if}

