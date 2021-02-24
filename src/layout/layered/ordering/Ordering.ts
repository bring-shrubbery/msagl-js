// Following "A technique for Drawing Directed Graphs" of Gansner, Koutsofios, North and Vo

import { copyTo } from "../../../utils/copy";
import { randomInt } from "../../../utils/random";
import { LayerArrays } from "../LayerArrays";
import { ProperLayeredGraph } from "../ProperLayeredGraph";
import { SugiyamaLayoutSettings } from "../SugiyamaLayoutSettings";
import { OrderingMeasure } from './OrderingMeasure';
import SortedMap = require("collections/sorted-map")

// Works on the layered graph. 
// See GraphLayout.pdfhttps://www.researchgate.net/profile/Lev_Nachmanson/publication/30509007_Drawing_graphs_with_GLEE/links/54b6b2930cf2e68eb27edf71/Drawing-graphs-with-GLEE.pdf

function HeadOfTheCoin() {
  return randomInt(2) == 0;
}

export class Ordering implements Algorithm {
  // fields
  balanceVirtAndOrigNodes: boolean;
  hasCrossWeights: boolean;

  layerArrays: LayerArrays;
  layerArraysCopy: number[][];
  layering: number[]
  layers: number[][]
  measure: Microsoft.Msagl.Layout.Layered.OrderingMeasure;

  nOfLayers: number;
  optimalOriginalGroupSize: number[]
  optimalVirtualGroupSize: number[]
  properLayeredGraph: ProperLayeredGraph;


  SugSettings: SugiyamaLayoutSettings;
  startOfVirtNodes: number;

  tryReverse = true

  get NoGainStepsBound() {
    return this.SugSettings.NoGainAdjacentSwapStepsBound *
      this.SugSettings.RepetitionCoefficientForOrdering;
  }


  // gets the random seed for some random choices inside of layer ordering
  get SeedOfRandom() {
    return randomInt(100)
  }

  X: number[]

  constructor(graphPar: ProperLayeredGraph, tryReverse: boolean, layerArraysParam: LayerArrays, startOfVirtualNodes: number, balanceVirtualAndOrigNodes: boolean, hasCrossWeights: boolean, settings: SugiyamaLayoutSettings) {
    this.tryReverse = tryReverse;
    this.startOfVirtNodes = startOfVirtualNodes;
    this.layerArrays = layerArraysParam;
    this.layering = layerArraysParam.Y;
    this.nOfLayers = layerArraysParam.Layers.length;
    this.layers = layerArraysParam.Layers;
    this.balanceVirtAndOrigNodes = balanceVirtualAndOrigNodes;
    this.properLayeredGraph = graphPar;
    this.hasCrossWeights = hasCrossWeights;
    this.SugSettings = settings;
  }

  // an upper limit on a number of passes in layer ordering
  get MaxOfIterations() {
    return this.SugSettings.MaxNumberOfPassesInOrdering *
      this.SugSettings.RepetitionCoefficientForOrdering;
  }

  static OrderLayers(graph: ProperLayeredGraph,
    layerArrays: LayerArrays,
    startOfVirtualNodes: number,
    balanceVirtualAndOriginalNodes: boolean,
    settings: SugiyamaLayoutSettings, cancelToken: CancelToken) {
    let hasCrossWeight = false;
    for (const le of graph.Edges)
      if (le.crossingWeight != 1) {
        hasCrossWeight = true;
        break;
      }

    var o = new Ordering(graph, true, layerArrays, startOfVirtualNodes, balanceVirtualAndOriginalNodes, hasCrossWeight, settings);
    o.Run();
  }


  Run() {
    // #if DEBUGORDERING
    // if (graph.NumberOfVertices != layering.Length)
    //   throw new System.Exception("the layering does not correspond to the graph");
    // for (IntEdge e of graph.Edges)
    // if (layering[e.Source] - layering[e.Target] != 1)
    //   throw new System.Exception("the edge in the graph does not span exactly one layer:" + e);
    // #endif

    this.Calculate();

    if ( /*orderingMeasure.x>0 &&*/ this.tryReverse) {
      const secondLayers = this.layerArrays.ReversedClone();

      var revOrdering = new Ordering(this.properLayeredGraph.ReversedClone(), false, secondLayers, this.startOfVirtNodes, this.balanceVirtAndOrigNodes,
        this.hasCrossWeights, this.SugSettings);

      revOrdering.Run();

      if (revOrdering.measure < this.measure) {
        for (let j = 0; j < this.nOfLayers; j++)
          copyTo(secondLayers.Layers[j], this.layerArrays.Layers[this.nOfLayers - 1 - j]);

        this.layerArrays.UpdateXFromLayers();
      }
    }
  }

  Calculate() {
    this.Init();

    this.layerArraysCopy = Ordering.CloneLayers(this.layers, this.layerArraysCopy);
    let countOfNoGainSteps = 0;
    this.measure = new OrderingMeasure(this.layerArraysCopy, this.GetCrossingsTotal(this.properLayeredGraph, this.layerArrays),
      this.startOfVirtNodes, this.optimalOriginalGroupSize,
      this.optimalVirtualGroupSize);

    //Stopwatch sw = Stopwatch.StartNew();
    for (let i = 0; i < this.MaxOfIterations && countOfNoGainSteps < this.NoGainStepsBound && !this.measure.IsPerfect(); i++) {
      let up = i % 2 == 0;

      this.LayerByLayerSweep(up);


      if (!this.balanceVirtAndOrigNodes)
        this.AdjacentExchange();
      else
        this.AdjacentExchangeWithBalancingVirtOrigNodes();


      var newMeasure = new OrderingMeasure(this.layerArrays.Layers,
        this.GetCrossingsTotal(properLayeredGraph, layerArrays),
        this.startOfVirtNodes,
        this.optimalOriginalGroupSize, this.optimalVirtualGroupSize);

      if (this.measure < newMeasure) {
        this.Restore();
        countOfNoGainSteps++;
      } else if (newMeasure < this.measure || HeadOfTheCoin()) {
        countOfNoGainSteps = 0;
        Ordering.CloneLayers(this.layers, this.layerArraysCopy);
        this.measure = newMeasure;
      }
    }
  }

  static CloneLayers(layers: number[][], layerArraysCopy: number[][]): number[][] {
    if (layerArraysCopy == null) {
      layerArraysCopy = new Array<Array<number>>(layers.length)
      for (let i = 0; i < layers.length; i++)
        layerArraysCopy[i] = layers[i].map(i => i)
    } else
      for (const i = 0; i < layers.length; i++)
        copyTo(layers[i], layerArraysCopy[i]);

    return layerArraysCopy
  }

  Restore() {
    this.layerArrays.updateLayers(this.layerArraysCopy);
  }

  LayerByLayerSweep(up: boolean) {
    if (up) {
      for (let i = 1; i < this.nOfLayers; i++)
        this.SweepLayer(i, true);
    } else
      for (let i = this.nOfLayers - 2; i >= 0; i--)
        this.SweepLayer(i, false);
  }

  // the layer layer-1 is fixed if 
  // upperLayer us true and layer+1 is fixed in 
  // the opposite case
  // the layer with index "layer" is updated    
  // of the strip</param>
  SweepLayer(layer: number, upperLayer: boolean) {
    const l = this.layers[layer];
    const medianValues = new Array<number>(l.length)

    for (let i = 0; i < medianValues.length; i++)
      medianValues[i] = this.WMedian(l[i], upperLayer);

    this.Sort(layer, medianValues);

    //update X
    const vertices = this.layerArrays.Layers[layer];
    for (let i = 0; i < vertices.length; i++)
      this.layerArrays.X[vertices[i]] = i;
  }

  // sorts layerToSort according to medianValues
  // if medianValues[i] is -1 then layer[i] does not move
  Sort(layerToSort: number, medianValues: number[]) {
    var s = new SortedMap<number, any>();
    const vertices = this.layers[layerToSort];
    let i = 0;

    for (const m of medianValues) {
      const v = vertices[i++];
      if (m == -1.0)
        continue;

      if (!s.has(m))
        s.set(m, v)
      else {
        const o = s.get(m)
        if (!(typeof o === "number")) {
          const al = o as number[]
          if (HeadOfTheCoin())
            al.push(v);
          else {
            //stick it in the middle 
            const j = randomInt(al.length);
            const k = al[j];
            al[j] = v;
            al.push(k);
          }
        } else {
          const io = o as number;
          const al = []
          s[m] = al;
          if (HeadOfTheCoin()) {
            al.push(io);
            al.push(v);
          } else {
            al.push(v);
            al.push(io);
          }
        }
      }
    }

    const senum = s.values()
    let j = -1

    for (i = 0; i < vertices.length;) {
      if (medianValues[i] != -1) {
        j++;
        const o = senum[j];
        if (typeof o == "number")
          vertices[i++] = o as number
        else {
          var al = o as number[]
          for (const v of al) {
            //find the first empty spot
            while (medianValues[i] == -1)
              i++;
            vertices[i++] = v;
          }
        }
      } else
        i++;
    }
  }


  // number WMedian(number node, boolean theMedianGoingDown) {
  //   IEnumerable < LayerEdge > edges;
  //   number p;
  //   if (theMedianGoingDown) {
  //     edges = properLayeredGraph.OutEdges(node);
  //     p = properLayeredGraph.OutEdgesCount(node);
  //   } else {
  //     edges = properLayeredGraph.InEdges(node);
  //     p = properLayeredGraph.InEdgesCount(node);
  //   }

  //   if (p == 0)
  //     return -1.0f;

  //   var parray = new number[p]; //we have no multiple edges

  //   number i = 0;
  //   if (theMedianGoingDown)
  //     for (LayerEdge e of edges)
  //       parray[i++] = X[e.Target];
  //   else
  //     for (LayerEdge e of edges)
  //       parray[i++] = X[e.Source];

  //   Array.Sort(parray);

  //   number m = p / 2;

  //   if (p % 2 == 1)
  //     return parray[m];

  //   if (p == 2)
  //     return 0.5f * ((number) parray[0] + (number) parray[1]);

  //   number left = parray[m - 1] - parray[0];

  //   number right = parray[p - 1] - parray[m];

  //   return ((number) parray[m - 1] * left + (number) parray[m] * right) /(left + right);
  // }


  // // Just depth search and assign the index saying when the node was visited
  // void Init() {
  //   var counts = new number[nOfLayers];

  //   //the initial layers are set by following the order of the 
  //   //depth first traversal inside one layer
  //   var q = new Stack<number>();
  //   //enqueue all sources of the graph 
  //   for (number i = 0; i < properLayeredGraph.NodeCount; i++)
  //   if (properLayeredGraph.InEdgesCount(i) == 0)
  //     q.Push(i);


  //   var visited = new boolean[properLayeredGraph.NodeCount];

  //   while (q.Count > 0) {
  //     number u = q.Pop();
  //     number l = layerArrays.Y[u];


  //     layerArrays.Layers[l][counts[l]] = u;
  //     layerArrays.X[u] = counts[l];
  //     counts[l]++;

  //     for (number v of properLayeredGraph.Succ(u))
  //       if (!visited[v]) {
  //         visited[v] = true;
  //         q.Push(v);
  //       }
  //   }

  //   X = layerArrays.X;

  //   if (balanceVirtAndOrigNodes)
  //     InitOptimalGroupSizes();
  // }

  // void InitOptimalGroupSizes() {
  //   optimalOriginalGroupSize = new number[nOfLayers];
  //   optimalVirtualGroupSize = new number[nOfLayers];

  //   for (number i = 0; i < nOfLayers; i++)
  //   InitOptimalGroupSizesForLayer(i);
  // }

  // void InitOptimalGroupSizesForLayer(number i) {
  //   //count original and virtual nodes
  //   number originals = 0;
  //   for (number j of layers[i])
  //     if (j < startOfVirtNodes)
  //       originals++;

  //   number virtuals = layers[i].Length - originals;

  //   if (originals < virtuals) {
  //     optimalOriginalGroupSize[i] = 1;
  //     optimalVirtualGroupSize[i] = (number) virtuals / (originals + 1);
  //   } else {
  //     optimalVirtualGroupSize[i] = 1;
  //     optimalOriginalGroupSize[i] = (number) originals / (virtuals + 1);
  //   }
  // }


  //          static number GetCrossingsTotal(ProperLayeredGraph properLayeredGraph, LayerArrays layerArrays) {
  //   number x = 0;
  //   for (number i = 0; i < layerArrays.Layers.Length - 1; i++)
  //   x += GetCrossingCountFromStrip(i, properLayeredGraph, layerArrays);

  //   return x;
  // }


  //         // This method can be improved: see the paper Simple And Efficient ...
  //         static number GetCrossingCountFromStrip(number bottom, ProperLayeredGraph properLayeredGraph, LayerArrays layerArrays) {
  //   number[] topVerts = layerArrays.Layers[bottom + 1];
  //   number[] bottomVerts = layerArrays.Layers[bottom];
  //   if (bottomVerts.Length <= topVerts.Length)
  //     return GetCrossingCountFromStripWhenBottomLayerIsShorter(bottomVerts, properLayeredGraph, layerArrays);
  //   else
  //     return GetCrossingCountFromStripWhenTopLayerIsShorter(topVerts, bottomVerts, properLayeredGraph,
  //       layerArrays);
  // }

  //         static number GetCrossingCountFromStripWhenTopLayerIsShorter(number[] topVerts, number[] bottomVerts,
  //   ProperLayeredGraph properLayeredGraph,
  //   LayerArrays layerArrays) {
  //   LayerEdge[] edges = EdgesOfStrip(bottomVerts, properLayeredGraph);
  //   Array.Sort(edges, new EdgeComparerByTarget(layerArrays.X));
  //   //find first n such that 2^n >=topVerts.Length
  //   number n = 1;
  //   while (n < topVerts.Length)
  //     n *= 2;
  //   //init the accumulator tree

  //   var tree = new number[2 * n - 1];

  //   n--; // the first bottom node starts from n now

  //   number cc = 0; //number of crossings
  //   for (LayerEdge edge of edges) {
  //     number index = n + layerArrays.X[edge.Source];
  //     number ew = edge.CrossingWeight;
  //     tree[index] += ew;
  //     while (index > 0) {
  //       if (index % 2 != 0)
  //         cc += ew * tree[index + 1]; //intersect everything accumulated in the right sibling 
  //       index = (index - 1) / 2;
  //       tree[index] += ew;
  //     }
  //   }
  //   return cc;
  // }


  //         static number GetCrossingCountFromStripWhenBottomLayerIsShorter(number[] bottomVerts,
  //   ProperLayeredGraph properLayeredGraph,
  //   LayerArrays layerArrays) {
  //   LayerEdge[] edges = EdgesOfStrip(bottomVerts, properLayeredGraph);
  //   Array.Sort(edges, new EdgeComparerBySource(layerArrays.X));
  //   //find first n such that 2^n >=bottomVerts.Length
  //   number n = 1;
  //   while (n < bottomVerts.Length)
  //     n *= 2;
  //   //init accumulator

  //   var tree = new number[2 * n - 1];

  //   n--; // the first bottom node starts from n now

  //   number cc = 0; //number of crossings
  //   for (LayerEdge edge of edges) {
  //     number index = n + layerArrays.X[edge.Target];
  //     number ew = edge.CrossingWeight;
  //     tree[index] += ew;
  //     while (index > 0) {
  //       if (index % 2 != 0)
  //         cc += ew * tree[index + 1]; //intersect everything accumulated in the right sibling 
  //       index = (index - 1) / 2;
  //       tree[index] += ew;
  //     }
  //   }

  //   return cc;
  // }

  //         static LayerEdge[] EdgesOfStrip(number[] bottomVerts, ProperLayeredGraph properLayeredGraph) {
  //   LayerEdge[] edges = (from v of bottomVerts
  //   from e in properLayeredGraph.InEdges(v)
  //   select e).ToArray();

  //   return edges;
  // }
  // number[][] predecessors;


  // // The array contains a dictionary per vertex
  // // The value POrder[v][u] gives the offset of u in the array P[v]
  // Dictionary < number, number > [] pOrder;

  // // for each vertex v let S[v] be the array of successors of v
  // number[][] successors;

  // // The array contains a dictionary per vertex
  // // The value SOrder[v][u] gives the offset of u in the array S[v]
  // Dictionary < number, number > [] sOrder;

  // Dictionary < number, number > [] inCrossingCount;
  // // Gets or sets the number of of passes over all layers to rung adjacent exchanges, where every pass goes '
  // // all way up to the top layer and down to the lowest layer
  // const number MaxNumberOfAdjacentExchanges = 50;

  // Dictionary < number, number > [] outCrossingCount;




  // void AdjacentExchangeWithBalancingVirtOrigNodes() {
  //   InitArrays();
  //   number count = 0;
  //   boolean progress = true;
  //   while (progress && count++ < MaxNumberOfAdjacentExchanges) {
  //     progress = false;
  //     for (number i = 0; i < layers.Length; i++)
  //     progress = AdjExchangeLayerWithBalance(i) || progress;
  //     for (number i = layers.Length - 2; i >= 0; i--)
  //     progress = AdjExchangeLayerWithBalance(i) || progress;
  //   }
  // }

  // void AdjacentExchange() {
  //   InitArrays();
  //   number count = 0;
  //   boolean progress = true;
  //   while (progress && count++ < MaxNumberOfAdjacentExchanges) {
  //     progress = false;
  //     for (number i = 0; i < layers.Length; i++)
  //     progress = AdjExchangeLayer(i) || progress;
  //     for (number i = layers.Length - 2; i >= 0; i--)
  //     progress = AdjExchangeLayer(i) || progress;
  //   }
  // }

  // void AllocArrays() {
  //   number n = properLayeredGraph.NodeCount;
  //   predecessors = new number[n][];
  //   successors = new number[n][];


  //   pOrder = new Dictionary < number, number > [n];
  //   sOrder = new Dictionary < number, number > [n];
  //   if (hasCrossWeights) {
  //     outCrossingCount = new Dictionary < number, number > [n];
  //     inCrossingCount = new Dictionary < number, number > [n];
  //   }
  //   for (number i = 0; i < n; i++) {
  //     number count = properLayeredGraph.InEdgesCount(i);
  //     predecessors[i] = new number[count];
  //     if (hasCrossWeights) {
  //       Dictionary < number, number > inCounts = inCrossingCount[i] = new Dictionary<number, number>(count);
  //       for (LayerEdge le of properLayeredGraph.InEdges(i))
  //         inCounts[le.Source] = le.CrossingWeight;
  //     }
  //     pOrder[i] = new Dictionary<number, number>(count);
  //     count = properLayeredGraph.OutEdgesCount(i);
  //     successors[i] = new number[count];
  //     sOrder[i] = new Dictionary<number, number>(count);
  //     if (hasCrossWeights) {
  //       Dictionary < number, number > outCounts = outCrossingCount[i] = new Dictionary<number, number>(count);
  //       for (LayerEdge le of properLayeredGraph.OutEdges(i))
  //         outCounts[le.Target] = le.CrossingWeight;
  //     }
  //   }
  // }

  // // Is called just after median layer swap is done
  // void InitArrays() {
  //   if (successors == null)
  //     AllocArrays();


  //   for (number i = 0; i < properLayeredGraph.NodeCount; i++) {
  //     pOrder[i].Clear();
  //     sOrder[i].Clear();
  //   }


  //   for (number[] t of layers)
  //     InitPsArraysForLayer(t);
  // }


  // // calculates the number of intersections between edges adjacent to u and v
  // void CalcPair(number u, number v, out number cuv, out number cvu) {
  //   number[] su = successors[u], sv = successors[v], pu = predecessors[u], pv = predecessors[v];
  //   if (!hasCrossWeights) {
  //     cuv = CountOnArrays(su, sv) +
  //       CountOnArrays(pu, pv);
  //     cvu = CountOnArrays(sv, su) +
  //       CountOnArrays(pv, pu);
  //   } else {
  //     Dictionary < number, number > uOutCrossCounts = outCrossingCount[u];
  //     Dictionary < number, number > vOutCrossCounts = outCrossingCount[v];
  //     Dictionary < number, number > uInCrossCounts = inCrossingCount[u];
  //     Dictionary < number, number > vInCrossCounts = inCrossingCount[v];
  //     cuv = CountOnArrays(su, sv, uOutCrossCounts, vOutCrossCounts) +
  //       CountOnArrays(pu, pv, uInCrossCounts, vInCrossCounts);
  //     cvu = CountOnArrays(sv, su, vOutCrossCounts, uOutCrossCounts) +
  //       CountOnArrays(pv, pu, vInCrossCounts, uInCrossCounts);
  //   }
  // }

  // // Sweep layer from left to right and fill S,P arrays as we go.
  // // The arrays P and S will be sorted according to X. Note that we will not keep them sorted
  // // as we doing adjacent swaps. Initial sorting only needed to calculate initial clr,crl values.
  // void InitPsArraysForLayer(number[] layer) {
  //   this.ProgressStep();

  //   for (number l of layer) {
  //     for (number p of properLayeredGraph.Pred(l)) {
  //       Dictionary < number, number > so = sOrder[p];
  //       number sHasNow = so.Count;
  //       successors[p][sHasNow] = l; //l takes the first available slot in S[p]
  //       so[l] = sHasNow;
  //     }
  //     for (number s of properLayeredGraph.Succ(l)) {
  //       Dictionary < number, number > po = pOrder[s];
  //       number pHasNow = po.Count;
  //       predecessors[s][pHasNow] = l; //l take the first available slot in P[s]
  //       po[l] = pHasNow;
  //     }
  //   }
  // }

  // number CountOnArrays(number[] unbs, number[] vnbs) {
  //   number ret = 0;
  //   number vl = vnbs.Length - 1;
  //   number j = -1; //the right most position of vnbs to the left from the current u neighbor 
  //   number vnbsSeenAlready = 0;
  //   for (number uNeighbor of unbs) {
  //     number xu = X[uNeighbor];
  //     for (; j < vl && X[vnbs[j + 1]] < xu; j++)
  //       vnbsSeenAlready++;
  //     ret += vnbsSeenAlready;
  //   }
  //   return ret;
  // }


  // // every inversion between unbs and vnbs gives an intersecton
  // number CountOnArrays(number[] unbs, number[] vnbs, Dictionary < number, number > uCrossingCounts,
  //   Dictionary < number, number > vCrossingCount) {
  //   number ret = 0;
  //   number vl = vnbs.Length - 1;
  //   number j = -1; //the right most position of vnbs to the left from the current u neighbor 

  //   number vCrossingNumberSeenAlready = 0;
  //   for (number uNeib of unbs) {
  //     number xu = X[uNeib];
  //     number vnb;
  //     for (; j < vl && X[vnb = vnbs[j + 1]] < xu; j++)
  //       vCrossingNumberSeenAlready += vCrossingCount[vnb];
  //     ret += vCrossingNumberSeenAlready * uCrossingCounts[uNeib];
  //   }
  //   return ret;
  // }

  // boolean AdjExchangeLayer(number i) {
  //   this.ProgressStep();

  //   number[] layer = layers[i];
  //   boolean gain = ExchangeWithGainWithNoDisturbance(layer);

  //   if (gain)
  //     return true;

  //   DisturbLayer(layer);

  //   return ExchangeWithGainWithNoDisturbance(layer);
  // }

  // boolean AdjExchangeLayerWithBalance(number i) {
  //   this.ProgressStep();
  //   number[] layer = layers[i];
  //   boolean gain = ExchangeWithGainWithNoDisturbanceWithBalance(layer);

  //   if (gain)
  //     return true;

  //   DisturbLayerWithBalance(layer);

  //   return ExchangeWithGainWithNoDisturbanceWithBalance(layer);
  // }

  // //in this routine u and v are adjacent, and u is to the left of v before the swap
  // void Swap(number u, number v) {
  //   number left = X[u];
  //   number right = X[v];
  //   number ln = layering[u]; //layer number
  //   number[] layer = layers[ln];

  //   layer[left] = v;
  //   layer[right] = u;

  //   X[u] = right;
  //   X[v] = left;

  //   //update sorted arrays POrders and SOrders
  //   //an array should be updated only in case it contains both u and v.
  //   // More than that, v has to follow u in an the array.

  //   UpdateSsContainingUv(u, v);

  //   UpdatePsContainingUv(u, v);
  // }

  // void UpdatePsContainingUv(number u, number v) {
  //   if (successors[u].Length <= successors[v].Length)
  //     for (number a of successors[u]) {
  //       Dictionary < number, number > porder = pOrder[a];
  //       //of course porder contains u, let us see if it contains v
  //       if (porder.ContainsKey(v)) {
  //         number vOffset = porder[v];
  //         //swap u and v in the array P[coeff]
  //         number[] p = predecessors[a];
  //         p[vOffset - 1] = v;
  //         p[vOffset] = u;
  //         //update sorder itself
  //         porder[v] = vOffset - 1;
  //         porder[u] = vOffset;
  //       }
  //     }
  //   else
  //     for (number a of successors[v]) {
  //       Dictionary < number, number > porder = pOrder[a];
  //       //of course porder contains u, let us see if it contains v
  //       if (porder.ContainsKey(u)) {
  //         number vOffset = porder[v];
  //         //swap u and v in the array P[coeff]
  //         number[] p = predecessors[a];
  //         p[vOffset - 1] = v;
  //         p[vOffset] = u;
  //         //update sorder itself
  //         porder[v] = vOffset - 1;
  //         porder[u] = vOffset;
  //       }
  //     }
  // }

  // void UpdateSsContainingUv(number u, number v) {
  //   if (predecessors[u].Length <= predecessors[v].Length)
  //     for (number a of predecessors[u]) {
  //       Dictionary < number, number > sorder = sOrder[a];
  //       //of course sorder contains u, let us see if it contains v
  //       if (sorder.ContainsKey(v)) {
  //         number vOffset = sorder[v];
  //         //swap u and v in the array S[coeff]
  //         number[] s = successors[a];
  //         s[vOffset - 1] = v;
  //         s[vOffset] = u;
  //         //update sorder itself
  //         sorder[v] = vOffset - 1;
  //         sorder[u] = vOffset;
  //       }
  //     }
  //   else
  //     for (number a of predecessors[v]) {
  //       Dictionary < number, number > sorder = sOrder[a];
  //       //of course sorder contains u, let us see if it contains v
  //       if (sorder.ContainsKey(u)) {
  //         number vOffset = sorder[v];
  //         //swap u and v in the array S[coeff]
  //         number[] s = successors[a];
  //         s[vOffset - 1] = v;
  //         s[vOffset] = u;
  //         //update sorder itself
  //         sorder[v] = vOffset - 1;
  //         sorder[u] = vOffset;
  //       }
  //     }
  // }


  // void DisturbLayer(number[] layer) {
  //   for (number i = 0; i < layer.Length - 1; i++)
  //   AdjacentSwapToTheRight(layer, i);
  // }

  // void DisturbLayerWithBalance(number[] layer) {
  //   for (number i = 0; i < layer.Length - 1; i++)
  //   AdjacentSwapToTheRightWithBalance(layer, i);
  // }

  // boolean ExchangeWithGainWithNoDisturbance(number[] layer) {
  //   boolean wasGain = false;

  //   boolean gain;
  //   do {
  //     gain = ExchangeWithGain(layer);
  //     wasGain = wasGain || gain;
  //   } while (gain);

  //   return wasGain;
  // }

  // boolean ExchangeWithGainWithNoDisturbanceWithBalance(number[] layer) {
  //   boolean wasGain = false;

  //   boolean gain;
  //   do {
  //     gain = ExchangeWithGainWithBalance(layer);
  //     wasGain = wasGain || gain;
  //   } while (gain);

  //   return wasGain;
  // }

  // boolean ExchangeWithGain(number[] layer) {
  //   //find a first pair giving some gain
  //   for (number i = 0; i < layer.Length - 1; i++)
  //   if (SwapWithGain(layer[i], layer[i + 1])) {
  //     SwapToTheLeft(layer, i);
  //     SwapToTheRight(layer, i + 1);
  //     return true;
  //   }

  //   return false;
  // }

  // boolean ExchangeWithGainWithBalance(number[] layer) {
  //   //find a first pair giving some gain
  //   for (number i = 0; i < layer.Length - 1; i++)
  //   if (SwapWithGainWithBalance(layer[i], layer[i + 1])) {
  //     SwapToTheLeftWithBalance(layer, i);
  //     SwapToTheRightWithBalance(layer, i + 1);
  //     return true;
  //   }

  //   return false;
  // }

  // void SwapToTheLeft(number[] layer, number i) {
  //   for (number j = i - 1; j >= 0; j--)
  //   AdjacentSwapToTheRight(layer, j);
  // }

  // void SwapToTheRight(number[] layer, number i) {
  //   for (number j = i; j < layer.Length - 1; j++)
  //   AdjacentSwapToTheRight(layer, j);
  // }

  // void SwapToTheLeftWithBalance(number[] layer, number i) {
  //   for (number j = i - 1; j >= 0; j--)
  //   AdjacentSwapToTheRightWithBalance(layer, j);
  // }

  // void SwapToTheRightWithBalance(number[] layer, number i) {
  //   for (number j = i; j < layer.Length - 1; j++)
  //   AdjacentSwapToTheRightWithBalance(layer, j);
  // }

  // // swaps i-th element with i+1
  // void AdjacentSwapToTheRight(number[] layer, number i) {
  //   number u = layer[i], v = layer[i + 1];

  //   number gain = SwapGain(u, v);

  //   if (gain > 0 || (gain == 0 && HeadOfTheCoin()))
  //     Swap(u, v);
  // }

  // void AdjacentSwapToTheRightWithBalance(number[] layer, number i) {
  //   number u = layer[i], v = layer[i + 1];

  //   number gain = SwapGainWithBalance(u, v);

  //   if (gain > 0 || (gain == 0 && HeadOfTheCoin()))
  //     Swap(u, v);
  // }

  // number SwapGain(number u, number v) {
  //   number cuv;
  //   number cvu;
  //   CalcPair(u, v, out cuv, out cvu);
  //   return cuv - cvu;
  // }

  // number SwapGainWithBalance(number u, number v) {
  //   number cuv;
  //   number cvu;
  //   CalcPair(u, v, out cuv, out cvu);
  //   number gain = cuv - cvu;
  //   if (gain != 0 && UvAreOfSameKind(u, v))
  //     return gain;
  //   //maybe we gain something in the group sizes
  //   return SwapGroupGain(u, v);
  // }

  // boolean UvAreOfSameKind(number u, number v) {
  //   return u < startOfVirtNodes && v < startOfVirtNodes || u >= startOfVirtNodes && v >= startOfVirtNodes;
  // }

  // number SwapGroupGain(number u, number v) {
  //   number layerIndex = layerArrays.Y[u];
  //   number[] layer = layers[layerIndex];

  //   if (NeighborsForbidTheSwap(u, v))
  //     return -1;

  //   number uPosition = X[u];
  //   boolean uIsSeparator;
  //   if (IsOriginal(u))
  //     uIsSeparator = optimalOriginalGroupSize[layerIndex] == 1;
  //   else
  //     uIsSeparator = optimalVirtualGroupSize[layerIndex] == 1;

  //   number delta = CalcDeltaBetweenGroupsToTheLeftAndToTheRightOfTheSeparator(layer,
  //     uIsSeparator
  //       ? uPosition
  //       : uPosition + 1,
  //     uIsSeparator ? u : v);

  //   if (uIsSeparator) {
  //     if (delta < -1)
  //       return 1;
  //     if (delta == -1)
  //       return 0;
  //     return -1;
  //   }
  //   if (delta > 1)
  //     return 1;
  //   if (delta == 1)
  //     return 0;
  //   return -1;
  // }

  // boolean NeighborsForbidTheSwap(number u, number v) {
  //   return UpperNeighborsForbidTheSwap(u, v) || LowerNeighborsForbidTheSwap(u, v);
  // }

  // boolean LowerNeighborsForbidTheSwap(number u, number v) {
  //   number uCount, vCount;
  //   if (((uCount = properLayeredGraph.OutEdgesCount(u)) == 0) ||
  //     ((vCount = properLayeredGraph.OutEdgesCount(v)) == 0))
  //     return false;

  //   return X[successors[u][uCount >> 1]] < X[successors[v][vCount >> 1]];
  // }


  // boolean UpperNeighborsForbidTheSwap(number u, number v) {
  //   number uCount = properLayeredGraph.InEdgesCount(u);
  //   number vCount = properLayeredGraph.InEdgesCount(v);
  //   if (uCount == 0 || vCount == 0)
  //     return false;

  //   return X[predecessors[u][uCount >> 1]] < X[predecessors[v][vCount >> 1]];
  // }

  // number CalcDeltaBetweenGroupsToTheLeftAndToTheRightOfTheSeparator(number[] layer, number separatorPosition, number separator) {
  //   Func < number, boolean > kind = GetKindDelegate(separator);
  //   number leftGroupSize = 0;
  //   for (number i = separatorPosition - 1; i >= 0 && !kind(layer[i]); i--)
  //   leftGroupSize++;
  //   number rightGroupSize = 0;
  //   for (number i = separatorPosition + 1; i < layer.Length && !kind(layer[i]); i++)
  //   rightGroupSize++;

  //   return leftGroupSize - rightGroupSize;
  // }

  // boolean IsOriginal(number v) {
  //   return v < startOfVirtNodes;
  // }

  // boolean IsVirtual(number v) {
  //   return v >= startOfVirtNodes;
  // }


  // Func < number, boolean > GetKindDelegate(number v) {
  //   Func < number, boolean > kind = IsVirtual(v) ? IsVirtual : new Func<number, boolean>(IsOriginal);
  //   return kind;
  // }


  // // swaps two vertices only if reduces the number of intersections
  // boolean SwapWithGain(number u, number v) {
  //   number gain = SwapGain(u, v);

  //   if (gain > 0) {
  //     Swap(u, v);
  //     return true;
  //   }
  //   return false;
  // }

  // boolean SwapWithGainWithBalance(number u, number v) {
  //   number gain = SwapGainWithBalance(u, v);

  //   if (gain > 0) {
  //     Swap(u, v);
  //     return true;
  //   }
  //   return false;
  // }

}
}
