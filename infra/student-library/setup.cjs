const fs=require("node:fs"),path=require("node:path"),os=require("node:os"),crypto=require("node:crypto"),{execFileSync}=require("node:child_process");
const region="us-east-1",appId="dhyzoanbmeb47",tableName="novasprout-student-library",poolName="NovaSproutStudents";
function aws(service,operation,args=[]){return JSON.parse(execFileSync("aws",[service,operation,...args,"--region",region,"--output","json","--no-cli-pager"],{encoding:"utf8",stdio:["ignore","pipe","pipe"]})||"{}");}
function input(service,operation,value){
 const file=path.join(os.tmpdir(),"ns-library-"+crypto.randomUUID()+".json");
 fs.writeFileSync(file,JSON.stringify(value),{mode:0o600});
 try{return aws(service,operation,["--cli-input-json","file://"+file]);}finally{fs.unlinkSync(file);}
}
try{
 const account=aws("sts","get-caller-identity").Account;
 if(account!=="924225826927")throw Error("The selected AWS account does not match NovaSprout.");
 let pool=aws("cognito-idp","list-user-pools",["--max-results","60"]).UserPools.find(item=>item.Name===poolName);
 if(!pool)pool=input("cognito-idp","create-user-pool",{PoolName:poolName,UserPoolTier:"ESSENTIALS",UsernameAttributes:["email"],AutoVerifiedAttributes:["email"],UsernameConfiguration:{CaseSensitive:false},Policies:{PasswordPolicy:{MinimumLength:12,RequireUppercase:true,RequireLowercase:true,RequireNumbers:true,RequireSymbols:true,TemporaryPasswordValidityDays:7}},Schema:[{Name:"email",AttributeDataType:"String",Mutable:true,Required:true}],AccountRecoverySetting:{RecoveryMechanisms:[{Name:"verified_email",Priority:1}]},AdminCreateUserConfig:{AllowAdminCreateUserOnly:false},EmailConfiguration:{EmailSendingAccount:"COGNITO_DEFAULT"},VerificationMessageTemplate:{DefaultEmailOption:"CONFIRM_WITH_CODE"},DeletionProtection:"ACTIVE",UserPoolTags:{Application:"NovaSprout",Purpose:"StudentLibrary"}}).UserPool;
 const fullPool=aws("cognito-idp","describe-user-pool",["--user-pool-id",pool.Id]).UserPool;
 if(fullPool.UserPoolTier!=="ESSENTIALS"){
   const shape=aws("cognito-idp","update-user-pool",["--generate-cli-skeleton","input"]);
   const update={UserPoolId:pool.Id,UserPoolTier:"ESSENTIALS"};
   for(const key of Object.keys(shape))if(fullPool[key]!==undefined&&key!=="UserPoolId"&&key!=="UserPoolTier")update[key]=fullPool[key];
   input("cognito-idp","update-user-pool",update);
 }
 input("cognito-idp","set-user-pool-mfa-config",{UserPoolId:pool.Id,MfaConfiguration:"ON",SoftwareTokenMfaConfiguration:{Enabled:true}});
 let client=aws("cognito-idp","list-user-pool-clients",["--user-pool-id",pool.Id,"--max-results","60"]).UserPoolClients.find(item=>item.ClientName==="NovaSproutStudentWeb");
 if(!client)client=input("cognito-idp","create-user-pool-client",{UserPoolId:pool.Id,ClientName:"NovaSproutStudentWeb",GenerateSecret:false,AllowedOAuthFlowsUserPoolClient:true,AllowedOAuthFlows:["code"],AllowedOAuthScopes:["openid","email"],SupportedIdentityProviders:["COGNITO"],CallbackURLs:["https://www.novasproutlearning.com/api/student-auth/callback"],DefaultRedirectURI:"https://www.novasproutlearning.com/api/student-auth/callback",LogoutURLs:["https://www.novasproutlearning.com/library"],ReadAttributes:["email","email_verified"],WriteAttributes:["email"],ExplicitAuthFlows:["ALLOW_USER_SRP_AUTH"],PreventUserExistenceErrors:"ENABLED",EnableTokenRevocation:true,RefreshTokenRotation:{Feature:"ENABLED",RetryGracePeriodSeconds:30},AccessTokenValidity:15,IdTokenValidity:15,RefreshTokenValidity:30,TokenValidityUnits:{AccessToken:"minutes",IdToken:"minutes",RefreshToken:"days"}}).UserPoolClient;
 const prefix="novasprout-students-"+account;
 const domain=aws("cognito-idp","describe-user-pool-domain",["--domain",prefix]).DomainDescription;
 if(!domain?.UserPoolId)input("cognito-idp","create-user-pool-domain",{UserPoolId:pool.Id,Domain:prefix,ManagedLoginVersion:2});
 else if(domain.UserPoolId!==pool.Id)throw Error("The student sign-in domain is attached to a different user pool.");
 try{aws("cognito-idp","describe-managed-login-branding-by-client",["--user-pool-id",pool.Id,"--client-id",client.ClientId]);}catch{input("cognito-idp","create-managed-login-branding",{UserPoolId:pool.Id,ClientId:client.ClientId,UseCognitoProvidedValues:true});}
 const tables=aws("dynamodb","list-tables").TableNames;
 if(!tables.includes(tableName))input("dynamodb","create-table",{TableName:tableName,BillingMode:"PAY_PER_REQUEST",DeletionProtectionEnabled:true,AttributeDefinitions:[{AttributeName:"studentId",AttributeType:"S"},{AttributeName:"lessonId",AttributeType:"S"},{AttributeName:"updatedAt",AttributeType:"S"}],KeySchema:[{AttributeName:"studentId",KeyType:"HASH"},{AttributeName:"lessonId",KeyType:"RANGE"}],GlobalSecondaryIndexes:[{IndexName:"student-updated",KeySchema:[{AttributeName:"studentId",KeyType:"HASH"},{AttributeName:"updatedAt",KeyType:"RANGE"}],Projection:{ProjectionType:"INCLUDE",NonKeyAttributes:["title","grade","subject","topic","createdAt","version","percent","completedParts","totalParts","firstTry","corrected","totalChecks"]}}],Tags:[{Key:"Application",Value:"NovaSprout"},{Key:"Purpose",Value:"StudentLibrary"}]});
 execFileSync("aws",["dynamodb","wait","table-exists","--table-name",tableName,"--region",region],{stdio:["ignore","pipe","pipe"]});
 const app=aws("amplify","get-app",["--app-id",appId]).app;
 const env={...app.environmentVariables,STUDENT_USER_POOL_ID:pool.Id,STUDENT_CLIENT_ID:client.ClientId,STUDENT_AUTH_DOMAIN:"https://"+prefix+".auth."+region+".amazoncognito.com",STUDENT_AUTH_REGION:region,STUDENT_LIBRARY_TABLE:tableName,STUDENT_SESSION_SECRET:app.environmentVariables.STUDENT_SESSION_SECRET||crypto.randomBytes(48).toString("base64url")};
 input("amplify","update-app",{appId,environmentVariables:env});
 console.log(JSON.stringify({userPoolId:pool.Id,clientId:client.ClientId,domain:env.STUDENT_AUTH_DOMAIN,table:tableName,configurationSaved:true,mfa:"Authenticator app required",secretsPrinted:false}));
}catch(error){console.error("Student-library setup failed: "+(error.stderr?String(error.stderr):error.message));process.exitCode=1;}
