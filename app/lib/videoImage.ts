import sharp from "sharp";
// Keep a complete, decodable illustration below the cache's item limit.
export async function boundedVideoImage(encoded:string):Promise<string> {
 if(encoded.length<100||encoded.length>6000000||!/^[A-Za-z0-9+/=]+$/.test(encoded))throw new Error("Invalid illustration data");
 const source=Buffer.from(encoded,"base64");if(source[0]!==255||source[1]!==216||source[2]!==255)throw new Error("Invalid illustration format");
 for(const [edge,quality] of [[1024,72],[1024,55],[768,55],[640,45]]){
  const output=await sharp(source,{limitInputPixels:16000000}).rotate().resize({width:edge,height:edge,fit:"inside",withoutEnlargement:true}).jpeg({quality,mozjpeg:true}).toBuffer();
  if(output.byteLength<=270000)return `data:image/jpeg;base64,${output.toString("base64")}`;
 }
 throw new Error("Illustration cannot fit the cache");
}
