// balances the layers by moving vertices with

import { from } from "linq-to-typescript";
import { Algorithm } from "../../utils/algorithm";
import { CancelToken } from "../../utils/cancelToken";
import { IntPair } from "../../utils/IntPair";
import { BasicGraphOnEdges as Graph } from '../../structs/basicGraphOnEdges'
import { PolyIntEdge } from "./polyIntEdge";

/// balances the layers by moving vertices with    
// the same number of input-output edges to feasible layers with fewer nodes
export class Balancing implements Algorithm {

  jumpers = new Set<number>();

  possibleJumperFeasibleIntervals = new Map<number, IntPair>()
  // numbers of vertices in layers 
  vertsCounts: number[]

  dag: Graph<PolyIntEdge>

  layering: number[]

  nodeCount: number[]
  cancelToken: CancelToken;

  static Balance(dag: Graph<PolyIntEdge>, layering: number[], nodeCount: number[], cancelObj: CancelToken) {
    const b = new Balancing(dag, layering, nodeCount, cancelObj);
    b.run();
  }

  constructor(dag: Graph<PolyIntEdge>, layering: number[], nodeCount: number[], cancelObj: CancelToken) {
    this.cancelToken = cancelObj
    this.nodeCount = nodeCount;
    this.dag = dag;
    this.layering = layering;
    this.Init();
  }

  run() {
    while (this.jumpers.size > 0)
      this.Jump(this.ChooseJumper());
  }

  Init() {
    this.CalculateLayerCounts();
    this.InitJumpers();
  }

  Jump(jumper: number) {
    this.jumpers.delete(jumper);
    const upLow = this.possibleJumperFeasibleIntervals[jumper];
    const ji = this.CalcJumpInfo(upLow.x, upLow.y, jumper)
    if (ji == undefined)
      return
    this.layering[jumper] = ji.layerToJumpTo;
    const jumperCount = this.nodeCount[jumper];
    this.vertsCounts[ji.jumperLayer] -= jumperCount;
    this.vertsCounts[ji.layerToJumpTo] += jumperCount;
    this.UpdateRegionsForPossibleJumpersAndInsertJumpers(ji.jumperLayer, jumper);
  }


  IsJumper(v: number): boolean {
    return this.possibleJumperFeasibleIntervals.has(v);
  }
  // some other jumpers may stop being ones if the jump 
  // was just in to their destination layer, so before the actual 
  // jump we have to recheck if the jump makes sense
  // 
  UpdateRegionsForPossibleJumpersAndInsertJumpers(jumperLayer: number, jumper: number) {
    const neighborPossibleJumpers = new Set<number>();
    //update possible jumpers neighbors
    for (const v of this.dag.pred(jumper))
      if (this.IsJumper(v)) {
        this.CalculateRegionAndInsertJumper(v);
        neighborPossibleJumpers.add(v);
      }

    for (const v of this.dag.succ(jumper))
      if (this.IsJumper(v)) {
        this.CalculateRegionAndInsertJumper(v);
        neighborPossibleJumpers.add(v);
      }

    const possibleJumpersToUpdate = new Array<number>();

    for (const kv of this.possibleJumperFeasibleIntervals) {
      if (!neighborPossibleJumpers.has(kv[0]))
        if (kv[1].x > jumperLayer && kv[1].y < jumperLayer)
          possibleJumpersToUpdate.push(kv[0]);
    }

    for (const v of possibleJumpersToUpdate)
      this.CalculateRegionAndInsertJumper(v);
  }

  InitJumpers() {
    const deltas = new Array<number>(this.dag.nodeCount)
    for (const ie of this.dag.edges) {
      deltas[ie.source] -= ie.weight;
      deltas[ie.target] += ie.weight;
    }

    this.possibleJumperFeasibleIntervals = new Map<number, IntPair>();

    for (let i = 0; i < this.dag.nodeCount; i++)
      if (deltas[i] == 0)
        this.CalculateRegionAndInsertJumper(i);
  }

  CalculateRegionAndInsertJumper(i: number) {
    const ip = new IntPair(this.Up(i), this.Down(i));
    this.possibleJumperFeasibleIntervals[i] = ip;

    this.InsertJumper(ip.x, ip.y, i);
  }

  InsertJumper(upLayer: number, lowLayer: number, jumper: number) {
    let ji = this.CalcJumpInfo(upLayer, lowLayer, jumper)
    if (ji != null)
      this.jumpers.add(jumper);
  }



  // layerToJumpTo is -1 if there is no jump
  CalcJumpInfo(upLayer: number, lowLayer: number, jumper: number): {
    jumperLayer: number,
    layerToJumpTo: number
  } {
    let jumperLayer = this.layering[jumper];
    let layerToJumpTo = -1;
    let min = this.vertsCounts[jumperLayer] - 2 * this.nodeCount[jumper];
    // jump makes sense if some layer has less than min vertices
    for (let i = upLayer - 1; i > jumperLayer; i--)
      if (this.vertsCounts[i] < min) {
        min = this.vertsCounts[i];
        layerToJumpTo = i;
      }

    for (const i = jumperLayer - 1; i > lowLayer; i--)
      if (this.vertsCounts[i] < min) {
        min = this.vertsCounts[i];
        layerToJumpTo = i;
      }
    if (layerToJumpTo == -1)
      return
    return { jumperLayer: jumperLayer, layerToJumpTo: layerToJumpTo }
  }
  // Up returns the first infeasible layer up from i that i cannot jump to
  Up(i: number): number {
    let ret = Number.MAX_SAFE_INTEGER
    //minimum of incoming edge sources layeres
    for (const ie of dag.InEdges(i)) {
      const r = this.layering[ie.source] - ie.Separation + 1;
      if (r < ret)
        ret = r;
    }

    if (ret == Number.MAX_SAFE_INTEGER)
      ret = this.layering[i] + 1;

    return ret;
  }
  // Returns the first infeasible layer down from i that i cannot jump to
  Down(i: number): number {
    let ret = Number.NEGATIVE_INFINITY

    for (const ie of this.dag.outEdges[i]) {
      const r = this.layering[ie.target] + ie.separation - 1;
      if (r > ret)
        ret = r;
    }

    if (ret == -Number.NEGATIVE_INFINITY)
      ret = this.layering[i] - 1;

    return ret;
  }

  CalculateLayerCounts() {
    this.vertsCounts = new Array<number>(from(this.layering).max() + 1)
    for (const r of this.layering)
      this.vertsCounts[r] += this.nodeCount[r];
  }

  ChooseJumper() {
    //just return the first available
    for (const jumper of this.jumpers)
      return jumper;

    throw new Error("there are no jumpers to choose")
  }
}

