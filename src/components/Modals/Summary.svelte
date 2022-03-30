<script lang="ts">
  import type { Contract } from '../../lib/types';
  import { getContractRatio, prettyNumber, prettyRatio } from '../../lib/utils';

  export let contract: Contract;
</script>

<div class="summary-line has-pink-border">
  <p>Borrow</p>
  <p class="is-gradient">
    {prettyNumber(contract.synthetic.quantity)}
    {contract.synthetic.ticker}
  </p>
</div>

<div class="summary-line has-pink-border">
  <p>Collateral</p>
  <p class="is-gradient">
    {prettyNumber(contract.collateral.quantity)}
    {contract.collateral.ticker}
  </p>
</div>

<div class="summary-line has-pink-border">
  <p>Ratio</p>
  <p class="is-gradient">
    {prettyRatio(getContractRatio(contract))}%
  </p>
</div>

<style lang="scss">
  .summary-line {
    background-color: #fff;
    display: flex;
    font-weight: 700;
    justify-content: space-between;
    padding: .7rem 3rem;
    max-width: 400px;
    margin: 2px auto;
    p {
      margin: 0;
    }
  }
</style>
