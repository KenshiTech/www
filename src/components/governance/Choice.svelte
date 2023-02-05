<script>
  import ExpressiveHeading from "../carbon/ExpressiveHeading.svelte";

  import { Tile, RadioTile, TileGroup } from "carbon-components-svelte";
  import { Grid, Column, Row, TextInput } from "carbon-components-svelte";
  import { ProgressBar, Tag, Button } from "carbon-components-svelte";
  import { AddComment, DocumentView } from "carbon-icons-svelte";
  import { wallet } from "src/stores/wallet";
  import { ethers } from "ethers";
  import { toast } from "@zerodevx/svelte-toast";
  import { onMount } from "svelte";

  import governanceAbi from "src/lib/abi/governance";

  export let poll;
  export let body;
  export let title;
  export let pills;
  export let values;
  export let question;
  export let selected;

  let userAddress;
  let provider;
  let votes = {};
  let comment = "";
  let resultsReady = false;
  let readMore = false;

  const toggleReadMore = () => {
    readMore = !readMore;
  };

  const address = "0xa57a940ff374f2Ad3f69539c8C7F2a13Ed929da2";

  const processVoteData = async (data) => {
    const contract = new ethers.Contract(address, governanceAbi, provider);
    const computed = {};

    let total = ethers.BigNumber.from(0);

    const options = values.map((value) => value.value);

    for (const value of options) {
      const users = data
        .filter((item) => item.vote.selected === value)
        .map((item) => item.user);
      const count = await contract.count(users, users.length);
      computed[value] = count;
      total = total.add(count);
    }

    if (total.toString() === "0") {
      resultsReady = true;
      return;
    }

    for (const key in computed) {
      computed[key] = computed[key].mul(10000).div(total).toNumber() / 100;
    }

    votes = computed;
    resultsReady = true;
  };

  const fetchResults = async () => {
    if (!provider) {
      return;
    }
    const res = await fetch(`https://api.kenshi.io/governance/${poll}`);
    const data = await res.json();
    processVoteData(data);
  };

  const sendVote = async (vote) => {
    const message = JSON.stringify({ vote, user: userAddress, poll });
    const signer = provider.getSigner(userAddress);
    const signature = await signer.signMessage(message);
    const req = await fetch(`https://api.kenshi.io/governance/${poll}`, {
      method: "POST",
      body: JSON.stringify({ vote, user: userAddress, poll, signature }),
    });
    if (req.ok) {
      toast.push("Vote submitted!");
    } else {
      const res = await req.text();
      throw new Error(res);
    }
    fetchResults();
  };

  const doVote = async () => {
    if (!userAddress || !provider) {
      return toast.push("You need to connect your wallet first");
    }
    try {
      await sendVote({ selected, comment });
    } catch (error) {
      toast.push(error.message);
    }
  };

  const onSelect = async ({ detail }) => {
    selected = detail;
  };

  const onWallet = async () => {
    provider = new ethers.providers.Web3Provider($wallet.provider);
    userAddress = await provider.getSigner().getAddress();
    fetchResults();
  };

  $: if ($wallet?.provider) onWallet();

  onMount(() => {
    const interval = setInterval(fetchResults, 60 * 1000);
    return () => {
      clearInterval(interval);
    };
  });
</script>

<div class="choice">
  <Tile>
    <div class="head">
      <ExpressiveHeading size={3}>
        <h3>{title}</h3>
      </ExpressiveHeading>
      <div class="spacer" />
      <div class="tags">
        {#each pills as pill}
          <Tag>{pill}</Tag>
        {/each}
      </div>
    </div>
    <div class="question">
      {question}
    </div>
    <Grid noGutter>
      <Row>
        <Column>
          <TileGroup on:select={onSelect} class="grid">
            {#each values as { value, title }}
              <RadioTile light {value} checked={selected === value}>
                {#if resultsReady}
                  <ProgressBar
                    value={votes[value] || 0}
                    labelText={title}
                    helperText={`${votes[value] || 0}% voted for this`}
                  />
                {:else if userAddress}
                  <ProgressBar
                    labelText={title}
                    helperText={"Fetching votes"}
                  />
                {:else}
                  {title}
                {/if}
              </RadioTile>
            {/each}
          </TileGroup>
        </Column>
      </Row>
      <Row>
        <Column class="comment-col">
          <TextInput
            bind:value={comment}
            light
            labelText="Comment"
            placeholder="Want to share more about your decision? Let Kenshi hear what you think."
          />
        </Column>
      </Row>
    </Grid>
    {#if readMore}
      <div class="body body-02">
        {body}
      </div>
    {/if}
    <div class="buttons">
      <Button kind="secondary" icon={DocumentView} on:click={toggleReadMore}>
        Read more
      </Button>
      <Button icon={AddComment} on:click={doVote}>Vote</Button>
    </div>
  </Tile>
</div>

<style>
  .body {
    margin-top: 1em;
    margin-bottom: 1em;
  }
  .question {
    margin-top: 2em;
  }
  .buttons {
    margin-top: 2em;
  }
  .head {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  }
  .choice :global(.comment-col) {
    padding-top: 0;
  }
</style>