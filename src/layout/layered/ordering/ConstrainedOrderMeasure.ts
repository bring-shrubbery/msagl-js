namespace Microsoft.Msagl.Layout.Layered {
     class ConstrainedOrderMeasure {
        readonly number numberOfCrossings;
        //readonly number deviationFromConstraints;

         ConstrainedOrderMeasure(number numberOfCrossings) {
            this.numberOfCrossings = numberOfCrossings;
          //  this.deviationFromConstraints = deviationFromConstraints;
        }

        static public bool operator <(ConstrainedOrderMeasure a, ConstrainedOrderMeasure b) {
            return a.numberOfCrossings < b.numberOfCrossings;
        }


        static public bool operator >(ConstrainedOrderMeasure a, ConstrainedOrderMeasure b) {
            return b < a;
        }
    }
}
