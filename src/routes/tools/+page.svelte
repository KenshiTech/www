<script>
  import Footer from "src/components/Footer.svelte";
  import MetaMask from "src/icons/MetaMask.svelte";

  import { Button } from "carbon-components-svelte";
  import { Grid, Content, Row, Column, Tile } from "carbon-components-svelte";
  import ConnectButton from "src/components/ConnectButton.svelte";
  import ExpressiveHeading from "src/components/carbon/ExpressiveHeading.svelte";
  import { Launch, Purchase } from "carbon-icons-svelte";
  import { TextInput, CopyButton } from "carbon-components-svelte";
  import { DataTable } from "carbon-components-svelte";

  import { wallet } from "src/stores/wallet";

  import { toast } from "@zerodevx/svelte-toast";
  import { ethers } from "ethers";
  import { onMount } from "svelte";
  import { onboard } from "src/lib/onboard";

  import formatThousands from "format-thousands";
  import kenshiAbi from "src/lib/abi/kenshi";

  import { fetchTokenPriceFromPair } from "src/lib/api/token";
  import { page } from "$app/stores";

  let balance;
  let userAddress = $page?.url?.searchParams?.get?.("address");
  let unitPrice;
  let treasury;
  let reserve;
  let staked;

  const formatCurrency = (n, unit = "") =>
    unit + formatThousands(trimDecimals(n), ",");

  const toUsd = (n) =>
    formatCurrency(n.div("1000000000000000000").toNumber() * unitPrice, "$");

  const toKenshi = (n) =>
    formatCurrency(ethers.utils.formatUnits(n || "0")) || "0";

  const trimDecimals = (n) => {
    const [lhs, rhs = ""] = n.toString().split(".");
    return [lhs, rhs.slice(0, 2).replace(/0+$/, "")].filter(Boolean).join(".");
  };

  $: balanceDisplay = toKenshi(balance || "0");
  $: treasuryDisplay = toKenshi(treasury || "0");
  $: reserveDisplay = toKenshi(reserve || "0");
  $: stakedDisplay = toKenshi(staked || "0");

  $: usdBalanceDisplay = balance && unitPrice ? toUsd(balance) : "0";
  $: usdTreasuryDisplay = treasury && unitPrice ? toUsd(treasury) : "0";
  $: usdReserveDisplay = reserve && unitPrice ? toUsd(reserve) : "0";
  $: usdStakedDisplay = staked && unitPrice ? toUsd(staked) : "0";

  const kenshiAddr = "0xf1264873436A0771E440E2b28072FAfcC5EEBd01";
  const treasuryAddr = "0xD59321c8266534dac369F0eFABDD5b815F1a5eb6";
  const reserveAddr = "0x51DD193630806aDCFFa9E72569a71A9c12591C33";
  const stakeAddr = "0xE894BD5Ec531EC8AAe856AFC3E0Fc948Ab22Efb4";
  const jsonRpcUrl = "https://arbitrum.blockpi.network/v1/rpc/public";
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

  const updateValues = async () => {
    if (!userAddress) return;
    balance = await contract.balanceOf(userAddress);
    treasury = await contract.balanceOf(treasuryAddr);
    reserve = await contract.balanceOf(reserveAddr);
    staked = await contract.balanceOf(stakeAddr);
  };

  $: if ($wallet?.provider) onWallet();
  $: if (userAddress && unitPrice) updateValues().catch(() => null);

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
      await onboard.setChain({ chainId: "0xa4b1" });
    } catch (error) {
      return toast.push("Couldn't switch to the Arbitrum One network.");
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

<Content>
  <Grid padding>
    <Row>
      <Column xlg={4} lg={6} md={6} sm={4}>
        <Tile class="blue-tile">
          <div class="flex-column">
            <ExpressiveHeading size={4}>
              <h1>Kenshi Tools</h1>
            </ExpressiveHeading>
            <p>
              Kenshi tools gives you an overview of your account and provides
              you with utilities for managing it.
            </p>
          </div>
        </Tile>
      </Column>
      <Column xlg={4} lg={6} md={4} sm={4}>
        <div class="flex-column align-start">
          <p class="body-02">
            You'll need to connect your wallet to use certain areas of Kenshi
            tools.
          </p>
          <div class="flex-spacer" />
          <ConnectButton primary />
        </div>
      </Column>
    </Row>
    <Row>
      <Column>
        <ExpressiveHeading size={2}>
          <h2>Account summary</h2>
        </ExpressiveHeading>
      </Column>
    </Row>
    <Row>
      <Column xlg={4} lg={6}>
        <Tile>
          <div class="card-inner forms">
            <div class="field">
              <TextInput
                light
                placeholder="Wallet address"
                labelText="Wallet"
                bind:value={userAddress}
              />
              {#if userAddress && typeof window !== "undefined"}
                <CopyButton
                  text={`${window.location.origin}/tools?address=${userAddress}`}
                />
              {/if}
            </div>
          </div>
          <div class="buttons">
            <Button
              href="https://app.uniswap.org/swap?outputCurrency=0xf1264873436A0771E440E2b28072FAfcC5EEBd01"
              icon={Purchase}
              kind="primary"
            >
              Buy Kenshi
            </Button>
            <Button on:click={addToMetamask} icon={MetaMask} kind="tertiary">
              Add ₭enshi
            </Button>
            <Button
              href="https://dexscreener.com/arbitrum/0x68c685fd52a56f04665b491d491355a624540e85"
              solid
              icon={Launch}
              kind="tertiary"
            >
              Charts
            </Button>
          </div>
        </Tile>
      </Column>
      {#if userAddress}
        <Column>
          <DataTable
            title="Balance sheet"
            description="Balance details for your account"
            headers={[
              { key: "name", value: "Name" },
              { key: "kenshi", value: "Kenshi" },
              { key: "usd", value: "USD" },
            ]}
            rows={[
              {
                id: "0",
                name: "Current",
                kenshi: balanceDisplay,
                usd: usdBalanceDisplay,
              },
            ]}
          />
        </Column>
        <Column>
          <DataTable
            title="Stats"
            description="Global Kenshi stats"
            headers={[
              { key: "name", value: "Name" },
              { key: "kenshi", value: "Kenshi" },
              { key: "usd", value: "USD" },
            ]}
            rows={[
              {
                id: "0",
                name: "Treasury",
                kenshi: treasuryDisplay,
                usd: usdTreasuryDisplay,
              },
              {
                id: "1",
                name: "Reserve",
                kenshi: reserveDisplay,
                usd: usdReserveDisplay,
              },
              {
                id: "2",
                name: "Staked",
                kenshi: stakedDisplay,
                usd: usdStakedDisplay,
              },
            ]}
          />
        </Column>
      {/if}
    </Row>
  </Grid>
</Content>

<Footer />

<style>
  .field {
    display: flex;
    gap: 0;
    align-items: flex-end;
  }
  .card-inner {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  }
  .forms {
    gap: 2em;
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
    flex-wrap: wrap;
  }
  .buttons :global(svg) {
    width: 1em;
  }
</style>
