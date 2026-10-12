import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {boundedVideoImage} from "../app/lib/videoImage.ts";
test("detailed oversized JPEGs are resized to a real image that fits the cache",async()=>{
 const pixels=Buffer.alloc(1536*1024*3);let state=42;for(let i=0;i<pixels.length;i++){state=(Math.imul(state,1664525)+1013904223)>>>0;pixels[i]=state>>>24;}
 const source=await sharp(pixels,{raw:{width:1536,height:1024,channels:3}}).jpeg({quality:95}).toBuffer();assert(source.length>300000);
 const url=await boundedVideoImage(source.toString("base64")),output=Buffer.from(url.split(",")[1],"base64"),metadata=await sharp(output).metadata();assert(output.length<=270000);assert.equal(metadata.format,"jpeg");assert(metadata.width!<=1024&&metadata.height!<=1024);assert(metadata.width!>500);
});
test("truncated or unsupported illustration data cannot be cached as a broken picture",async()=>{
 await assert.rejects(boundedVideoImage(Buffer.from([255,216,255,...new Array(130).fill(0)]).toString("base64")));
 await assert.rejects(boundedVideoImage("A".repeat(6000004)));
});
