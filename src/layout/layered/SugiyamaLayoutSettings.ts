import { VerticalConstraintsForSugiyama } from './VerticalConstraintsForSugiyama'
import { HorizontalConstraintsForSugiyama } from './HorizontalConstraintsForSugiyama'

export class SugiyamaLayoutSettings {
  verticalConstraints = new VerticalConstraintsForSugiyama()
  horizontalConstraints = new HorizontalConstraintsForSugiyama()
  layeringOnly: boolean
  NoGainAdjacentSwapStepsBound = 5
  RepetitionCoefficientForOrdering = 1
  AspectRatio: number
  MaxNumberOfPassesInOrdering = 24
}
