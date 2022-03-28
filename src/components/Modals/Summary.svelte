<script lang="ts">
  import type { Contract } from '../../lib/types';
  import { getContractRatio, prettyNumber } from '../../lib/utils';

  export let contract: Contract;
</script>

<table class="table">
  <tr>
    <td>Borrow</td>
    <td>{prettyNumber(contract.synthetic.quantity)}</td>
    <td>{contract.synthetic.ticker}</td>
  </tr>
  <tr>
    <td>Collateral</td>
    <td>{prettyNumber(contract.collateral.quantity)}</td>
    <td>{contract.collateral.ticker}</td>
  </tr>
  <tr>
    <td>Ratio</td>
    <td>{prettyNumber(getContractRatio(contract) * 100, 0, 2)}</td>
    <td>%</td>
  </tr>
</table>

<style lang="scss">
  table {
    margin: 10px auto 20px auto;
    tr {
      text-align: left;
      td {
        padding: 0 10px;
      }
      td:nth-child(2) {
        text-align: right;
      }
    }
  }
</style>
