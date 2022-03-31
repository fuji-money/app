<script lang="ts">
  export let network;
</script>

<div>
  <button on:click={() => network = 'liquid'}>Liquid</button>
  <button on:click={() => network = 'lightning'}>Lightning</button>
</div>
