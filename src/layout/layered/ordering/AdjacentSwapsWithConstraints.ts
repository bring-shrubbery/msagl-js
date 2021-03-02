import { get } from "lodash";
import { LayerEdge } from "../LayerEdge";
import { ProperLayeredGraph } from "../ProperLayeredGraph";
import { ConstrainedOrdering } from "./ConstrainedOrdering";
import { LayerInfo } from "./LayerInfo";

export class AdjacentSwapsWithConstraints {
  readonly maxNumberOfAdjacentExchanges = 50;
  readonly hasCrossWeights: boolean;

  readonly layerInfos: LayerInfo[];
  readonly layering: number[];
  readonly layers: number[][];
  readonly properLayeredGraph: ProperLayeredGraph;
  readonly X: number[];
  Dictionary<number, number> [] inCrossingCount;
  Dictionary<number, number> [] outCrossingCount;

  // for each vertex v let P[v] be the array of predeccessors of v
  List<number> [] P;


  // The array contains a dictionary per vertex
  // The value POrder[v][u] gives the offset of u in the array P[v]
  Dictionary<number, number> [] POrder;

  // for each vertex v let S[v] be the array of successors of v
  List<number> [] S;

  // The array contains a dictionary per vertex
  // The value SOrder[v][u] gives the offset of u in the array S[v]
  Dictionary<number, number> [] SOrder;

  AdjacentSwapsWithConstraints(LayerArrays layerArray,
    boolean hasCrossWeights,
    ProperLayeredGraph properLayeredGraph,
    LayerInfo[] layerInfos) {
    X = layerArray.X;
    layering = layerArray.Y;
    layers = layerArray.Layers;
    this.properLayeredGraph = properLayeredGraph;
    this.hasCrossWeights = hasCrossWeights;
    this.layerInfos = layerInfos;
  }

  // Gets or sets the number of of passes over all layers to run
  // adjacent exchanges, where every pass goes
  // all way up to the top layer and down to the lowest layer
  static number MaxNumberOfAdjacentExchanges {
  get { return maxNumberOfAdjacentExchanges; }
}

boolean ExchangeWithGainWithNoDisturbance(number[] layer) {
  boolean wasGain = false;

  boolean gain;
  do {
    gain = ExchangeWithGain(layer);
    wasGain = wasGain || gain;
  } while (gain);

  return wasGain;
}

boolean CanSwap(number i, number j) {
  if (IsVirtualNode(i) || IsVirtualNode(j))
    return true;
  LayerInfo layerInfo = layerInfos[layering[i]];
  if (layerInfo == null)
    return true;
  if (ConstrainedOrdering.BelongsToNeighbBlock(i, layerInfo)
    ||
    ConstrainedOrdering.BelongsToNeighbBlock(j, layerInfo)
    ||
    layerInfo.constrainedFromAbove.ContainsKey(i)
    ||
    layerInfo.constrainedFromBelow.ContainsKey(j)
  )
    return false;

  if (layerInfo.leftRight.Contains(new Tuple<number, number>(i, j)))
    return false;
  return true;
}

boolean IsVirtualNode(number v) {
  return properLayeredGraph.IsVirtualNode(v);
}

// swaps two vertices only if reduces the number of intersections
boolean SwapWithGain(number u, number v) {
  number gain = SwapGain(u, v);

  if (gain > 0) {
    Swap(u, v);
    return true;
  }
  return false;
}

number SwapGain(number u, number v) {
  if (!CanSwap(u, v))
    return -1;
  number cuv;
  number cvu;
  CalcPair(u, v, out cuv, out cvu);
  return cuv - cvu;
}

// calculates the number of intersections between edges adjacent to u and v
void CalcPair(number u, number v, out number cuv, out number cvu) {
  List < number > su = S[u], sv = S[v], pu = P[u], pv = P[v];
  if (!hasCrossWeights) {
    cuv = CountOnArrays(su, sv) +
      CountOnArrays(pu, pv);
    cvu = CountOnArrays(sv, su) +
      CountOnArrays(pv, pu);
  } else {
    Dictionary < number, number > uOutCrossCounts = outCrossingCount[u];
    Dictionary < number, number > vOutCrossCounts = outCrossingCount[v];
    Dictionary < number, number > uInCrossCounts = inCrossingCount[u];
    Dictionary < number, number > vInCrossCounts = inCrossingCount[v];
    cuv = CountOnArrays(su, sv, uOutCrossCounts, vOutCrossCounts) +
      CountOnArrays(pu, pv, uInCrossCounts, vInCrossCounts);
    cvu = CountOnArrays(sv, su, vOutCrossCounts, uOutCrossCounts) +
      CountOnArrays(pv, pu, vInCrossCounts, uInCrossCounts);
  }
}

number CountOnArrays(List < number > unbs, List < number > vnbs) {
  number ret = 0;
  number vl = vnbs.Count - 1;
  number j = -1; //the right most position of vnbs to the left from the current u neighbor 
  number vnbsSeenAlready = 0;
  for (number uNeighbor in unbs) {
    number xu = X[uNeighbor];
    for (; j < vl && X[vnbs[j + 1]] < xu; j++)
      vnbsSeenAlready++;
    ret += vnbsSeenAlready;
  }
  return ret;
}

// every inversion between unbs and vnbs gives an intersecton
number CountOnArrays(List < number > unbs, List < number > vnbs, Dictionary < number, number > uCrossingCounts,
  Dictionary < number, number > vCrossingCount) {
  number ret = 0;
  number vl = vnbs.Count - 1;
  number j = -1; //the right most position of vnbs to the left from the current u neighbor 

  number vCrossingNumberSeenAlready = 0;
  for (number uNeib in unbs) {
    number xu = X[uNeib];
    number vnb;
    for (; j < vl && X[vnb = vnbs[j + 1]] < xu; j++)
      vCrossingNumberSeenAlready += vCrossingCount[vnb];
    ret += vCrossingNumberSeenAlready * uCrossingCounts[uNeib];
  }
  return ret;
}


//in this routine u and v are adjacent, and u is to the left of v before the swap
void Swap(number u, number v) {
  Debug.Assert(UAndVAreOnSameLayer(u, v));
  Debug.Assert(UIsToTheLeftOfV(u, v));
  Debug.Assert(CanSwap(u, v));

  number left = X[u];
  number right = X[v];
  number ln = layering[u]; //layer number
  number[] layer = layers[ln];

  layer[left] = v;
  layer[right] = u;

  X[u] = right;
  X[v] = left;

  //update sorted arrays POrders and SOrders
  //an array should be updated only in case it contains both u and v.
  // More than that, v has to follow u in an the array.

  UpdateSsContainingUV(u, v);

  UpdatePsContainingUV(u, v);
}

boolean ExchangeWithGain(number[] layer) {
  //find a first pair giving some gain
  for (number i = 0; i < layer.Length - 1; i++)
  if (SwapWithGain(layer[i], layer[i + 1])) {
    SwapToTheLeft(layer, i);
    SwapToTheRight(layer, i + 1);
    return true;
  }

  return false;
}

boolean HeadOfTheCoin() {
  return random.Next(2) == 0;
}


void DoSwaps() {
  InitArrays();
  number count = 0;
  boolean progress = true;
  while (progress && count++ < MaxNumberOfAdjacentExchanges) {
    progress = false;
    for (number i = 0; i < layers.Length; i++)
    progress = AdjExchangeLayer(i) || progress;

    for (number i = layers.Length - 2; i >= 0; i--)
    progress = AdjExchangeLayer(i) || progress;
  }
  Debug.Assert(SPAreCorrect());
}

        private boolean SPAreCorrect()
{
  number n = this.properLayeredGraph.NodeCount;
  for (number i = 0; i < n; i++)
  if (!SIsCorrect(i))
    return false;

  return true;
}

        private boolean SIsCorrect(number i)
{
  var s = S[i];
  Dictionary < number, number > so = SOrder[i];
  for (number k = 0; k < s.Count; k++)
  {
    number u = s[k];
    number uPosition = 0;
    if (so.TryGetValue(u, out uPosition) == false)
      return false;
    if (uPosition != k)
      return false;
  }

  for (number k = 0; k < s.Count - 1; k++)
  {
    number u = s[k];
    number v = s[k + 1];
    if (!UIsToTheLeftOfV(u, v))
      return false;
  }
  return true;
}

// Is called just after median layer swap is done
void InitArrays() {
  if (S == null)
    AllocArrays();

  for (number i = 0; i < properLayeredGraph.NodeCount; i++) {
    POrder[i].Clear();
    SOrder[i].Clear();
    S[i].Clear();
    P[i].Clear();
  }


  for (number i = 0; i < layers.Length; i++)
  InitPSArraysForLayer(layers[i]);
}

void DisturbLayer(number[] layer) {
  for (number i = 0; i < layer.Length - 1; i++)
  AdjacentSwapToTheRight(layer, i);
}

boolean AdjExchangeLayer(number i) {
  number[] layer = layers[i];
  boolean gain = ExchangeWithGainWithNoDisturbance(layer);

  if (gain)
    return true;

  DisturbLayer(layer);

  return ExchangeWithGainWithNoDisturbance(layer);
}

void AllocArrays() {
  number n = properLayeredGraph.NodeCount;
  P = new List < number > [n];
  S = new List < number > [n];


  POrder = new Dictionary < number, number > [n];
  SOrder = new Dictionary < number, number > [n];
  if (hasCrossWeights) {
    outCrossingCount = new Dictionary < number, number > [n];
    inCrossingCount = new Dictionary < number, number > [n];
  }
  for (number i = 0; i < n; i++) {
    number count = properLayeredGraph.InEdgesCount(i);
    P[i] = new List<number>();
    if (hasCrossWeights) {
      Dictionary < number, number > inCounts = inCrossingCount[i] = new Dictionary<number, number>(count);
      for (LayerEdge le in properLayeredGraph.InEdges(i))
        inCounts[le.Source] = le.CrossingWeight;
    }
    POrder[i] = new Dictionary<number, number>(count);
    count = properLayeredGraph.OutEdgesCount(i);
    S[i] = new List<number>();
    SOrder[i] = new Dictionary<number, number>(count);
    if (hasCrossWeights) {
      Dictionary < number, number > outCounts = outCrossingCount[i] = new Dictionary<number, number>(count);
      for (LayerEdge le in properLayeredGraph.OutEdges(i))
        outCounts[le.Target] = le.CrossingWeight;
    }
  }
}

void UpdatePsContainingUV(number u, number v) {
  if (S[u].Count <= S[v].Count)
    for (number a in S[u]) {
      Dictionary < number, number > porder = POrder[a];
      //of course porder contains u, let us see if it contains v
      if (porder.ContainsKey(v)) {
        number vOffset = porder[v];
        //swap u and v in the array P[coeff]
        var p = P[a];
        p[vOffset - 1] = v;
        p[vOffset] = u;
        //update sorder itself
        porder[v] = vOffset - 1;
        porder[u] = vOffset;
      }
    }
  else
    for (number a in S[v]) {
      Dictionary < number, number > porder = POrder[a];
      //of course porder contains u, let us see if it contains v
      if (porder.ContainsKey(u)) {
        number vOffset = porder[v];
        //swap u and v in the array P[coeff]
        var p = P[a];
        p[vOffset - 1] = v;
        p[vOffset] = u;
        //update sorder itself
        porder[v] = vOffset - 1;
        porder[u] = vOffset;
      }
    }
}

void SwapToTheRight(number[] layer, number i) {
  for (number j = i; j < layer.Length - 1; j++)
  AdjacentSwapToTheRight(layer, j);
}

void SwapToTheLeft(number[] layer, number i) {
  for (number j = i - 1; j >= 0; j--)
  AdjacentSwapToTheRight(layer, j);
}

// swaps i-th element with i+1
void AdjacentSwapToTheRight(number[] layer, number i) {
  number u = layer[i], v = layer[i + 1];

  number gain = SwapGain(u, v);

  if (gain > 0 || (gain == 0 && HeadOfTheCoin())) {
    Swap(u, v);
    return;
  }
}
/*
// Sweep layer from left to right and fill S,P arrays as we go.
// The arrays P and S will be sorted according to X. Note that we will not keep them sorted
// as we doing adjacent swaps. Initial sorting only needed to calculate initial clr,crl values.
void InitPSArraysForLayer(number[] layer) {
  for (number l in layer) {
    for (number p in properLayeredGraph.Pred(l)) {
      Dictionary < number, number > so = SOrder[p];
      if (so.ContainsKey(l))
        continue;
      number sHasNow = so.Count;
      S[p].Add(l); //l takes the first available slot in S[p]
      so[l] = sHasNow;
    }
    for (number s in properLayeredGraph.Succ(l)) {
      Dictionary < number, number > po = POrder[s];
      if (po.ContainsKey(l))
        continue;
      number pHasNow = po.Count;
      P[s].Add(l); //l take the first available slot in P[s]
      po[l] = pHasNow;
    }
  }
}

void UpdateSsContainingUV(number u, number v) {
  if (P[u].Count <= P[v].Count)
    for (number a in P[u]) {
      Dictionary < number, number > sorder = SOrder[a];
      //of course sorder contains u, let us see if it contains v
      if (sorder.ContainsKey(v)) {
        number vOffset = sorder[v];
        //swap u and v in the array S[coeff]
        var s = S[a];
        s[vOffset - 1] = v;
        s[vOffset] = u;
        //update sorder itself
        sorder[v] = vOffset - 1;
        sorder[u] = vOffset;
      }
    }
  else
    for (number a in P[v]) {
      Dictionary < number, number > sorder = SOrder[a];
      //of course sorder contains u, let us see if it contains v
      if (sorder.ContainsKey(u)) {
        number vOffset = sorder[v];
        //swap u and v in the array S[coeff]
        var s = S[a];
        s[vOffset - 1] = v;
        s[vOffset] = u;
        //update sorder itself
        sorder[v] = vOffset - 1;
        sorder[u] = vOffset;
      }
    }
}

        private boolean UAndVAreOnSameLayer(number u, number v)
{
  return layering[u] == layering[v];
}

        private boolean UIsToTheLeftOfV(number u, number v)
{
  return X[u] < X[v];
}
*/    }
