import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { usedBudget, takeBudget, releaseBudget } from "../../../lib/usageStore";
export const runtime = "nodejs";
function allowed(request: Request) {
  const expected=process.env.ADMIN_DASHBOARD_TOKEN || "";const provided=request.headers.get("x-admin-token") || "";
  return expected && Buffer.byteLength(expected)===Buffer.byteLength(provided) && crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(provided));
}
export async function GET(request: Request) {
  if (!allowed(request)) return NextResponse.json({error:"Unauthorized"},{status:401});
  try { await usedBudget("web:health");return NextResponse.json({usageLedger:"reachable",model:process.env.OPENAI_MODEL},{headers:{"Cache-Control":"no-store"}}); }
  catch { return NextResponse.json({error:"The usage ledger is not reachable."},{status:503}); }
}
export async function POST(request: Request) {
  if (!allowed(request)) return NextResponse.json({error:"Unauthorized"},{status:401});
  try {
    const key="qa:"+crypto.randomUUID();const expiry=Date.now()+3600000;
    const first=await takeBudget(key,1,expiry);const second=await takeBudget(key,1,expiry);
    await releaseBudget(key);const used=await usedBudget(key);
    return NextResponse.json({accepted:first,blocked:!second,restored:used===0},{headers:{"Cache-Control":"no-store"}});
  } catch { return NextResponse.json({error:"Usage enforcement check failed."},{status:503}); }
}
