export {
  sankeyCircular as sankey,
  sankeyLeft,
  sankeyRight,
  sankeyJustify,
} from "d3-sankey-circular";

import { linkHorizontal } from "d3-shape";

function horizontalSource(d) {
  return [d.source.x1, d.y0];
}

function horizontalTarget(d) {
  return [d.target.x0, d.y1];
}

export function sankeyLinkHorizontal() {
  return linkHorizontal().source(horizontalSource).target(horizontalTarget);
}
