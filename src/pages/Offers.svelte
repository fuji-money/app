<script lang="ts">
  import List from '../components/Borrow/List.svelte';
  import type { Offer } from '../lib/types';

  export let offers: Offer[];
  export let wallet: boolean;
</script>

<h1>Borrow</h1>
<List {offers} {wallet} on:borrow on:connect />
