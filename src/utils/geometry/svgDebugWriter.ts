import {ICurve} from './icurve';
import {LineSegment} from './lineSegment';
/// <reference path="path/to/node.d.ts" />s

export class svgDebugWriter {
	// Here we import the File System module of node
	private fs = require('fs');
	write(cs: ICurve[], fileName: string): void {
		this.fs.writeFile(fileName, 'I am cool!', function (err) {
			if (err) {
				return console.error(err);
			}
			console.log('File created!');
		});
	}
}
