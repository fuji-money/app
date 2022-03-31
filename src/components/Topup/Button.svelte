<script lang="ts">
  import type { Asset } from '../../lib/types';

  export let extraCollateral: Asset;
  export let wallet: boolean;

  $: disabled = !wallet || extraCollateral.quantity === 0;
</script>

<div class="has-text-centered">
  <button on:click class="button is-primary is-cta" {disabled}>Proceed to payment</button>
</div>
