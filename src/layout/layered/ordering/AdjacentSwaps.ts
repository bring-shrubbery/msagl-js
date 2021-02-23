
namespace Microsoft.Msagl.Layout.Layered {
  // Following "A technique for Drawing Directed Graphs" of Gansner, Koutsofios, North and Vo
  // Works on the layered graph. 
  // For explanations of the algorithm here see https://www.researchgate.net/profile/Lev_Nachmanson/publication/30509007_Drawing_graphs_with_GLEE/links/54b6b2930cf2e68eb27edf71/Drawing-graphs-with-GLEE.pdf
  // 
  partial class Ordering {
    // for each vertex v let P[v] be the array of predeccessors of v
    number[][] predecessors;


    // The array contains a dictionary per vertex
    // The value POrder[v][u] gives the offset of u in the array P[v]
    Dictionary<number, number>[] pOrder;

    // for each vertex v let S[v] be the array of successors of v
    number[][] successors;

    // The array contains a dictionary per vertex
    // The value SOrder[v][u] gives the offset of u in the array S[v]
    Dictionary<number, number>[] sOrder;

    Dictionary<number, number>[] inCrossingCount;
        // Gets or sets the number of of passes over all layers to rung adjacent exchanges, where every pass goes '
        // all way up to the top layer and down to the lowest layer
        const number MaxNumberOfAdjacentExchanges = 50;

  Dictionary < number, number > [] outCrossingCount;


  bool HeadOfTheCoin() {
    return random.Next(2) == 0;
  }


  void AdjacentExchangeWithBalancingVirtOrigNodes() {
    InitArrays();
    number count = 0;
    bool progress = true;
    while (progress && count++ < MaxNumberOfAdjacentExchanges) {
      progress = false;
      for (number i = 0; i < layers.Length; i++)
      progress = AdjExchangeLayerWithBalance(i) || progress;
      for (number i = layers.Length - 2; i >= 0; i--)
      progress = AdjExchangeLayerWithBalance(i) || progress;
    }
  }

  void AdjacentExchange() {
    InitArrays();
    number count = 0;
    bool progress = true;
    while (progress && count++ < MaxNumberOfAdjacentExchanges) {
      progress = false;
      for (number i = 0; i < layers.Length; i++)
      progress = AdjExchangeLayer(i) || progress;
      for (number i = layers.Length - 2; i >= 0; i--)
      progress = AdjExchangeLayer(i) || progress;
    }
  }

  void AllocArrays() {
    number n = properLayeredGraph.NodeCount;
    predecessors = new number[n][];
    successors = new number[n][];


    pOrder = new Dictionary < number, number > [n];
    sOrder = new Dictionary < number, number > [n];
    if (hasCrossWeights) {
      outCrossingCount = new Dictionary < number, number > [n];
      inCrossingCount = new Dictionary < number, number > [n];
    }
    for (number i = 0; i < n; i++) {
      number count = properLayeredGraph.InEdgesCount(i);
      predecessors[i] = new number[count];
      if (hasCrossWeights) {
        Dictionary < number, number > inCounts = inCrossingCount[i] = new Dictionary<number, number>(count);
        for(LayerEdge le in properLayeredGraph.InEdges(i))
        inCounts[le.Source] = le.CrossingWeight;
      }
      pOrder[i] = new Dictionary<number, number>(count);
      count = properLayeredGraph.OutEdgesCount(i);
      successors[i] = new number[count];
      sOrder[i] = new Dictionary<number, number>(count);
      if (hasCrossWeights) {
        Dictionary < number, number > outCounts = outCrossingCount[i] = new Dictionary<number, number>(count);
        for(LayerEdge le in properLayeredGraph.OutEdges(i))
        outCounts[le.Target] = le.CrossingWeight;
      }
    }
  }

  // Is called just after median layer swap is done
  void InitArrays() {
    if (successors == null)
      AllocArrays();


    for (number i = 0; i < properLayeredGraph.NodeCount; i++) {
      pOrder[i].Clear();
      sOrder[i].Clear();
    }


    for(number[] t in layers)
    InitPsArraysForLayer(t);
  }


  // calculates the number of intersections between edges adjacent to u and v
  void CalcPair(number u, number v, out number cuv, out number cvu) {
    number[] su = successors[u], sv = successors[v], pu = predecessors[u], pv = predecessors[v];
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

  // Sweep layer from left to right and fill S,P arrays as we go.
  // The arrays P and S will be sorted according to X. Note that we will not keep them sorted
  // as we doing adjacent swaps. Initial sorting only needed to calculate initial clr,crl values.
  void InitPsArraysForLayer(number[] layer) {
    this.ProgressStep();

    for(number l in layer) {
      for(number p in properLayeredGraph.Pred(l)) {
        Dictionary < number, number > so = sOrder[p];
        number sHasNow = so.Count;
        successors[p][sHasNow] = l; //l takes the first available slot in S[p]
        so[l] = sHasNow;
      }
      for(number s in properLayeredGraph.Succ(l)) {
        Dictionary < number, number > po = pOrder[s];
        number pHasNow = po.Count;
        predecessors[s][pHasNow] = l; //l take the first available slot in P[s]
        po[l] = pHasNow;
      }
    }
  }

  number CountOnArrays(number[] unbs, number[] vnbs) {
    number ret = 0;
    number vl = vnbs.Length - 1;
    number j = -1; //the right most position of vnbs to the left from the current u neighbor 
    number vnbsSeenAlready = 0;
    for(number uNeighbor in unbs) {
      number xu = X[uNeighbor];
      for (; j < vl && X[vnbs[j + 1]] < xu; j++)
        vnbsSeenAlready++;
      ret += vnbsSeenAlready;
    }
    return ret;
  }


  // every inversion between unbs and vnbs gives an intersecton
  number CountOnArrays(number[] unbs, number[] vnbs, Dictionary < number, number > uCrossingCounts,
    Dictionary < number, number > vCrossingCount) {
    number ret = 0;
    number vl = vnbs.Length - 1;
    number j = -1; //the right most position of vnbs to the left from the current u neighbor 

    number vCrossingNumberSeenAlready = 0;
    for(number uNeib in unbs) {
      number xu = X[uNeib];
      number vnb;
      for (; j < vl && X[vnb = vnbs[j + 1]] < xu; j++)
        vCrossingNumberSeenAlready += vCrossingCount[vnb];
      ret += vCrossingNumberSeenAlready * uCrossingCounts[uNeib];
    }
    return ret;
  }

  bool AdjExchangeLayer(number i) {
    this.ProgressStep();

    number[] layer = layers[i];
    bool gain = ExchangeWithGainWithNoDisturbance(layer);

    if (gain)
      return true;

    DisturbLayer(layer);

    return ExchangeWithGainWithNoDisturbance(layer);
  }

  bool AdjExchangeLayerWithBalance(number i) {
    this.ProgressStep();
    number[] layer = layers[i];
    bool gain = ExchangeWithGainWithNoDisturbanceWithBalance(layer);

    if (gain)
      return true;

    DisturbLayerWithBalance(layer);

    return ExchangeWithGainWithNoDisturbanceWithBalance(layer);
  }

  //in this routine u and v are adjacent, and u is to the left of v before the swap
  void Swap(number u, number v) {
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

    UpdateSsContainingUv(u, v);

    UpdatePsContainingUv(u, v);
  }

  void UpdatePsContainingUv(number u, number v) {
    if (successors[u].Length <= successors[v].Length)
      for(number a in successors[u]) {
      Dictionary < number, number > porder = pOrder[a];
      //of course porder contains u, let us see if it contains v
      if (porder.ContainsKey(v)) {
        number vOffset = porder[v];
        //swap u and v in the array P[coeff]
        number[] p = predecessors[a];
        p[vOffset - 1] = v;
        p[vOffset] = u;
        //update sorder itself
        porder[v] = vOffset - 1;
        porder[u] = vOffset;
      }
    }
            else
    for(number a in successors[v]) {
      Dictionary < number, number > porder = pOrder[a];
      //of course porder contains u, let us see if it contains v
      if (porder.ContainsKey(u)) {
        number vOffset = porder[v];
        //swap u and v in the array P[coeff]
        number[] p = predecessors[a];
        p[vOffset - 1] = v;
        p[vOffset] = u;
        //update sorder itself
        porder[v] = vOffset - 1;
        porder[u] = vOffset;
      }
    }
  }

  void UpdateSsContainingUv(number u, number v) {
    if (predecessors[u].Length <= predecessors[v].Length)
      for(number a in predecessors[u]) {
      Dictionary < number, number > sorder = sOrder[a];
      //of course sorder contains u, let us see if it contains v
      if (sorder.ContainsKey(v)) {
        number vOffset = sorder[v];
        //swap u and v in the array S[coeff]
        number[] s = successors[a];
        s[vOffset - 1] = v;
        s[vOffset] = u;
        //update sorder itself
        sorder[v] = vOffset - 1;
        sorder[u] = vOffset;
      }
    }
            else
    for(number a in predecessors[v]) {
      Dictionary < number, number > sorder = sOrder[a];
      //of course sorder contains u, let us see if it contains v
      if (sorder.ContainsKey(u)) {
        number vOffset = sorder[v];
        //swap u and v in the array S[coeff]
        number[] s = successors[a];
        s[vOffset - 1] = v;
        s[vOffset] = u;
        //update sorder itself
        sorder[v] = vOffset - 1;
        sorder[u] = vOffset;
      }
    }
  }


  void DisturbLayer(number[] layer) {
    for (number i = 0; i < layer.Length - 1; i++)
    AdjacentSwapToTheRight(layer, i);
  }

  void DisturbLayerWithBalance(number[] layer) {
    for (number i = 0; i < layer.Length - 1; i++)
    AdjacentSwapToTheRightWithBalance(layer, i);
  }

  bool ExchangeWithGainWithNoDisturbance(number[] layer) {
    bool wasGain = false;

    bool gain;
    do {
      gain = ExchangeWithGain(layer);
      wasGain = wasGain || gain;
    } while (gain);

    return wasGain;
  }

  bool ExchangeWithGainWithNoDisturbanceWithBalance(number[] layer) {
    bool wasGain = false;

    bool gain;
    do {
      gain = ExchangeWithGainWithBalance(layer);
      wasGain = wasGain || gain;
    } while (gain);

    return wasGain;
  }

  bool ExchangeWithGain(number[] layer) {
    //find a first pair giving some gain
    for (number i = 0; i < layer.Length - 1; i++)
    if (SwapWithGain(layer[i], layer[i + 1])) {
      SwapToTheLeft(layer, i);
      SwapToTheRight(layer, i + 1);
      return true;
    }

    return false;
  }

  bool ExchangeWithGainWithBalance(number[] layer) {
    //find a first pair giving some gain
    for (number i = 0; i < layer.Length - 1; i++)
    if (SwapWithGainWithBalance(layer[i], layer[i + 1])) {
      SwapToTheLeftWithBalance(layer, i);
      SwapToTheRightWithBalance(layer, i + 1);
      return true;
    }

    return false;
  }

  void SwapToTheLeft(number[] layer, number i) {
    for (number j = i - 1; j >= 0; j--)
    AdjacentSwapToTheRight(layer, j);
  }

  void SwapToTheRight(number[] layer, number i) {
    for (number j = i; j < layer.Length - 1; j++)
    AdjacentSwapToTheRight(layer, j);
  }

  void SwapToTheLeftWithBalance(number[] layer, number i) {
    for (number j = i - 1; j >= 0; j--)
    AdjacentSwapToTheRightWithBalance(layer, j);
  }

  void SwapToTheRightWithBalance(number[] layer, number i) {
    for (number j = i; j < layer.Length - 1; j++)
    AdjacentSwapToTheRightWithBalance(layer, j);
  }

  // swaps i-th element with i+1
  void AdjacentSwapToTheRight(number[] layer, number i) {
    number u = layer[i], v = layer[i + 1];

    number gain = SwapGain(u, v);

    if (gain > 0 || (gain == 0 && HeadOfTheCoin()))
      Swap(u, v);
  }

  void AdjacentSwapToTheRightWithBalance(number[] layer, number i) {
    number u = layer[i], v = layer[i + 1];

    number gain = SwapGainWithBalance(u, v);

    if (gain > 0 || (gain == 0 && HeadOfTheCoin()))
      Swap(u, v);
  }

  number SwapGain(number u, number v) {
    number cuv;
    number cvu;
    CalcPair(u, v, out cuv, out cvu);
    return cuv - cvu;
  }

  number SwapGainWithBalance(number u, number v) {
    number cuv;
    number cvu;
    CalcPair(u, v, out cuv, out cvu);
    number gain = cuv - cvu;
    if (gain != 0 && UvAreOfSameKind(u, v))
      return gain;
    //maybe we gain something in the group sizes
    return SwapGroupGain(u, v);
  }

  bool UvAreOfSameKind(number u, number v) {
    return u < startOfVirtNodes && v < startOfVirtNodes || u >= startOfVirtNodes && v >= startOfVirtNodes;
  }

  number SwapGroupGain(number u, number v) {
    number layerIndex = layerArrays.Y[u];
    number[] layer = layers[layerIndex];

    if (NeighborsForbidTheSwap(u, v))
      return -1;

    number uPosition = X[u];
    bool uIsSeparator;
    if (IsOriginal(u))
      uIsSeparator = optimalOriginalGroupSize[layerIndex] == 1;
    else
      uIsSeparator = optimalVirtualGroupSize[layerIndex] == 1;

    number delta = CalcDeltaBetweenGroupsToTheLeftAndToTheRightOfTheSeparator(layer,
      uIsSeparator
        ? uPosition
        : uPosition + 1,
      uIsSeparator ? u : v);

    if (uIsSeparator) {
      if (delta < -1)
        return 1;
      if (delta == -1)
        return 0;
      return -1;
    }
    if (delta > 1)
      return 1;
    if (delta == 1)
      return 0;
    return -1;
  }

  bool NeighborsForbidTheSwap(number u, number v) {
    return UpperNeighborsForbidTheSwap(u, v) || LowerNeighborsForbidTheSwap(u, v);
  }

  bool LowerNeighborsForbidTheSwap(number u, number v) {
    number uCount, vCount;
    if (((uCount = properLayeredGraph.OutEdgesCount(u)) == 0) ||
      ((vCount = properLayeredGraph.OutEdgesCount(v)) == 0))
      return false;

    return X[successors[u][uCount >> 1]] < X[successors[v][vCount >> 1]];
  }


  bool UpperNeighborsForbidTheSwap(number u, number v) {
    number uCount = properLayeredGraph.InEdgesCount(u);
    number vCount = properLayeredGraph.InEdgesCount(v);
    if (uCount == 0 || vCount == 0)
      return false;

    return X[predecessors[u][uCount >> 1]] < X[predecessors[v][vCount >> 1]];
  }

  number CalcDeltaBetweenGroupsToTheLeftAndToTheRightOfTheSeparator(number[] layer, number separatorPosition, number separator) {
    Func < number, bool > kind = GetKindDelegate(separator);
    number leftGroupSize = 0;
    for (number i = separatorPosition - 1; i >= 0 && !kind(layer[i]); i--)
    leftGroupSize++;
    number rightGroupSize = 0;
    for (number i = separatorPosition + 1; i < layer.Length && !kind(layer[i]); i++)
    rightGroupSize++;

    return leftGroupSize - rightGroupSize;
  }

  bool IsOriginal(number v) {
    return v < startOfVirtNodes;
  }

  bool IsVirtual(number v) {
    return v >= startOfVirtNodes;
  }


  Func < number, bool > GetKindDelegate(number v) {
    Func < number, bool > kind = IsVirtual(v) ? IsVirtual : new Func<number, bool>(IsOriginal);
    return kind;
  }


  // swaps two vertices only if reduces the number of intersections
  bool SwapWithGain(number u, number v) {
    number gain = SwapGain(u, v);

    if (gain > 0) {
      Swap(u, v);
      return true;
    }
    return false;
  }

  bool SwapWithGainWithBalance(number u, number v) {
    number gain = SwapGainWithBalance(u, v);

    if (gain > 0) {
      Swap(u, v);
      return true;
    }
    return false;
  }
}
}
