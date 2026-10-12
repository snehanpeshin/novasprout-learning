import assert from "node:assert/strict";
import test from "node:test";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { takeBudget, usedBudget, releaseBudget, refundFailedResponse } from "../app/lib/usageStore.ts";
process.env.AI_USAGE_TABLE="test-ledger";
async function capture(action: () => Promise<any>, failure?: any) {
  const original=DynamoDBDocumentClient.prototype.send;const inputs:any[]=[];
  DynamoDBDocumentClient.prototype.send=(async (command:any) => {inputs.push(command);if (failure) throw failure;return {Item:{used:3}};}) as any;
  try {const result=await action();return {result,inputs};} finally {DynamoDBDocumentClient.prototype.send=original;}
}
test("single-lesson counters are durable so a restored purchase cannot replay after TTL deletion",async()=>{
  const {inputs,result}=await capture(()=>takeBudget("web:purchase:cs_paid",1,Date.now()+86400000));
  assert.equal(result,true);assert.equal(inputs[0].input.TransactItems[0].Update.ExpressionAttributeValues[":limit"],1);
  assert.equal(inputs[0].input.TransactItems[0].Update.ExpressionAttributeNames["#ttl"],undefined);
  assert.ok(inputs[0].input.ClientRequestToken);
});
test("a confirmed quota condition rejects another generation",async()=>{
  const {result}=await capture(()=>takeBudget("web:month:sub:1",20,Date.now()+86400000),{name:"TransactionCanceledException",CancellationReasons:[{Code:"ConditionalCheckFailed"}]});assert.equal(result,false);
});
test("a storage failure cannot turn into paid access",async()=>{
  await assert.rejects(capture(()=>takeBudget("web:month:sub:1",20,Date.now()+86400000),new Error("unreachable")));
});
test("usage displays use consistent reads",async()=>{
  const {result,inputs}=await capture(()=>usedBudget("web:month:sub:1"));assert.equal(result,3);assert.ok(inputs[0] instanceof GetCommand);assert.equal(inputs[0].input.ConsistentRead,true);
});
test("failed-response refund marker and decrement are one atomic transaction",async()=>{
  const {inputs}=await capture(()=>refundFailedResponse("resp_failed","web:purchase:cs_paid"));
  const actions=inputs[0].input.TransactItems;assert.equal(actions.length,2);assert.match(actions[0].Put.ConditionExpression,/attribute_not_exists/);assert.equal(actions[1].Update.ExpressionAttributeValues[":one"],1);
  const next=await capture(()=>refundFailedResponse("resp_failed","web:purchase:cs_paid"));assert.equal(next.inputs[0].input.ClientRequestToken,inputs[0].input.ClientRequestToken);
});
test("invalid allowances or expired lessons never write usage",async()=>{
  const {result,inputs}=await capture(()=>takeBudget("web:step:expired",0,Date.now()-1));assert.equal(result,false);assert.equal(inputs.length,0);
});
