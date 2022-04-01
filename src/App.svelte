<script lang="ts">
  import Home from './pages/Home.svelte';
  import Dashboard from './pages/Dashboard.svelte';
  import Create from './pages/Borrow.svelte';
  import Offers from './pages/Offers.svelte';
  import Topup from './pages/Topup.svelte';
  import Footer from './components/Footer/Footer.svelte';
  import TradeModal from './components/Modals/Trade.svelte';
  import RedeemModal from './components/Modals/Redeem.svelte';
  import Navbar from './components/Navigation/Navbar.svelte';
  import { onMount } from 'svelte';
  import { openModal } from './lib/utils';
  import type { Activity, Asset, Contract, Offer, Ticker } from './lib/types';
  import {
    getActivities,
    getAssets,
    getBalance,
    getContracts,
    getOffers,
  } from './lib/fetch';
  import { detectProvider, MarinaProvider } from 'marina-provider';
  import Breadcrumbs from './components/Navigation/Breadcrumbs.svelte';
  import Pay from './pages/Pay.svelte';

  let activities: Activity[];
  let assets: Asset[];
  let contract: Contract;
  let contracts: Contract[];
  let extraCollateral: Asset;
  let offer: Offer;
  let offers: Offer[];
  let page = 'home';
  let ticker: Ticker;
  let marina: MarinaProvider;
  let wallet = true;

  // after home, go to dashboard
  const advance = () => (page = 'dashboard');

  // new contract form
  const borrow = (event: CustomEvent) => {
    offer = event.detail;
    page = 'create';
  };

  // toggles marina wallet on button click
  const connect = async () => {
    if (await marina.isEnabled()) {
      await marina.disable();
      wallet = false;
    } else {
      await marina.enable();
      wallet = true;
    }
  };

  // filter offers by asset ticker
  const filter = (event: CustomEvent) => {
    ticker = event.detail;
    page = 'offers';
  };

  // navigate to a different page
  const navigate = (event: CustomEvent) => {
    page = event.detail;
    if (page === 'offers') ticker = undefined;
  }

  // pay a contract
  const pay = (event: CustomEvent) => {
    ({ contract, extraCollateral } = event.detail);
    page = 'pay';
  }

  // redeem contract, ask for marina confirmation
  const redeem = (event: CustomEvent) => {
    contract = event.detail;
    openModal('redeem');
  };

  // new topup form
  const topup = (event: CustomEvent) => {
    contract = event.detail;
    page = 'topup';
  };

  // show available exchanges in modal
  const trade = () => openModal('trade');

  // BIG TODO
  // Using dummy data from now, coming from a API:
  // - change schema and url for correct API
  // - get data from heuristic anaylisis to marina transactions
  onMount(async () => {
    try {
      marina = await detectProvider('marina');
    } catch (_) {}
    // get assets from API
    assets = await getAssets();
    // get contracts from API - TODO
    contracts = await getContracts({ assets });
    // get available offers from API
    offers = await getOffers({ assets });
    // add balance to assets - TODO
    assets = await getBalance({ assets, contracts });
    // get activities - TODO
    activities = await getActivities({ contracts, assets });
  });
</script>

{#if page == 'home'}
  <Home on:advance={advance} />
{:else}
  <Navbar {wallet} on:navigate={navigate} on:trade={trade} on:connect={connect} />
  <main>
    <div class="container">
      <Breadcrumbs {page} on:navigate={navigate} />
      {#if page === 'dashboard'}
        <Dashboard
          {activities}
          {assets}
          {contracts}
          {wallet}
          on:borrow={borrow}
          on:filter={filter}
          on:redeem={redeem}
          on:topup={topup}
          on:trade={trade}
        />
      {:else if page === 'offers'}
        <Offers {offers} {ticker} {wallet} on:borrow={borrow} on:connect={connect} />
      {:else if page === 'create'}
        <Create {assets} {offer} {wallet} on:pay={pay} on:connect={connect} on:pay={pay} />
      {:else if page === 'topup'}
        <Topup {assets} {contract} {wallet} on:pay={pay} on:connect={connect} />
      {:else if page === 'pay'}
        <Pay {assets} {contract} {extraCollateral} {wallet} />
      {/if}
    </div>
  </main>
{/if}

<Footer />

<RedeemModal {contract} />
<TradeModal />
