import {ICurve} from './../../math/geometry/icurve'
import {SmoothedPolyline} from './../../math/geometry/smoothedPolyline'
import {Arrowhead} from './arrowhead'
export class EdgeGeometry {
  curve: ICurve
  smoothedPolyline: SmoothedPolyline

  sourceArrowhead: Arrowhead

  targetArrowhead: Arrowhead

  lineWidth: number

  setSmoothedPolylineAndCurve(poly: SmoothedPolyline) {
    this.smoothedPolyline = poly
    this.curve = poly.createCurve()
  }

  /* 
   /// <summary>
   ///     Translate all the geometries with absolute positions by the specified delta
   /// </summary>
   /// <param name="delta">vector by which to translate</param>
   public void Translate(Point delta) {
     if (delta.X == 0 && delta.Y == 0) return;
     RaiseLayoutChangeEvent(delta);
     if (Curve != null)
       Curve.Translate(delta);
 
     if (SmoothedPolyline != null)
       for (Site s = SmoothedPolyline.HeadSite, s0 = SmoothedPolyline.HeadSite;
         s != null;
     s = s.Next, s0 = s0.Next)
     s.Point = s0.Point + delta;
 
     if (SourceArrowhead != null)
       SourceArrowhead.TipPosition += delta;
     if (TargetArrowhead != null)
       TargetArrowhead.TipPosition += delta;
 
   }
 
   internal number GetMaxArrowheadLength() {
   number l = 0;
   if (SourceArrowhead != null)
     l = SourceArrowhead.Length;
   if (TargetArrowhead != null && TargetArrowhead.Length > l)
     return TargetArrowhead.Length;
   return l;
 }
 
 
         /// <summary>
         /// </summary>
         public event EventHandler < LayoutChangeEventArgs > LayoutChangeEvent;
 
 
         /// <summary>
         /// </summary>
         /// <param name="newValue"></param>
         public void RaiseLayoutChangeEvent(object newValue) {
   if (LayoutChangeEvent != null)
     LayoutChangeEvent(this, new LayoutChangeEventArgs{ DataAfterChange = newValue });
 }
     }
 */
}
