<script lang="ts">
  import type { Asset } from '../../lib/types';
  import { prettyNumber } from '../../lib/utils';
  import EmptyState from '../Utils/EmptyState.svelte';
  import Spinner from '../Utils/Spinner.svelte';
  import TradeButton from '../Buttons/Trade.svelte';
  import FilterButton from '../Buttons/Filter.svelte';

  export let assets: Asset[];

  $: loading = assets === undefined;
  $: synthetics = assets?.filter((asset) => asset.isSynthetic);
</script>

<section>
  <h2>Assets</h2>
  {#if loading}
    <Spinner />
  {:else if !assets}
    <EmptyState type="assets" />
  {:else}
    {#each synthetics as asset}
      <div class="white-slip row">
        <div class="columns level">
          <div class="column is-flex">
            <img src={asset.icon} alt="asset logo" />
            <div class="synthetic is-gradient">
              <p>{asset.name}</p>
              <p>{prettyNumber(asset.quantity)} {asset.ticker}</p>
            </div>
          </div>
          <div class="column">
            <p class="amount is-gradient">
              US ${prettyNumber(asset.quantity * asset.value)}
            </p>
          </div>
          <div class="column">
            <TradeButton on:trade />
            <FilterButton {asset} on:filter />
          </div>
        </div>
      </div>
    {/each}
  {/if}
</section>

<style lang="scss">
  img {
    display: block;
    height: 60px;
    padding: 10px;
    padding-left: 0;
  }
</style>
