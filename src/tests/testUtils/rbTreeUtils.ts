import {randomInt} from './../../layoutPlatform/utils/random'
import {RBTree} from './../../layoutPlatform/structs/RBTree/rbTree'
import {RBNode} from './../../layoutPlatform/structs/RBTree/rbNode'
import {RBColor} from '../../layoutPlatform/structs/RBTree/rbColor'

export class RbTreeUtils {
  static getRandomArray(size: number, upperBound = 1000): number[] {
    const arr: number[] = []
    for (let i = 0; i < size; i++) {
      arr.push(randomInt(upperBound))
    }
    return arr
  }

  static buildTreeWithNums(
    vals: number[],
    comparer: (a: number, b: number) => number,
  ): RBTree<number> {
    const tree: RBTree<number> = new RBTree(comparer)
    for (let i = 0; i < vals.length; i++) {
      tree.insert(vals[i])
    }
    return tree
  }

  static computeBlackHeight<T>(root: RBNode<T>): number {
    if (root == null) {
      return 0
    } else {
      const leftHeight: number = this.computeBlackHeight(root.left)
      const rightHeight: number = this.computeBlackHeight(root.right)
      if (leftHeight == -1 || rightHeight == -1 || rightHeight != leftHeight) {
        return -1
      }
      return (root.color == RBColor.Black ? 1 : 0) + leftHeight
    }
  }
}
