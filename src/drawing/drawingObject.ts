import {ArrowTypeEnum} from './arrawTypeEnum'
import {Color} from './color'
import {ShapeEnum} from './shapeEnum'
import {StyleEnum} from './styleEnum'
import {RankEnum} from './rankEnum'
import {DirTypeEnum, OrderingEnum} from './dotparser'
import {LayerDirectionEnum} from '..'
import {AttrContainer} from '../structs/attrContainer'

export abstract class DrawingObject {
  attrCont: AttrContainer // this is the field from main graph - keep the connection with the underlying graph

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
  shapeEnum = ShapeEnum.Box
  pencolor: Color
  peripheries: number
  size: [number, number]
  rankdir: LayerDirectionEnum
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
  lhead: string
  bgcolor: Color
  center: boolean
  pos: [number, number]
  nodesep: number
  rotate: number
  arrowsize: number
  colorscheme: string
  ltail: string
  sides: number
  distortion: number
  skew: number
  bb: [number, number, number, number]
  labelloc: string
  decorate: boolean
  tailclip: boolean
  headclip: boolean
  constraint: boolean
  gradientangle: number
  samehead: string
  href: string
  imagepath: string
  image: string
  labejust: string
  layers: string[]
  layer: string
  layersep: number
  f: number
  nojustify: boolean
  root: boolean
  page: [number, number]
  pname: any
  kind: any
  fname: any
  subkind: any
  area: number
  tailport: string
  headport: string
  wt: any
  id: any
  edgetooltip: any
  headURL: any
  tailURL: any
  labelURL: any
  edgeurl: any
  tailtooltip: any
  headtooltip: any
  shapefile: any
  xlabel: any
  sametail: string

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
