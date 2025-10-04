<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store';
  import { api, type Booking } from '$lib/api';

  // --- Estado ---
  let bookings = $state<Booking[]>([]);
  let isLoading = $state(true);
  let activeTab = $state('upcoming');

  let showReviewModal = $state(false);
  let selectedBookingForReview = $state<Booking | null>(null);
  let rating = $state(0);
  let comment = $state('');
  let isSubmittingReview = $state(false);

  onMount(() => {
    loadBookings();
  });

  async function loadBookings() {
    isLoading = true;
    try {
      const data = await api.getClientBookings();
      bookings = data;
    } catch (error) {
      console.error('Erro ao carregar reservas:', error);
    } finally {
      isLoading = false;
    }
  }

  async function cancelBooking(id: string) {
    if (!confirm('Tem certeza que deseja cancelar esta reserva?')) return;
    try {
      await api.updateBookingStatus(id, 'cancelled');
      await loadBookings();
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      if (error instanceof Error) {
        alert(`Erro ao cancelar: ${error.message}`);
      }
    }
  }
  
  function openReviewModal(booking: Booking) {
      selectedBookingForReview = booking;
      rating = 0;
      comment = '';
      showReviewModal = true;
  }

  async function handleReviewSubmit() {
      if (!selectedBookingForReview || rating === 0) {
          alert('Por favor, selecione uma classificação de 1 a 5 estrelas.');
          return;
      }
      isSubmittingReview = true;
      try {
          await api.createReview(selectedBookingForReview.id, { rating, comment });
          alert('Avaliação enviada com sucesso!');
          showReviewModal = false;
          await loadBookings(); 
      } catch (error) {
          console.error('Erro ao enviar avaliação:', error);
          if (error instanceof Error) {
              alert(`Erro ao avaliar: ${error.message}`);
          }
      } finally {
          isSubmittingReview = false;
      }
  }

  // --- Funções Auxiliares ---
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
    } else { // cancelled
      return bookings.filter(booking => booking.status === 'cancelled');
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
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
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
      <a href="/marketplace">
        <h1 class="text-2xl font-bold">ServiceHub</h1>
      </a>
      <div class="flex items-center gap-4">
        <a href="/marketplace" class="text-sm font-medium hover:underline">
          Marketplace
        </a>
        <button onclick={logout} class="text-sm font-medium hover:underline">
          Sair
        </button>
      </div>
    </div>
  </header>

  <main class="flex-1 container mx-auto px-4 py-8">
    <div class="mb-8">
      <h2 class="text-3xl font-bold mb-2">Minhas Reservas</h2>
      <p class="text-muted-foreground">Gerencie suas reservas de serviços</p>
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
      <div class="rounded-lg border bg-card p-12 text-center">
        <p class="text-muted-foreground mb-4">
          Nenhum resultado para esta aba.
        </p>
        <a
          href="/marketplace"
          class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Explorar Serviços
        </a>
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
                        com {booking.service_variation.service.provider?.name || 'Prestador'}
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
                      <span>{new Date(booking.start_time).toLocaleTimeString('pt-BR', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' })} ({booking.service_variation.duration_minutes} minutos)</span>
                    </div>
                    <div class="flex items-center gap-2 text-sm">
                      <svg class="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span class="font-medium">${booking.service_variation.price}</span>
                    </div>
                  </div>
                </div>

                {#if booking.status === 'completed'}
                    <div class="flex flex-col gap-2">
                        <button onclick={() => openReviewModal(booking)} class="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-4 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80">
                            Avaliar Serviço
                        </button>
                    </div>
                {:else if activeTab === 'upcoming' && booking.status !== 'cancelled'}
                  <div class="flex flex-col gap-2">
                    <button
                      onclick={() => cancelBooking(booking.id)}
                      class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      Cancelar Reserva
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

{#if showReviewModal && selectedBookingForReview}
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    role="dialog"
    aria-modal="true"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    onclick={() => showReviewModal = false}
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="w-full max-w-lg rounded-lg border bg-card p-6" onclick={(event) => event.stopPropagation()}>
      <h3 class="text-2xl font-bold mb-2">Avaliar Serviço</h3>
      <p class="text-sm text-muted-foreground mb-6">
        {selectedBookingForReview.service_variation.service.title} com {selectedBookingForReview.service_variation.service.provider.name}
      </p>

      <div class="space-y-6">
        <div class="space-y-2">
          <!-- svelte-ignore a11y_label_has_associated_control -->
          <label class="text-sm font-medium">Sua classificação</label>
          <div class="flex items-center gap-1">
            {#each { length: 5 } as _, i}
              <!-- svelte-ignore a11y_consider_explicit_label -->
              <button onclick={() => rating = i + 1} class="p-1">
                <svg class:text-yellow-400={i < rating} class:text-gray-600={i >= rating} width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="m12 17.27l-5.18 2.73l1-5.77l-4.2-4.09l5.81-.84L12 4.63l2.57 5.67l5.81.84l-4.2 4.09l1 5.77z"/></svg>
              </button>
            {/each}
          </div>
        </div>
        <div class="space-y-2">
          <label for="comment" class="text-sm font-medium">Seu comentário (opcional)</label>
          <textarea
            id="comment"
            bind:value={comment}
            rows="4"
            class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Descreva a sua experiência..."
          ></textarea>
        </div>
      </div>

      <div class="flex gap-2 pt-6">
        <button onclick={() => showReviewModal = false} class="flex-1 inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent">
          Cancelar
        </button>
        <button onclick={handleReviewSubmit} disabled={isSubmittingReview || rating === 0} class="flex-1 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
          {isSubmittingReview ? 'A enviar...' : 'Enviar Avaliação'}
        </button>
      </div>
    </div>
  </div>
{/if}

