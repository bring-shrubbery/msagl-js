import {Point} from './point'
export class Site {
  // the coeffiecient used to calculate the first and the second control points of the
  // Bezier segment for the fillet at the site
  previouisBezierCoefficient = 0.5
  // the coeffiecient used to calculate the third and the fourth control points of the
  // Bezier segment for the fillet at the site
  nextBezierCoefficient = 0.5

  // the coefficient tells how tight the segment fits to the segment after the site; the formula is kNext * c + (1 - kNext) * b
  /// </summary>
  previousTangentCoefficient: number = 1.0 / 3

  nextTangentCoefficient: number = 1.0 / 3
  point: Point

  prev: Site

  next: Site
  static mkSiteP(sitePoint: Point): Site {
    const s = new Site()
    s.point = sitePoint
    return s
  }

  static mkSiteSP(previousSite: Site, sitePoint: Point): Site {
    const s = new Site()
    s.point = sitePoint
    s.prev = previousSite
    previousSite.next = s
    return s
  }
  /// <param name="previousSite"></param>
  /// <param name="sitePoint"></param>
  /// <param name="nextSite"></param>
  static mkSiteSPS(previousSite: Site, sitePoint: Point, nextSite: Site): Site {
    const s = new Site()
    s.prev = previousSite
    s.point = sitePoint
    s.next = nextSite

    previousSite.next = s
    nextSite.prev = s
    return s
  }

  get turn(): number {
    if (this.next == null || this.prev == null) return 0
    return Point.signedDoubledTriangleArea(
      this.prev.point,
      this.point,
      this.next.point,
    )
  }

  clone(): Site {
    const s = new Site()
    s.previouisBezierCoefficient = this.previouisBezierCoefficient
    s.point = this.point
    return s
  }
}
