import {GeomNode} from './geomNode'
import {EdgeGeometry} from './edgeGeometry'
import {Edge} from './../../structs/edge'
import {GeomObject} from './geomObject'
import {Rectangle} from './../../math/geometry/rectangle'
import {ICurve} from './../../math/geometry/icurve'
import {SmoothedPolyline} from './../../math/geometry/smoothedPolyline'
import {GeomLabel} from './geomLabel'
import {PlaneTransformation} from '../../math/geometry/planeTransformation'

export class GeomEdge extends GeomObject {
  transform(matrix: PlaneTransformation) {
    if (this.curve == null) return
    this.curve = this.curve.transform(matrix)
    if (this.underlyingPolyline != null)
      for (
        let s = this.underlyingPolyline.headSite,
          s0 = this.underlyingPolyline.headSite;
        s != null;
        s = s.next, s0 = s0.next
      )
        s.point = matrix.multiplyPoint(s.point)

    const sourceArrow = this.edgeGeometry.sourceArrowhead
    if (sourceArrow != null)
      sourceArrow.tipPosition = matrix.multiplyPoint(sourceArrow.tipPosition)
    const targetArrow = this.edgeGeometry.targetArrowhead
    if (targetArrow != null)
      targetArrow.tipPosition = matrix.multiplyPoint(targetArrow.tipPosition)

    if (this.label != null)
      this.label.center = matrix.multiplyPoint(this.label.center)
  }
  underlyingPolyline: SmoothedPolyline
  edgeGeometry = new EdgeGeometry()
  label: GeomLabel
  get labelBBox() {
    return this.label.boundingBox
  }
  get edge(): Edge {
    return this.attrCont as Edge
  }
  get source(): GeomNode {
    return GeomObject.getGeom(this.edge.source) as GeomNode
  }

  get boundingBox(): Rectangle {
    const rect = Rectangle.mkEmpty()
    if (this.underlyingPolyline != null)
      for (const p of this.underlyingPolyline.points()) rect.add(p)

    if (this.curve != null) rect.addRec(this.curve.boundingBox)

    if (this.edgeGeometry != null) {
      if (this.edgeGeometry.sourceArrowhead != null)
        rect.add(this.edgeGeometry.sourceArrowhead.tipPosition)
      if (this.edgeGeometry.targetArrowhead != null)
        rect.add(this.edgeGeometry.targetArrowhead.tipPosition)
    }
    if (this.edge.label) {
      rect.addRec(this.label.boundingBox)
    }

    const del = this.lineWidth
    rect.left -= del
    rect.top += del
    rect.right += del
    rect.bottom -= del
    return rect
  }

  isInterGraphEdge(): boolean {
    return this.edge.isInterGraphEdge()
  }

  get lineWidth() {
    return this.edgeGeometry.lineWidth
  }

  get target(): GeomNode {
    return GeomObject.getGeom(this.edge.target) as GeomNode
  }

  constructor(edge: Edge) {
    super(edge)
  }
  toString() {
    return this.source.toString() + '->' + this.target
  }
  // <summary>
  // The bounding box of the edge curve
  // </summary>
  /*
    public override Rectangle BoundingBox {
    get {
   
      var rect = Rectangle.CreateAnEmptyBox();
      if (UnderlyingPolyline != null)
        foreach(Point p of UnderlyingPolyline)
      rect.Add(p);
   
      if (Curve != null)
        rect.Add(Curve.BoundingBox);
   
      if (this.edgeGeometry != null) {
        if (this.edgeGeometry.sourceArrowhead != null)
          rect.Add(this.edgeGeometry.sourceArrowhead.tipPosition);
        if (this.edgeGeometry.targetArrowhead != null)
          rect.Add(this.edgeGeometry.targetArrowhead.tipPosition);
      }
   
      double del = LineWidth;
      rect.Left -= del;
      rect.top += del;
      rect.Right += del;
      rect.bottom -= del;
      return rect;
    }
    set { throw new NotImplementedException(); }
  }
   
  */

  /*
          // <summary>
          // the polyline of the untrimmed spline
          // </summary>
          public SmoothedPolyline UnderlyingPolyline {
    get { return edgeGeometry.SmoothedPolyline; }
    set { edgeGeometry.SmoothedPolyline = value; }
  }
   
  */
  // A curve representing the edge
  get curve(): ICurve {
    return this.edgeGeometry != null ? this.edgeGeometry.curve : null
  }
  set curve(value: ICurve) {
    this.edgeGeometry.curve = value
  }

  /*  
    // <summary>
    // Transform the curve, arrowheads and label according to the given matrix
    // </summary>
    // <param name="matrix">affine transform matrix</param>
    internal void Transform(PlaneTransformation matrix)
    {
      if (Curve == null)
        return;
      Curve = Curve.Transform(matrix);
      if (UnderlyingPolyline != null)
        for (Site s = UnderlyingPolyline.HeadSite, s0 = UnderlyingPolyline.HeadSite;
          s != null;
      s = s.next, s0 = s0.next)
      s.point = matrix * s.point;
    
      var sourceArrow = edgeGeometry.sourceArrowhead;
      if (sourceArrow != null)
        sourceArrow.tipPosition = matrix * sourceArrow.tipPosition;
      var targetArrow = edgeGeometry.targetArrowhead;
      if (targetArrow != null)
        targetArrow.tipPosition = matrix * targetArrow.tipPosition;
    
      if (Label != null)
        Label.Center = matrix * LabelBBox.Center;
    }
    
            // <summary>
            // Translate the edge curve arrowheads and label by the specified delta
            // </summary>
            // <param name="delta">amount to shift geometry</param>
            public void Translate(Point delta)
    {
      if (this.this.edgeGeometry != null) {
        this.this.edgeGeometry.Translate(delta);
      }
      foreach(var l of this.Labels)
      {
        l.Translate(delta);
      }
    }
    
                    // <summary>
                    // transforms relative to given rectangles
                    // </summary>
                    public void TransformRelativeTo(Rectangle oldBounds, Rectangle newBounds)
    {
      if (this.edgeGeometry != null) {
        var toOrigin = new PlaneTransformation(1, 0, -oldBounds.Left, 0, 1, -oldBounds.bottom);
        var scale = new PlaneTransformation(newBounds.Width / oldBounds.Width, 0, 0,
          0, newBounds.Height / oldBounds.Height, 0);
        var toNewBounds = new PlaneTransformation(1, 0, newBounds.Left, 0, 1, newBounds.bottom);
        Transform(toNewBounds * scale * toOrigin);
      }
      foreach(var l of this.Labels)
      {
        l.Translate(newBounds.leftBottom - oldBounds.leftBottom);
      }
    }
    
            // <summary>
            // Checks if an arrowhead is needed at the source
            // </summary>
            public bool ArrowheadAtSource
    {
      get
      {
        return this.edgeGeometry != null && this.edgeGeometry.sourceArrowhead != null;
      }
    }
    
            // <summary>
            // Checks if an arrowhead is needed at the target
            // </summary>
            public bool ArrowheadAtTarget
    {
      get
      {
        return this.edgeGeometry != null && this.edgeGeometry.targetArrowhead != null;
      }
    }
    
            // <summary>
            // Routes a self edge inside the given "howMuchToStickOut" parameter
            // </summary>
            // <param name="boundaryCurve"></param>
            // <param name="howMuchToStickOut"></param>
            // <param name="smoothedPolyline"> the underlying polyline used later for editing</param>
            // <returns></returns>
            static internal ICurve RouteSelfEdge(ICurve boundaryCurve, double howMuchToStickOut, out SmoothedPolyline smoothedPolyline)
    {
      //we just need to find the box of the corresponding node
      var w = boundaryCurve.BoundingBox.Width;
      var h = boundaryCurve.BoundingBox.Height;
      var center = boundaryCurve.BoundingBox.Center;
    
      var p0 = new Point(center.x - w / 4, center.y);
      var p1 = new Point(center.x - w / 4, center.y - h / 2 - howMuchToStickOut);
      var p2 = new Point(center.x + w / 4, center.y - h / 2 - howMuchToStickOut);
      var p3 = new Point(center.x + w / 4, center.y);
    
      smoothedPolyline = SmoothedPolyline.FromPoints(new [] { p0, p1, p2, p3 });
    
      return smoothedPolyline.CreateCurve();
    }
    
            // <summary>
            //
            // </summary>
            // <param name="newValue"></param>
            public override void RaiseLayoutChangeEvent(object newValue) {
      edgeGeometry.RaiseLayoutChangeEvent(newValue);
    }
    
    
            // <summary>
            //
            // </summary>
            public override event EventHandler < LayoutChangeEventArgs > BeforeLayoutChangeEvent {
      add { edgeGeometry.LayoutChangeEvent += value; }
      remove { edgeGeometry.LayoutChangeEvent -= value; }
    }
  */
  underCollapsedCluster(): boolean {
    return (
      this.source.underCollapsedCluster() || this.target.underCollapsedCluster()
    )
  }
}
