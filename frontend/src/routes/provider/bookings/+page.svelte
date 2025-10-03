<script lang="ts">
  import { goto } from '$app/navigation';
  import { api, type Booking } from '$lib/api';
  import { authStore } from '$lib/stores/auth.store';
  import { onMount } from 'svelte';

  let bookings = $state<Booking[]>([]);
  let isLoading = $state(true);
  let activeTab = $state('upcoming');

  onMount(() => {
    loadBookings();
  });

  async function loadBookings() {
    isLoading = true;
    try {
      const data = await api.getProviderBookings();
      bookings = data;
    } catch (error) {
      console.error('Erro ao carregar reservas:', error);
    } finally {
      isLoading = false;
    }
  }
  
  // --- FUNÇÕES AUXILIARES ---
  function getFilteredBookings() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

    if (activeTab === 'upcoming') {
      return bookings.filter(booking => {
        if (booking.status === 'cancelled' || booking.status === 'completed') return false;
        if (booking.date > today) return true;
        if (booking.date === today && booking.start_time >= currentTime) return true;
        return false;
      });
    } else if (activeTab === 'past') {
      return bookings.filter(booking => {
        if (booking.status === 'completed') return true;
        if (booking.date < today) return true;
        if (booking.date === today && booking.start_time < currentTime) return true;
        return false;
      });
    } else {
      return bookings.filter(booking => booking.status === 'cancelled');
    }
  }
  
  async function updateBookingStatus(id: string, status: Booking['status']) {
      if (status === 'cancelled' && !confirm('Tem certeza que deseja cancelar esta reserva?')) {
          return;
      }
    try {
      await api.updateBookingStatus(id, status);
      await loadBookings();
    } catch (error) {
      console.error('Erro ao atualizar reserva:', error);
      if (error instanceof Error) {
        alert(`Erro ao atualizar reserva: ${error.message}`);
      } else {
        alert('Ocorreu um erro desconhecido ao atualizar a reserva.');
      }
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      timeZone: 'UTC',
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  function getStatusColor(status: Booking['status']) {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getStatusLabel(status: Booking['status']) {
    const labels = {
      confirmed: 'Confirmada',
      pending: 'Pendente',
      cancelled: 'Cancelada',
      completed: 'Concluída',
    };
    return labels[status];
  }

  function logout() {
    authStore.logout();
    goto('/');
  }

  let filteredBookings = $derived(getFilteredBookings());
</script>

<div class="min-h-screen flex flex-col">
  <header class="border-b border-border">
    <div class="container mx-auto px-4 py-4 flex items-center justify-between">
      <a href="/provider/dashboard">
        <h1 class="text-2xl font-bold">ServiceHub</h1>
      </a>
      <div class="flex items-center gap-4">
        <a
          href="/provider/dashboard"
          class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Dashboard
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
      <h2 class="text-3xl font-bold mb-2">Reservas Recebidas</h2>
      <p class="text-muted-foreground">Gerencie as reservas dos seus serviços</p>
    </div>

    <div class="mb-6">
      <div class="flex gap-2 border-b border-border">
        <button
          onclick={() => activeTab = 'upcoming'}
          class={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'upcoming'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Próximas
        </button>
        <button
          onclick={() => activeTab = 'past'}
          class={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'past'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Passadas & Concluídas
        </button>
        <button
          onclick={() => activeTab = 'cancelled'}
          class={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'cancelled'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Canceladas
        </button>
      </div>
    </div>

    {#if isLoading}
      <div class="text-center py-12">Carregando reservas...</div>
    {:else if filteredBookings.length === 0}
      <div class="rounded-lg border border-border bg-card p-12 text-center">
        <p class="text-muted-foreground mb-4">
          {#if activeTab === 'upcoming'}
            Você não tem reservas próximas
          {:else if activeTab === 'past'}
            Você não tem reservas passadas ou concluídas
          {:else}
            Você não tem reservas canceladas
          {/if}
        </p>
      </div>
    {:else}
      <div class="space-y-4">
        {#each filteredBookings as booking}
          <div class="rounded-lg border border-border bg-card">
            <div class="p-6">
              <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-start justify-between mb-2">
                    <div>
                      <h3 class="text-xl font-bold">{booking.service_variation.service.title || 'Serviço'}</h3>
                      <p class="text-sm text-muted-foreground">
                        Cliente: {booking.client?.name || 'Cliente'}
                      </p>
                      <p class="text-sm text-muted-foreground">
                        {booking.client?.email || ''}
                      </p>
                    </div>
                    <span class={`rounded-md px-2 py-1 text-xs ${getStatusColor(booking.status)}`}>
                      {getStatusLabel(booking.status)}
                    </span>
                  </div>

                  <div class="space-y-2 mt-4">
                    <div class="flex items-center gap-2 text-sm">
                      <svg class="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span>{formatDate(booking.date)}</span>
                    </div>
                    <div class="flex items-center gap-2 text-sm">
                       <svg class="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span>{booking.start_time.substring(0,5)} ({booking.service_variation.duration_minutes} minutos)</span>
                    </div>
                    <div class="flex items-center gap-2 text-sm">
                      <svg class="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span class="font-medium">${booking.service_variation.price}</span>
                    </div>
                  </div>
                </div>

                {#if activeTab === 'upcoming'}
                  <div class="flex flex-col gap-2">
                    {#if booking.status === 'pending'}
                      <button
                        onclick={() => updateBookingStatus(booking.id, 'confirmed')}
                        class="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        Confirmar
                      </button>
                    {/if}
                    {#if booking.status !== 'cancelled'}
                      <button
                        onclick={() => updateBookingStatus(booking.id, 'cancelled')}
                        class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        Cancelar
                      </button>
                    {/if}
                  </div>
                {:else if activeTab === 'past' && booking.status !== 'completed' && booking.status !== 'cancelled'}
                  <div class="flex flex-col gap-2">
                    <button
                      onclick={() => updateBookingStatus(booking.id, 'completed')}
                      class="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Marcar como Concluída
                    </button>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </main>
</div>

