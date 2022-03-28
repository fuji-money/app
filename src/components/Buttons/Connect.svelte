<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let wallet: boolean;

  const dispatch = createEventDispatcher();
  const connect = () => dispatch('connect', null);
</script>

<button on:click={connect} class="button is-primary">
  {wallet ? 'Disconnect ' : 'Connect wallet'}
</button>

<style lang="scss">
  button {
    border: 0;
    margin: auto;
    margin-left: 80px;
  }
</style>
