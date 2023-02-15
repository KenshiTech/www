<script>
  import Footer from "src/components/Footer.svelte";

  import { Content, Tile, Grid, Row, Column } from "carbon-components-svelte";
  import { TextInput, Button } from "carbon-components-svelte";
  import { InlineNotification } from "carbon-components-svelte";
  import { Information } from "carbon-icons-svelte";
  import { Checkbox } from "carbon-components-svelte";
  import { CodeSnippet } from "carbon-components-svelte";
  import { ViewOff, View, Copy } from "carbon-icons-svelte";
  import { toast } from "@zerodevx/svelte-toast";
  import { generate } from "src/lib/vrf-seed";
  import { ethers } from "ethers";

  import ExpressiveHeading from "src/components/carbon/ExpressiveHeading.svelte";

  let seedMode = false;
  let secret = "";
  let index = 0;
  let visible = false;

  const copy = (text) => {
    navigator.clipboard?.writeText?.(text);
    toast.push("Copied to clipboard.");
  };

  let wallet;
  let seedphrase;

  const copySecret = () => copy(seedMode ? seedphrase : wallet.privateKey);
  const toggleView = () => (visible = !visible);

  const getMnemonic = (seed, index) => {
    const key = generate(seed, index);
    return ethers.utils.entropyToMnemonic(`0x${key}`);
  };

  const getWallet = (seed, index) => {
    const key = generate(seed, index);
    return new ethers.Wallet(key);
  };

  $: if (secret && typeof index !== "undefined") {
    if (seedMode) {
      seedphrase = getMnemonic(secret, index);
    } else {
      wallet = getWallet(secret, index);
    }
  }
</script>

<Content>
  <Grid noGutter padding narrow>
    <Row>
      <Column lg={4}>
        <div class="stick sidebar">
          <Tile class="blue-tile">
            <div class="form-info">
              <ExpressiveHeading size={4}>
                <h1>Kenshi VRF Seed</h1>
              </ExpressiveHeading>
              <p class="body-02">
                Kenshi VRF Seed is an experimental VRF-based wallet and seed
                phrase generator.
              </p>
            </div>
          </Tile>

          <InlineNotification kind="warning" hideCloseButton>
            This tool is experimental! Use at your own risk.
          </InlineNotification>

          <div class="buttons">
            <Button kind="secondary" href="/docs" icon={Information}>
              Learn about Kenshi
            </Button>
          </div>
        </div>
      </Column>
      <Column>
        <Grid>
          <Row>
            <Column>
              <ExpressiveHeading size={3}>
                <h2>Generator</h2>
              </ExpressiveHeading>
              The Kenshi VRF Seed is an experimental wallet and seed phrase generator
              that uses a secret to generate your wallets and BIP-39 seed phrases.
            </Column>
          </Row>
          <Row>
            <Column>
              <ExpressiveHeading size={2}>
                <h3>Secret</h3>
              </ExpressiveHeading>
              You can recover your wallets at any time using this secret, which must
              be kept safe. It's important to select a memorable and hard-to-guess
              secret for safety.
            </Column>
          </Row>
          <Row>
            <Column>
              <TextInput
                bind:value={secret}
                labelText="Secret"
                placeholder="A memorable, yet difficult to guess secret"
                helperText="Enter a long and difficult to guess secret here."
              />
            </Column>
          </Row>
          <Row>
            <Column>
              <ExpressiveHeading size={2}>
                <h3>Index</h3>
              </ExpressiveHeading>
              The generator is capable of producing multiple wallets and seed phrases
              from a single secret, here you must select which account name or account
              index you want to recover or generate.
            </Column>
          </Row>
          <Row>
            <Column>
              <TextInput
                bind:value={index}
                labelText="Index"
                placeholder="Account number or name"
                helperText="This selects a specific wallet on your multi-account VRF based seed phrase."
              />
            </Column>
          </Row>
          <Row>
            <Column>
              <ExpressiveHeading size={2}>
                <h3>Mode</h3>
              </ExpressiveHeading>
              This tool can generate both private keys and BIP-39 seed phrases. Select
              BIP-39 if you prefer to get a seed phrase.
            </Column>
          </Row>
          <Row>
            <Column>
              <Checkbox
                bind:checked={seedMode}
                labelText="Produce a BIP-39 seed phrase"
              />
            </Column>
          </Row>
          {#if secret && typeof index !== "undefined"}
            <Row>
              <Column>
                <ExpressiveHeading size={2}>
                  <h3>Results</h3>
                </ExpressiveHeading>
                Use the Copy button to copy the
                {#if seedMode}
                  seed phrase.
                {:else}
                  private key.
                {/if}
              </Column>
            </Row>
            {#if !seedMode}
              <Row>
                <Column>
                  <h5>Address</h5>
                  <CodeSnippet code={wallet.address} />
                </Column>
              </Row>
            {/if}
            {#if visible}
              <Row>
                <Column>
                  {#if seedMode}
                    <CodeSnippet code={seedphrase} />
                  {:else}
                    <CodeSnippet code={wallet.privateKey} />
                  {/if}
                </Column>
              </Row>
            {/if}
            <Row>
              <Column>
                <Button on:click={copySecret} icon={Copy}>Copy</Button>
                <Button
                  kind="secondary"
                  on:click={toggleView}
                  icon={visible ? ViewOff : View}
                >
                  View
                </Button>
              </Column>
            </Row>
          {/if}
        </Grid>
      </Column>
    </Row>
  </Grid>
</Content>

<Footer />

<style>
  .sidebar {
    padding-top: 1em;
    display: flex;
    flex-direction: column;
    gap: 1em;
    align-items: flex-start;
  }
  .buttons {
    display: flex;
    gap: 1em;
  }
  .buttons :global(svg) {
    width: 1em;
  }
  h2,
  h3,
  h5 {
    margin-bottom: 1em;
  }
</style>
