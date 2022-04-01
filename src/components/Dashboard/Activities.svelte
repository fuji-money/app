<script lang="ts">
  import { Activity, ActivityType } from '../../lib/types';
  import { prettyAgo } from '../../lib/utils';
  import EmptyState from '../Utils/EmptyState.svelte';
  import Spinner from '../Utils/Spinner.svelte';

  export let activities: Activity[];
  export let wallet: boolean;

  let filteredActivities: Activity[];
  let selected = ActivityType.Creation;

  $: filteredActivities = activities?.filter((a) => a.type === selected);
  $: loading = activities === undefined;
</script>

<section>
  <div class="header level mb-4">
    <div class="level-left">
      <div class="level-item">
        <h2>Activity</h2>
      </div>
    </div>
    <div class="level-right">
      <div class="level-item">
        <p><strong>Filter by:</strong></p>
        <div class="select is-rounded is-primary is-small">
          <select bind:value={selected}>
            <option value={ActivityType.Creation}>{ActivityType.Creation}</option>
            <option value={ActivityType.Redeemed}>{ActivityType.Redeemed}</option>
            <option value={ActivityType.Topup}>{ActivityType.Topup}</option>
            <option value={ActivityType.Liquidated}>{ActivityType.Liquidated}</option>
          </select>
        </div>
      </div>
    </div>
  </div>
  {#if !wallet}
    <EmptyState type="wallet" />
  {:else if loading}
    <Spinner />
  {:else if filteredActivities?.length === 0}
    <EmptyState type="activities" />
  {:else}
    <div class="activity-list">
      {#each filteredActivities as { icon, message, createdAt, txid }}
        <div class="level">
          <div class="level-left">
            <div class="level-item">
              <img src={icon} alt="asset logo" />
            </div>
            <div class="level-item">
              <p>{message}</p>
            </div>
          </div>
          <div class="level-right">
            <div class="level-item">
              <a href="https://blockstream.info/liquid/tx/{txid}" class="button external"
                >{txid.substring(0, 8)}...</a
              >
            </div>
            <div class="level-item">
              <p class="time">{prettyAgo(createdAt)}</p>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</section>

<style lang="scss">
  .activity-list {
    background-color: #fff;
    margin-top: 20px;
    padding: 20px;
    img {
      height: 60px;
      padding: 10px;
    }
    p {
      margin: 0;
      &.time {
        color: #6b1d9c;
        font-weight: 700;
        margin: auto 10px;
      }
    }
    & > div {
      border-bottom: 1px solid #aaa;
    }
  }
  .select {
    margin-left: 20px;
  }
  select {
    border: 1px solid #6b1d9c;
  }
</style>
