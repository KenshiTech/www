<script>
  import { onMount } from "svelte";
  import Chart, { registerables } from "chart.js/auto";
  import annotationPlugin from "chartjs-plugin-annotation";

  Chart.register(...registerables, annotationPlugin);

  export let data;
  export let options;
  export let type = "line";
  export let height = "180px";

  let canvas;
  let chart;

  $: if (canvas && data && options) {
    if (!chart) {
      chart = new Chart(canvas.getContext("2d"), {
        type,
        data,
        options,
      });
    } else {
      chart.data = data;
      chart.options = options;
      chart.update("none");
    }
  }

  onMount(() => () => chart?.destroy());
</script>

<canvas bind:this={canvas} {height} />
