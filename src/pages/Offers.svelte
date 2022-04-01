<script lang="ts">
  import type { Ticker, Offer } from '../lib/types';
  import EmptyState from '../components/Utils/EmptyState.svelte';
  import Filter from '../components/Offers/Filter.svelte';
  import Table from '../components/Offers/Table.svelte';
  import Breadcrumbs from '../components/Navigation/Breadcrumbs.svelte';

  export let offers: Offer[];
  export let ticker: Ticker;
  export let wallet: boolean;

  let filter = ticker;
  let bread = ['Borrow'];

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

  $: filteredOffers = filterOffers(filter);
  $: crumbs = filter ?  [filter] : [];
</script>

<Breadcrumbs {bread} {crumbs} on:navigate />
<h1>Borrow</h1>
<Filter bind:filter />
{#if filteredOffers?.length === 0}
  <EmptyState type="offers" />
{:else}
  <Table {filteredOffers} {wallet} on:borrow on:connect />
{/if}
