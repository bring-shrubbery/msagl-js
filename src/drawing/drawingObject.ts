import {AttrContainer} from '../layoutPlatform/structs/attrContainer'
import {OrderingEnum, DirTypeEnum} from '../tools/dotparser'
import {ArrowTypeEnum} from './arrawTypeEnum'
import {Color} from './color'
import {RankDirEnum} from './rankDirEnum'
import {RankEnum} from './rankEnum'
import {ShapeEnum} from './shapeEnum'
import {StyleEnum} from './styleEnum'

export abstract class DrawingObject {
  // not all attributes can be used in derived classes
  static defaultLabelFontName = 'Times-Roman'
  static defaultLabelFontSize = 12

  color: Color
  fillColor: Color
  labelfontcolor: Color
  labelText: string
  headlabel: string
  taillabel: string
  fontColor: Color
  styleEnum: StyleEnum
  attrCont: AttrContainer // this is the field from main graph
  shapeEnum: ShapeEnum
  pencolor: Color
  peripheries: number
  size: [number, number]
  rankdir: RankDirEnum
  fontname: any
  width: number
  height: number
  margin: number
  len: number
  fontsize: number
  minlen: number
  rank: RankEnum
  charset: any
  orientation: any
  ratio: any
  weight: number
  ranksep: number
  splines: boolean
  overlap: boolean
  arrowtail: ArrowTypeEnum
  arrowhead: ArrowTypeEnum
  ordering: OrderingEnum
  URL: string
  dir: DirTypeEnum
  concentrate: boolean
  compound: boolean

  bind() {
    if (this.attrCont != null) {
      this.attrCont.setAttr(1, this) // the attribute at 0 is for geometry, at 1 is for drawing
    }
  }

  constructor(attrCont: AttrContainer) {
    this.attrCont = attrCont
    this.bind()
  }

  static getDrawingObj(attrCont: AttrContainer): DrawingObject {
    if (attrCont == null) {
      return null
    } else {
      return attrCont.getAttr(1) // the attribute at 0 is for geometry, at 1 is for drawing
    }
  }
}
