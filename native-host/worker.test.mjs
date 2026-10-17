import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.mjs';
test('rejects unknown proxy routes',async()=>assert.equal((await worker.fetch(new Request('https://site.test/api/scoring/admin'),{})).status,404));
test('blocks cross origin uploads',async()=>assert.equal((await worker.fetch(new Request('https://site.test/api/scoring/v1/score',{method:'POST',headers:{origin:'https://other.test'}}),{})).status,403));
test('missing configuration is explicit',async()=>assert.equal((await worker.fetch(new Request('https://site.test/api/scoring/healthz'),{})).status,503));
test('forwards scoring with server secret, preserves status and body',async()=>{
const original=globalThis.fetch;let seen;
globalThis.fetch=async(url,options)=>{seen={url,options};return Response.json({status:'unclear'},{status:200});};
try {
 const r=await worker.fetch(new Request('https://site.test/api/scoring/v1/score',{method:'POST',headers:{origin:'https://site.test','content-type':'multipart/form-data; boundary=x'},body:'test'}),{KIDS_SCORING_URL:'https://backend.test',KIDS_SCORING_API_KEY:'test-only'});
 assert.equal(seen.options.redirect,'manual');assert.equal(seen.url,'https://backend.test/v1/score');assert.equal(seen.options.headers.get('X-Api-Key'),'test-only');assert.deepEqual(await r.json(),{status:'unclear'});assert.equal(r.headers.get('X-Api-Key'),null);
}finally{globalThis.fetch=original;}});
