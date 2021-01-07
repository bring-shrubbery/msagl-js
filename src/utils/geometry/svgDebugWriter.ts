import {ICurve} from './icurve';
// import {LineSegment} from './lineSegment';
//import {fs} from 'file-system';
/// <reference path="path/to/node.d.ts" />s

export class svgDebugWriter {
  // Here we import the File System module of node
  private fs = require('fs');
  private xmlw = require('xml-writer');
  test() {
    const logger = this.fs.createWriteStream('/tmp/log.txt', {
      flags: 'a', // 'a' means appending (old data will be preserved)
    });

    logger.write('some data'); // append string to your file
    logger.write('more data'); // again
    logger.write('and more'); // again
    logger.close();
    const xw = new this.xmlw();
    xw.startDocument();
    xw.startElement('root');
    xw.writeAttribute('foo', 'value');
    xw.text('Some content');
    xw.endDocument();

    console.log(xw.toString());
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
