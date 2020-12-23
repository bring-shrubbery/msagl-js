import {ICurve} from '../geometry/icurve';
export class DebugCurve {
	seg: ICurve;
	width: number;
	transparency: number;
	label: string;
	constructor(seg: ICurve, width = 1, transparency = 1, label = '') {
		this.seg = seg;
		this.width = width;
		this.transparency = transparency;
		this.label = label;
	}
}
