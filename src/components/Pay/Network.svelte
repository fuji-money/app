<script lang="ts">
  import type { Contract } from '../../lib/types';

  export let contract: Contract;
  export let network: string;

  const { ticker } = contract.collateral;

  $: disabled = ticker !== 'LBTC';
</script>

<div>
  <div class="has-text-centered">
    <h2>Choose how to deposit {ticker}</h2>
    <p>
      <button class="button is-primary" on:click={() => (network = 'liquid')}>
        <img src="/images/networks/liquid.svg" alt="liquid network logo" />
        Liquid
      </button>
      <button class="button is-primary" on:click={() => (network = 'lightning')} {disabled}>
        <img src="/images/networks/lightning.svg" alt="lightning network logo" />
        Lightning
      </button>
    </p>
    {#if disabled}
      <p class="has-text-weight-bold is-size-6 mt-4">
        {ticker} swaps in Lightning are still in development.
      </p>
    {/if}
  </div>
</div>

<style lang="scss">
  button {
    margin: auto 1rem;
    img {
      margin-right: 1rem;
      max-height: 1.42rem;
    }
  }
</style>
