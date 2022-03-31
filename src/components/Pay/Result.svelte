<script lang="ts">
  export let result: string;
</script>

<div class="has-text-centered">
  {#if result === 'success'}
    <p><img src="/images/success.svg" alt="success icon"></p>
    <h2 class="mt-4">Topup success!</h2>
  {:else}
    <p><img src="/images/failed.svg" alt="failed icon"></p>
    <h2 class="mt-4">Topup failed</h2>
  {/if}
</div>
<p class="is-size-7">
  In vivamus mi pretium pharetra cursus lacus, elit. Adipiscing eget vel ut non duis vitae.
  Augue mi, bibendum ac imperdiet ipsum sed ornare. Facilisis id sem quam elementum euismod ante ut.
  Ac, pharetra elit, sit pharetra a. Eu diam nunc nulla risus arcu, integer nulla diam, est.
  Nisl accumsan potenti mattis consectetur pellentesque.
</p>
