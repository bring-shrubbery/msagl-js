class BasicReflectionEvent extends SweepEvent {
  get ReflectingObstacle(): Obstacle {}
  set ReflectingObstacle(value: Obstacle) {}

  get InitialObstacle(): Obstacle {}
  set InitialObstacle(value: Obstacle) {}

  get PreviousSite(): BasicReflectionEvent {}
  set PreviousSite(value: BasicReflectionEvent) {}

  //  Called by StoreLookaheadSite only.
  constructor(
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
  constructor(
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
  IsStaircaseStep(reflectionTarget: Obstacle): boolean {
    return this.InitialObstacle == reflectionTarget
  }

  private site: Point

  /* override */ get Site(): Point {
    return this.site
  }
}
