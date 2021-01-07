import { FileManager } from './file-manager';
import { ZipArchive, ZipFile } from './zip-archive';
import path from 'path';
import fs from 'fs';

const archive = ZipFile.Open(path.resolve(__dirname, '../encrypt.zip'));
archive.Password = '1234';
const tga = archive.Entries[1].Delete();
console.log(archive);
//fs.writeFileSync(archive.Entries[0].Name, tga);