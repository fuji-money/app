<script lang="ts">
  import type { Asset, Contract, Offer } from '../../../lib/types';

  import { notEnoughFunds } from '../../../lib/utils';

  export let balance: Asset[];
  export let contract: Contract;
  export let offer: Offer;
  export let wallet: boolean;

  $: disabled =
    !wallet ||
    !balance ||
    !contract ||
    !offer ||
    notEnoughFunds({ asset: contract.collateral, balance }) ||
    !(
      contract.collateral.quantity > 0 &&
      contract.collateral.value > 0 &&
      contract.ratio >= offer.ratio &&
      contract.synthetic.quantity > 0 &&
      contract.synthetic.value > 0
    );
</script>

<div class="has-text-centered">
  <button on:click class="button is-primary is-cta" {disabled}>Create contract</button>
</div>
