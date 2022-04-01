<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let page: string;

  const dispatch = createEventDispatcher();
  const navigate = (route: string) => dispatch('navigate', route);
</script>

{#if page === 'topup'}
  <p>
    <!-- svelte-ignore a11y-missing-attribute -->
    <a on:click={() => navigate('dashboard')}>Dashboard</a>
    &gt;
    <span>Topup</span>
  </p>
{/if}

<style>
  p {
    font-size: 0.8rem;
  }
</style>
