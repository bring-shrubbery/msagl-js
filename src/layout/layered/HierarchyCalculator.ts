import { Parallelogram } from "../../math/geometry/parallelogram";
import { PN } from "../../math/geometry/parallelogramNode";

export class HierarchyCalculator {

  initialNodes: Array<PN>;

  groupSplitThreshold = 2;

  static Calculate(nodes: Array<PN>, groupSplitThresholdPar: number): PN {
    let calc: HierarchyCalculator = new HierarchyCalculator(nodes, groupSplitThresholdPar);
    return calc.Calculate();
  }

  constructor(nodes: Array<PN>, groupSplitThresholdPar: number) {
    this.initialNodes = nodes;
    this.groupSplitThreshold = groupSplitThresholdPar;
  }

  Calculate(): PN {
    return this.Calc(this.initialNodes);
  }

  Calc(nodes: Array<PN>): PN {
    if ((nodes.length == 0)) {
      return null;
    }

    if ((nodes.length == 1)) {
      return nodes[0];
    }

    // Finding the seeds
    let b0: Parallelogram = nodes[0].parallelogram;
    // the first seed
    let seed0: number = 1;
    let area: number = Parallelogram.parallelogramOfTwo(b0, nodes[seed0].parallelogram).Area;
    for (let i = 2; (i < nodes.length); i++) {
      let area0: number = Parallelogram.parallelogramOfTwo(b0, nodes[i].parallelogram).Area;
      if ((area0 > area)) {
        seed0 = i;
        area = area0;
      }

    }

    // Got the first seed seed0
    // Now looking for a seed for the second group
    let seed1: number = 0;
    // the compiler forces me to init it
    // init seed1
    for (let i: number = 0; (i < nodes.length); i++) {
      if ((i != seed0)) {
        seed1 = i;
        break;
      }

    }
    area = Parallelogram.parallelogramOfTwo(nodes[seed0].parallelogram, nodes[seed1].parallelogram).Area;
    // Now try to improve the second seed
    for (let i: number = 0; (i < nodes.length); i++) {
      if ((i == seed0)) {
        // TODO: Warning!!! continue If
      }

      let area1: number = (Parallelogram.parallelogramOfTwo(nodes[seed0].parallelogram, nodes[i].parallelogram).Area);
      if ((area1 > area)) {
        seed1 = i;
        area = area1;
      }

    }

    // We have two seeds at hand. Build two groups.
    let gr0: Array<PN> = new Array<PN>();
    let gr1: Array<PN> = new Array<PN>();
    gr0.push(nodes[seed0]);
    gr1.push(nodes[seed1]);
    let box0: Parallelogram = nodes[seed0].parallelogram;
    let box1: Parallelogram = nodes[seed1].parallelogram;
    // divide nodes on two groups
    for (let i: number = 0; (i < nodes.length); i++) {
      if (i == seed0 || i == seed1) {
        continue
      }

      let box0_ = Parallelogram.parallelogramOfTwo(box0, nodes[i].parallelogram);
      let delta0: number = (box0_.Area - box0.Area);
      let box1_: Parallelogram = Parallelogram.parallelogramOfTwo(box1, nodes[i].parallelogram);
      let delta1: number = (box1_.Area - box1.Area);
      // keep the tree roughly balanced
      if (((gr0.length * this.groupSplitThreshold)
        < gr1.length)) {
        gr0.push(nodes[i]);
        box0 = box0_;
      }
      else if (((gr1.length * this.groupSplitThreshold)
        < gr0.length)) {
        gr1.push(nodes[i]);
        box1 = box1_;
      }
      else if ((delta0 < delta1)) {
        gr0.push(nodes[i]);
        box0 = box0_;
      }
      else {
        gr1.push(nodes[i]);
        box1 = box1_;
      }

    }
    return {
      parallelogram: Parallelogram.parallelogramOfTwo(box0, box1),
      node: { children: [this.Calc(gr0), this.Calc(gr1)] },
      seg: undefined,
      leafBoxesOffset: undefined
    }


  }
}
