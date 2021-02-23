using Microsoft.Msagl.Core.DataStructures;

namespace Microsoft.Msagl.Layout.Layered {
     class LayerInfo {
        // constrained on the level of neighBlocks
         Set<Tuple<number, number>> leftRight = new Set<Tuple<number, number>>();
         Set<Tuple<number, number>> flatEdges = new Set<Tuple<number, number>>();
         Dictionary<number, List<number>> neigBlocks = new Dictionary<number, List<number>>();
         Dictionary<number, number> constrainedFromAbove = new Dictionary<number, number>();
         Dictionary<number, number> constrainedFromBelow = new Dictionary<number, number>();
         Dictionary<number, number> nodeToBlockRoot = new Dictionary<number, number>();
        // if the block contains a fixed node v,  it can be only one because of the monotone paths feature,
        // then blockToFixedNodeOfBlock[block]=v
        
         Dictionary<number, number> blockRootToVertConstrainedNodeOfBlock = new Dictionary<number, number>();
    }
}
