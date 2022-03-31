<script lang="ts">
  import type { Asset } from "../../lib/types";

  export let collateral: Asset;

  // event handler
  const change = (e: any) => {
    collateral = {
      ...collateral,
      quantity: parseFloat(e.target.value),
    }
  }
</script>

<div class="level is-pink">
  <div class="level-left">
    <div class="level-item">
      <p class="ml-3"><img src={collateral.icon} alt="collateral icon" /></p>
      <p class="ml-3">{collateral.ticker}</p>
    </div>
  </div>
  <div class="level-right">
    <div class="level-item">
      <input
        class="input has-pink-background has-text-right"
        min="0"
        placeholder="0.00"
        type="number"
        on:change={change}
      />
    </div>
  </div>
</div>

<style lang="scss">
  img {
    height: 1.5rem;
    margin-top: 2px;
  }
  input {
    border: 0;
    max-width: 100px;
  }
</style>
