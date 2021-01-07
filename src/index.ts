import { FileManager } from './file-manager';
import { ZipArchive } from './zip-archive';
import path from 'path';

const fm = new FileManager(path.resolve(__dirname, '../test.zip'));
new ZipArchive(fm);