
// 
public class CurvePort: Port  {
  number parameter;
        // constructor
        public CurvePort(ICurve curve, number parameter) {
    this.curve = curve;
    this.parameter = parameter;
  }


        // empty constructor
        public CurvePort() { }
        // 
        public number Parameter {
    get { return parameter; }
    set { parameter = value; }
  }
  ICurve curve;
  // 
  override public ICurve Curve {
    get { return curve; }
    set { curve = value; }
  }

  // 
  get { return Curve[parameter].Clone(); }
}
}

