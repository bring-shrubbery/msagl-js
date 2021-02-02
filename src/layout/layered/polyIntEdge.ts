import { IEdge } from './iedge'
// An edge with source and target represented as integers, they point to the array of Nodes of the graph
export class PolyIntEdge implements IEdge {
  source: number

  target: number

  reversed: boolean

  // A dummy edge that will not be drawn; serves just as a place holder.

  isVirtualEdge: boolean
  constructor(source: number, target: number) {
    this.source = source;
    this.target = target;
  }

 
  boolean HasLabel {
  get { return Edge.Label != null; }
}

/// <summary>
/// Label width
/// </summary>
internal double LabelWidth {
  get { return Edge.Label.Width; }
}

/// <summary>
/// Label height
/// </summary>
internal double LabelHeight {
  get { return Edge.Label.Height; }
}

/// <summary>
/// This function changes the edge by swapping 
/// source and target. However Revert(Revert) does not change it.
/// </summary>
internal void Revert() {
  int t = source;
  source = target;
  target = t;
  reversed = !reversed;
#if SHARPKIT //https://code.google.com/p/sharpkit/issues/detail?id=289 Support Dictionary directly based on object's GetHashCode
  UpdateHashKey();
#endif
}

        /// <summary>
        /// The original edge corresponding to the PolyIntEdge
        /// </summary>
        public Edge Edge { get; set; }

/// <summary>
/// constructor
/// </summary>
/// <param name="source"></param>
/// <param name="target"></param>
/// <param name="edge"></param>
internal PolyIntEdge(number source, number target, Edge edge) {
  this.source = source;
  this.target = target;
  Edge = edge;
  if (edge != null) {
    Separation = edge.Separation;
    Weight = edge.Weight;
  }
#if SHARPKIT //https://code.google.com/p/sharpkit/issues/detail?id=289 Support Dictionary directly based on object's GetHashCode
  UpdateHashKey();
#endif
}

        /// <summary>
        /// compares only source and target
        /// </summary>
        /// <param name="obj"></param>
        /// <returns></returns>
        public override boolean Equals(object obj) {
  var ie = obj as PolyIntEdge;
  if (ie == null)
    return false;
  return ie.source == source &&
    ie.target == target;
}

#if SHARPKIT //https://code.google.com/p/sharpkit/issues/detail?id=289 Support Dictionary directly based on object's GetHashCode
        private SharpKit.JavaScript.JsString _hashKey;
        private void UpdateHashKey()
{
  _hashKey = "" + source + "," + target;
}
#endif

        /// <summary>
        /// 
        /// </summary>
        /// <returns></returns>
        public override number GetHashCode() {
  var hc = (uint) source.GetHashCode();
  return (int)((hc << 5 | hc >> 27) + (uint) target);
}

        /// <summary>
        /// 
        /// </summary>
        /// <returns></returns>
        public override string ToString() {
  return "Edge(" + source + "->" + target + ")";
}

internal ICurve Curve {
  get { return Edge.Curve; }
  set { Edge.Curve = value; }
}


[SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
internal SmoothedPolyline UnderlyingPolyline {
  get { return Edge.UnderlyingPolyline; }
  set { Edge.UnderlyingPolyline = value; }
}


number weight = 1;

internal number Weight {
  get { return weight; }
  set { weight = value; }
}

number crossingWeight = 1;

internal number CrossingWeight {
  get { return crossingWeight; }
}

number separation;

        /// <summary>
        /// the distance between the source and the target in the number of layers
        /// </summary>
        public number Separation {
  get { return separation; }
  set { separation = value; }
}

        /// <summary>
        /// the edge span in layers
        /// </summary>
        public number LayerSpan {
  get {
    return layerEdges != null ? layerEdges.Length : 0;
    // return virtualStart == -1 ? 1 : VirtualEnd - VirtualStart + 2;
  }
}


LayerEdge[] layerEdges;
        /// <summary>
        /// 
        /// </summary>
#if TEST_MSAGL
[System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
public
#else
internal
#endif
IList < LayerEdge > LayerEdges {
  get { return layerEdges; }
  set { layerEdges = (LayerEdge[]) value; }
}


internal boolean SelfEdge() {
  return source == target;
}

internal PolyIntEdge ReversedClone() {
  var ret = new PolyIntEdge(target, source, Edge);
  if (layerEdges != null) {
    number len = layerEdges.Length;
    ret.layerEdges = new LayerEdge[len];
    for (number i = 0; i < len; i++) {
      LayerEdge le = layerEdges[len - 1 - i];
      ret.layerEdges[i] = new LayerEdge(le.Target, le.Source, le.CrossingWeight);
    }
    ret.layerEdges[0].Source = target;
    ret.layerEdges[layerEdges.Length - 1].Target = source;
  }
#if SHARPKIT //https://code.google.com/p/sharpkit/issues/detail?id=289 Support Dictionary directly based on object's GetHashCode
  ret.UpdateHashKey();
#endif
  return ret;
}

internal LayerEdge this[number i] {
  get { return layerEdges[i]; }
}

internal number Count {
  get { return layerEdges.Length; }
}


internal void UpdateEdgeLabelPosition(Anchor[] anchors) {
  if (Edge.Label != null) {
    number m = layerEdges.Length / 2;
    LayerEdge layerEdge = layerEdges[m];
    Routing.UpdateLabel(Edge, anchors[layerEdge.Source]);
  }
}

        #region IEnumerable < number > Members

        /// <summary>
        /// enumerates over virtual virtices corresponding to the original edge
        /// </summary>
        /// <returns></returns>
        public IEnumerator < number > GetEnumerator() {
  yield return layerEdges[0].Source;
  foreach(LayerEdge le in layerEdges)
  yield return le.Target;
}

        #endregion

        #region IEnumerable Members

IEnumerator IEnumerable.GetEnumerator() {
  yield return layerEdges[0].Source;
  foreach(LayerEdge le in layerEdges)
  yield return le.Target;
}

        #endregion

/// <summary>
/// The function returns an array arr such that
/// arr is a permutation of the graph vertices,
/// and for any edge e in graph if e.Source=arr[i]
/// e.Target=arr[j], then i is less than j
/// </summary>
/// <param name="graph"></param>
/// <returns></returns>
internal static number[] GetOrder(BasicGraphOnEdges < PolyIntEdge > graph){
  var visited = new boolean[graph.NodeCount];

  //no recursion! So we have to organize a stack
  var sv = new Stack<number>();
  var se = new Stack<IEnumerator<number>>();

  var order = new List<number>();

  IEnumerator < number > en;
  for (number u = 0; u < graph.NodeCount; u++) {
    if (visited[u])
      continue;

    number cu = u;
    visited[cu] = true;
    en = new Succ(graph, u).GetEnumerator();

    do {
      while (en.MoveNext()) {
        number v = en.Current;
        if (!visited[v]) {
          visited[v] = true;
          sv.Push(cu);
          se.Push(en);
          cu = v;
          en = new Succ(graph, cu).GetEnumerator();
        }
      }
      order.Add(cu);


      if (sv.Count > 0) {
        en = se.Pop();
        cu = sv.Pop();
      }
      else
        break;
    } while (true);
  }

  order.Reverse();

  return order.ToArray();
}
}
}
