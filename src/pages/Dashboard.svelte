<script lang="ts">
  import Activities from '../components/Dashboard/Activities.svelte';
  import Assets from '../components/Dashboard/Assets.svelte';
  import Contracts from '../components/Dashboard/Contracts.svelte';
  import type { Activity, Asset, Contract } from '../lib/types';

  export let activities: Activity[];
  export let assets: Asset[];
  export let contracts: Contract[];
  export let wallet: boolean;
</script>

<h1 class="is-sr-only">Dashboard</h1>
<Assets {assets} on:borrow on:filter on:trade />
<Contracts {contracts} {wallet} on:redeem on:topup />
<Activities {activities} {wallet} />
