<script>
  import { page } from "$app/stores";
  import { Tile, Grid, Column, Row, Content } from "carbon-components-svelte";
  import { Link } from "carbon-components-svelte";
  import Articles from "src/components/home/Articles.svelte";
  import ExpressiveHeading from "src/components/carbon/ExpressiveHeading.svelte";
  import Footer from "src/components/Footer.svelte";
</script>

<Content>
  <div class="error">
    <Grid padding>
      <Row class="full-height">
        <Column lg={6} md={4} sm={4}>
          <Tile class="blue-tile">
            <div class="flex fast">
              <ExpressiveHeading size={5}>
                <h2>Error {$page.status}!</h2>
              </ExpressiveHeading>
              <br />
              <div class="body-02">
                {#if $page.status === 404}
                  We could not find the page you are looking for.<br />
                  Try exploring other areas of the website instead.
                {:else}
                  There was an issue loading this page.
                  <br />
                  You can contact us at
                  <Link href="mailto:support@kenshi.io">support@kenshi.io</Link>
                  to report this error.
                {/if}
              </div>
            </div>
          </Tile>
        </Column>
      </Row>
    </Grid>
  </div>
  <Articles />
</Content>

<Footer />

<style>
  .error {
    margin-top: 4em;
    margin-bottom: 4em;
  }
</style>
