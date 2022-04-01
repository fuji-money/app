<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let result: string;

  // event dispatcher
  const dispatch = createEventDispatcher();
  const dashboard = () => dispatch('navigate', 'dashboard');
</script>

<div class="has-text-centered mx-6">
  {#if result === 'success'}
    <p><img src="/images/success.svg" alt="success icon" /></p>
    <h2 class="mt-4">Success</h2>
  {:else}
    <p><img src="/images/failed.svg" alt="failed icon" /></p>
    <h2 class="mt-4">Something went wrong</h2>
  {/if}
  <p class="is-size-7 has-text-left">
    In vivamus mi pretium pharetra cursus lacus, elit. Adipiscing eget vel ut non duis vitae. Augue
    mi, bibendum ac imperdiet ipsum sed ornare. Facilisis id sem quam elementum euismod ante ut. Ac,
    pharetra elit, sit pharetra a. Eu diam nunc nulla risus arcu, integer nulla diam, est. Nisl
    accumsan potenti mattis consectetur pellentesque.
  </p>
  {#if result === 'success'}
    <p class="has-text-centered mt-4">
      <button on:click={dashboard} class="button is-primary is-cta">Back to dashboard</button>
    </p>
  {:else}
    <p class="has-text-centered mt-4">
      <button class="button is-primary is-cta">Retry payment</button>
    </p>
    <p class="has-text-centered mt-4">
      <button on:click={dashboard} class="button is-cta">Back to dashboard</button>
    </p>
  {/if}
</div>
