import { IEnumerable } from "linq-to-typescript";
import { ConvexHull } from "../../../../layoutPlatform/math/geometry/convexHull";
import { Curve, PointLocation } from "../../../../layoutPlatform/math/geometry/curve";
import { DebugCurve } from "../../../../layoutPlatform/math/geometry/debugCurve";
import { Point } from "../../../../layoutPlatform/math/geometry/point";
import { Polyline } from "../../../../layoutPlatform/math/geometry/polyline";
import { SvgDebugWriter } from "../../../../layoutPlatform/math/geometry/svgDebugWriter";




  test('repeated points', ()=> {
    const expected = [
      new Point(0, 0),
      new Point(10, 0),
      new Point(10, 10),
      new Point(0, 10),
    ]

    let points = new Array<Point>();
    for (let i: number = 0; (i < 20); i++) {
      for (const p of expected)
          points.push(p)
    }

    let actual = Array.from(ConvexHull.CalculateConvexHull(points))
    expect(actual.length).toBe(4)
    for (const p of expected) {
        expect(points.findIndex(t=>t.equal(p)) >= 0).toBe(true)
    }

  })

  test('testConvexHull1', ()=> {
    let points = [
      new Point(2.37997, 1.680394),
      new Point(-0.527835, 9.134165),
      new Point(0.281398, 10.545642),
      new Point(10.098738, 16.060836),
      new Point(11.489047, 16.387183),
      new Point(19.476612, 16.292199),
      new Point(20.522959, 13.307952),
      new Point(18.232532, 5.659001),
      new Point(6.040618, -1.189735),
      new Point(18.608074, -2.188965),
      new Point(18.869482, 27.256956),
      new Point(21.49004, 29.877514),
      new Point(25.196069, 29.877514),
      new Point(35.960054, 20.134587),
      new Point(38.600742, 9.253306),
      new Point(39.666216, 3.98651),
      new Point(39.527496, 0.356043),
      new Point(37.195498, -0.761055),
      new Point(26.449923, -4.887396),
      new Point(2.37997, 1.680394),
      new Point(-0.527835, 9.134165),
      new Point(0.281398, 10.545642),
      new Point(10.098738, 16.060836),
      new Point(11.489047, 16.387183),
      new Point(19.476612, 16.292199),
      new Point(20.522959, 13.307952),
      new Point(18.232532, 5.659001),
      new Point(6.040618, -1.189735),
      new Point(2.37997, 1.680394),
      new Point(-0.527835, 9.134165),
      new Point(0.281398, 10.545642),
      new Point(10.098738, 16.060836),
      new Point(11.489047, 16.387183),
      new Point(19.476612, 16.292199),
      new Point(20.522959, 13.307952),
      new Point(18.232532, 5.659001),
      new Point(6.040618, -1.189735),
      new Point(2.37997, 1.680394),
      new Point(-0.527835, 9.134165),
      new Point(0.281398, 10.545642),
      new Point(10.098738, 16.060836),
      new Point(11.489047, 16.387183),
      new Point(19.476612, 16.292199),
      new Point(20.522959, 13.307952),
      new Point(18.232532, 5.659001),
      new Point(6.040618, -1.189735),
      new Point(2.37997, 1.680394),
      new Point(-0.527835, 9.134165),
      new Point(0.281398, 10.545642),
      new Point(10.098738, 16.060836),
      new Point(11.489047, 16.387183),
      new Point(19.476612, 16.292199),
      new Point(20.522959, 13.307952),
      new Point(18.232532, 5.659001),
      new Point(6.040618, -1.189735),
      new Point(18.608074, -2.188965),
      new Point(18.869482, 27.256956),
      new Point(21.49004, 29.877514),
      new Point(25.196069, 29.877514),
      new Point(35.960054, 20.134587),
      new Point(38.600742, 9.253306),
      new Point(39.666216, 3.98651),
      new Point(39.527496, 0.356043),
      new Point(37.195498, -0.761055),
      new Point(26.449923, -4.887396),
      new Point(18.608074, -2.188965),
      new Point(18.869482, 27.256956),
      new Point(21.49004, 29.877514),
      new Point(25.196069, 29.877514),
      new Point(35.960054, 20.134587),
      new Point(38.600742, 9.253306),
      new Point(39.666216, 3.98651),
      new Point(39.527496, 0.356043),
      new Point(37.195498, -0.761055),
      new Point(26.449923, -4.887396),
      new Point(18.608074, -2.188965),
      new Point(18.869482, 27.256956),
      new Point(21.49004, 29.877514),
      new Point(25.196069, 29.877514),
      new Point(35.960054, 20.134587),
      new Point(38.600742, 9.253306),
      new Point(39.666216, 3.98651),
      new Point(39.527496, 0.356043),
      new Point(37.195498, -0.761055),
      new Point(26.449923, -4.887396),
      new Point(18.608074, -2.188965),
      new Point(18.869482, 27.256956),
      new Point(21.49004, 29.877514),
      new Point(25.196069, 29.877514),
      new Point(35.960054, 20.134587),
      new Point(38.600742, 9.253306),
      new Point(39.666216, 3.98651),
      new Point(39.527496, 0.356043),
      new Point(37.195498, -0.761055),
      new Point(26.449923, -4.887396),
      new Point(18.608074, -2.188965),
      new Point(18.869482, 27.256956),
      new Point(21.49004, 29.877514),
      new Point(25.196069, 29.877514),
      new Point(35.960054, 20.134587),
      new Point(38.600742, 9.253306),
      new Point(39.666216, 3.98651),
      new Point(39.527496, 0.356043),
      new Point(37.195498, -0.761055),
      new Point(26.449923, -4.887396),
      new Point(18.608074, -2.188965),
      new Point(18.869482, 27.256956),
      new Point(21.49004, 29.877514),
      new Point(25.196069, 29.877514),
      new Point(35.960054, 20.134587),
      new Point(38.600742, 9.253306),
      new Point(39.666216, 3.98651),
      new Point(39.527496, 0.356043),
      new Point(37.195498, -0.761055),
      new Point(26.449923, -4.887396),
      new Point(18.608074, -2.188965),
      new Point(18.869482, 27.256956),
      new Point(21.49004, 29.877514),
      new Point(25.196069, 29.877514),
      new Point(35.960054, 20.134587),
      new Point(38.600742, 9.253306),
      new Point(39.666216, 3.98651),
      new Point(39.527496, 0.356043),
      new Point(37.195498, -0.761055),
      new Point(26.449923, -4.887396),
      new Point(15.440365, 27.281786),
      new Point(19.424634, 19.99807),
      new Point(14.406863, 17.253297),
      new Point(10.422595, 24.537014)]

      VerifyAndDisplayConvexHull(points, 'convextest1');
  })

  test('TestConvexHull2', () =>{
    let points = [
      new Point(26.44995, -4.887702),
      new Point(2.114632, -4.440962),
      new Point(-0.528156, 9.134172),
      new Point(-0.556468, 68.265599),
      new Point(-0.556468, 72.011187),
      new Point(6.640957, 87.981148),
      new Point(8.42716, 90.443018),
      new Point(12.533072, 91.816193),
      new Point(22.244099, 93.112914),
      new Point(22.244147, 93.112917),
      new Point(44.94153, 94.198307),
      new Point(44.941535, 94.198307),
      new Point(85.226131, 93.564001),
      new Point(87.272998, 92.16606),
      new Point(95.068903, 83.487398),
      new Point(94.460938, 36.116782),
      new Point(90.208883, 15.854088),
      new Point(85.968829, 11.297508),
      new Point(74.551407, 2.342174),
      new Point(26.449959, -4.887702),
      new Point(26.449957, -4.887802),
      new Point(2.114632, -4.440962),
      new Point(-0.528246, 9.134134),
      new Point(-0.556568, 68.265599),
      new Point(-0.556568, 72.011208),
      new Point(6.64087, 87.981198),
      new Point(8.427098, 90.443103),
      new Point(12.533049, 91.816291),
      new Point(22.244138, 93.113017),
      new Point(44.941555, 94.198404),
      new Point(85.226163, 93.564101),
      new Point(87.273064, 92.166136),
      new Point(95.069003, 83.487436),
      new Point(94.461038, 36.116771),
      new Point(90.208975, 15.85404),
      new Point(85.968897, 11.297434),
      new Point(74.551448, 2.342079),
    ]
    VerifyAndDisplayConvexHull(points, 'convextest2');
  }
  )
  test ('TestConvexHull3', () =>{
    let points = [
      new Point(2.37997, 1.680394),
      new Point(-0.527835, 9.134165),
      new Point(0.281398, 10.545642),
      new Point(10.098738, 16.060836),
      new Point(11.489047, 16.387183),
      new Point(19.476612, 16.292199),
      new Point(20.522959, 13.307952),
      new Point(18.232532, 5.659001),
      new Point(6.040618, -1.189735),
      new Point(18.608074, -2.188965),
      new Point(18.869482, 27.256956),
      new Point(21.49004, 29.877514),
      new Point(25.196069, 29.877514),
      new Point(35.960054, 20.134587),
      new Point(38.600742, 9.253306),
      new Point(39.666216, 3.98651),
      new Point(39.527496, 0.356043),
      new Point(37.195498, -0.761055),
      new Point(26.449923, -4.887396),
      new Point(2.37997, 1.680394),
      new Point(-0.527835, 9.134165),
      new Point(0.281398, 10.545642),
      new Point(10.098738, 16.060836),
      new Point(11.489047, 16.387183),
      new Point(19.476612, 16.292199),
      new Point(20.522959, 13.307952),
      new Point(18.232532, 5.659001),
      new Point(6.040618, -1.189735),
      new Point(2.37997, 1.680394),
      new Point(-0.527835, 9.134165),
      new Point(0.281398, 10.545642),
      new Point(10.098738, 16.060836),
      new Point(11.489047, 16.387183),
      new Point(19.476612, 16.292199),
      new Point(20.522959, 13.307952),
      new Point(18.232532, 5.659001),
      new Point(6.040618, -1.189735),
      new Point(2.37997, 1.680394),
      new Point(-0.527835, 9.134165),
      new Point(0.281398, 10.545642),
      new Point(10.098738, 16.060836),
      new Point(11.489047, 16.387183),
      new Point(19.476612, 16.292199),
      new Point(20.522959, 13.307952),
      new Point(18.232532, 5.659001),
      new Point(6.040618, -1.189735),
      new Point(2.37997, 1.680394),
      new Point(-0.527835, 9.134165),
      new Point(0.281398, 10.545642),
      new Point(10.098738, 16.060836),
      new Point(11.489047, 16.387183),
      new Point(19.476612, 16.292199),
      new Point(20.522959, 13.307952),
      new Point(18.232532, 5.659001),
      new Point(6.040618, -1.189735),
      new Point(18.608074, -2.188965),
      new Point(18.869482, 27.256956),
      new Point(21.49004, 29.877514),
      new Point(25.196069, 29.877514),
      new Point(35.960054, 20.134587),
      new Point(38.600742, 9.253306),
      new Point(39.666216, 3.98651),
      new Point(39.527496, 0.356043),
      new Point(37.195498, -0.761055),
      new Point(26.449923, -4.887396),
      new Point(18.608074, -2.188965),
      new Point(18.869482, 27.256956),
      new Point(21.49004, 29.877514),
      new Point(25.196069, 29.877514),
      new Point(35.960054, 20.134587),
      new Point(38.600742, 9.253306),
      new Point(39.666216, 3.98651),
      new Point(39.527496, 0.356043),
      new Point(37.195498, -0.761055),
      new Point(26.449923, -4.887396),
      new Point(18.608074, -2.188965),
      new Point(18.869482, 27.256956),
      new Point(21.49004, 29.877514),
      new Point(25.196069, 29.877514),
      new Point(35.960054, 20.134587),
      new Point(38.600742, 9.253306),
      new Point(39.666216, 3.98651),
      new Point(39.527496, 0.356043),
      new Point(37.195498, -0.761055),
      new Point(26.449923, -4.887396),
      new Point(18.608074, -2.188965),
      new Point(18.869482, 27.256956),
      new Point(21.49004, 29.877514),
      new Point(25.196069, 29.877514),
      new Point(35.960054, 20.134587),
      new Point(38.600742, 9.253306),
      new Point(39.666216, 3.98651),
      new Point(39.527496, 0.356043),
      new Point(37.195498, -0.761055),
      new Point(26.449923, -4.887396),
      new Point(18.608074, -2.188965),
      new Point(18.869482, 27.256956),
      new Point(21.49004, 29.877514),
      new Point(25.196069, 29.877514),
      new Point(35.960054, 20.134587),
      new Point(38.600742, 9.253306),
      new Point(39.666216, 3.98651),
      new Point(39.527496, 0.356043),
      new Point(37.195498, -0.761055),
      new Point(26.449923, -4.887396),
      new Point(18.608074, -2.188965),
      new Point(18.869482, 27.256956),
      new Point(21.49004, 29.877514),
      new Point(25.196069, 29.877514),
      new Point(35.960054, 20.134587),
      new Point(38.600742, 9.253306),
      new Point(39.666216, 3.98651),
      new Point(39.527496, 0.356043),
      new Point(37.195498, -0.761055),
      new Point(26.449923, -4.887396),
      new Point(18.608074, -2.188965),
      new Point(18.869482, 27.256956),
      new Point(21.49004, 29.877514),
      new Point(25.196069, 29.877514),
      new Point(35.960054, 20.134587),
      new Point(38.600742, 9.253306),
      new Point(39.666216, 3.98651),
      new Point(39.527496, 0.356043),
      new Point(37.195498, -0.761055),
      new Point(26.449923, -4.887396),
      new Point(15.440365, 27.281786),
      new Point(19.424634, 19.99807),
      new Point(14.406863, 17.253297),
      new Point(10.422595, 24.537014)]

      VerifyAndDisplayConvexHull(points, 'convextest3')
    })

  test('TestConvexHull4', ()=> {
    let points = [
    new Point(0.31698, -9.230142),
      new Point(-14.24348, 29.42568),
      new Point(-14.24348, 46.527387),
      new Point(-1.835356, 72.715731),
      new Point(7.602116, 87.795607),
      new Point(9.312994, 89.506485),
      new Point(38.876265, 92.496913),
      new Point(76.794923, 92.289279),
      new Point(77.849731, 91.156191),
      new Point(92.715038, 65.964248),
      new Point(92.715086, 65.963686),
      new Point(93.737871, 53.6752),
      new Point(93.737879, 53.675092),
      new Point(92.346356, 15.632231),
      new Point(78.350016, -1.251781),
      new Point(69.825071, -5.905569),
      new Point(32.519376, -9.230142),
      new Point(32.51942, -9.231142),
      new Point(0.316288, -9.231142),
      new Point(-14.24448, 29.425498),
      new Point(-14.24448, 46.527612),
      new Point(-1.836235, 72.716212),
      new Point(7.601329, 87.796234),
      new Point(9.312539, 89.507444),
      new Point(38.876217, 92.497913),
      new Point(76.795361, 92.290277),
      new Point(77.850537, 91.156793),
      new Point(92.716015, 65.96456),
      new Point(92.716082, 65.96377),
      new Point(93.738868, 53.675278),
      new Point(93.73888, 53.675111),
      new Point(92.347343, 15.631855),
      new Point(78.350663, -1.252567),
      new Point(69.825367, -5.906547)]

      VerifyAndDisplayConvexHull(points, 'convextest4');
  })

  test('TestConvexHull5',() =>{
    let points = [
    new Point(68.496881, -4.863846),
      new Point(23.011518, -3.253472),
      new Point(23.010834, -3.253447),
      new Point(4.013853, 6.407226),
      new Point(-3.839299, 45.427215),
      new Point(-3.887502, 85.987896),
      new Point(-3.887502, 89.850653),
      new Point(-1.155548, 92.582607),
      new Point(88.713601, 94.015726),
      new Point(93.560155, 91.364691),
      new Point(94.548236, 88.575329),
      new Point(93.546507, 41.74241),
      new Point(90.543659, 17.846696),
      new Point(88.854639, 5.767201),
      new Point(83.100874, 0.969771),
      new Point(74.766791, -3.362198),
      new Point(68.497306, -4.863746),
      new Point(68.496882, -4.863846),
      new Point(68.496882, -4.863846),
      new Point(23.011518, -3.253472),
      new Point(23.010834, -3.253447),
      new Point(4.013853, 6.407226),
      new Point(-3.839299, 45.427215),
      new Point(-3.888502, 85.987895),
      new Point(-3.888502, 89.851067),
      new Point(-1.155969, 92.5836),
      new Point(88.713931, 94.016686),
      new Point(93.56097, 91.365385),
      new Point(94.549234, 88.575507),
      new Point(93.546507, 41.742411),
      new Point(93.546446, 41.741928),
      new Point(90.543659, 17.846696),
      new Point(88.854639, 5.767201),
      new Point(83.100874, 0.969771),
      new Point(74.766791, -3.362198),
      new Point(68.497306, -4.863746)]

      VerifyAndDisplayConvexHull(points, 'convextest5');
  })

  test('TestConvexHull6',()=> {
    let points = [
    new Point(46.72085, -4.805022),
      new Point(8.418835, -3.687079),
      new Point(-22.235449, -0.624312),
      new Point(-22.235449, 46.677688),
      new Point(9.715055, 93.369907),
      new Point(54.3123, 97.999863),
      new Point(86.517584, 97.999863),
      new Point(91.066823, 56.177836),
      new Point(92.802856, 9.150555),
      new Point(92.802856, 5.910432),
      new Point(90.511346, 3.618921),
      new Point(55.161691, -3.780041),
      new Point(46.720885, -4.805022),
      new Point(46.72062, -4.805054),
      new Point(8.418899, -3.68608),
      new Point(4.452323, -0.963838),
      new Point(4.023085, -0.585522),
      new Point(1.181385, 2.256179),
      new Point(-1.352344, 34.957271),
      new Point(9.714775, 93.369878),
      new Point(54.312841, 97.997863),
      new Point(86.51579, 97.997863),
      new Point(91.065804, 56.17796),
      new Point(92.802856, 9.150555),
      new Point(92.802856, 5.910432),
      new Point(90.511346, 3.618921),
      //  This duplication causes the point to be outside the hull and not close to it.
      new Point(55.161691, -3.780041)]

      VerifyAndDisplayConvexHull(points, 'convextest6');
  })

  test('TestConvexHull7', ()=> {
    let points = [
    //  not found: (60.907705 41.938473)
    new Point(48.430423, 62.349176),
      new Point(44.031409, 74.624165),
      new Point(50.427754, 81.58763),
      new Point(54.321791, 84.861983),
      new Point(62.444674, 90.715783),
      new Point(66.610446, 90.715783),
      new Point(90.833936, 84.244977),
      new Point(92.983682, 82.095231),
      new Point(93.973562, 48.806198),
      new Point(89.349677, 45.651469),
      new Point(88.140281, 45.15359),
      new Point(60.907705, 41.938473),
      new Point(60.907706, 41.938473),
      new Point(48.429529, 62.348706),
      new Point(44.030284, 74.624339),
      new Point(56.629912, 91.159412),
      new Point(73.731089, 91.159412),
      new Point(85.507896, 61.174801),
      new Point(72.037425, 46.252021)]

      VerifyAndDisplayConvexHull(points, 'convextest7');
  })

  test('TestConvexHull8',()=> {
    let points = [
    //  not found: (50.814572 4.710486)
    new Point(50.814572, 4.710486),
      new Point(31.188044, 22.839098),
      new Point(30.409868, 28.323784),
      new Point(35.413191, 58.184864),
      new Point(36.118713, 61.397242),
      new Point(53.776783, 85.030741),
      new Point(73.815028, 92.737334),
      new Point(76.220647, 92.737334),
      new Point(85.798252, 83.921083),
      new Point(104.579785, 47.775701),
      new Point(104.579785, 15.574577),
      new Point(70.091318, -0.029538),
      new Point(70.091415, -0.030592),
      new Point(50.814572, 4.710487),
      new Point(31.188044, 22.839098),
      new Point(30.409868, 28.323784),
      new Point(35.395205, 40.354142),
      new Point(38.374532, 45.624759),
      new Point(42.178295, 47.776094),
      new Point(68.933441, 62.683544),
      new Point(80.122353, 63.478478),
      new Point(86.035364, 62.683516),
      new Point(104.579785, 47.775701),
      new Point(104.579785, 15.574577)]

      VerifyAndDisplayConvexHull(points, 'convextest8');
  })

  function VerifyAndDisplayConvexHull(points: Point[], filename:string) {
    let hull = Polyline.mkFromPoints(Array.from(ConvexHull.CalculateConvexHull(points[Symbol.iterator]())));
    VerifyPointsAreInOrOnHull(points, hull);
  
    let poly = Polyline.mkFromPoints(points);
    SvgDebugWriter.dumpDebugCurves('/tmp/' + filename, [DebugCurve.mkDebugCurveTWCI(100, 0.01, "magenta", hull), 
    DebugCurve.mkDebugCurveTWCI(100, 0.001, "green", poly)]);
        
  }

  function  VerifyPointsAreInOrOnHull(points: Array<Point>, hull: Polyline) {
    //  A convex hull may not pick up points that are just barely outside the hull 
    for (let point of points) {
      if ((Curve.PointRelativeToCurveLocation(point, hull) == PointLocation.Outside)) {
        let hullPoint = hull[hull.closestParameter(point)];
        expect(Point.closeIntersections(point, hullPoint)).toBe(true) 
      }

    }

  }

