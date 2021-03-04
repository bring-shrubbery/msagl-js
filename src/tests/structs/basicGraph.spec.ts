import { BasicGraph } from '../../structs/BasicGraph'
import { IEdge } from './../../structs/iedge'
class myedge implements IEdge {
  Source: number
  Target: number
  constructor(a: number, b: number) {
    this.Source = a
    this.Target = b
  }
}
test('bgoe', () => {
  const edges = [
    new myedge(0, 1),
    new myedge(1, 2),
    new myedge(2, 0),
    new myedge(2, 2),
    new myedge(2, 3),
  ]
  const bg = new BasicGraph(edges, 4)
  expect(bg.NodeCount).toBe(4)
  bg.removeEdge(edges[4])
  expect(bg.inEdgesCount(3)).toBe(0)
  expect(bg.outEdgesCount(2)).toBe(1)
  expect(bg.selfEdgesCount(2)).toBe(1)
  let i = 0
  for (const n of bg.nodesOfConnectedGraph()) {
    i++
  }
  expect(i).toBe(3)
  bg.addEdge(new myedge(0, 2))
  expect(bg.outEdgesCount(0)).toBe(2)
})
