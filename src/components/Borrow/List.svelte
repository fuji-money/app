<script lang="ts">
  import type { Ticker, Offer } from '../../lib/types';
  import { prettyNumber } from '../../lib/utils';
  import EmptyState from '../EmptyState.svelte';
  import BorrowButton from '../Buttons/Borrow.svelte';
  import ConnectButton from '../Buttons/Connect.svelte';

  export let offers: Offer[];
  export let ticker: Ticker;
  export let wallet: boolean;

  let filter = ticker;

  const filterOffers = (filter: string) => {
    if (!filter) return offers;
    const regexp = new RegExp(filter, 'gi');
    return offers.filter(
      ({ synthetic, collateral, id }) =>
        synthetic.name.match(regexp) ||
        synthetic.ticker.match(regexp) ||
        collateral.ratio.toString().match(regexp) ||
        id.match(regexp)
    );
  };

  $: filteredOffers = filterOffers(filter);
</script>

<input
  class="input is-medium has-pink-border"
  type="text"
  placeholder="Search"
  bind:value={filter}
/>

{#if filteredOffers?.length === 0}
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
  {#each filteredOffers as offer}
    <div class="white-slip row">
      <div class="columns level">
        <div class="column is-flex is-2">
          <img src={offer.synthetic.icon} alt="asset logo" />
          <div class="synthetic is-gradient">
            <p>{offer.synthetic.name}</p>
            <p>{offer.synthetic.ticker}</p>
          </div>
        </div>
        <div class="column is-2">
          <p class="amount is-gradient">US ${prettyNumber(offer.synthetic.value)}</p>
        </div>
        <div class="column is-2">
          <p class="is-gradient">{`>${offer.collateral.ratio}%`}</p>
        </div>
        <div class="column is-2">
          <p class="is-gradient">{offer.collateral.ticker}</p>
        </div>
        <div class="column is-4">
          {#if wallet}
            <BorrowButton {offer} on:borrow />
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
  img {
    display: block;
    height: 60px;
    padding: 10px;
    padding-left: 0;
  }
</style>
