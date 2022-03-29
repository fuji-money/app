<script lang="ts">
  import List from '../components/Borrow/List.svelte';
  import type { Offer, Ticker } from '../lib/types';

  export let ticker: Ticker;
  export let offers: Offer[];
  export let wallet: boolean;
</script>

<h1>Borrow</h1>
<List {offers} {ticker} {wallet} on:borrow on:connect />
