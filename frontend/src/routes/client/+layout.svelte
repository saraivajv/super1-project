<script lang="ts">
    import { goto } from '$app/navigation';
    import { authStore } from '$lib/stores/auth.store';
    import { get } from 'svelte/store';

    if (!get(authStore.isAuthenticated) || !authStore.isClient()) {
        goto('/login', { replaceState: true });
    }
</script>

<slot />