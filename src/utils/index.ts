import { Point, Segment } from "../models";

export function addPoints(point1: Point, point2: Point): Point {
    return {
        x: point1.x ?? 0 + point2.x ?? 0,
        y: point1.y ?? 0 + point1.y ?? 0
    }
}

export function mapSegment(num: number, segment: Segment): Point {
    return {
        x: segment.start ?? 0,
        y: segment.end ?? 0
    }
}