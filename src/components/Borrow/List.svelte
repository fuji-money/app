<script lang="ts">
  import type { Offer } from '../../lib/types';
  import { prettyNumber } from '../../lib/utils';
  import EmptyState from '../EmptyState.svelte';
  import Spinner from '../Spinner.svelte';
  import BorrowButton from '../Buttons/Borrow.svelte';
  import ConnectButton from '../Buttons/Connect.svelte';

  export let filter = '';
  export let offers: Offer[];
  export let wallet: boolean;

  const filterOffers = (filter: string) => {
    if (!offers) return [];
    const regexp = new RegExp(filter, 'gi');
    return offers.filter(
      ({ synthetic, ratio, txid }) =>
        synthetic.name.match(regexp) ||
        synthetic.ticker.match(regexp) ||
        ratio.toString().match(regexp) ||
        txid.match(regexp)
    );
  };

  $: filteredOffers = filterOffers(filter);
  $: loading = offers === undefined;
</script>

<input
  class="input is-medium has-pink-border"
  type="text"
  placeholder="Search"
  bind:value={filter}
/>

{#if loading}
  <Spinner />
{:else if filteredOffers.length === 0}
  <EmptyState type="offers" />
{:else}
  <div class="row mt-6 mb-0 pr-4 pl-4">
    <div class="columns">
      <div class="column is-2">
        <h2>Ticker</h2>
      </div>
      <div class="column is-2">
        <h2>Oracle price</h2>
      </div>
      <div class="column is-2">
        <h2>Collateral ratio</h2>
      </div>
      <div class="column is-2">
        <h2>Collateral asset</h2>
      </div>
      <div class="column is-4">&nbsp;</div>
    </div>
  </div>
  {#each filteredOffers as { collateral, quantity, ratio, synthetic }}
    <div class="white-slip row">
      <div class="columns level">
        <div class="column is-flex is-2">
          <img src={synthetic.icon} alt="asset logo" />
          <div class="synthetic is-gradient">
            <p>{synthetic.name}</p>
            <p>{prettyNumber(quantity)} {synthetic.ticker}</p>
          </div>
        </div>
        <div class="column is-2">
          <p class="amount is-gradient">US ${prettyNumber(quantity * synthetic.value)}</p>
        </div>
        <div class="column is-2">
          <p class="is-gradient">{`>${ratio}%`}</p>
        </div>
        <div class="column is-2">
          <p class="is-gradient">{collateral.map((c) => c.ticker).join(', ')}</p>
        </div>
        <div class="column is-4">
          {#if wallet}
            <BorrowButton asset={synthetic} on:borrow />
          {:else}
            <ConnectButton {wallet} on:connect />
          {/if}
        </div>
      </div>
    </div>
  {/each}
{/if}

<style lang="scss">
  h2 {
    margin-bottom: 0;
  }
</style>
