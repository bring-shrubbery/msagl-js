import {Graph} from '../../structs/graph'
import {Algorithm} from './../../utils/algorithm'
import {SugiyamaLayoutSettings} from './SugiyamaLayoutSettings'

export class LayeredLayout extends Algorithm {
  originalGraph: Graph
  sugiyamaSettings: SugiyamaLayoutSettings
  constructor(graph: Graph, settings: SugiyamaLayoutSettings) {
    super()
    this.originalGraph = graph
    this.sugiyamaSettings = settings
  }
  run() {
    throw new Error()
  }
}
