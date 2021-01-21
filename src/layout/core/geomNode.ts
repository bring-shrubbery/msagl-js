// A node of a GeomGraph
import {GeomObject} from './geomObject';
import {Assert} from './../../utils/assert';
import {ICurve} from './../../math/geometry/icurve';
import {Rectangle} from './../../math/geometry/rectangle';
import {Point} from './../../math/geometry/point';
import {CurveFactory} from './../../math/geometry/curveFactory';
import {PlaneTransformation} from './../../math/geometry/planeTransformation';
import {GeomEdge as Edge} from './geomEdge';
import {GeomCluster as Cluster} from './geomCluster';
import {from} from 'linq-to-typescript';

export class GeomNode extends GeomObject {
  padding = 1;

  boundaryCurve: ICurve;
  // Creates a Node instance
  mkGeomNode(curve: ICurve, userData: any = null) {
    this.boundaryCurve = curve;
    this.userData = userData;
    this.algorithmData = null;
  }

  // Gets the UserData string if present.
  toString(): string {
    if (this.userData != null) {
      return this.userData.toString();
    }
    return 'geomNode';
  }

  // the list of incoming edges
  inEdges: Set<Edge>;
  // the collection of outcoming edges
  outEdges: Set<Edge>;

  // the list of self edges
  selfEdges: Set<Edge>;

  clusterParent: Cluster;
  *allClusterAncestors(): IterableIterator<Cluster> {
    let parent = this.clusterParent;
    while (parent != null) {
      yield parent;
      parent = parent.clusterParent;
    }
  }

  setClusterParent(parent: Cluster): void {
    Assert.assert(!Object.is(parent, this));
    this.clusterParent = parent;
  }

  removeSelfEdge(edge: Edge) {
    return this.selfEdges.delete(edge);
  }

  // adds and outgoing edge
  addOutEdge(edge: Edge): void {
    Assert.assert(edge.source != edge.target);
    Assert.assert(edge.source == this);
    this.outEdges.add(edge);
  }

  // add an incoming edge
  addInEdge(edge: Edge): void {
    Assert.assert(edge.source != edge.target);
    Assert.assert(edge.target == this);
    this.inEdges.add(edge);
  }
  // adds a self edge
  addSelfEdge(edge: Edge): void {
    Assert.assert(edge.target == this && edge.source == this);
    this.selfEdges.add(edge);
  }

  // enumerates over all edges
  *edges(): IterableIterator<Edge> {
    for (const e of this.outEdges) yield e;
    for (const e of this.inEdges) yield e;
    for (const e of this.selfEdges) yield e;
  }

  // Fields which are set by Msagl
  // return the center of the curve bounding box
  get center() {
    return this.boundaryCurve.boundingBox().center;
  }
  set center(value: Point) {
    const del = value.minus(this.center);
    this.boundaryCurve.translate(del);
  }

  // sets the bounding curve scaled to fit the targetBounds
  fitBoundaryCurveToTarget(targetBounds: Rectangle) {
    if (this.boundaryCurve != null) {
      // RoundedRect is special, rather then simply scaling the geometry we want to keep the corner radii constant
      const radii = CurveFactory.isRoundedRect(this.boundaryCurve);
      if (radii == undefined) {
        Assert.assert(this.boundaryCurve.boundingBox().width > 0);
        Assert.assert(this.boundaryCurve.boundingBox().height > 0);
        const scaleX = targetBounds.width / this.boundaryCurve.boundingBox().width;
        const scaleY = targetBounds.height / this.boundaryCurve.boundingBox().height;

        this.boundaryCurve = this.boundaryCurve.scaleFromOrigin(scaleX, scaleY);
        this.boundaryCurve.translate(targetBounds.center.minus(this.boundaryCurve.boundingBox().center));
      } else {
        this.boundaryCurve = CurveFactory.createRectangleWithRoundedCorners(
          targetBounds.width,
          targetBounds.height,
          radii.radX,
          radii.radY,
          targetBounds.center,
        );
      }
    }
  }

  // the bounding box of the node
  get boundingBox() {
    return this.boundaryCurve != null ? this.boundaryCurve.boundingBox() : Rectangle.mkEmpty();
  }
  set boundingBox(value: Rectangle) {
    if (Math.abs(value.width - this.width) < 0.0001 && Math.abs(value.height - this.height) < 0.0001) {
      this.center = value.center;
    } else {
      this.fitBoundaryCurveToTarget(value);
    }
  }

  // width of the node does not include the padding
  get width() {
    return this.boundaryCurve.boundingBox().width;
  }
  // height of the node does not including the padding
  get height() {
    return this.boundaryCurve.boundingBox().height;
  }

  get degree(): number {
    return this.outEdges.size + this.inEdges.size + this.selfEdges.size;
  }

  // the rest of the fields

  removeInEdge(edge: Edge): boolean {
    return this.inEdges.delete(edge);
  }
  // removes an incoming edge
  removeOutEdge(edge: Edge) {
    return this.outEdges.delete(edge);
  }
  // remove all edges
  clearEdges() {
    this.inEdges.clear();
    this.outEdges.clear();
    this.selfEdges.clear();
  }

  transform(t: PlaneTransformation) {
    if (this.boundaryCurve != null) this.boundaryCurve = this.boundaryCurve.transform(t);
  }

  // Determines if this node is a descendant of the given cluster.
  isDescendantOf(cluster: Cluster) {
    return from(this.allClusterAncestors()).any((p) => p == cluster);
  }

  isUnderCollapsedCluster(): boolean {
    return this.clusterParent != null && this.clusterParent.isCollapsed;
  }
}
