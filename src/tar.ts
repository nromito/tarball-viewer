import { createReadStream } from "fs";
import { pipeline } from "stream";
import { createGunzip } from "zlib";
import * as tar from 'tar-stream';

export class Tarball {
  constructor(private tarball: string) {}
  public async listContent(): Promise<string[]> {
    console.log('listing tarball content', {tarball: this.tarball});
    return await new Promise(async (resolve, reject) => {
      try {
        const extract = tar.extract();
        const contents: string[] = [];
        extract.on('entry', (header: any, stream: any, next: any) => {
          if (header.type !== 'directory') {
            contents.push(header.name);
          }
          stream.on('end', function() {
            next(); // ready for next entry
          });
          stream.resume();
        });
        const streams = [
          createReadStream(this.tarball),
          this.tarball.endsWith('gz') ? createGunzip() : undefined,
          extract
        ].filter(s => !!s);
        pipeline(streams, err => {
          console.log('finished pipeline', {err, contents});
          if (err) {return reject(err);}
          return resolve(contents);
        });
      } catch (err) {
        reject(err);
      }
    });
  }
  public async getFileContent(file: string): Promise<string> {
    console.log('getting tarball file content', {tarball: this.tarball, file});
    return await new Promise(async (resolve, reject) => {
      try {
        const extract = tar.extract();
        let content = '';
        extract.on('entry', (header: any, stream: any, next: any) => {
          if (header.name === file) {
            stream.on('data', buf => {
              content += buf.toString();
            });
            // TODO: kill extract stream on stream end to stop reading the tarball
          }
          stream.on('end', function() {
            next(); // ready for next entry
          });
          stream.resume();
        });
        const streams = [
          createReadStream(this.tarball),
          this.tarball.endsWith('gz') ? createGunzip() : undefined,
          extract
        ].filter(s => !!s);
        pipeline(streams, err => {
          console.log('finished pipeline', {err});
          if (err) {return reject(err);}
          return resolve(content);
        });
      } catch (err) {
        reject(err);
      }
    });
  }
}