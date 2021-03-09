import { LayerArrays } from "../LayerArrays";
import { LayerEdge } from "../LayerEdge";
import { ProperLayeredGraph } from "../ProperLayeredGraph";
import { ConstrainedOrdering } from "./ConstrainedOrdering";
import { LayerInfo } from "./LayerInfo";
import { Assert } from './../../../utils/assert'
import { randomInt } from "../../../utils/random";
export class AdjacentSwapsWithConstraints {

  /* const */
  static maxNumberOfAdjacentExchanges: number = 50;

  hasCrossWeights: boolean;

  layerInfos: LayerInfo[];

  layering: number[];

  layers: number[][];

  properLayeredGraph: ProperLayeredGraph;


  X: number[];

  inCrossingCount: Map<number, number>[];

  outCrossingCount: Map<number, number>[];

  ///  for each vertex v let P[v] be the array of predeccessors of v
  P: number[][];

  ///  <summary>
  ///  The array contains a dictionary per vertex
  ///  The value POrder[v][u] gives the offset of u in the array P[v]
  ///  </summary>
  POrder: Map<number, number>[];

  ///  <summary>
  ///  for each vertex v let S[v] be the array of successors of v
  ///  </summary>
  S: number[][];

  ///  <summary>
  ///  The array contains a dictionary per vertex
  ///  The value SOrder[v][u] gives the offset of u in the array S[v]
  ///  </summary>
  SOrder: Map<number, number>[];

  private /* internal */ constructor(layerArray: LayerArrays, hasCrossWeights: boolean, properLayeredGraph: ProperLayeredGraph, layerInfos: LayerInfo[]) {
    this.X = layerArray.X;
    this.layering = layerArray.Y;
    this.layers = layerArray.Layers;
    this.properLayeredGraph = properLayeredGraph;
    this.hasCrossWeights = hasCrossWeights;
    this.layerInfos = layerInfos;
  }

  ///  Gets or sets the number of of passes over all layers to run
  ///  adjacent exchanges, where every pass goes
  ///  all way up to the top layer and down to the lowest layer
  static get MaxNumberOfAdjacentExchanges(): number {
    return AdjacentSwapsWithConstraints.maxNumberOfAdjacentExchanges;
  }

  ExchangeWithGainWithNoDisturbance(layer: number[]): boolean {
    let wasGain: boolean = false;
    let gain: boolean;
    do {
      gain = this.ExchangeWithGain(layer);
      wasGain = (wasGain || gain);
    } while (gain)

    return wasGain;
  }

  CanSwap(i: number, j: number): boolean {
    if ((this.IsVirtualNode(i) || this.IsVirtualNode(j))) {
      return true;
    }

    let layerInfo: LayerInfo = this.layerInfos[this.layering[i]];
    if ((layerInfo == null)) {
      return true;
    }

    if ((ConstrainedOrdering.BelongsToNeighbBlock(i, layerInfo)
      || (ConstrainedOrdering.BelongsToNeighbBlock(j, layerInfo)
        || (layerInfo.constrainedFromAbove.has(i) || layerInfo.constrainedFromBelow.has(j))))) {
      return false;
    }

    if (layerInfo.leftRight.has(i, j)) {
      return false;
    }

    return true;
  }

  IsVirtualNode(v: number): boolean {
    return this.properLayeredGraph.IsVirtualNode(v);
  }

  /// // <summary>
  /// // swaps two vertices only if reduces the number of intersections
  /// // </summary>
  /// // <param name="layer">the layer to work on</param>
  /// // <param name="u">left vertex</param>
  /// // <param name="v">right vertex</param>
  /// // <returns></returns>
  SwapWithGain(u: number, v: number): boolean {
    let gain: number = this.SwapGain(u, v);
    if ((gain > 0)) {
      this.Swap(u, v);
      return true;
    }

    return false;
  }

  SwapGain(u: number, v: number): number {
    if (!this.CanSwap(u, v)) {
      return -1;
    }

    let cuv: number;
    let cvu: number;
    this.CalcPair(u, v, /* out */cuv, /* out */cvu);
    return (cuv - cvu);
  }

  ///  <summary>
  ///  calculates the number of intersections between edges adjacent to u and v
  ///  </summary>
  ///  <param name="u">a vertex</param>
  ///  <param name="v">a vertex</param>
  ///  <param name="cuv">the result when u is to the left of v</param>
  ///  <param name="cvu">the result when v is to the left of u</param>
  CalcPair(u: number, v: number, /* out */cuv: number, /* out */cvu: number) {
    let pv: Array<number> = this.P[v];
    let su: Array<number> = this.S[u];
    let sv: Array<number> = this.S[v];
    let pu: Array<number> = this.P[u];
    if (!this.hasCrossWeights) {
      cuv = (this.CountOnArrays(su, sv) + this.CountOnArrays(pu, pv));
      cvu = (this.CountOnArrays(sv, su) + this.CountOnArrays(pv, pu));
    }
    else {
      let uOutCrossCounts: Map<number, number> = this.outCrossingCount[u];
      let vOutCrossCounts: Map<number, number> = this.outCrossingCount[v];
      let uInCrossCounts: Map<number, number> = this.inCrossingCount[u];
      let vInCrossCounts: Map<number, number> = this.inCrossingCount[v];
      cuv = (this.CountOnArrays_(su, sv, uOutCrossCounts, vOutCrossCounts) + this.CountOnArrays_(pu, pv, uInCrossCounts, vInCrossCounts));
      cvu = (this.CountOnArrays_(sv, su, vOutCrossCounts, uOutCrossCounts) + this.CountOnArrays_(pv, pu, vInCrossCounts, uInCrossCounts));
    }

  }

  CountOnArrays(unbs: Array<number>, vnbs: Array<number>): number {
    let ret: number = 0;
    let vl: number = (vnbs.length - 1);
    let j: number = -1;
    // the right most position of vnbs to the left from the current u neighbor 
    let vnbsSeenAlready = 0;
    for (let uNeighbor of unbs) {
      let xu: number = this.X[uNeighbor];
      for (
        ; ((j < vl)
          && (this.X[vnbs[(j + 1)]] < xu)); j++) {
        vnbsSeenAlready++;
      }

      ret = (ret + vnbsSeenAlready);
    }

    return ret;
  }

  ///  every inversion between unbs and vnbs gives an intersecton

  ///  <param name="unbs">neighbors of u but only from one layer</param>
  ///  <param name="vnbs">neighbors of v from the same layers</param>
  ///  <returns>number of intersections when u is to the left of v</returns>
  ///  <param name="uCrossingCounts"></param>
  ///  <param name="vCrossingCount"></param>
  CountOnArrays_(unbs: Array<number>, vnbs: Array<number>, uCrossingCounts: Map<number, number>, vCrossingCount: Map<number, number>): number {
    let ret: number = 0;
    let vl: number = (vnbs.length - 1);
    let j: number = -1;
    // the right most position of vnbs to the left from the current u neighbor 
    let vCrossingNumberSeenAlready: number = 0;
    for (let uNeib of unbs) {
      let xu: number = this.X[uNeib];
      let vnb: number;
      for (
        ; ((j < vl)
          && (this.X[vnb = vnbs[j + 1]] < xu)); j++) {
        vCrossingNumberSeenAlready = (vCrossingNumberSeenAlready + vCrossingCount[vnb]);
      }

      ret = (ret
        + (vCrossingNumberSeenAlready * uCrossingCounts[uNeib]));
    }

    return ret;
  }

  // in this routine u and v are adjacent, and u is to the left of v before the swap
  Swap(u: number, v: number) {
    Assert.assert(this.UAndVAreOnSameLayer(u, v));
    Assert.assert(this.UIsToTheLeftOfV(u, v));
    Assert.assert(this.CanSwap(u, v));
    let left: number = this.X[u];
    let right: number = this.X[v];
    let ln: number = this.layering[u];
    // layer number
    let layer: number[] = this.layers[ln];
    layer[left] = v;
    layer[right] = u;
    this.X[u] = right;
    this.X[v] = left;
    // update sorted arrays POrders and SOrders
    // an array should be updated only in case it contains both u and v.
    //  More than that, v has to follow u in an the array.
    this.UpdateSsContainingUV(u, v);
    this.UpdatePsContainingUV(u, v);
  }

  ExchangeWithGain(layer: number[]): boolean {
    // find a first pair giving some gain
    for (let i: number = 0; (i
      < (layer.length - 1)); i++) {
      if (this.SwapWithGain(layer[i], layer[(i + 1)])) {
        this.SwapToTheLeft(layer, i);
        this.SwapToTheRight(layer, (i + 1));
        return true;
      }

    }

    return false;
  }

  HeadOfTheCoin(): boolean {
    return randomInt(2) == 0;
  }

  DoSwaps() {
    this.InitArrays();
    let count: number = 0;
    let progress: boolean = true;
    while ((progress && count++ < AdjacentSwapsWithConstraints.MaxNumberOfAdjacentExchanges)) {
      progress = false;
      for (let i: number = 0; (i < this.layers.length); i++) {
        progress = (this.AdjExchangeLayer(i) || progress);
      }

      for (let i: number = (this.layers.length - 2); (i >= 0); i--) {
        progress = (this.AdjExchangeLayer(i) || progress);
      }

    }

    Assert.assert(this.SPAreCorrect());
  }

  private SPAreCorrect(): boolean {
    let n: number = this.properLayeredGraph.NodeCount;
    for (let i: number = 0; (i < n); i++) {
      if (!this.SIsCorrect(i)) {
        return false;
      }

    }

    return true;
  }

  private SIsCorrect(i: number): boolean {
    let s = this.S[i];
    let so: Map<number, number> = this.SOrder[i];
    for (let k: number = 0; (k < s.length); k++) {
      let u: number = s[k];
      let uPosition: number = 0;
      if ((uPosition = so.get(u,)) == null) {
        return false;
      }

      if ((uPosition != k)) {
        return false;
      }

    }

    for (let k: number = 0; (k
      < (s.length - 1)); k++) {
      let u: number = s[k];
      let v: number = s[(k + 1)];
      if (!this.UIsToTheLeftOfV(u, v)) {
        return false;
      }

    }

    return true;
  }

  ///  <summary>
  ///  Is called just after median layer swap is done
  ///  </summary>
  InitArrays() {
    if ((this.S == null)) {
      this.AllocArrays();
    }

    for (let i: number = 0; (i < this.properLayeredGraph.NodeCount); i++) {
      this.POrder[i].clear();
      this.SOrder[i].clear();
      this.S[i] = []
      this.P[i] = []
    }

    for (let i: number = 0; (i < this.layers.length); i++) {
      this.InitPSArraysForLayer(this.layers[i]);
    }

  }

  DisturbLayer(layer: number[]) {
    for (let i: number = 0; (i
      < (layer.length - 1)); i++) {
      this.AdjacentSwapToTheRight(layer, i);
    }

  }

  AdjExchangeLayer(i: number): boolean {
    let layer: number[] = this.layers[i];
    let gain: boolean = this.ExchangeWithGainWithNoDisturbance(layer);
    if (gain) {
      return true;
    }

    this.DisturbLayer(layer);
    return this.ExchangeWithGainWithNoDisturbance(layer);
  }

  AllocArrays() {
    let n: number = this.properLayeredGraph.NodeCount;
    this.P = new Array(n);
    this.S = new Array(n);
    this.POrder = new Array(n);
    this.SOrder = new Array(n);
    if (this.hasCrossWeights) {
      this.outCrossingCount = new Array(n);
      this.inCrossingCount = new Array(n);
    }

    for (let i: number = 0; (i < n); i++) {
      this.P[i] = new Array<number>();
      if (this.hasCrossWeights) {
        let inCounts: Map<number, number>;
        for (const le of this.properLayeredGraph.InEdges(i)) {
          inCounts[le.Source] = le.CrossingWeight;
        }

      }

      this.POrder[i] = new Map<number, number>();
      this.S[i] = new Array<number>();
      this.SOrder[i] = new Map<number, number>();
      if (this.hasCrossWeights) {
        let outCounts: Map<number, number>;
        for (let le of this.properLayeredGraph.OutEdges(i)) {
          outCounts[le.Target] = le.CrossingWeight;
        }

      }

    }

  }

  UpdatePsContainingUV(u: number, v: number) {
    if ((this.S[u].length <= this.S[v].length)) {
      for (const a of this.S[u]) {
        let porder: Map<number, number> = this.POrder[a];
        // of course porder contains u, let us see if it contains v
        if (porder.has(v)) {
          let vOffset: number = porder[v];
          // swap u and v in the array P[coeff]
          let p = this.P[a];
          p[(vOffset - 1)] = v;
          p[vOffset] = u;
          // update sorder itself
          porder[v] = (vOffset - 1);
          porder[u] = vOffset;
        }

      }

    }
    else {
      for (const a of this.S[v]) {
        let porder: Map<number, number> = this.POrder[a];
        // of course porder contains u, let us see if it contains v
        if (porder.has(u)) {
          let vOffset: number = porder[v];
          // swap u and v in the array P[coeff]
          let p = this.P[a];
          p[(vOffset - 1)] = v;
          p[vOffset] = u;
          // update sorder itself
          porder[v] = (vOffset - 1);
          porder[u] = vOffset;
        }

      }

    }

  }

  SwapToTheRight(layer: number[], i: number) {
    for (let j: number = i; (j
      < (layer.length - 1)); j++) {
      this.AdjacentSwapToTheRight(layer, j);
    }

  }

  SwapToTheLeft(layer: number[], i: number) {
    for (let j: number = (i - 1); (j >= 0); j--) {
      this.AdjacentSwapToTheRight(layer, j);
    }
  }

  ///  <summary>
  ///  swaps i-th element with i+1
  ///  </summary>
  ///  <param name="layer">the layer to work on</param>
  ///  <param name="i">the position to start</param>
  ///  <returns></returns>
  AdjacentSwapToTheRight(layer: number[], i: number) {
    let v: number = layer[(i + 1)];
    let u: number = layer[i];
    let gain: number = this.SwapGain(u, v);
    if (((gain > 0)
      || ((gain == 0)
        && this.HeadOfTheCoin()))) {
      this.Swap(u, v);
      return;
    }

  }

  ///  <summary>
  ///  Sweep layer from left to right and fill S,P arrays as we go.
  ///  The arrays P and S will be sorted according to X. Note that we will not keep them sorted
  ///  as we doing adjacent swaps. Initial sorting only needed to calculate initial clr,crl values.
  ///  </summary>
  ///  <param name="layer"></param>
  InitPSArraysForLayer(layer: number[]) {
    for (const l of layer) {
      for (const p of this.properLayeredGraph.Pred(l)) {
        let so: Map<number, number> = this.SOrder[p];
        if (so.has(l)) {
          continue
        }

        let sHasNow: number = so.size;
        this.S[p].push(l);
        // l takes the first available slot in S[p]
        so[l] = sHasNow;
      }

      for (const s of this.properLayeredGraph.Succ(l)) {
        let po: Map<number, number> = this.POrder[s];
        if (po.has(l)) {
          continue
        }

        let pHasNow: number = po.size;
        this.P[s].push(l);
        // l take the first available slot in P[s]
        po[l] = pHasNow;
      }
    }
  }

  UpdateSsContainingUV(u: number, v: number) {
    if ((this.P[u].length <= this.P[v].length)) {
      for (const a of this.P[u]) {
        let sorder: Map<number, number> = this.SOrder[a];
        // of course sorder contains u, let us see if it contains v
        if (sorder.has(v)) {
          let vOffset: number = sorder[v];
          // swap u and v in the array S[coeff]
          let s = this.S[a];
          s[(vOffset - 1)] = v;
          s[vOffset] = u;
          // update sorder itself
          sorder[v] = (vOffset - 1);
          sorder[u] = vOffset;
        }

      }

    }
    else {
      for (let a of this.P[v]) {
        let sorder: Map<number, number> = this.SOrder[a];
        // of course sorder contains u, let us see if it contains v
        if (sorder.has(u)) {
          let vOffset: number = sorder[v];
          // swap u and v in the array S[coeff]
          let s = this.S[a];
          s[(vOffset - 1)] = v;
          s[vOffset] = u;
          // update sorder itself
          sorder[v] = (vOffset - 1);
          sorder[u] = vOffset;
        }

      }

    }

  }

  private UAndVAreOnSameLayer(u: number, v: number): boolean {
    return (this.layering[u] == this.layering[v]);
  }

  private UIsToTheLeftOfV(u: number, v: number): boolean {
    return (this.X[u] < this.X[v]);
  }
}

