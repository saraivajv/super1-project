<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { api } from '$lib/api';
  import { authStore } from '$lib/stores/auth.store';
  import { onMount } from 'svelte';

  let service = $state(null);
  let isLoading = $state(true);
  let showBookingDialog = $state(false);
  let selectedVariation = $state(null);
  let selectedDate = $state(null);
  let selectedTime = $state('');
  let availableSlots = $state([]);
  let availability = null;

  onMount(() => {
    const unsubscribe = page.subscribe(($page) => {
      const id = $page.params.id;
      if (id) {
        loadService(id);
      }
    });

    return unsubscribe;
  });

  async function loadService(id: string) {
    try {
      const data = await api.getService(id);
      service = data;
      
      if (service?.provider?.id) {
        await loadAvailability(service.provider.id);
      }
    } catch (error) {
      console.error('[v0] Error loading service:', error);
    } finally {
      isLoading = false;
    }
  }

  async function loadAvailability(providerId: string) {
    try {
      const data = await api.getAvailability(providerId);
      availability = data;
    } catch (error) {
      console.error('[v0] No availability set');
    }
  }

  function openBookingDialog(variation: any) {
    if (!authStore.user) {
      alert('Por favor, faça login para reservar este serviço');
      goto('/login');
      return;
    }

    if (authStore.user.role !== 'client') {
      alert('Apenas clientes podem reservar serviços');
      return;
    }

    selectedVariation = variation;
    selectedDate = null;
    selectedTime = '';
    showBookingDialog = true;
  }

  function generateTimeSlots(date: Date) {
    if (!availability?.schedule) {
      return generateDefaultSlots();
    }

    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const daySchedule = availability.schedule.find((d: any) => d.day === dayName && d.enabled);

    if (!daySchedule) return [];

    const slots = [];
    const [startHour, startMin] = daySchedule.startTime.split(':').map(Number);
    const [endHour, endMin] = daySchedule.endTime.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      slots.push({
        time: `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`,
        available: true,
      });

      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }

    return slots;
  }

  function generateDefaultSlots() {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      slots.push({ time: `${String(hour).padStart(2, '0')}:00`, available: true });
      slots.push({ time: `${String(hour).padStart(2, '0')}:30`, available: true });
    }
    return slots;
  }

  function handleDateChange(date: Date) {
    selectedDate = date;
    selectedTime = '';
    availableSlots = generateTimeSlots(date);
  }

  async function confirmBooking() {
    if (!selectedDate || !selectedTime) {
      alert('Por favor, selecione data e horário');
      return;
    }

    try {
      await api.createBooking({
        serviceId: service.id,
        variationId: selectedVariation.id,
        providerId: service.provider.id,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        duration: selectedVariation.duration,
        price: selectedVariation.price,
      });

      alert('Reserva criada com sucesso!');
      showBookingDialog = false;
      goto('/client/bookings');
    } catch (error) {
      console.error('[v0] Error creating booking:', error);
      alert('Erro ao criar reserva');
    }
  }

  function logout() {
    authStore.logout();
    goto('/');
  }
</script>

<div class="min-h-screen flex flex-col">
   Header 
  <header class="border-b border-border sticky top-0 bg-background z-10">
    <div class="container mx-auto px-4 py-4 flex items-center justify-between">
      <a href="/marketplace">
        <h1 class="text-2xl font-bold">ServiceHub</h1>
      </a>

      <div class="flex items-center gap-4">
         Access user directly from authStore.user 
        {#if authStore.user}
          {#if authStore.user.role === 'client'}
            <a
              href="/client/bookings"
              class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Minhas Reservas
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
        {/if}
      </div>
    </div>
  </header>

   Main Content 
  <main class="flex-1 container mx-auto px-4 py-8">
    {#if isLoading}
      <div class="text-center py-12">Carregando detalhes do serviço...</div>
    {:else if !service}
      <div class="rounded-lg border border-border bg-card p-12 text-center">
        <p class="text-muted-foreground mb-4">Serviço não encontrado</p>
        <a
          href="/marketplace"
          class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Voltar ao Marketplace
        </a>
      </div>
    {:else}
      <a
        href="/marketplace"
        class="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        ← Voltar ao Marketplace
      </a>

      <div class="grid gap-6 lg:grid-cols-3">
         Service Info 
        <div class="lg:col-span-2 space-y-6">
          <div class="rounded-lg border border-border bg-card p-6">
            <div class="flex items-start justify-between mb-2">
              <span class="rounded-md bg-secondary px-2 py-1 text-xs">{service.serviceType}</span>
            </div>
            <h2 class="text-3xl font-bold mb-2">{service.name}</h2>
            <p class="text-base text-muted-foreground">{service.description}</p>
          </div>

          <div class="rounded-lg border border-border bg-card p-6">
            <h3 class="text-xl font-bold mb-4">Sobre o Provedor</h3>
            <div class="space-y-2">
              <p class="font-medium">{service.provider?.name || 'Provedor'}</p>
              <p class="text-sm text-muted-foreground">{service.provider?.email || ''}</p>
            </div>
          </div>
        </div>

         Booking Options 
        <div class="space-y-6">
          <div class="rounded-lg border border-border bg-card p-6">
            <h3 class="text-xl font-bold mb-2">Opções de Serviço</h3>
            <p class="text-sm text-muted-foreground mb-4">Escolha a opção que atende suas necessidades</p>

            <div class="space-y-4">
              {#each service.variations as variation, index}
                {#if index > 0}
                  <div class="border-t border-border my-4"></div>
                {/if}
                <div class="space-y-3">
                  <div>
                    <h4 class="font-semibold text-lg">{variation.name}</h4>
                    <div class="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{variation.duration} minutos</span>
                    </div>
                  </div>
                  <div class="flex items-end justify-between">
                    <div>
                      <p class="text-3xl font-bold">${variation.price}</p>
                    </div>
                    <button
                      onclick={() => openBookingDialog(variation)}
                      class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
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

 Booking Dialog 
{#if showBookingDialog && selectedVariation}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-card p-6">
      <h3 class="text-2xl font-bold mb-2">Reservar {service.name}</h3>
      <p class="text-sm text-muted-foreground mb-6">
        {selectedVariation.name} - ${selectedVariation.price} ({selectedVariation.duration} minutos)
      </p>

      <div class="space-y-6">
        <div class="space-y-2">
          <label for="date" class="text-sm font-medium">Selecione a Data</label>
          <input
            id="date"
            type="date"
            min={new Date().toISOString().split('T')[0]}
            onchange={(e) => handleDateChange(new Date(e.target.value))}
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        {#if selectedDate && availableSlots.length > 0}
          <div class="space-y-2">
            <label for="time" class="text-sm font-medium">Selecione o Horário</label>
            <div class="grid grid-cols-4 gap-2">
              {#each availableSlots as slot}
                <button
                  id="time"
                  type="button"
                  onclick={() => selectedTime = slot.time}
                  disabled={!slot.available}
                  class={`py-2 px-3 rounded-md border text-sm transition-colors ${
                    selectedTime === slot.time
                      ? 'bg-primary text-primary-foreground border-primary'
                      : slot.available
                        ? 'hover:bg-accent border-input'
                        : 'opacity-50 cursor-not-allowed border-input'
                  }`}
                >
                  {slot.time}
                </button>
              {/each}
            </div>
          </div>
        {/if}

        {#if selectedDate && availableSlots.length === 0}
          <div class="text-center py-4 text-muted-foreground">
            Nenhum horário disponível para esta data
          </div>
        {/if}
      </div>

      <div class="flex gap-2 pt-6">
        <button
          onclick={() => showBookingDialog = false}
          class="flex-1 inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent"
        >
          Cancelar
        </button>
        <button
          onclick={confirmBooking}
          disabled={!selectedDate || !selectedTime}
          class="flex-1 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
        >
          Confirmar Reserva
        </button>
      </div>
    </div>
  </div>
{/if}
