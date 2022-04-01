<script lang="ts">
  import type { Asset, Contract } from '../../lib/types';
  import { prettyNumber } from '../../lib/utils';
  import Summary from '../Contract/Summary.svelte';
  import Spinner from '../Utils/Spinner.svelte';

  export let contract: Contract;
  export let extraCollateral: Asset;
  export let result: string;
</script>

<div class="has-text-centered">
  <Spinner />
  <h3>Waiting for confirmation...</h3>
  <p>
    {#if extraCollateral}
      Topup contract with
      <strong>
        +{prettyNumber(extraCollateral.quantity)}
        {extraCollateral.ticker}:
      </strong>
    {:else}
      Create contract:
    {/if}
  </p>
  <Summary {contract} />
  <p on:click={() => (result = 'success')} class="confirm">
    Confirm this transaction in your Marina wallet
  </p>
</div>

<style lang="scss">
  h3 {
    color: #6b1d9c;
  }
  p.confirm {
    color: #000;
    font-size: 0.9rem;
    font-weight: 700;
    margin-top: 1rem;
  }
</style>
