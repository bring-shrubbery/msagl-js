import {Entity} from './entity'

export class Label extends Entity {
  text: string
  constructor(parent: Entity, text: string) {
    super(parent)
    this.text = text
  }
  toString() {
    return this.text
  }
}
