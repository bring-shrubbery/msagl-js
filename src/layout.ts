import { rank } from "./rank";

export function runLayout(g) {
  rank(g);
  return g;
}
