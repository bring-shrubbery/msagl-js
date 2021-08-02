import {from, IEnumerable} from 'linq-to-typescript'
import {Queue} from 'queue-typescript'
import {Port} from '../../../layoutPlatform/layout/core/port'
import {ICurve} from '../../../layoutPlatform/math/geometry/icurve'
import {Rectangle} from '../../../layoutPlatform/math/geometry/rectangle'
import {constructor} from '../../../layoutPlatform/routing/ConstrainedDelaunayTriangulation/ThreeArray'

export class Shape {
  parents: Set<Shape> = new Set<Shape>()

  
  ///  shape parents
  
  public get Parents(): IEnumerable<Shape> {
    return from(this.parents.values())
  }

  children: Set<Shape> = new Set<Shape>()

  ///  <summary>
  ///  shape children
  ///  </summary>
  public get Children(): IEnumerable<Shape> {
    return from(this.children.values())
  }

  get BoundaryCurve(): ICurve {
    return this.boundaryCurve
  }
  set BoundaryCurve(value: ICurve) {
    this.boundaryCurve = value
  }

  boundaryCurve: ICurve

  ///  <summary>
  ///  The bounding box of the shape.
  ///  </summary>
  public get BoundingBox(): Rectangle {
    return this.BoundaryCurve.boundingBox
  }

  ///  <summary>
  ///  The set of Ports for this obstacle, usually RelativePorts.  In the event of overlapping
  ///  obstacles, this identifies the obstacle to which the port applies.
  ///  </summary>
  public get Ports(): Set<Port> {
    return this.ports
  }

  private ports: Set<Port> = new Set<Port>()

  ///  <summary>
  ///  A location for storing user data associated with the Shape.
  ///  </summary>
  UserData: any

  ///  <summary>
  ///  Default constructor.
  ///  </summary>
  static mkShope(): Shape {
    return new Shape(null)
  }

  ///  <summary>
  ///  Constructor taking the ID and the curve of the shape.
  ///  </summary>
  ///  <param name="boundaryCurve"></param>
  public constructor(boundaryCurve: ICurve) {
    this.boundaryCurve = boundaryCurve
  }

  ///  <summary>
  ///  A group is a shape that has children.
  ///  </summary>
  public get IsGroup(): boolean {
    return this.children.size > 0
  }

  IsTransparent: boolean;

  *Descendants(): IterableIterator<Shape> {
    const q = new Queue<Shape>()
    for (const shape of this.Children) {
      q.enqueue(shape)
    }

    while (q.length > 0) {
      const sh = q.dequeue()
      yield sh
      for (const shape of sh.Children) {
        q.enqueue(shape)
      }
    }
  }

  *Ancestors(): IterableIterator<Shape> {
    const q = new Queue<Shape>()
    for (const shape of this.Parents) {
      q.enqueue(shape)
    }

    while (q.length > 0) {
      const sh = q.dequeue()
      yield
      return sh
      for (const shape of sh.Parents) {
        q.enqueue(shape)
      }
    }
  }

  
  ///  Adds a parent. A shape can have several parents
  
  /// <param name="shape"></param>
  public AddParent(shape: Shape) {
    this.parents.add(shape)
    shape.children.add(this)
  }

  
  
  /// <param name="shape"></param>
  public AddChild(shape: Shape) {
    shape.parents.add(this)
    this.children.add(shape)
  }

  ///  <summary>
  ///
  ///  </summary>
  ///  <param name="shape"></param>
  public RemoveChild(shape: Shape) {
    this.children.delete(shape)
    shape.parents.delete(this)
  }

  ///  <summary>
  ///
  ///  </summary>
  ///  <param name="shape"></param>
  public RemoveParent(shape: Shape) {
    this.parents.delete(shape)
    shape.children.delete(this)
  }

  ///  <summary>
  ///
  ///  </summary>
  ///  <returns></returns>
  public ToString(): string {
    return this.UserData ? this.UserData.toString() : 'null'
  }
}
