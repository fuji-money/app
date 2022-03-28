<script lang="ts">
  import type { Contract } from "../../../lib/types";
  import { prettyNumber } from "../../../lib/utils";

  export let contract: Contract;
</script>

<div class="white-slip has-pink-border">
  <div class="level">
    <div class="level-left">
      <div class="level-item">
        <p>Oracle price</p>
        <p>Borrowing fee</p>
      </div>
    </div>
    <div class="level-right">
      <div class="level-item has-text-right">
        <p>1 {contract.synthetic.ticker} = {prettyNumber(contract.synthetic.value)} USDt</p>
        <p>{prettyNumber(contract.synthetic.quantity * contract.synthetic.value * 0.0025)} USDt</p>
      </div>
    </div>
  </div>
</div>

<style>
  .level-item {
    display: block;
  }
</style>
