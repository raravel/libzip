import { FileManager } from './file-manager';
import { ZipArchive, ZipFile } from './zip-archive';
import path from 'path';
import fs from 'fs';

const archive = ZipFile.Open(path.resolve(__dirname, '../041205_DarkSider.zip'));
const tga = archive.Entries[0].Open();

fs.writeFileSync(archive.Entries[0].Name, tga as Buffer);