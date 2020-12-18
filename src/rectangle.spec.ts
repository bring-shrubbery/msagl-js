import { Rectangle } from "./utils/geometry/rectangle"
import { Point } from "./utils/geometry/point"
test("rectangle test", () => {
    let r = new Rectangle(0, 1, 1, 0);
    let p = new Point(0.3, 0.3);
    expect(r.Contains(p)).toBe(true)
    let r0 = new Rectangle(1, 4, 1, 0);
    expect(r.Intersects(r0)).toBe(true)
    r0.Center = new Point(12, 0);
    console.log(r0)
    expect(r.Intersects(r0)).toBe(false)
    
    
    

});
