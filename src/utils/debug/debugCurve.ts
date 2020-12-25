import {ICurve} from '../geometry/icurve';
import {XMLWriter} from 'xml-writer';
import {fs} from 'file-system';

export class DebugCurve {
	seg: ICurve;
	width: number;
	transparency: number;
	label: string;
	dashArray: number[];
	constructor(seg: ICurve, width = 1, transparency = 1, label = '') {
		this.seg = seg;
		this.width = width;
		this.transparency = transparency;
		this.label = label;
	}
	static toxml(): void {
		const ws = fs.createWriteStream('/tmp/foo.xml');
		ws.on('close', function () {
			console.log(fs.readFileSync('/tmp/foo.xml', 'UTF-8'));
		});

		const xw = XMLWriter.create(false, function (string, encoding) {
			ws.write(string, encoding);
		});

		xw.startDocument('1.0', 'UTF-8')
			.startElement(function () {
				return 'root';
			})
			.text(function () {
				return 'Some content';
			});
		ws.end();
	}
}
