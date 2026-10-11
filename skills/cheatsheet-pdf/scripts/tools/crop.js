const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
// usage: node crop.js <out.png> <l%> <t%> <w%> <h%> [source.png]
// The image URL carries a cache-busting query: with a persistent Chrome profile the same
// file:// URL keeps serving a stale cached bitmap, which silently shows the PREVIOUS build.
const [out,l,t,w,h,srcArg]=process.argv.slice(2);
const dir=require('../lib/env').WORK, src=path.resolve(dir, srcArg||'preview.png');
const outPath=path.resolve(dir, out);
const bust='?v='+Date.now();
const html='<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:#fff}#box{position:relative;overflow:hidden}img{position:absolute}</style></head><body><div id="box"><img id="i" src="file:///'+src.replace(/\\/g,'/')+bust+'"></div><script>var img=document.getElementById("i");img.onload=function(){var W=img.naturalWidth,H=img.naturalHeight;var cw=W*'+Number(w)+'/100,ch=H*'+Number(h)+'/100;var sc=Math.min(3.4,1600/cw);var box=document.getElementById("box");box.style.width=Math.round(cw*sc)+"px";box.style.height=Math.round(ch*sc)+"px";img.style.width=Math.round(W*sc)+"px";img.style.height=Math.round(H*sc)+"px";img.style.left=-Math.round(W*'+Number(l)+'/100*sc)+"px";img.style.top=-Math.round(H*'+Number(t)+'/100*sc)+"px";};</script></body></html>';
fs.writeFileSync(path.join(dir,'_crop.html'),html,'utf8');
const { chromePath: _cp, profile: _pf } = require('../lib/env');
execFileSync(_cp(),['--headless=new','--disable-gpu','--no-sandbox','--no-first-run','--user-data-dir='+_pf('crop'),'--disable-crash-reporter','--disable-breakpad','--window-size=1620,1100','--hide-scrollbars','--virtual-time-budget=3000','--screenshot='+outPath,'file:///'+path.join(dir,'_crop.html').replace(/\\/g,'/')],{stdio:'ignore'});
console.log('cropped -> '+out+'   from '+path.basename(src));