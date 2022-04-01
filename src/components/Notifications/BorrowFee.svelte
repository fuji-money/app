<script lang="ts">
  export let payout = 0.25;
</script>

<p class="notification">
  <img src="/images/warning.svg" alt="warning icon" />
  A {payout}% fee of the minted value will be levied when the borrow position is closed
</p>

<style>
  p {
    background-color: #ffe8d3;
    border: 1px solid #ff712c;
    color: #ff712c;
  }
</style>
