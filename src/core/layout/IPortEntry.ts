import { Point } from "../../math/geometry/point"

// restricts the access to a port
export interface IPortEntry {
    [Symbol.iterator](): Iterator<Point>
}