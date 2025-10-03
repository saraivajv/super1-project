<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
// Correção: Importar do ficheiro correto
  import { api } from '$lib/api';
  import { authStore } from '$lib/stores/auth.store';

  let bookings = $state([]); // Adicionar tipos de dados seria o ideal aqui
  let isLoading = $state(true);
  let activeTab = $state('upcoming');

  onMount(() => {
    // A segurança agora é feita pelo +layout.svelte, o que limpa este código
    loadBookings();
  });

  async function loadBookings() {
    isLoading = true;
    try {
      // Correção: Chamar a função correta da nossa API
      const data = await api.getClientBookings();
      bookings = data;
    } catch (error) {
      console.error('Erro ao carregar reservas:', error);
    } finally {
      isLoading = false;
    }
  }

  // Correção: A função de cancelar na API precisa ser implementada
  async function cancelBooking(id: string) {
    if (!confirm('Tem certeza que deseja cancelar esta reserva?')) return;
    try {
      // Nota: A API para o cliente cancelar ainda precisa ser criada.
      // await api.cancelClientBooking(id);
      alert("Função de cancelamento ainda não implementada na API.");
      // loadBookings();
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
    }
  }

  // ... (O resto da lógica e do HTML está maioritariamente correto) ...
  // Pequenas correções de nomes de variáveis podem ser necessárias dependendo da resposta da API.
  // Ex: booking.service.title em vez de booking.service.name

  function getFilteredBookings() {
    // ... esta função está bem
  }
  function formatDate(dateStr: string) {
    // ... esta função está bem
  }
  function getStatusColor(status: string) {
    // ... esta função está bem
  }
  function getStatusLabel(status: string) {
    // ... esta função está bem
  }
  function logout() {
    authStore.logout();
    goto('/');
  }

  let filteredBookings = $derived(getFilteredBookings());
</script>

<!-- O HTML daqui para baixo está bom. Apenas lembre-se de ajustar nomes de propriedades -->
<!-- se a sua API retornar, por exemplo, 'service.title' em vez de 'service.name'. -->
<div class="min-h-screen flex flex-col">
  <!-- Header ... -->
  <!-- Main Content ... -->
</div>
