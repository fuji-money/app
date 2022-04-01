<script lang="ts">
  import type { Ticker, Offer } from '../../lib/types';

  export let offers: Offer[];
  export let filteredOffers: Offer[];
  export let ticker: Ticker;

  let filter = ticker;

  const filterOffers = (filter: string) => {
    if (!filter) return offers;
    const regexp = new RegExp(filter, 'gi');
    return offers.filter(
      ({ synthetic, collateral, id }) =>
        collateral.name.match(regexp) ||
        collateral.ticker.match(regexp) ||
        collateral.ratio.toString().match(regexp) ||
        synthetic.name.match(regexp) ||
        synthetic.ticker.match(regexp) ||
        id.match(regexp)
    );
  };

  const reset = () => {
    console.log('reset');
    filter = null;
  };

  $: filteredOffers = filterOffers(filter);
</script>

<p class="control has-icons-left">
  <input
    class="input is-medium has-pink-border"
    type="text"
    placeholder="Search"
    bind:value={filter}
  />
  <span class="icon is-left">
    {#if filter}
      <img on:click={reset} src="/images/icons/close.svg" alt="close icon" />
    {:else}
      <img src="/images/icons/search.svg" alt="search icon" />
    {/if}
  </span>
</p>

<style lang="scss">
  // .icon needs extra specificity due to bulma
  .control.has-icons-left .icon {
    // bulma removes pointer events from icons
    pointer-events: initial;
  }
</style>
