<script lang="ts">
  import type { Ticker, Offer } from '../../lib/types';
  import EmptyState from '../EmptyState.svelte';
  import Filter from './Filter.svelte';
  import Table from './Table.svelte';

  export let offers: Offer[];
  export let ticker: Ticker;
  export let wallet: boolean;

  let filteredOffers = offers;
</script>


<Filter bind:filteredOffers {offers} {ticker} />
{#if filteredOffers?.length === 0}
  <EmptyState type="offers" />
{:else}
  <Table {filteredOffers} {wallet} on:borrow on:connect />
{/if}
