<script lang="ts">
  import type { Asset } from '../../../lib/types';

  import { notEnoughFunds } from '../../../lib/utils';

  export let balance: Asset[];
  export let collateral: Asset;
  export let wallet: boolean;

  $: disabled =
    !wallet ||
    notEnoughFunds({ asset: collateral, balance }) ||
    collateral.quantity === 0;
</script>

<div class="has-text-centered">
  <button on:click class="button is-primary is-cta" {disabled}>Topup</button>
</div>
