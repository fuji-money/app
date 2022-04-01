<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Asset } from '../../lib/types';

  export let asset: Asset;

  const dispatch = createEventDispatcher();
  const filter = () => dispatch('filter', asset.ticker);
</script>

<button on:click={filter} class="button"> Borrow </button>
