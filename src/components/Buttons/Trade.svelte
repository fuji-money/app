<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  const trade = () => dispatch('trade', null);
</script>

<button on:click={trade} class="button is-primary">Trade</button>
