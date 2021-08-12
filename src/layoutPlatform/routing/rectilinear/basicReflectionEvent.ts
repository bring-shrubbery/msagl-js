import {SweepEvent} from '../spline/coneSpanner/SweepEvent'

export class BasicReflectionEvent extends SweepEvent {
  ReflectingObstacle: Obstacle

  InitialObstacle: Obstacle

  PreviousSite: BasicReflectionEvent

  //  Called by StoreLookaheadSite only.
  private /* internal */ constructor(
    initialObstacle: Obstacle,
    reflectingObstacle: Obstacle,
    site: Point,
  ) {
    this.InitialObstacle = initialObstacle
    this.ReflectingObstacle = reflectingObstacle
    this.site = site
  }

  //  Called by LowReflectionEvent or HighReflectionEvent ctors, which are called out of
  //  AddReflectionEvent, which in turn is called by LoadLookaheadIntersections.
  //  In this case we know the eventObstacle and initialObstacle are the same obstacle (the
  //  one that the reflected ray bounced off of, to generate the Left/HighReflectionEvent).
  private /* internal */ constructor(
    previousSite: BasicReflectionEvent,
    reflectingObstacle: Obstacle,
    site: Point,
  ) {
    this.InitialObstacle = previousSite.ReflectingObstacle
    this.ReflectingObstacle = reflectingObstacle
    this.site = site
    this.PreviousSite = previousSite
  }

  //  If true, we have a staircase situation.
  private /* internal */ IsStaircaseStep(reflectionTarget: Obstacle): boolean {
    return this.InitialObstacle == reflectionTarget
  }

  private site: Point

  private get /* internal */ /* override */ Site(): Point {
    return this.site
  }
}
