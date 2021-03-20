// 
//  Shape.cs
//  MSAGL Shape class for Rectilinear Edge Routing.
// 
//  Copyright Microsoft Corporation.

import { IEnumerable } from "linq-to-typescript";

import { Queue } from "queue-typescript";
import { Port } from "../core/layout/Port";
import { ICurve } from "../math/geometry/icurve";
import { Rectangle } from "../math/geometry/rectangle";

//  A shape wrapping an ICurve, providing additional information.
export class Shape {

    parents: Set<Shape> = new Set<Shape>();

    //  shape parents
    * Parents(): IterableIterator<Shape> {
        return this.parents;
    }

    children: Set<Shape> = new Set<Shape>();

    //  shape children
    * Children(): IterableIterator<Shape> {
        return this.children;
    }

    //  The curve of the shape.
    public get BoundaryCurve(): ICurve {
        return this.boundaryCurve;
    }
    public /* virtual */ set BoundaryCurve(value: ICurve) {
        this.boundaryCurve = value;
    }

    boundaryCurve: ICurve;

    //  The bounding box of the shape.
    public get BoundingBox(): Rectangle {
        return this.BoundaryCurve.boundingBox;
    }

    //  The set of Ports for this obstacle, usually RelativePorts.  In the event of overlapping
    //  obstacles, this identifies the obstacle to which the port applies.
    public get Ports(): Set<Port> {
        return this.ports;
    }

    private ports: Set<Port> = new Set<Port>();

    userData: Object;
    //  A location for storing user data associated with the Shape.
    public get UserData(): Object {
        return this.userData;
    }
    public set UserData(value: Object) {
        this.userData = value;
    }


    //  Constructor taking the ID and the curve of the shape.
    //  <param name="boundaryCurve"></param>
    constructor(boundaryCurve: ICurve) {
        this.boundaryCurve = boundaryCurve;
        //  RelativeShape throws an exception on BoundaryCurve_set so set _boundaryCurve directly.
    }

    //  A group is a shape that has children.
    public get IsGroup(): boolean {
        return (this.children.size > 0);
    }
    isTransparent: boolean;
    get IsTransparent(): boolean {
        return this.isTransparent;
    }
    set IsTransparent(value: boolean) {
        this.isTransparent = value;
    }

    * Descendants(): IterableIterator<Shape> {
        let q = new Queue<Shape>();
        for (const shape of this.Children()) {
            q.enqueue(shape);
        }

        while ((q.length > 0)) {
            let sh = q.dequeue();
            yield sh;
            for (const shape of sh.Children()) {
                q.enqueue(shape);
            }
        }
    }

    *Ancestors(): IterableIterator<Shape> {
        let q = new Queue<Shape>();
        for (const shape of this.Parents()) {
            q.enqueue(shape);
        }

        while (q.length > 0) {
            let sh = q.dequeue();
            yield sh;
            for (const shape of sh.Parents()) {
                q.enqueue(shape);
            }

        }

    }

    //  Adds a parent. A shape can have several parents
    // <param name="shape"></param>
    public AddParent(shape: Shape) {
        this.parents.add(shape);
        shape.children.add(this);
    }

    // <param name="shape"></param>
    public AddChild(shape: Shape) {
        shape.parents.add(this);
        this.children.add(shape);
    }

    //  
    //  <param name="shape"></param>
    public RemoveChild(shape: Shape) {
        this.children.delete(shape);
        shape.parents.delete(this);
    }

    //  
    //  <param name="shape"></param>
    public RemoveParent(shape: Shape) {
        this.parents.delete(shape);
        shape.children.delete(this);
    }

    toString(): string {
        return (this.UserData == null) ? "null" : this.UserData.toString();
    }
}