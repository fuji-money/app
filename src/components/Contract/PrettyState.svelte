<script lang="ts">
  import type { ContractState } from '../../lib/types';

  export let state: ContractState;
</script>

<p class="state {state}">
  <span>&bull;</span>
  <span>{state}</span>
</p>

<style lang="scss">
  .state {
    border-radius: 16px;
    display: flex;
    font-weight: 700;
    line-height: 0.5rem;
    padding: 4px;
    margin: auto 0;
    width: 5rem;
    span {
      display: block;
      margin: auto;
      &:nth-child(1) {
        /* bullet */
        font-size: 2rem;
        padding-bottom: 2px;
      }
      &:nth-child(2) {
        /* string */
        flex-grow: 8;
        font-size: 0.6rem;
        padding-bottom: 0px;
        text-align: center;
        text-transform: uppercase;
      }
    }
    &.safe {
      background-color: #e4fcff;
      color: #64bec9;
    }
    &.unsafe {
      background-color: #ffecdb;
      color: #ffba78;
    }
    &.critical {
      background-color: #ffdedf;
      color: #ff4e53;
    }
    &.liquidated {
      background-color: #eee;
      color: #000;
    }
    &.redeemed {
      background-color: #e4fcff;
      color: #64bec9;
    }
  }
</style>
