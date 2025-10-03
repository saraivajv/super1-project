<script lang="ts">
    import { goto } from '$app/navigation';
    import { authStore } from '$lib/stores/auth.store';
    import { onMount } from 'svelte';
    import { get } from 'svelte/store';

    onMount(() => {
        if (!get(authStore.isAuthenticated) || !authStore.isProvider()) {
            goto('/login', { replaceState: true });
        }
    });
</script>

<slot />

