<script>
  import Navbar from "src/components/Navbar.svelte";
  import Footer from "src/components/Footer.svelte";
  import Card from "src/components/Card.svelte";
  import TextInput from "src/components/TextInput.svelte";
  import Button from "src/components/Button.svelte";
  import Alert from "src/components/Alert.svelte";
  import Select from "src/components/Select.svelte";
  import Checkbox from "src/components/Checkbox.svelte";

  import kenshiAbi from "src/lib/abi/kenshi";

  import { onboard } from "src/lib/onboard";
  import { wallet } from "src/stores/wallet";
  import { ethers } from "ethers";
  import { SpinLine } from "svelte-loading-spinners";
  import { toast } from "@zerodevx/svelte-toast";
  import { goto } from "$app/navigation";

  import External from "src/icons/External.svelte";
  import Copy from "src/icons/Copy.svelte";

  // This API key is available for free to those who want to
  // query the Kenshi contract transfer events
  const apikey = "fSDjCXCTyq+cx7+HLXKBA5oGIfqyMwztb+0/7pvTK8I=";
  const owner = "0x51DD193630806aDCFFa9E72569a71A9c12591C33";
  const endpoint = "https://api.kenshi.io/index/graphql";
  const deployerAddr = "0x14677928b375D188d65ac277Ee0a5d72D1dB6e01";
  const kenshiAddr = "0x42f9c5a27a2647a64f7D3d58d8f896C60a727b0f";

  let userAddress;

  const query = (addr) => `{
    getEntries(
      blockchain: "binance-mainnet",
      apikey: "${apikey}",
      owner: "${owner}",
      address: "${deployerAddr.toLowerCase()}",
      event: "LockerCreated",
      args: [{ name: "owner", value: "${addr}" }]) {
        event {
          args
        }
      }
  }`;

  const waitForLockerQuery = (txHash) => `{
    getEntries(
      blockchain: "binance-mainnet",
      apikey: "${apikey}",
      owner: "${owner}",
      address: "${deployerAddr.toLowerCase()}",
      event: "LockerCreated",
      txHash: "${txHash}") {
        event {
          args
        }
      }
  }`;

  const setAddress = () => {
    userAddress = $wallet.accounts?.[0]?.address;
  };

  $: if ($wallet) setAddress();

  const getLockers = (owner) =>
    fetch(endpoint, {
      method: "POST",
      body: JSON.stringify({ query: query(owner) }),
    })
      .then((response) => response.json())
      .then((payload) => payload.data.getEntries)
      .then((entries) => entries.map((e) => e.event.args))
      .then((events) => events.map((event) => Object.fromEntries(event)));

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const waitForLocker = async (txHash) => {
    const query = waitForLockerQuery(txHash);
    while (true) {
      const response = await fetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ query }),
      });
      const { data: { getEntries } = {} } = await response.json();
      if (getEntries.length) {
        const { addr } = Object.fromEntries(getEntries.pop().event.args);
        return addr;
      }
      sleep(5000);
    }
  };

  let userLockers = [];

  $: if (userAddress) {
    getLockers(ethers.utils.getAddress(userAddress))
      .then((lockers) => (userLockers = lockers))
      .catch(() => null);
  }

  let showLockerForm;
  const toggleShowLockerForm = () => {
    showLockerForm = !showLockerForm;
  };

  let paymentMethod;
  let acceptedTerms;

  const paymentOptions = [
    { label: "Spend 100M Kenshi", value: "spend" },
    { label: "Lock 200M Kenshi for 1Y", value: "lock" },
  ];

  let spin = false;
  const create = async () => {
    spin = true;

    if (!acceptedTerms) {
      toast.push("You need to accept the terms");
      spin = false;
      return;
    }

    if (!paymentMethod) {
      toast.push("You must choose a payment method");
      spin = false;
      return;
    }

    try {
      await onboard.setChain({ chainId: "0x38" });
    } catch (error) {
      toast.push("Couldn't change to BSC network.");
      spin = false;
      return;
    }

    const provider = new ethers.providers.Web3Provider($wallet.provider);
    const signer = provider.getSigner(userAddress);
    const kenshi = new ethers.Contract(kenshiAddr, kenshiAbi, signer);

    let txHash;

    try {
      const amount =
        paymentMethod === "lock"
          ? ethers.utils.parseUnits("200000001")
          : ethers.utils.parseUnits("100000001");

      const data = ethers.utils.defaultAbiCoder.encode(
        ["bool"],
        [paymentMethod === "lock"]
      );

      const tx = await kenshi
        .connect(signer)
        ["approveAndCall(address,uint256,bytes)"](deployerAddr, amount, data);

      await tx.wait(1);
      txHash = tx.hash;
    } catch (error) {
      console.log(error);
      toast.push("Couldn't create the locker.");
      spin = false;
      return;
    }

    try {
      const addr = await waitForLocker(txHash);
      goto(`/lockers/${addr}`);
    } catch (error) {
      toast.push("Failed to fetch data from the Kenshi data center");
    }

    spin = false;
  };

  const copy = (text) => () => {
    navigator.clipboard?.writeText?.(text);
    toast.push("Copied to clipboard.");
  };
</script>

<Navbar />

<div class="section">
  <h2>Kenshi Lockers</h2>

  <div class="description">
    Kenshi provides upgradable, multi-token lockers on the BNB Smart Chain.
  </div>

  <div class="description">
    <Alert>
      Getting a locker is free if you choose to lock a specific amount of Kenshi
      for a year, otherwise you can spend Kenshi to buy one.
    </Alert>
  </div>

  <div class="chains">
    <span>Available on:</span>
    <img src="/images/chains/binance.svg" alt="BNB Smart Chain" />
  </div>

  {#if !$wallet?.provider}
    <div class="alert">
      <Alert warning>Connect your wallet to continue.</Alert>
    </div>
  {/if}

  <div class="buttons">
    <Button solid href="/docs/services/locker" target="_blank">
      Docs <External />
    </Button>

    <Button
      href="https://pancakeswap.finance/swap?outputCurrency=0x42f9c5a27a2647a64f7D3d58d8f896C60a727b0f"
    >
      Buy ₭enshi
    </Button>

    {#if $wallet?.provider}
      <Button on:click={toggleShowLockerForm}>New locker</Button>
    {/if}
  </div>
</div>

{#if showLockerForm}
  <div class="section">
    <Card>
      <div class="card-inner">
        <div class="form">
          <h3>New locker</h3>
          <Select
            bind:value={paymentMethod}
            options={paymentOptions}
            placeholder="Select a payment method"
          />
          <Checkbox bind:checked={acceptedTerms}>
            I agree to the Kenshi locker terms of use
          </Checkbox>
          <a href="/docs/services/locker" target="_blank">
            <Alert>
              <div class="tos">
                <span>Click here to review the Kenshi locker terms of use</span>
                <External />
              </div>
            </Alert>
          </a>
        </div>
        <div />
      </div>
      <div class="buttons">
        <Button on:click={create}>
          {#if spin}
            <SpinLine size="32" color="currentColor" unit="px" duration="4s" />
            Processing
          {:else}
            Create
          {/if}
        </Button>
      </div>
    </Card>
  </div>
{/if}

{#if $wallet?.provider}
  <div class="section">
    <h3>Your lockers</h3>
    <div class="lockers">
      {#each userLockers as locker}
        <Card>
          <h4>Locker address:</h4>
          <div class="copy" on:click={copy(locker.address)}>
            <Alert>
              <div class="address">
                <span>{locker.addr}</span>
                <Copy />
              </div>
            </Alert>
          </div>
          <div class="buttons">
            <Button href="/lockers/{locker.addr}">Manage locker</Button>
          </div>
        </Card>
      {:else}
        You don't have any lockers yet.
      {/each}
    </div>
  </div>
{/if}

<Footer />

<style>
  h2 {
    margin-top: 0;
    margin-bottom: 1.5em;
    margin-left: 0em;
  }
  .form h3 {
    margin-top: 0;
  }
  h4 {
    margin-top: 0;
  }
  .section {
    padding: 2em 4em;
    padding-bottom: 4em;
  }
  .section + .section {
    padding-top: 0;
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
  .alert {
    max-width: 600px;
  }
  .description {
    max-width: 600px;
    margin-bottom: 2.5em;
  }
  .chains {
    max-width: 600px;
    margin-bottom: 2.5em;
    display: flex;
    align-items: center;
    gap: 1em;
  }
  .buttons {
    display: flex;
    gap: 1em;
  }
  .section > .buttons {
    margin-top: 1.5em;
  }
  .chains img {
    width: 32px;
  }
  .card-inner {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    margin-bottom: 2em;
  }
  .form {
    display: flex;
    gap: 1em;
    flex-direction: column;
  }
  .tos {
    display: flex;
    align-items: center;
  }
  .tos span {
    flex: 1;
  }
  .tos :global(svg) {
    height: 1em;
    fill: var(--secondary-color);
    transition: cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s transform;
  }
  .tos:hover :global(svg) {
    transform: rotate(45deg);
  }
  .lockers {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(440px, 1fr));
    margin-top: 2em;
    gap: 2em;
  }
  @media screen and (max-width: 520px) {
    .lockers {
      grid-template-columns: 1fr;
    }
  }
  .address :global(svg) {
    height: 1em;
  }
  .address {
    display: flex;
    gap: 0.75em;
    align-items: center;
  }
  .address span {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: pre;
  }
  .copy {
    cursor: copy;
  }
  .lockers .buttons {
    margin-top: 2em;
  }
</style>
