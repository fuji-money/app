<script lang="ts">
  import type { Asset, Contract, Offer } from '../../../lib/types';
  import { getContractRatio, notEnoughFunds } from '../../../lib/utils';

  export let assets: Asset[];
  export let contract: Contract;
  export let offer: Offer;
  export let wallet: boolean;

  $: disabled =
    !wallet ||
    !assets ||
    !contract ||
    !offer ||
    !(
      contract.collateral.quantity > 0 &&
      contract.collateral.value > 0 &&
      getContractRatio(contract) >= offer.collateral.ratio &&
      contract.synthetic.quantity > 0 &&
      contract.synthetic.value > 0
    );
</script>

<div class="has-text-centered">
  <button on:click class="button is-primary is-cta" {disabled}>Proceed to payment</button>
</div>
