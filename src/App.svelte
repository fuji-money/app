<script lang="ts">
  import Home from './pages/Home.svelte';
  import Dashboard from './pages/Dashboard.svelte';
  import Create from './pages/Create.svelte';
  import Offers from './pages/Offers.svelte';
  import Topup from './pages/Topup.svelte';
  import Footer from './components/Footer/Footer.svelte';
  import TradeModal from './components/Modals/Trade.svelte';
  import RedeemModal from './components/Modals/Redeem.svelte';
  import TopupModal from './components/Modals/Topup.svelte';
  import CreateModal from './components/Modals/Create.svelte';
  import Navbar from './components/Navbar.svelte';
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
  import Breadcrumbs from './components/Breadcrumbs.svelte';

  let activities: Activity[];
  let asset: Asset;
  let assets: Asset[];
  let contract: Contract;
  let contracts: Contract[];
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

  // new contract created, ask for marina confirmation
  const create = (event: CustomEvent) => {
    contract = event.detail;
    openModal('create');
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
    page = 'borrow';
  };

  // new topup created, ask for marina confirmation
  const increase = (event: CustomEvent) => {
    asset = event.detail;
    openModal('topup');
  };

  // navigate to a different page
  const navigate = (event: CustomEvent) => (page = event.detail);

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
      {:else if page === 'borrow'}
        <Offers {offers} {ticker} {wallet} on:borrow={borrow} on:connect={connect} />
      {:else if page === 'create'}
        <Create {assets} {offer} {wallet} on:create={create} on:connect={connect} />
      {:else if page === 'topup'}
        <Topup {assets} {contract} {wallet} on:increase={increase} on:connect={connect} />
      {/if}
    </div>
  </main>
{/if}

<Footer />

<CreateModal {contract} />
<RedeemModal {contract} />
<TopupModal {contract} {asset} />
<TradeModal />
