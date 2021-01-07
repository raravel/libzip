import { FileManager } from './file-manager';
import { ZipArchive, ZipFile } from './zip-archive';
import path from 'path';

const archive = ZipFile.Open(path.resolve(__dirname, '../test.zip'));
console.log(archive.Entries[0].Open());