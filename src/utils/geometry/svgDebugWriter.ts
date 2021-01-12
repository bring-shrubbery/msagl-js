import {ICurve} from './icurve';
// import {LineSegment} from './lineSegment';
//import {fs} from 'file-system';
/// <reference path="path/to/node.d.ts" />s

export class svgDebugWriter {
  // Here we import the File System module of node
  private fs = require('fs');
  private xmlw = require('xml-writer');
  test() {
    const ws = this.fs.createWriteStream('/tmp/foo.xml');
    const xw = new this.xmlw(false, function (string: string, encoding) {
      ws.write(string, encoding);
    });

    xw.startDocument();
    xw.startElement('root');
    xw.writeAttribute('foo', 'value');
    xw.text('Some content');
    xw.endElement();
    xw.endDocument();
    ws.end();
  }
  close() {
    console.log('foo');
  }
  write(cs: ICurve[], fileName: string): void {
    this.fs.writeFile(fileName, 'I am cool!', function (err) {
      if (err) {
        return console.error(err);
      }
      console.log('File created!');
    });
  }

  // this.fs.close();
}
