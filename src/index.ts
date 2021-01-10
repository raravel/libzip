import { ZipArchive, ZipFile } from './zip-archive';
import path from 'path';
import fs from 'fs';

//const archive = ZipFile.Open(path.resolve(__dirname, '../encrypt.zip'));
//const archive = ZipFile.Open(path.resolve(__dirname, '../test.zip'));
//archive.Password = '1234';
//const entry = archive.CreateEntry('test.txt');
//entry.Write(Buffer.from('aaaaaa'));
//archive.Save();
//const tga = archive.Entries[1].Delete();
//console.log(archive.Entries);
//fs.writeFileSync(archive.Entries[0].Name, tga);
//archive.Save();

//archive.Entries[0].ExtractEntry();
//archive.ExtractAll();


//ZipFile.CreateFromDirectory('./src', 't.zip');
ZipFile.ExtractToDirectory('./encrypt.zip', './encrypt', '1234');