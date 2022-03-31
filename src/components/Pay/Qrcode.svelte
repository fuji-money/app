<script lang="ts">
  export let contract;
  export let result;
</script>

<div class="is-flex">
  <img class="qrcode" src="/images/qrcode.svg" alt="qrcode" />
  <div class="is-flex is-flex-direction-column is-justify-content-center">
    <h1>Pay by Scaning this QR</h1>
    <div class="is-flex" on:click={() => result = 'success'}>
      <div class="has-pink-border info-card px-5 py-4">
        <p>Pay amount</p>
        <p>20.00 L-BTC</p>
        <p>US $874587</p>
      </div>
    </div>
  </div>
</div>
<p class="is-size-7">
  In vivamus mi pretium pharetra cursus lacus, elit. Adipiscing eget vel ut non duis vitae.
  Augue mi, bibendum ac imperdiet ipsum sed ornare. Facilisis id sem quam elementum euismod ante ut.
  Ac, pharetra elit, sit pharetra a. Eu diam nunc nulla risus arcu, integer nulla diam, est.
  Nisl accumsan potenti mattis consectetur pellentesque.
</p>

<style lang="scss">
  .qrcode {
    max-width: 300px;
  }
</style>
