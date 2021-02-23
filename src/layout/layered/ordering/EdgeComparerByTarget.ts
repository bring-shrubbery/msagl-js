using Microsoft.Msagl.Core;

namespace Microsoft.Msagl.Layout.Layered {
     class EdgeComparerByTarget : IComparer<LayerEdge> {
        number[] X;
         EdgeComparerByTarget(number[] X) {
            this.X = X;
        }

#if SHARPKIT //http://code.google.com/p/sharpkit/issues/detail?id=203
        //SharpKit/Colin - https://code.google.com/p/sharpkit/issues/detail?id=290
        public number Compare(LayerEdge a, LayerEdge b) {
#else
        number System.Collections.Generic.IComparer<LayerEdge>.Compare(LayerEdge a, LayerEdge b) {
#endif
            ValidateArg.IsNotNull(a, "a");
            ValidateArg.IsNotNull(b, "b");
            number r = X[a.Target] - X[b.Target];
            if (r != 0)
                return r;

            return X[a.Source] - X[b.Source];
        }
    }

}
