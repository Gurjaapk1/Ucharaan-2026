// Deterministic artwork and hit targets share one coordinate system.
// Pass a path to an installed sharp package when regenerating outside the app.
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const sharp = require(process.argv[2] || 'sharp');
const width = 390, height = 3730;
const nodes = Array.from({ length: 38 }, (_, i) => ({ pauri: i + 1, x: Math.round(195 + 94 * Math.sin(i * Math.PI / 2)), y: 112 + i * 94 }));
const parts = [`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>
<linearGradient id="land" x2="0" y2="1"><stop stop-color="#e3d9a7"/><stop offset=".18" stop-color="#d3dcb6"/><stop offset=".36" stop-color="#bfcfb0"/><stop offset=".54" stop-color="#d4dfcb"/><stop offset=".72" stop-color="#d9d5aa"/><stop offset="1" stop-color="#c0d3b2"/></linearGradient>
<g id="tree"><ellipse cy="13" rx="21" ry="8" fill="#769779" opacity=".18"/><path d="M0 9V-18" stroke="#8a8060" stroke-width="5"/><path d="M-20-12Q-24-34-7-37Q5-51 19-32Q33-15 12-6Q-7 1-20-12" fill="#78966f"/><path d="M-13-22Q-11-39 1-38Q17-38 18-24Q5-32-13-22" fill="#91aa7d"/></g>
<g id="cypress"><ellipse cy="12" rx="12" ry="5" fill="#78936f" opacity=".2"/><path d="M0 12V-27" stroke="#8a8060" stroke-width="3"/><path d="M0-57Q-25-6 0 1Q25-6 0-57" fill="#65856e"/></g>
<g id="stone"><ellipse rx="9" ry="5" fill="#b2b4a0"/><path d="M-7-1Q-3-9 5-4L8 0Z" fill="#d8d7bd"/></g>
</defs><path fill="url(#land)" d="M0 0H390V3730H0Z"/>`];
// Broad land contours overlap gently; no panel edges, sky strips or horizons.
for(let i=0;i<13;i++){
 const y=90+i*295;
 parts.push(`<path d="M0 ${y-130}Q130 ${y-90} 70 ${y+40}Q10 ${y+140} 0 ${y+195}Z" fill="${['#b9c593','#c6d2a8','#9fbda0'][i%3]}" opacity=".55"/>`);
 parts.push(`<path d="M390 ${y-20}Q270 ${y+25} 321 ${y+120}Q370 ${y+205} 390 ${y+225}Z" fill="${['#e9d696','#b4cba9','#c8d7bf'][i%3]}" opacity=".7"/>`);
 parts.push(`<path d="M0 ${y+155}Q45 ${y+115} 82 ${y+145}" fill="none" stroke="#eff0d4" stroke-width="2" opacity=".4"/>`);
}
// A river meanders along the edge of the same world, with one crossing.
parts.push('<path d="M401 360Q325 520 367 680T370 900Q344 1010 286 1052Q208 1100 205 1190Q215 1310 328 1380Q408 1460 384 1610T410 1940" fill="none" stroke="#a4c9ca" stroke-width="42"/>');
parts.push('<path d="M401 360Q325 520 367 680T370 900Q344 1010 286 1052Q208 1100 205 1190Q215 1310 328 1380Q408 1460 384 1610T410 1940" fill="none" stroke="#c4ded7" stroke-width="3"/>');
for(let i=0;i<24;i++){
 const y=75+i*150, x=i%2?354:34;
 parts.push(`<use href="#${i%4===0?'cypress':'tree'}" transform="translate(${x} ${y}) scale(${i%3===0?.8:1})"/>`);
 if(i%3===0)parts.push(`<use href="#stone" transform="translate(${x+15} ${y+52})"/>`);
}
// Small, quiet landmarks sit beside the route.
parts.push('<g transform="translate(24 470)"><ellipse cx="23" cy="12" rx="25" ry="12" fill="#aaa886"/><ellipse cx="23" cy="8" rx="25" ry="12" fill="#e4dbc0"/><ellipse cx="23" cy="8" rx="19" ry="8" fill="#a4c9ca"/></g>');
parts.push('<g transform="translate(322 2130)"><path d="M0 0H44V39H0Z" fill="#d7c99f"/><path d="M-5 0L22-24 49 0Z" fill="#9c9671"/><path d="M16 39V18Q22 10 28 18V39" fill="#99966d"/></g>');
parts.push('<g transform="translate(14 2720)" fill="none" stroke="#b9b38b" stroke-width="5"><path d="M0 0Q35-18 63 0M0 15Q35-3 63 15M0 30Q35 12 63 30"/></g>');
let d=`M${nodes[0].x} 0 L${nodes[0].x} ${nodes[0].y}`;
for(let i=1;i<nodes.length;i++){const a=nodes[i-1],b=nodes[i];d+=` C${a.x} ${a.y+47} ${b.x} ${b.y-47} ${b.x} ${b.y}`;}
d+=` Q${nodes.at(-1).x} 3680 195 3730`;
parts.push(`<path d="${d}" fill="none" stroke="#b8aa79" stroke-width="27" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#f3e6b9" stroke-width="21" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#fff5d8" stroke-width="2" opacity=".65"/>`);
for(const n of nodes)parts.push(`<ellipse cx="${n.x}" cy="${n.y+3}" rx="34" ry="25" fill="#b8aa79"/><ellipse cx="${n.x}" cy="${n.y}" rx="33" ry="24" fill="#f3e6b9"/>`);
parts.push('</svg>');
const root=new URL('../',import.meta.url);
writeFileSync(new URL('public/assets/japji-connected-map.svg',root),parts.join('\n'));
await sharp(Buffer.from(parts.join('\n'))).resize(780,7460).png().toFile(fileURLToPath(new URL('public/assets/japji-connected-map.png',root)));
writeFileSync(new URL('src/KidsMode/journey-map.json',root),JSON.stringify({width,height,image:'japji-connected-map.png',nodes},null,2)+'\n');
