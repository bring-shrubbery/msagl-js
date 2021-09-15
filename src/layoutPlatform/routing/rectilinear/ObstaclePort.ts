import {Point, Rectangle, ICurve} from '../../..'
import {Port} from '../../layout/core/port'
import {Direction} from '../../math/geometry/direction'
import {GeomConstants} from '../../math/geometry/geomConstants'
import {VisibilityVertex} from '../visibility/VisibilityVertex'
import {Obstacle} from './obstacle'
import {ObstaclePortEntrance} from './ObstaclePortEntrance'
import {ObstacleTree} from './ObstacleTree'
import {TransientGraphUtility} from './TransientGraphUtility'

export class ObstaclePort {
  Port: Port
  Obstacle: Obstacle
  CenterVertex: VisibilityVertex

  //  These are derived from PortEntry spans if present, else from Port.Location.
  PortEntrances: Array<ObstaclePortEntrance>

  HasCollinearEntrances = false

  //  Hang onto this separately to detect port movement.
  Location: Point

  VisibilityRectangle: Rectangle = Rectangle.mkEmpty()

  constructor(port: Port, obstacle: Obstacle) {
    this.Port = port
    this.Obstacle = obstacle
    this.PortEntrances = new Array<ObstaclePortEntrance>()
    this.Location = GeomConstants.RoundPoint(this.Port.Location)
  }

  CreatePortEntrance(
    unpaddedBorderIntersect: Point,
    outDir: Direction,
    obstacleTree: ObstacleTree,
  ) {
    const entrance = new ObstaclePortEntrance(
      this,
      unpaddedBorderIntersect,
      outDir,
      obstacleTree,
    )
    this.PortEntrances.push(entrance)
    this.VisibilityRectangle.add(entrance.MaxVisibilitySegment.end)
    this.HasCollinearEntrances =
      this.HasCollinearEntrances || entrance.IsCollinearWithPort
  }

  ClearVisibility() {
    //  Most of the retained PortEntrance stuff is about precalculated visibility.
    this.PortEntrances = []
  }

  AddToGraph(transUtil: TransientGraphUtility, routeToCenter: boolean) {
    //  We use only border vertices if !routeToCenter.
    if (routeToCenter) {
      this.CenterVertex = transUtil.FindOrAddVertex(this.Location)
    }
  }

  RemoveFromGraph() {
    //  Currently all transient removals and edge restorations are done by TransientGraphUtility itself.
    for (const entrance of this.PortEntrances) {
      entrance.RemoveFromGraph()
    }

    this.CenterVertex = null
  }

  //  PortManager will recreate the Port if it detects this (this.Location has already been rounded).
  get LocationHasChanged(): boolean {
    return !Point.closeDistEps(
      this.Location,
      GeomConstants.RoundPoint(this.Port.Location),
    )
  }

  ///  <summary>
  ///  The curve associated with the port.
  ///  </summary>
  public get PortCurve(): ICurve {
    return this.Port.Curve
  }

  ///  <summary>
  ///  The (unrounded) location of the port.
  ///  </summary>
  public get PortLocation(): Point {
    return this.Port.Location
  }

  ///  <summary>
  ///  </summary>
  ///  <returns></returns>
  toString(): string {
    return this.Port + this.Obstacle.toString()
  }
}
