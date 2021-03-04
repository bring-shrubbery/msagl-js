import { get, first, List } from "lodash";
import { textChangeRangeIsUnchanged } from "typescript";
import { BasicGraph } from "../../structs/BasicGraph";
import { IntPair } from "../../utils/IntPair";
import { GeomNode } from "../core/geomNode";
import { Database } from "./Database";
import { EdgePathsInserter } from "./EdgePathInserter";
import { LayerArrays } from "./LayerArrays";
import { LayerEdge } from "./LayerEdge";
import { PolyIntEdge } from "./polyIntEdge";
import { ProperLayeredGraph } from "./ProperLayeredGraph";

// Preparing the graph for x-coordinate calculation by inserting dummy nodes into the layers
export class LayerInserter {
    intGraph: BasicGraph<GeomNode, PolyIntEdge>;
    database: Database;
    // Old layered graph: 
    layeredGraph: ProperLayeredGraph;
    // new layered graph 

    virtNodesToIntEdges: PolyIntEdge[];

    NLayeredGraph: ProperLayeredGraph

    // old layer arrays
    la: LayerArrays;

    // new layer arrays
    Nla: LayerArrays
    totalNodes: number;

    constructor(
        layeredGraph: ProperLayeredGraph, la: LayerArrays, database: Database, intGraphP: BasicGraph<GeomNode, PolyIntEdge>) {
        this.la = la;
        this.database = database;
        this.layeredGraph = layeredGraph;
        this.intGraph = intGraphP;
    }

    //// the entry point of the class
    static InsertLayers(
        layeredGraph: ProperLayeredGraph, la: LayerArrays, db: Database, intGraphP: BasicGraph<GeomNode, PolyIntEdge>): { layeredGraph: ProperLayeredGraph, la: LayerArrays } {
        const li = new LayerInserter(layeredGraph, la, db, intGraphP);
        li.InsertLayers();

        return {
            layeredGraph: li.NLayeredGraph,
            la: li.Nla.DropEmptyLayers()
        }

    }
    // new Y-layering
    get NLayering(): number[] {
        return this.Nla.Y;
    }

    // does the main work
    InsertLayers() {

        this.EditOldLayering();

        this.CreateFullLayeredGraph();

        this.InitNewLayering();

        this.MapVirtualNodesToEdges();

        this.FillUnsortedNewOddLayers();

        this.WidenOriginalLayers();

        this.SortNewOddLayers();

    }
    // virtual nodes inside of an edge should be of the form i,i+1, ....
    EditOldLayering() {
        let curVNode = this.intGraph.NodeCount;

        for (const list of this.database.RegularMultiedges()) {
            let span = 0;
            const e = list[0];
            span = e.LayerSpan * 2;
            if (span > 0) {//ignoring flat edges            
                for (const le of e.LayerEdges) {
                    if (le.Target != e.Target) {
                        curVNode++;
                        this.UpdateOldLayer(curVNode++, le.Target);
                    }
                }
                curVNode += (span - 1) * (list.length - 1) + 1;
            }
        }
    }

    private UpdateOldLayer(replacingNode: number, prevNode: number) {
        const x = this.la.X[prevNode];
        const y = this.la.Y[prevNode];
        const layer = this.la.Layers[y];
        layer[x] = replacingNode;
        //   this.la.X[replacingNode] = x;
        //  this.la.Y[replacingNode] = y;
    }

    // Original layers are represented by even layers of the new layering.
    // Here we add new virtices of such layers and 
    // set new x-offsets of original and dummy vertices of these layers.
    WidenOriginalLayers() {
        for (let i = 0; i < this.la.Layers.length; i++) {
            const layer = this.Nla.Layers[i * 2];
            let offset = 0;
            for (const v of this.la.Layers[i]) {
                const e = this.virtNodesToIntEdges[v];
                if (e != null) {
                    const layerOffsetInTheEdge = this.NLayering[e.Source] - this.NLayering[v];
                    const list = this.database.Multiedges.get(e.Source, e.Target);

                    for (const ie of list) {
                        if (ie != e) {
                            const u = ie.LayerEdges[layerOffsetInTheEdge].Source;
                            layer[offset] = u;
                            this.Nla.X[u] = offset++;
                        } else {
                            layer[offset] = v;
                            this.Nla.X[v] = offset++;
                        }
                    }
                } else {
                    layer[offset] = v;
                    this.Nla.X[v] = offset++;
                }
            }
        }
    }

    // filling new layers not corresponding to the original layers
    FillUnsortedNewOddLayers() {
        const c = new Array<number>(this.Nla.Layers.length).fill(0)
        for (let i = this.intGraph.NodeCount; i < this.NLayeredGraph.NodeCount; i++) {
            const layer = this.NLayering[i];
            if (layer % 2 == 1) {//new layers have odd numbers
                this.Nla.Layers[layer][c[layer]++] = i;
            }
        }
    }


    // create the mapping from the vertices to edges to which they belong
    MapVirtualNodesToEdges() {
        this.virtNodesToIntEdges = new Array<PolyIntEdge>(this.NLayering.length)
        for (const e of this.database.AllIntEdges())
            if (e.Source != e.Target && e.LayerEdges != null)
                for (const le of e.LayerEdges)
                    if (le.Target != e.Target)
                        this.virtNodesToIntEdges[le.Target] = e;
    }
    // Creating buckets for multi edges and allocating the graph.
    CreateFullLayeredGraph() {
        this.totalNodes = this.intGraph.NodeCount;
        for (const list of this.database.RegularMultiedges()) {
            let span = 0;
            let first = true;
            for (const e of list) {
                if (first) {
                    first = false;
                    span = e.LayerSpan * 2;
                }
                if (span > 0) {
                    e.LayerEdges = new LayerEdge[span];
                    for (let i = 0; i < span; i++) {
                        const bT = { currentVV: this.totalNodes }
                        const source = EdgePathsInserter.GetSource(bT, e, i);
                        this.totalNodes = bT.currentVV
                        const target = EdgePathsInserter.GetTarget(this.totalNodes, e, i, span);
                        e.LayerEdges[i] = new LayerEdge(source, target, e.CrossingWeight);
                    }
                    LayerInserter.RegisterDontStepOnVertex(this.database, e);
                }
            }
        }
        this.NLayeredGraph = new ProperLayeredGraph(this.intGraph);
    }


    // Sort new odd layers by the sum of x-coordinatates of predecessors and the successors of 
    // dummy nodes.
    SortNewOddLayers() {

        for (number i = 1; i < this.Nla.Layers.length; i += 2) {
            SortedDictionary < number, object > sd = new SortedDictionary<number, object>();
            number[] layer = this.Nla.Layers[i];
            for (number v of layer) {

                //find unique predecessor and successor
                number predecessor = -1;
                for (LayerEdge ie of nLayeredGraph.InEdges(v))
                predecessor = ie.Source;
                number successor = -1;
                for (LayerEdge ie of nLayeredGraph.OutEdges(v))
                successor = ie.Target;

                number x = this.Nla.X[predecessor] + this.Nla.X[successor];

                if (sd.ContainsKey(x)) {
                    object o = sd[x];
                    if (o.GetType() == typeof (number)) {
                        List < number > l = new List<number>();
                        l.Add((number)o);
                        l.Add(v);
                        sd[x] = l;
                    } else {
                        List < number > l = o as List<number>;
                        l.Add(v);
                    }
                } else
                    sd[x] = v;
            }
            //fill the layer according to this order
            number c = 0;
            for (object v of sd.Values)
            if (v.GetType() == typeof (number))
                layer[c++] = (number)v;
                    else for (number k of v as List<number>)
            layer[c++] = k;

            //update X now
            for (number m = 0; m < layer.length; m++)
            this.Nla.X[layer[m]] = m;
        }
    }

    // Allocating new layering and filling its y-layers
    InitNewLayering() {


        this.Nla = new LayerArrays(new Array<number>(this.totalNodes));

        for (number i = 0; i < layeredGraph.NodeCount; i++)
        NLayering[i] = la.Y[i] * 2;

        for (KeyValuePair < IntPair, List < PolyIntEdge >> kv of database.Multiedges) {
            IntPair ip = kv.Key;

            if (ip.First != ip.Second && la.Y[ip.First] != la.Y[ip.Second]) {//not a self edge and not a flat edge
                number top = la.Y[ip.x] * 2;
                for (PolyIntEdge e of kv.Value) {
                    number layer = top - 1;
                    for (LayerEdge le of e.LayerEdges)
                    if (le.Target != e.Target)
                        NLayering[le.Target] = layer--;
                }
            }
        }

        number[][] newLayers = new number[2 * la.Layers.length - 1][];

        //count new layer widths
        number[] counts = new number[newLayers.length];

        for (number l of NLayering)
        counts[l]++;

        for (number i = 0; i < counts.length; i++)
        newLayers[i] = new number[counts[i]];

        this.Nla = new LayerArrays(NLayering);
        this.Nla.Layers = newLayers;

    }
    //// mark the vertex as one representing a label
    //// or a middle of a multi edge
    static RegisterDontStepOnVertex(db: Database, parent: PolyIntEdge) {
        if (db.Multiedges.get(parent.Source, parent.Target).length > 1) {
            const e = parent.LayerEdges[parent.LayerEdges.length / 2];
            db.MultipleMiddles.add(e.Source);
        }
    }
}

