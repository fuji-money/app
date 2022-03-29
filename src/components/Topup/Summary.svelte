<script lang="ts">
  import type { Contract } from '../../lib/types';
  import { getContractState, prettyAmount, prettyNumber, prettyAsset, getContractRatio } from '../../lib/utils';
  import PrettyState from '../PrettyState.svelte';

  export let contract: Contract;

  $: ratio = getContractRatio(contract);
  $: state = getContractState(contract);
</script>

<div class="level">
  <div class="level-item has-text-centered">
    <div>
      <p>Synthetic</p>
      <p>{prettyAsset(contract.synthetic)}</p>
      <p>{prettyAmount(contract.synthetic)}</p>
    </div>
  </div>
  <div class="level-item has-text-centered">
    <div>
      <p>Ratio</p>
      <p>{prettyNumber(ratio, 2, 2)}%</p>
      <p><PrettyState {state} /></p>
    </div>
  </div>
  <div class="level-item has-text-centered">
    <div>
      <p>Collateral</p>
      <p>{prettyAsset(contract.collateral)}</p>
      <p>{prettyAmount(contract.collateral)}</p>
    </div>
  </div>
</div>

<style lang="scss">
  .level-item {
    p {
      font-weight: 700;
      margin: 10px auto;
    }
    p:nth-child(1) {
      color: #63159b;
      font-size: 0.7rem;
      text-transform: uppercase;
    }
    p:nth-child(3) {
      font-size: 0.9rem;
      font-weight: 400;
    }
  }
</style>
