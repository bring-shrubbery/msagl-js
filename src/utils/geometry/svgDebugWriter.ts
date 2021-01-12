import {ICurve} from './icurve';
// import {LineSegment} from './lineSegment';
//import {fs} from 'file-system';
/// <reference path="path/to/node.d.ts" />s

export class svgDebugWriter {
  // Here we import the File System module of node
  private fs = require('fs');
  private xmlw = require('xml-writer');
  xw: any;
  ws: any;
  test() {
    this.ws = this.fs.createWriteStream('/tmp/foo.xml');
    this.xw = new this.xmlw(false, function (string: string, encoding) {
      this.ws.write(string, encoding);
    });

    this.xw.startDocument();
    this.xw.startElement('root');
    this.xw.writeAttribute('foo', 'value');
    this.xw.text(typeof this);
    this.xw.endElement();
    this.xw.endDocument();
    this.ws.end();
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
