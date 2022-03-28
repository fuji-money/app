<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Contract } from '../../lib/types';

  export let contract: Contract;

  const dispatch = createEventDispatcher();
  const redeem = () => dispatch('redeem', contract);
</script>

<button on:click={redeem} class="button is-primary">
  Redeem
</button>
