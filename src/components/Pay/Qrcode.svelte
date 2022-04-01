<script lang="ts">
  import type { Asset, Contract } from '../../lib/types';
  import { prettyNumber } from '../../lib/utils';

  export let contract: Contract;
  export let extraCollateral: Asset;
  export let result = '';

  const payment = extraCollateral || contract.collateral;
  const { quantity, ticker, value } = payment;
</script>

<div class="is-flex" on:click={() => (result = 'failure')}>
  <img class="qrcode" src="/images/qrcode.svg" alt="qrcode" />
  <div class="is-flex is-flex-direction-column is-justify-content-center">
    <h1>Pay by Scaning this QR</h1>
    <div class="is-flex">
      <div class="has-pink-border info-card px-5 py-4">
        <p>Pay amount</p>
        <p>{prettyNumber(quantity)} {ticker}</p>
        <p>US ${prettyNumber(quantity * value)}</p>
      </div>
    </div>
  </div>
</div>
<p class="is-size-7">
  In vivamus mi pretium pharetra cursus lacus, elit. Adipiscing eget vel ut non duis vitae. Augue
  mi, bibendum ac imperdiet ipsum sed ornare. Facilisis id sem quam elementum euismod ante ut. Ac,
  pharetra elit, sit pharetra a. Eu diam nunc nulla risus arcu, integer nulla diam, est. Nisl
  accumsan potenti mattis consectetur pellentesque.
</p>

<style lang="scss">
  .qrcode {
    max-width: 300px;
  }
</style>
