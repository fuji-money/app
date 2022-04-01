<script lang="ts">
  import type { Asset } from '../../lib/types';
  import { prettyNumber } from '../../lib/utils';

  export let collateral: Asset;

  $: quantity = collateral.quantity || 0;
</script>

<div class="level has-pink-border has-pink-background">
  <div class="level-left">
    <div class="level-item">
      <p class="ml-3 my-auto"><img src={collateral.icon} alt="collateral icon" /></p>
      <p class="ml-3 my-auto">{collateral.ticker}</p>
    </div>
  </div>
  <div class="level-right">
    <div class="level-item">
      <p class="mr-3 my-auto">{prettyNumber(quantity)}</p>
    </div>
  </div>
</div>

<style lang="scss">
  img {
    height: 1.5rem;
    margin-top: 2px;
  }
  .level {
    min-height: 45px;
  }
</style>
