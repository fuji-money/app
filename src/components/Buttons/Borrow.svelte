<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Asset } from '../../lib/types';

  export let asset: Asset;

  const dispatch = createEventDispatcher();
  const borrow = () => {
    const token = { ...asset };
    delete token.quantity;
    dispatch('borrow', token);
  }
</script>

<button on:click={borrow} class="button">
  Borrow
</button>
