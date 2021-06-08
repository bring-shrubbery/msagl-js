import {Node} from './../../../layoutPlatform/structs/node'
import {Graph} from './../../../layoutPlatform/structs/graph'
test('entity graphs', () => {
  const c = Graph.mkGraph('c', null)
  const b = Graph.mkGraph('b', c)
  const a = Graph.mkGraph('a', b)
  const bc = Array.from(a.getAncestors())
  expect(bc.length).toBe(2)
  expect(a.isDescendantOf(b) && a.isDescendantOf(c)).toBe(true)
  const e = Graph.mkGraph('e', null)
  expect(e.isDescendantOf(b)).toBe(false)
})

test('test attrs', () => {
  const a = new Node('a', null)
  a.setAttr(2, '2')
  expect(a.getAttr(0)).toBe(null)
  expect(a.getAttr(2)).toBe('2')
})
