import { readFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const env = await readFile(new URL('.env.deploy.local', root), 'utf8');
const token = env.split(/\r?\n/).find(x=>x.startsWith('SUPABASE_ACCESS_TOKEN='))?.split('=').slice(1).join('=').trim().replace(/^['"]|['"]$/g,'');
if (!token) throw new Error('Missing local deployment token');
for (const slug of ['parse-decision','analyze-decision']) {
 const form = new FormData();
 form.append('metadata', JSON.stringify({name:slug,entrypoint_path:`${slug}/index.ts`,import_map_path:'deno.json',verify_jwt:false}));
 for (const path of [`${slug}/index.ts`,'_shared/handler.ts','_shared/schema.ts','deno.json']) {
  form.append('file',new Blob([await readFile(new URL(`supabase/functions/${path}`,root))],{type:'application/typescript'}),path);
 }
 try {
  const res=await fetch(`https://api.supabase.com/v1/projects/gsnehtsbeldwclzlcrza/functions/deploy?slug=${slug}`,{method:'POST',headers:{Authorization:`Bearer ${token}`},body:form,signal:AbortSignal.timeout(60000)});
  const body=await res.json();
  console.log(JSON.stringify({function:slug,status:res.status,result:res.ok?{status:body.status,version:body.version,verify_jwt:body.verify_jwt}:body}));
  if(!res.ok) process.exit(1);
 } catch(e) {console.log(JSON.stringify({function:slug,error:e.message,cause:e.cause?.code}));process.exit(1);}
}
