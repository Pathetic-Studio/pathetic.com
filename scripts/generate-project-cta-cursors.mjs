// Pixel-grid companions to cursor-98.svg: every pixel is the same 6px square.
// SVG sources remain editable; PNGs provide native cursor support across browsers.
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve('next/package.json'))('sharp');
const art = {
  pointer: [
    '.....###..........','....#ooo#.........','....#ooo#.........','....#ooo#.........',
    '....#ooo#.........','....#ooo#.........','....#ooo####......','....#ooo#oo###....',
    '....#ooo#oo#oo##..','....#ooo#oo#oo#o#.','.##.#oooooooooo#..','#oo##oooooooooo#..',
    '#ooo#oooooooooo#..','.#ooooooooooooo#..','..#oooooooooooo#..','...#oooooooooo#...',
    '....#ooooooooo#...','.....#ooooooo#....','.....#ooooooo#....','.....#########....',
  ],
  grab: [
    '.......##...........','...##.#oo#.##.......','..#oo##oo##oo#......','..#oo##oo##oo#.##...',
    '..#oo##oo##oo##oo#..','..#oo##oo##oo##oo#..','..#oo##oo##oo##oo#..','..#ooo#oo#ooo#oo#...',
    '...#oooooooooooo#...','...#oooooooooooo#...','.###oooooooooooo#...','#ooo#ooooooooooo#...',
    '#oooo#oooooooooo#...','.#ooooooooooooo#....','..#oooooooooooo#....','...#oooooooooo#.....',
    '....#oooooooo#......','.....#oooooo#.......','.....#oooooo#.......','.....########.......',
  ],
  grabbing: [
    '..................','..................','..................','..................',
    '.....########.....','...##oo#oo#oo##...','..#oooo#oo#oo#o#..','..#oooo#oo#oo#o#..',
    '..#oooooooooooo#..','..#oooooooooooo#..','.##oooo####oooo#..','#ooo###oooo#ooo#..',
    '#ooooooooooo#oo#..','#oooooooooooooo#..','.#oooooooooooo#...','..#ooooooooooo#...',
    '...#ooooooooo#....','....#ooooooo#.....','....#ooooooo#.....','....#########.....',
  ],
  text: [
    '.####.####.','.#oo###oo#.','.####o####.','....#o#....','....#o#....',
    '....#o#....','....#o#....','....#o#....','....#o#....','...##o##...',
    '...##o##...','....#o#....','....#o#....','....#o#....','....#o#....',
    '....#o#....','....#o#....','.####o####.','.#oo###oo#.','.####.####.',
  ],
  wait: [
    '.############.','.#oooooooooo#.','.############.','..#oooooooo#..','..#oooooooo#..',
    '..#oooooooo#..','...#oooooo#...','....#oooo#....','.....#oo#.....','......##......',
    '......##......','.....#oo#.....','....#oooo#....','...#oooooo#...','..#oooooooo#..',
    '..#oooooooo#..','..#oooooooo#..','.############.','.#oooooooooo#.','.############.',
  ],
  'not-allowed': [
    '.....#######.....','...##ooooooo##...','..#ooooooooooo#..','.#oo##ooooooooo#.',
    '.#oo###oooooooo#.','#oooo###oooooooo#','#ooooo###ooooooo#','#oooooo###oooooo#',
    '#ooooooo###ooooo#','#oooooooo###oooo#','#ooooooooo###ooo#','#oooooooooo###oo#',
    '.#oooooooooo##o#.','.#ooooooooooooo#.','..#ooooooooooo#..','...##ooooooo##...',
    '.....#######.....',
  ],
  'resize-ew': [
    '....#.........#....','...##.........##...','..#o#.........#o#..','.#oo###########oo#.',
    '#ooooooooooooooooo#','.#oo###########oo#.','..#o#.........#o#..','...##.........##...',
    '....#.........#....',
  ],
};
const transpose = (rows) => Array.from({length:rows[0].length},(_,x)=>rows.map(row=>row[x]).join(''));
art['resize-ns'] = transpose(art['resize-ew']);
const move = Array.from({length:19},()=>Array(19).fill('.'));
for(let y=0;y<art['resize-ew'].length;y++)for(let x=0;x<19;x++)move[y+5][x]=art['resize-ew'][y][x];
for(let y=0;y<19;y++)for(let x=0;x<9;x++)if(art['resize-ns'][y][x]!=='.')move[y][x+5]=art['resize-ns'][y][x];
for(let y=8;y<=10;y++)for(let x=8;x<=10;x++)move[y][x]='o';
art.move=move.map(row=>row.join(''));
const dir=new URL('../public/images/project-cta/cursors/',import.meta.url);
await mkdir(dir,{recursive:true});
for(const [name,rows] of Object.entries(art)){
 const width=Math.max(...rows.map(row=>row.length));
 if(width>20||rows.length>20)throw new Error(`Cursor exceeds browser limits: ${name}`);
 const rectangles=[];
 rows.forEach((row,y)=>[...row].forEach((pixel,x)=>{if(pixel!=='.')rectangles.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${pixel==='#'?'#1b1e1e':'#fff'}"/>`)}));
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width*6}" height="${rows.length*6}" viewBox="0 0 ${width} ${rows.length}" shape-rendering="crispEdges">${rectangles.join('')}</svg>\n`;
 await writeFile(new URL(`${name}.svg`,dir),svg);
 await sharp(Buffer.from(svg)).png().toFile(new URL(`${name}.png`,dir).pathname);
 console.log(name,`${width*6}×${rows.length*6}`);
}
