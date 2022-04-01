<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Offer } from '../../lib/types';

  export let offer: Offer;

  const dispatch = createEventDispatcher();
  const borrow = () => dispatch('borrow', offer);
</script>

<button on:click={borrow} class="button"> Borrow </button>
