import {Node} from './../../structs/node'
import {Graph} from './../../structs/graph'
import {from} from 'linq-to-typescript'
test('entity graphs', () => {
  const a = Graph.mkGraph('a')
  const b = Graph.mkGraph('b')
  const c = Graph.mkGraph('c')
  a.graphParent = b
  b.graphParent = c
  const bc = from(a.allGraphAncestors()).toArray()
  expect(bc.length).toBe(2)
  expect(a.isDescendantOf(b) && a.isDescendantOf(c)).toBe(true)
  const e = Graph.mkGraph('e')
  expect(e.isDescendantOf(b)).toBe(false)
})

test('test attrs', () => {
  const a = new Node('a')
  a.setAttr(2, '2')
  expect(a.getAttr(0)).toBe(null)
  expect(a.getAttr(2)).toBe('2')
})
