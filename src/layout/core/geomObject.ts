// The base class of the Graph,Node and Edge classes
export class GeomObject {
  geometryParent: GeomObject;
  // storage for algorithm data
  algorithmData: any;
  // keeps the back pointer to the user data
  userData: any;
}
