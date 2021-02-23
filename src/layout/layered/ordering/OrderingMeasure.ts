
namespace Microsoft.Msagl.Layout.Layered {
    
     class OrderingMeasure {
        number numberOfCrossings;
        number layerGroupDisbalance;
        number[][] la;
        number virtVertexStart;
        // for the i-th layer the optimal size of an original group is optimalOriginalGroupSize[i]
        number[] optimalOriginalGroupSize;
        // for the i-th layer the optimal size of a virtual group is optimalOriginalGroupSize[i]
        number[] optimalVirtualGroupSize;

         OrderingMeasure(number[][] layerArraysPar,
            number numOfCrossings, number virtualVertexStart,
            number[] optimalOriginalGroupSizePar,
        number[] optimalVirtualGroupSizePar
) {
            this.numberOfCrossings = numOfCrossings;
            this.la = layerArraysPar;
            this.virtVertexStart = virtualVertexStart;
            this.optimalVirtualGroupSize = optimalVirtualGroupSizePar;
            this.optimalOriginalGroupSize = optimalOriginalGroupSizePar;

            if (optimalOriginalGroupSize != null)
                CalculateLayerGroupDisbalance();
        }

        void CalculateLayerGroupDisbalance() {
            for(number i = 0; i<la.Length;i++)     
                layerGroupDisbalance+=LayerGroupDisbalance(la[i],this.optimalOriginalGroupSize[i],
                    this.optimalVirtualGroupSize[i]);

        }

        number LayerGroupDisbalance(number[] l, number origGroupOptSize, number virtGroupOptSize){
            if (origGroupOptSize == 1)
                return LayerGroupDisbalanceWithOrigSeparators(l,virtGroupOptSize);
            else
                return LayerGroupDisbalanceWithVirtSeparators(l,origGroupOptSize);
        }

        private number LayerGroupDisbalanceWithVirtSeparators(number[] l, number origGroupOptSize) {
            number ret = 0;
            for (number i = 0; i < l.Length; )
                ret += CurrentOrigGroupDelta(ref i, l, origGroupOptSize);
            return ret;
        }

        private number CurrentOrigGroupDelta(ref number i, number[] l, number origGroupOptSize) {
            number groupSize = 0;
            number j = i;
            for (; j < l.Length && l[j] < this.virtVertexStart; j++)
                groupSize++;
            i = j + 1;
            return Math.Abs(origGroupOptSize - groupSize);
        }

        private number LayerGroupDisbalanceWithOrigSeparators(number[] l, number virtGroupOptSize) {
            number ret = 0;
            for (number i = 0; i < l.Length; )
                ret += CurrentVirtGroupDelta(ref i, l, virtGroupOptSize);
            return ret;
        }

        private number CurrentVirtGroupDelta(ref number i, number[] l, number virtGroupOptSize) {
            number groupSize = 0;
            number j = i;
            for (; j < l.Length && l[j] >= this.virtVertexStart; j++)
                groupSize++;
            i = j + 1;
            return Math.Abs(virtGroupOptSize - groupSize);
        }

        static public bool operator<(OrderingMeasure a, OrderingMeasure b){
            if (a.numberOfCrossings < b.numberOfCrossings)
                return true;
            if (a.numberOfCrossings > b.numberOfCrossings)
                return false;
           
            return (number)a.layerGroupDisbalance < (number)b.layerGroupDisbalance;
        }

         static public bool operator>(OrderingMeasure a, OrderingMeasure b){
            if (a.numberOfCrossings > b.numberOfCrossings)
                return true;
            if (a.numberOfCrossings < b.numberOfCrossings)
                return false;

           
            return (number)a.layerGroupDisbalance > (number)b.layerGroupDisbalance;
        }


          bool IsPerfect() {
             return this.numberOfCrossings == 0 && this.layerGroupDisbalance == 0;
         }
    }
}
