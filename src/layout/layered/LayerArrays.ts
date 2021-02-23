export class LayerArrays {
  Y: number[]

  verticesToX: number[]

  layers: number[][]

  constructor(verticesToLayers: number[]) {
    this.initialize(verticesToLayers)
  }

  initialize(verticesToLayers: number[]) {
    this.Y = verticesToLayers
    this.verticesToX = null
    this.layers = null
  }

  // Returns the same arrays but with no empty layers.
  dropEmptyLayers(): LayerArrays {
    const drop = new Array<number>(this.Layers.length)
    let dropVal = 0
    for (let i = 0; i < this.Layers.length; i++) {
      drop[i] = dropVal
      if (this.Layers[i].length == 0) dropVal++
    }

    if (dropVal == 0) return this

    //we do have empty layers
    const ny = new Array<number>(this.Y.length)
    for (let i = 0; i < ny.length; i++) ny[i] = this.Y[i] - drop[this.Y[i]]

    //copy the layers itself
    const nls = new Array<number[]>(this.layers.length - dropVal)
    for (let i = 0; i < this.layers.length; i++) {
      if (this.layers[i].length > 0) nls[i - drop[i]] = [...this.layers[i]]
    }

    const la = new LayerArrays(ny)
    la.layers = nls
    return la
  }

  static copyTo(s: number[], t: number[]) {
    for (let i = 0; i < s.length; i++) t[i] = s[i]
  }

  updateLayers(ulayers: number[][]) {
    if (this.layers == null) this.InitLayers()

    for (let i = 0; i < this.layers.length; i++)
      LayerArrays.copyTo(ulayers[i], this.layers[i])

    this.UpdateXFromLayers()
  }

  UpdateXFromLayers() {
    if (this.layers == null) this.InitLayers()

    if (this.verticesToX == null)
      this.verticesToX = new Array<number>(this.Y.length)

    for (const layer of this.layers) {
      let i = 0
      for (const v of layer) this.verticesToX[v] = i++
    }
  }

  // gives the order of the vertices in the y-layer
  // <value></value>
  get X(): number[] {
    if (this.verticesToX != null) return this.verticesToX

    this.verticesToX = new Array<number>(this.Y.length)

    this.UpdateXFromLayers()

    return this.verticesToX
  }

  // returns the layer hierarchy where the order of the layers is reversed
  ReversedClone(): LayerArrays {
    const rv = new Array<number>(this.Y.length)
    const lastLayer = this.Layers.length - 1 //call Layers to ensure that the layers are calculated
    for (let i = 0; i < this.Y.length; i++) rv[i] = lastLayer - this.Y[i]
    return new LayerArrays(rv)
  }

  // Layers[i] is the array of vertices of i-th layer
  get Layers(): number[][] {
    if (this.layers != null) return this.layers

    this.InitLayers()

    return this.layers
  }

  set Layers(value) {
    this.layers = value
  }

  InitLayers() {
    //find the number of layers
    let nOfLayers = 0

    for (const l of this.Y) if (l + 1 > nOfLayers) nOfLayers = l + 1

    const counts = new Array<number>(nOfLayers)

    //find the number of vertices in the layer
    for (const l of this.Y) counts[l]++

    this.layers = new Array<number[]>(nOfLayers)

    for (let i = 0; i < nOfLayers; i++) {
      this.layers[i] = new Array<number>(counts[i])
      counts[i] = 0 //we reuse these counts below
    }

    for (let i = 0; i < this.Y.length; i++) {
      const l = this.Y[i]
      this.layers[l][counts[l]++] = i
    }
  }
}
