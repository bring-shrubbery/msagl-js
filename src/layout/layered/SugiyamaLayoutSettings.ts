import { VerticalConstraintsForSugiyama } from './VerticalConstraintsForSugiyama'
import { HorizontalConstraintsForSugiyama } from './HorizontalConstraintsForSugiyama'

export class SugiyamaLayoutSettings {
  verticalConstraints = new VerticalConstraintsForSugiyama()
  horizontalConstraints = new HorizontalConstraintsForSugiyama()
  layeringOnly: boolean
}
