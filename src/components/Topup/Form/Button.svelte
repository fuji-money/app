<script lang="ts">
  import type { Asset } from '../../../lib/types';

  import { notEnoughFunds } from '../../../lib/utils';

  export let assets: Asset[];
  export let extraCollateral: Asset;
  export let wallet: boolean;

  $: disabled =
    !wallet ||
    notEnoughFunds({ asset: extraCollateral, assets }) ||
    extraCollateral.quantity === 0;
</script>

<div class="has-text-centered">
  <button on:click class="button is-primary is-cta" {disabled}>Topup</button>
</div>
