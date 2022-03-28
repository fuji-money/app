<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Contract } from '../../lib/types';

  export let contract: Contract;

  const dispatch = createEventDispatcher();
  const topup = () => dispatch('topup', contract);
</script>

<button on:click={topup} class="button">
  Topup
</button>
