import crypto from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
const database = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AI_USAGE_REGION || "us-east-1", maxAttempts: 3 }), { marshallOptions: { removeUndefinedValues: true } });
function table() { const name=process.env.AI_USAGE_TABLE; if (!name) throw new Error("The usage ledger is unavailable."); return name; }
function id(value: string) { return crypto.createHash("sha256").update(value).digest("hex"); }
async function transact(command: TransactWriteCommand) {
  for (let attempt=0; attempt<4; attempt++) {
    try { await database.send(command); return true; }
    catch (error: any) {
      if (error.name === "TransactionCanceledException" && error.CancellationReasons?.some((reason: any)=>reason.Code === "ConditionalCheckFailed")) return false;
      if ((error.name === "TransactionConflictException" || error.CancellationReasons?.some((reason: any)=>reason.Code === "TransactionConflict")) && attempt<3) { await new Promise(resolve=>setTimeout(resolve, 30 * 2**attempt)); continue; }
      throw error;
    }
  }
  return false;
}
export async function takeBudget(key: string, limit: number, expiresAt: number) {
  const maximum = key.startsWith("web:step:") && key.endsWith(":audio") ? 60 : 20;
  if (!Number.isInteger(limit) || limit<1 || limit>maximum || expiresAt<=Date.now()) return false;
  const durable = key.startsWith("web:purchase:");
  return transact(new TransactWriteCommand({ ClientRequestToken: crypto.randomUUID(), TransactItems:[{Update:{TableName:table(),Key:{id:id(key)},UpdateExpression:durable ? "SET #used = if_not_exists(#used, :zero) + :one" : "SET #used = if_not_exists(#used, :zero) + :one, #ttl = :ttl",ConditionExpression:"attribute_not_exists(#used) OR #used < :limit",ExpressionAttributeNames:durable ? {"#used":"used"} : {"#used":"used","#ttl":"expiresAt"},ExpressionAttributeValues:{":zero":0,":one":1,":limit":limit,...(durable ? {} : {":ttl":Math.floor(expiresAt/1000)+30*86400})}}}] }));
}
export async function usedBudget(key: string) {
  const result=await database.send(new GetCommand({TableName:table(),Key:{id:id(key)},ConsistentRead:true}));return Number(result.Item?.used || 0);
}
export async function releaseBudget(key: string) {
  return transact(new TransactWriteCommand({ClientRequestToken:crypto.randomUUID(),TransactItems:[{Update:{TableName:table(),Key:{id:id(key)},UpdateExpression:"SET #used = #used - :one",ConditionExpression:"#used >= :one",ExpressionAttributeNames:{"#used":"used"},ExpressionAttributeValues:{":one":1}}}]}));
}
export async function refundFailedResponse(responseId: string, budgetKey: string) {
  if (!budgetKey.startsWith("web:")) return false;
  // The refund marker and decrement succeed together, even under repeated polling.
  return transact(new TransactWriteCommand({ClientRequestToken:id("refund:"+responseId).slice(0,36),TransactItems:[
    {Put:{TableName:table(),Item:{id:id("refund:"+responseId),budget:id(budgetKey)},ConditionExpression:"attribute_not_exists(id)"}},
    {Update:{TableName:table(),Key:{id:id(budgetKey)},UpdateExpression:"SET #used = #used - :one",ConditionExpression:"#used >= :one",ExpressionAttributeNames:{"#used":"used"},ExpressionAttributeValues:{":one":1}}}
  ]}));
}

export async function cachedVideoLesson(responseId:string,owner:string) {
 const result=await database.send(new GetCommand({TableName:table(),Key:{id:id("video:plan:v1:"+responseId)},ConsistentRead:true}));
 return result.Item?.owner===owner&&Number(result.Item.expiresAt)*1000>Date.now() ? result.Item.plan : null;
}
export async function saveVideoLesson(responseId:string,owner:string,plan:unknown,expiresAt:number) {
 await database.send(new PutCommand({TableName:table(),Item:{id:id("video:plan:v1:"+responseId),owner,plan,expiresAt:Math.floor(expiresAt/1000)},ConditionExpression:"attribute_not_exists(id)"}));
}
