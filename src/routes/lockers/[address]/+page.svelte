<script>
  import Navbar from "src/components/Navbar.svelte";
  import Footer from "src/components/Footer.svelte";
  import Card from "src/components/Card.svelte";
  import TextInput from "src/components/TextInput.svelte";
  import DateInput from "src/components/DateInput.svelte";
  import Select from "src/components/Select.svelte";
  import Button from "src/components/Button.svelte";
  import Alert from "src/components/Alert.svelte";

  import CheckDouble from "src/icons/CheckDouble.svelte";
  import Xmark from "src/icons/Xmark.svelte";
  import External from "src/icons/External.svelte";

  import Copy from "src/icons/Copy.svelte";

  import { onboard } from "src/lib/onboard";
  import { wallet } from "src/stores/wallet";

  import { toast } from "@zerodevx/svelte-toast";
  import { ethers } from "ethers";
  import { SpinLine, Jumper } from "svelte-loading-spinners";

  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import abi from "src/lib/abi/locker.js";
  import bep20 from "src/lib/abi/bep20.js";
  import deployerAbi from "src/lib/abi/deployer";
  import migrationRegistryAbi from "src/lib/abi/migrationRegistry";

  let signer;
  let userAddress;

  // MAINNET CONTRACT ADDRESS
  const contractAddr = $page.params.address;
  const deployerAddr = "0x14677928b375D188d65ac277Ee0a5d72D1dB6e01";
  const migrationRegistryAddr = "0xC21261F93360B3F9123A4fb26bbB6618aAdeFcaC";

  $: contractAddrDisplay = [
    contractAddr.slice(0, 6),
    contractAddr.slice(-4),
  ].join("..");

  let locker;
  let lock;
  let owner;
  let isKenshiLocker;
  let lockerVersion;
  let newLockDate;
  let tokenAddr = "";
  let amount;
  let tokenName = "Token";
  let deployerVersion;
  let migrateLocker;

  $: if (tokenAddr && tokenAddr.length === 42 && signer) {
    const token = new ethers.Contract(tokenAddr, bep20, signer);
    token.name().then((name) => {
      tokenName = name;
    });
  }

  let interval;
  const connectWallet = async (wallet) => {
    const provider = new ethers.providers.Web3Provider(wallet.provider);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();
    clearInterval(interval);
    interval = setInterval(updateValues, 60 * 1000, signer);
    updateValues(signer);
  };

  const connectNoWallet = async () => {
    const provider = new ethers.providers.JsonRpcProvider(
      "https://bsc-dataseed.binance.org/"
    );
    signer = provider;
    clearInterval(interval);
    interval = setInterval(updateValues, 60 * 1000, provider);
    updateValues(provider);
  };

  $: if ($wallet && $wallet.provider) {
    connectWallet($wallet);
  } else if (typeof window !== "undefined") {
    //connectNoWallet();
  }

  $: if ($wallet?.provider) {
    onboard.setChain({ chainId: "0x38" });
  }

  let updating = false;
  let loaded = false;

  const updateValues = async (signer) => {
    if (updating) return;
    updating = true;

    const deployer = new ethers.Contract(deployerAddr, deployerAbi, signer);
    isKenshiLocker = await deployer.isKenshiLocker(contractAddr);

    if (isKenshiLocker) {
      const registry = new ethers.Contract(
        migrationRegistryAddr,
        migrationRegistryAbi,
        signer
      );
      migrateLocker = await registry.getMigration(contractAddr);

      locker = new ethers.Contract(contractAddr, abi, signer);

      const timestamp = await locker.getLock();
      lock = new Date(timestamp * 1000);
      newLockDate = newLockDate || lock;

      owner = await locker.getOwner();

      deployerVersion = await deployer.getVersion();
      lockerVersion = await locker.getVersion();
    }

    updating = false;
    loaded = true;
  };

  const copy = (text) => () => {
    navigator.clipboard.writeText(text);
    toast.push("Copied to clipboard");
  };

  const bscScan = (addr) => `https://bscscan.com/address/${addr}#tokentxns`;

  let settingNewDate = false;
  const setNewLockDate = async () => {
    settingNewDate = true;
    if (!newLockDate) {
      toast.push("Select an unlock date first!");
    } else if (newLockDate.valueOf() <= lock.valueOf()) {
      toast.push("New unlock date should be bigger than the current.");
    } else {
      try {
        const date = Math.floor(new Date(newLockDate).valueOf() / 1000);
        await locker.lock(ethers.BigNumber.from(date));
        lock = new Date(newLockDate);
        toast.push("Unlock date updated successfully.");
      } catch (error) {
        toast.push("Something went wrong.");
      }
    }
    settingNewDate = false;
  };

  let locking = false;
  const lockTokens = async () => {
    locking = true;
    try {
      const token = new ethers.Contract(tokenAddr, bep20, signer);
      const decimals = await token.decimals();
      const amountWithDecimals = ethers.utils.parseUnits(amount, decimals);
      await token.transfer(contractAddr, amountWithDecimals);
      toast.push("Locking successful.");
    } catch (error) {
      toast.push("Something went wrong!");
    }
    locking = false;
  };

  let migrating = false;
  const migrateTokens = async () => {
    migrating = true;
    try {
      const token = new ethers.Contract(tokenAddr, bep20, signer);
      const decimals = await token.decimals();
      const amountWithDecimals = ethers.utils.parseUnits(amount, decimals);
      await locker.migrateTokens(tokenAddr, amountWithDecimals);
      toast.push("Migration successful.");
    } catch (error) {
      toast.push("Something went wrong!");
    }
    migrating = false;
  };

  let upgradingLocker = false;
  const upgradeLocker = async () => {
    upgradingLocker = true;
    try {
      const deployer = new ethers.Contract(deployerAddr, deployerAbi, signer);
      await deployer.migrateLocker(contractAddr);
      updateValues(signer);
      toast.push("Upgrade successful.");
    } catch (error) {
      toast.push("Something went wrong!");
    }
    upgradingLocker = false;
  };

  let withdrawing = false;
  const withdrawTokens = async () => {
    withdrawing = true;
    try {
      const token = new ethers.Contract(tokenAddr, bep20, signer);
      const decimals = await token.decimals();
      const amountWithDecimals = ethers.utils.parseUnits(amount, decimals);
      await locker.withdraw(tokenAddr, owner, amountWithDecimals);
      toast.push("Withdraw successful.");
    } catch (error) {
      toast.push("Something went wrong!");
    }
    withdrawing = false;
  };

  const formatBEP20 = (n) => {
    const [lhs, rhs = ""] = ethers.utils.formatUnits(n).split(".");
    return [lhs, rhs.slice(0, 2)].filter(Boolean).join(".");
  };

  const toPercentage = (lhs, rhs) => {
    return ((100 * parseInt(lhs)) / parseInt(rhs)).toFixed(2);
  };

  onMount(async () => {
    return () => {
      clearInterval(interval);
    };
  });
</script>

<Navbar />

<div class="section">
  <h2>Kenshi Locker</h2>
  <Card>
    <div class="card-inner">
      <div class="form">
        <h3>Locker info</h3>
        {#if !loaded && updating}
          <div class="description flex-text">
            <Jumper size="32" color="var(--primary-color)" />
            Loading contract {contractAddrDisplay}
          </div>
        {:else}
          <div class="description">
            {#if isKenshiLocker}
              <Alert success>
                <div class="flex-text">
                  <CheckDouble />
                  {contractAddrDisplay} is a verified Kenshi locker!
                </div>
              </Alert>
            {:else}
              <Alert danger>
                <div class="flex-text">
                  <Xmark />
                  {contractAddrDisplay} is NOT a Kenshi locker!
                </div>
              </Alert>
            {/if}
          </div>
          {#if isKenshiLocker}
            <div class="description">
              <Card flat slim>
                <div class="table">
                  <div class="row">
                    <h4>Owner</h4>
                    <div>{owner}</div>
                  </div>
                  <div class="row">
                    <h4>Unlocks on</h4>
                    <div>
                      {lock.toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          {/if}
          {#if isKenshiLocker && !$wallet?.provider}
            <div class="description">
              Are you the owner of this locker? Connect your wallet to access
              the management interface.
            </div>
          {/if}
        {/if}
        <div class="buttons">
          <Button
            target="_blank"
            href="https://bscscan.com/tokenholdings?a={contractAddr}"
            solid
          >
            View locked tokens <External />
          </Button>
        </div>
      </div>
      <div class="form">
        {#if isKenshiLocker && owner && owner === userAddress}
          <h3>Manage Locker</h3>
          <div class="mini-forms">
            <div class="mini-form">
              <h4>Set unlock date</h4>
              <div class="expand">
                <DateInput bind:value={newLockDate} />
              </div>
              <Button on:click={setNewLockDate} disabled={settingNewDate}>
                {#if settingNewDate}
                  <SpinLine
                    size="32"
                    color="currentColor"
                    unit="px"
                    duration="4s"
                  />
                  Processing
                {:else}
                  Set unlock date
                {/if}
              </Button>
            </div>
            <div class="mini-form">
              <h4>Tokens</h4>
              <div class="expand">
                <TextInput
                  bind:value={tokenAddr}
                  suffix={tokenName}
                  placeholder="Token address"
                />
                <TextInput
                  bind:value={amount}
                  regex={/^([1-9][0-9]*\.[0-9]+)|(0\.[0-9]+)$/}
                  placeholder="Amount"
                />
              </div>
              <div class="buttons">
                <Button on:click={withdrawTokens} disabled={withdrawing}>
                  {#if withdrawing}
                    <SpinLine
                      size="32"
                      color="currentColor"
                      unit="px"
                      duration="4s"
                    />
                    Processing
                  {:else}
                    Withdraw
                  {/if}
                </Button>
                <Button on:click={lockTokens} disabled={locking}>
                  {#if locking}
                    <SpinLine
                      size="32"
                      color="currentColor"
                      unit="px"
                      duration="4s"
                    />
                    Processing
                  {:else}
                    Lock
                  {/if}
                </Button>
                {#if migrateLocker !== "0x0000000000000000000000000000000000000000"}
                  <Button on:click={migrateTokens} disabled={migrating}>
                    {#if migrating}
                      <SpinLine
                        size="32"
                        color="currentColor"
                        unit="px"
                        duration="4s"
                      />
                      Processing
                    {:else}
                      Migrate
                    {/if}
                  </Button>
                {/if}
              </div>
            </div>
            {#if migrateLocker && migrateLocker !== "0x0000000000000000000000000000000000000000"}
              <div class="mini-form">
                <h4>Upgrade locker</h4>
                <div class="expand">
                  This locker was upgraded to a newer version. Use the button
                  below to manage the new locker.
                </div>
                <Button href="/lockers/manage/{migrateLocker}">
                  Manage new locker
                </Button>
              </div>
            {:else if lockerVersion && deployerVersion && lockerVersion.lt(deployerVersion)}
              <div class="mini-form">
                <h4>Upgrade locker</h4>
                <div class="expand">
                  There is an upgrade available for this locker. You can upgrade
                  from v{lockerVersion.toString()} to v{deployerVersion.toString()}.
                </div>
                <Button on:click={upgradeLocker} disabled={upgradingLocker}>
                  {#if upgradingLocker}
                    <SpinLine
                      size="32"
                      color="currentColor"
                      unit="px"
                      duration="4s"
                    />
                    Processing
                  {:else}
                    Upgrade
                  {/if}
                </Button>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </Card>
</div>

<Footer />

<style>
  h2 {
    margin-top: 0;
    margin-bottom: 1.5em;
    margin-left: 0.5em;
  }
  h3 {
    margin-top: 0;
  }
  .section {
    padding: 4em;
    padding-top: 2em;
  }
  @media screen and (max-width: 960px) {
    .section {
      padding: 2em;
    }
  }
  @media screen and (max-width: 480px) {
    .section {
      padding: 1em;
    }
  }
  .card-inner {
    display: grid;
    gap: 2em;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  }
  .card-inner h4 {
    margin: 0;
  }
  .table {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
  }
  .table .row {
    display: grid;
    grid-template-columns: 2fr 8fr;
  }
  .form {
    display: flex;
    flex-direction: column;
    gap: 1em;
  }
  .buttons {
    display: flex;
    gap: 1em;
    margin-top: 2em;
  }
  .mini-form .buttons {
    margin-top: 0;
  }
  .description {
    margin-bottom: 1em;
    color: #111;
  }
  .flex-text {
    display: flex;
    gap: 0.5em;
    align-items: center;
  }
  .flex-text :global(svg) {
    height: 1em;
    fill: currentColor;
  }
  .mini-form {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1em;
  }
  .mini-forms {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 2em;
  }
  .expand {
    width: 100%;
    flex: 1;
    gap: 1em;
    display: flex;
    flex-direction: column;
  }
</style>
