<script lang="ts">
  import { onMount } from "svelte";
  import type { ContractState } from "../../../lib/types";
  import { getRatioState, prettyRatio } from "../../../lib/utils";

  export let min: number;
  export let safe: number;
  export let ratio: number;

  let state: ContractState;

  // update range bar colors,
  // runs everytime the ratio changes
  const updateColors = () => {
    const target = document.getElementById('range');
    if (!target) return false;
    const width = target.offsetWidth;
    target.style.backgroundSize = (ratio * 100) / width + '% 100%';
  }

  // put range labels on correct coordinates,
  // runs only once, on component mount
  const updateLabels = () => {
    const _min = document.getElementById('min');
    const _safe = document.getElementById('safe');
    if (!_min || !_safe || !ratio) return;
    let left = ratio - 25; // 25 = 50/2 with 50 = safe delta
    _min.style.left = `${left}px`;
    if (safe >= min + 40) {
      _safe.style.left = `${left}px`;
    } else {
      _safe.style.visibility = 'hidden';
    }
  };

  // event handler
  const change = (e: any) => {
    // ratio can't go under the minumum ratio
    ratio = e.target.value > min ? e.target.value : min;
    // update range bar colors
    updateColors();
  };

  // :-)
  const easterEgg = (e: any) => {
    if (e.target.id === 'min') ratio = min;
    if (e.target.id === 'safe') ratio = safe;
    updateColors();
  }

  // on component mount, update labels positioning and range bar colors
  onMount(() => {
    updateLabels();
    updateColors();
  })

  $: state = getRatioState(ratio, min);
</script>

<p class="range-legend">
  <span on:click={easterEgg} id="min">min: {prettyRatio(min)}%</span>
  <span on:click={easterEgg} id="safe">safe: {prettyRatio(safe)}%</span>
</p>
<div class="level">
  <div class="level-left">
    <div class="level-item">
      <input
        id="range"
        min="0"
        max="400"
        type="range"
        class="{state}"
        bind:value={ratio}
        on:change={change}
      />
    </div>
  </div>
  <div class="level-right">
    <div class="level-item">
      <div class="level is-pink has-text-right pr-5">
        <input
          class="input is-pink has-text-right has-suffix"
          placeholder="{ratio}%"
          type="number"
          bind:value={ratio}
          on:change={change}
        />
        <span>%</span>
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  p {
    &.range-legend {
      span {
        display: inline-block;
        font-size: 0.6rem;
        position: relative;
        text-align: center;
        width: 50px;
      }
    }
  }
  input[type='number'] {
    border: 0;
    max-width: 100px;
  }
  input.has-suffix {
    margin-right: 0;
    padding-right: 0;
  }
  input[type="range"] {
    -webkit-appearance: none;
    margin-right: 15px;
    width: 400px;
    height: 7px;
    background: #ffddbb;
    border-radius: 5px;
    background-image: linear-gradient(#6b1d9c, #6b1d9c);
    background-size: 50% 100%;
    background-repeat: no-repeat;
    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      height: 20px;
      width: 20px;
      border-radius: 50%;
      background: #aaa;
      cursor: ew-resize;
      box-shadow: 0 0 2px 0 #555;
      transition: background .3s ease-in-out;
    }
    &::-webkit-slider-runnable-track  {
      -webkit-appearance: none;
      box-shadow: none;
      border: none;
      background: transparent;
    }
    &.safe {
      background-image: linear-gradient(#6b1d9c, #6b1d9c);
    }
    &.unsafe {
      background-image: linear-gradient(#ff712c, #ff712c);
    }
    &.critical {
      background-image: linear-gradient(#e30f00, #e30f00);
    }
  }
</style>

