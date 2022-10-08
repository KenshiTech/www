<script>
  import Navbar from "src/components/Navbar.svelte";
  import Footer from "src/components/Footer.svelte";
  import Card from "src/components/Card.svelte";
  import TextInput from "src/components/TextInput.svelte";
  import Select from "src/components/Select.svelte";
  import Button from "src/components/Button.svelte";
  import Alert from "src/components/Alert.svelte";
  import Section from "src/components/Section.svelte";

  import Copy from "src/icons/Copy.svelte";
  import External from "src/icons/External.svelte";
  import Coin from "src/icons/Coin.svelte";
  import Dollar from "src/icons/Dollar.svelte";
  import ArrowUp from "src/icons/ArrowUp.svelte";
  import Treasure from "src/icons/Treasure.svelte";
  import CreditCard from "src/icons/CreditCard.svelte";
  import Percent from "src/icons/Percent.svelte";
  import Timer from "src/icons/Timer.svelte";
  import Wallet from "src/icons/WalletThin.svelte";
  import Link from "src/icons/Link.svelte";
  import MetaMask from "src/icons/MetaMask.svelte";

  import { wallet } from "src/stores/wallet";

  import { toast } from "@zerodevx/svelte-toast";
  import { ethers } from "ethers";
  import { onMount } from "svelte";
  import { SpinLine } from "svelte-loading-spinners";
  import { onboard } from "src/lib/onboard";

  import formatThousands from "format-thousands";
  import kenshiAbi from "src/lib/abi/kenshi";

  import { fetchTokenPriceFromPair } from "src/lib/api/token";
  import { page } from "$app/stores";

  let balance;
  let userAddress = $page?.url?.searchParams?.get?.("address");
  let unitPrice;
  let maxBalance;
  let treasury;
  let ableToBuy;
  let saleTax;
  let when = 0;

  let ableToBuyDisplay = "0";
  let reflections = "0";
  let reflectionsDisplay = "0";
  let reflectionsUsdDisplay = "0";

  $: if (maxBalance && balance) {
    const diff = maxBalance.sub(balance);
    if (diff.gt(0)) {
      ableToBuy = diff;
    } else {
      ableToBuy = ethers.BigNumber.from("0");
    }
    ableToBuyDisplay = formatCurrency(ethers.utils.formatUnits(ableToBuy));
  }

  const formatCurrency = (n) => formatThousands(trimDecimals(n), ",");

  const trimDecimals = (n) => {
    const [lhs, rhs = ""] = n.toString().split(".");
    return [lhs, rhs.slice(0, 4).replace(/0+$/, "")].filter(Boolean).join(".");
  };

  $: balanceDisplay =
    formatCurrency(ethers.utils.formatUnits(balance || "0")) || "0";

  $: maxBalanceDisplay =
    formatCurrency(ethers.utils.formatUnits(maxBalance || "0")) || "0";

  $: treasuryDisplay =
    formatCurrency(ethers.utils.formatUnits(treasury || "0")) || "0";

  $: usdBalanceDisplay =
    balance && unitPrice
      ? formatCurrency(
          balance.div("1000000000000000000").toNumber() * unitPrice
        )
      : "0";

  const kenshiAddr = "0x42f9c5a27a2647a64f7D3d58d8f896C60a727b0f";
  const proxyAddr = "0x0A7eD4314D9109986281bdd6235f1A5623690110";
  const treasuryAddr = "0xD59321c8266534dac369F0eFABDD5b815F1a5eb6";
  const jsonRpcUrl = "https://bsc-dataseed.binance.org";
  const provider = new ethers.providers.JsonRpcProvider(jsonRpcUrl);
  const contract = new ethers.Contract(kenshiAddr, kenshiAbi, provider);

  const onWallet = async () => {
    const walletProvider = new ethers.providers.Web3Provider($wallet.provider);
    userAddress = await walletProvider.getSigner().getAddress();
    updateValues();
  };

  const updatePrice = async () => {
    const { price } = await fetchTokenPriceFromPair();
    unitPrice = price || unitPrice;
  };

  const calculateTax = async () => {
    saleTax = await contract.getTaxPercentageAt(
      userAddress,
      Math.floor(new Date().valueOf() / 1000 + when)
    );
  };

  const updateValues = async () => {
    if (!userAddress) return;
    balance = await contract.balanceOf(userAddress);
    treasury = await contract.balanceOf(treasuryAddr);
    maxBalance = await contract.getMaxBalance();
    calculateTax();
  };

  $: if (when !== undefined && userAddress) calculateTax().catch(() => null);

  $: if ($wallet?.provider) onWallet();

  const copy = (text) => () => {
    navigator.clipboard?.writeText?.(text);
    toast.push("Copied to clipboard.");
  };

  // This API key is available for free to those who want to
  // query the Kenshi contract transfer events
  const apikey = "fSDjCXCTyq+cx7+HLXKBA5oGIfqyMwztb+0/7pvTK8I=";
  const owner = "0x51DD193630806aDCFFa9E72569a71A9c12591C33";
  const endpoint = "https://api.kenshi.io/index/graphql";

  const query = (arg, addr) => `{
    getEntries(
      blockchain: "binance-mainnet",
      apikey: "${apikey}",
      owner: "${owner}",
      address: "${kenshiAddr.toLowerCase()}",
      args: [ { name: "${arg}", value: "${addr}"}]) {
        event {
          args
        }
      }
  }`;

  const getArgByName = (args, name) =>
    args
      .filter((a) => a[0] === name)
      .pop()
      .pop();

  const runQuery = (arg) =>
    fetch(endpoint, {
      method: "POST",
      body: JSON.stringify({
        query: query(arg, ethers.utils.getAddress(userAddress)),
      }),
    })
      .then((r) => r.json())
      .then((r) =>
        r.data.getEntries.map((e) => {
          const amount = getArgByName(e.event.args, "amount");
          const to = getArgByName(e.event.args, "to");
          if (to === treasuryAddr) {
            // Account for reflections going out of this account
            return ethers.BigNumber.from(amount).mul(2);
          } else {
            return amount;
          }
        })
      );

  const sumArr = (arr) =>
    arr.reduce((a, b) => a.add(b), ethers.BigNumber.from("0"));

  const calculateReflections = async () => {
    const received = await runQuery("to");
    const sent = await runQuery("from");

    const receivedAmount = sumArr(received);
    const sentAmount = sumArr(sent);
    const diff = receivedAmount.sub(sentAmount);

    reflections = ethers.utils.formatUnits(balance.sub(diff));
    reflectionsDisplay = formatCurrency(reflections);
    reflectionsUsdDisplay = formatCurrency(
      balance.sub(diff).div("1000000000000000000").toNumber() * unitPrice
    );
  };

  $: if (userAddress && unitPrice)
    updateValues()
      .then(calculateReflections)
      .catch(() => null);

  const taxDateOptions = [
    { label: "Today", value: 0 },
    { label: "Tomorrow", value: 86400 },
    ...new Array(28).fill().map((_, i) => ({
      label: `In ${i + 2} days`,
      value: 86400 * (i + 2),
    })),
  ];

  let transferTo = "";
  let transferAmount = "0";
  let transferring = false;

  const maxTransfer = () => {
    transferAmount = ethers.utils.formatUnits(balance, 18);
  };

  const transfer = async () => {
    if (!transferTo) {
      return toast.push("Destination is required");
    }

    if (!transferAmount || !Number(transferAmount)) {
      return toast.push("Amount is required");
    }

    const tax = await contract.getTaxPercentageAt(
      userAddress,
      Math.floor(new Date().valueOf() / 1000)
    );

    if (tax > 5) {
      return toast.push("Fine amount is bigger than zero");
    }

    transferring = true;

    const provider = new ethers.providers.Web3Provider($wallet.provider);
    const signer = provider.getSigner();

    try {
      await onboard.setChain({ chainId: "0x38" });
    } catch (error) {
      transferring = false;
      return toast.push("Couldn't switch to BNBChain.");
    }

    try {
      const parsedAmount = ethers.utils.parseUnits(transferAmount);
      const data = ethers.utils.defaultAbiCoder.encode(
        ["address"],
        [transferTo]
      );

      const tx = await contract
        .connect(signer)
        ["transferAndCall(address,uint256,bytes)"](
          proxyAddr,
          parsedAmount,
          data
        );

      await tx.wait(1);

      toast.push("Transfer successful.");
    } catch (error) {
      toast.push("Transfer failed.");
    }

    transferring = false;
  };

  const addToMetamask = async () => {
    const params = {
      type: "ERC20",
      options: {
        address: kenshiAddr,
        symbol: "Kenshi",
        decimals: 18,
        image: `${window.location.origin}/images/logo/512x512.png`,
      },
    };

    try {
      await onboard.setChain({ chainId: "0x38" });
    } catch (error) {
      return toast.push("Couldn't switch to the BSC network.");
    }

    $wallet.provider
      .request({ method: "wallet_watchAsset", params })
      .catch(() => {
        toast.push("Couldn't add the token to your wallet.");
      });
  };

  onMount(() => {
    updatePrice();
    const priceInterval = setInterval(updatePrice, 5 * 60 * 1000);
    const valueInterval = setInterval(updateValues, 5 * 60 * 1000);
    return () => {
      clearInterval(priceInterval);
      clearInterval(valueInterval);
    };
  });
</script>

<Navbar />

<div class="mask">
  <img src="/images/mask.png" alt="Mask" />
</div>

<Section>
  <h2>Kenshi Tools</h2>
  {#if !userAddress}
    <div class="alert">
      <Alert warning>
        Connect your wallet or enter wallet address to continue.
      </Alert>
    </div>
  {/if}
  <Card>
    <div class="card-inner forms">
      <div class="form">
        <h5>Wallet address</h5>
        <TextInput
          placeholder="Wallet address"
          suffix="Wallet"
          bind:value={userAddress}
          icon={Wallet}
        >
          <div class="field-buttons" slot="buttons">
            {#if userAddress}
              <Button
                flat
                on:click={copy(
                  `${window.location.origin}/tools?address=${userAddress}`
                )}
              >
                <Link />
              </Button>
            {/if}
          </div>
        </TextInput>
        {#if userAddress}
          <h5>Tokens held</h5>
          <div class="split">
            <TextInput
              disabled
              placeholder="Kenshi balance"
              suffix="Kenshi"
              value={balanceDisplay}
              icon={Coin}
            >
              <div class="field-buttons" slot="buttons">
                <Button
                  flat
                  on:click={copy(ethers.utils.formatUnits(balance || "0"))}
                >
                  <Copy />
                </Button>
              </div>
            </TextInput>
            <TextInput
              disabled
              placeholder="Equivalent BUSD value"
              suffix="USD"
              value={usdBalanceDisplay}
              icon={Dollar}
            >
              <div class="field-buttons" slot="buttons">
                <Button
                  flat
                  on:click={copy(usdBalanceDisplay.replace(/,/g, ""))}
                >
                  <Copy />
                </Button>
              </div>
            </TextInput>
          </div>
          <h5>Reflections received</h5>
          <div class="split">
            <TextInput
              disabled
              placeholder="Reflections"
              suffix="Kenshi"
              value={reflectionsDisplay}
              icon={Coin}
            >
              <div class="field-buttons" slot="buttons">
                <Button flat on:click={copy(reflections)}>
                  <Copy />
                </Button>
              </div>
            </TextInput>
            <TextInput
              disabled
              placeholder="Equivalent BUSD value"
              suffix="USD"
              value={reflectionsUsdDisplay}
              icon={Dollar}
            >
              <div class="field-buttons" slot="buttons">
                <Button
                  flat
                  on:click={copy(reflectionsUsdDisplay.replace(/,/g, ""))}
                >
                  <Copy />
                </Button>
              </div>
            </TextInput>
          </div>
          <h5>Able to buy</h5>
          <TextInput
            disabled
            placeholder="Kenshi balance"
            suffix="Kenshi"
            value={ableToBuyDisplay}
            icon={CreditCard}
          >
            <div class="field-buttons" slot="buttons">
              <Button
                flat
                on:click={copy(ethers.utils.formatUnits(ableToBuy || "0"))}
              >
                <Copy />
              </Button>
            </div>
          </TextInput>
        {/if}
      </div>
      <div class="form">
        {#if userAddress}
          <h5>Max balance</h5>
          <TextInput
            disabled
            suffix="Kenshi"
            value={maxBalanceDisplay}
            icon={ArrowUp}
          >
            <div class="field-buttons" slot="buttons">
              <Button flat on:click={copy(maxBalanceDisplay.replace(/,/g, ""))}>
                <Copy />
              </Button>
            </div>
          </TextInput>
          <h5>Treasury</h5>
          <TextInput
            disabled
            suffix="Kenshi"
            value={treasuryDisplay}
            icon={Treasure}
          >
            <div class="field-buttons" slot="buttons">
              <Button flat on:click={copy(treasuryDisplay.replace(/,/g, ""))}>
                <Copy />
              </Button>
            </div>
          </TextInput>
          <h5>Selling tax</h5>
          <div class="split">
            <Select
              options={taxDateOptions}
              placeholder="When?"
              icon={Timer}
              bind:value={when}
            />
            <TextInput
              disabled
              placeholder="Tax percentage"
              suffix="percent"
              value={saleTax}
              icon={Percent}
            />
          </div>
        {/if}
      </div>
    </div>
    <div class="buttons">
      <Button href="/swap">Buy Kenshi</Button>
      {#if $wallet?.provider}
        <Button on:click={addToMetamask}>
          <MetaMask />
          Add ₭enshi
        </Button>
      {/if}
      <Button
        href="https://charts.bogged.finance/?c=bsc&t=0x42f9c5a27a2647a64f7D3d58d8f896C60a727b0f"
        solid
      >
        Charts <External />
      </Button>
    </div>
  </Card>
</Section>

<Section>
  <h2>Wallet Transfer</h2>
  <div class="alert">
    <Alert>
      You can use this tool to do a tax-free transfer from your wallet to
      another.
      {#if !$wallet?.provider}
        To use this tool, you need to connect your wallet.
      {/if}
    </Alert>
  </div>
  {#if $wallet?.provider}
    <Card>
      <div class="card-inner forms">
        <div class="form">
          <h5>Wallet address</h5>
          <TextInput
            placeholder="Destination"
            suffix="Destination"
            bind:value={transferTo}
            icon={Wallet}
          />
          <div class="field-with-buttons">
            <TextInput
              placeholder="Amount"
              suffix="Amount"
              icon={Coin}
              regex={/^(0|[1-9][0-9]*(\.[0-9]+)?|0\.[0-9]+)$/}
              bind:value={transferAmount}
            />
            <Button on:click={maxTransfer}>MAX</Button>
          </div>
          <Alert warning>
            To be able to make a transfer, your selling tax should be 5%. See
            the Kenshi tools above to find out about your current tax.
          </Alert>
        </div>
        <div />
      </div>
      <div class="buttons">
        <Button on:click={transfer} disabled={transferring}>
          {#if transferring}
            <SpinLine size="32" color="currentColor" unit="px" duration="4s" />
            Processing
          {:else}
            Transfer
          {/if}
        </Button>
      </div>
    </Card>
  {/if}
</Section>

<Footer />

<style>
  h2 {
    margin-top: 0;
    margin-bottom: 1.5em;
    margin-left: 0.5em;
  }
  h5 {
    margin: 0;
  }
  .card-inner {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  }
  .forms {
    gap: 2em;
  }
  .form {
    display: flex;
    flex-direction: column;
    gap: 1em;
  }
  .split {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1em;
  }
  @media only screen and (max-width: 640px) {
    .split {
      grid-template-columns: 1fr;
    }
    .section {
      padding: 1em;
    }
  }
  @media only screen and (max-width: 420px) {
    :global(.card.padding) {
      padding: 1.25em 1em;
    }
  }
  @media only screen and (max-width: 380px) {
    :global(.input) {
      font-size: 0.9em;
    }
  }
  .buttons {
    margin-top: 2em;
    display: flex;
    gap: 1em;
  }
  .buttons :global(svg) {
    width: 1em;
  }
  .mask {
    position: absolute;
    z-index: -1;
    top: 0;
    padding: 0;
    opacity: 0.6;
    height: 80%;
    max-height: 640px;
    width: auto;
  }
  .mask img {
    height: 100%;
    max-width: 100%;
  }
  .alert {
    margin-bottom: 2em;
    max-width: 560px;
  }
  .field-with-buttons {
    display: flex;
    gap: 1em;
    align-items: flex-start;
  }
</style>
