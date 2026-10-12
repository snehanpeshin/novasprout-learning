import { NextResponse } from "next/server";
import { isAiAccessAllowed } from "../../../lib/aiAccess";
import { trustedOrigin } from "../../../lib/webAiAccess";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    trustedOrigin(request);
    if (!await isAiAccessAllowed(request)) return NextResponse.json({error:"That private access code is not valid."},{status:401});
    return NextResponse.json({active:true},{headers:{"Cache-Control":"no-store"}});
  } catch { return NextResponse.json({error:"Access verification is temporarily unavailable."},{status:503}); }
}
