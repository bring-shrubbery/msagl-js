import {ICurve} from './../../math/geometry/icurve'
import {SmoothedPolyline} from './../../math/geometry/smoothedPolyline'
import {Arrowhead} from './arrowhead'
import {Port} from './port'
export class EdgeGeometry {
  sourcePort: Port
  targetPort: Port
  curve: ICurve
  smoothedPolyline: SmoothedPolyline

  sourceArrowhead: Arrowhead

  targetArrowhead = new Arrowhead()

  lineWidth = 1

  setSmoothedPolylineAndCurve(poly: SmoothedPolyline) {
    this.smoothedPolyline = poly
    this.curve = poly.createCurve()
  }

  /*

   //     Translate all the geometries with absolute positions by the specified delta
   // <

   public void Translate(Point delta) {
     if (delta.x == 0 && delta.y == 0) return;
     RaiseLayoutChangeEvent(delta);
     if (Curve != null)
       Curve.Translate(delta);

     if (SmoothedPolyline != null)
       for (Site s = SmoothedPolyline.HeadSite, s0 = SmoothedPolyline.HeadSite;
         s != null;
     s = s.next, s0 = s0.next)
     s.point = s0.point + delta;

     if (SourceArrowhead != null)
       SourceArrowhead.TipPosition += delta;
     if (TargetArrowhead != null)
       TargetArrowhead.TipPosition += delta;

   }
 */
  GetMaxArrowheadLength(): number {
    let l = 0
    if (this.sourceArrowhead != null) {
      l = this.sourceArrowhead.length
    }

    if (this.targetArrowhead != null && this.targetArrowhead.length > l) {
      return this.targetArrowhead.length
    }

    return l
  }

  /*
         // <
         public event EventHandler < LayoutChangeEventArgs > LayoutChangeEvent;



         // <

         public void RaiseLayoutChangeEvent(object newValue) {
   if (LayoutChangeEvent != null)
     LayoutChangeEvent(this, new LayoutChangeEventArgs{ DataAfterChange = newValue });
 }
     }
 */
}
