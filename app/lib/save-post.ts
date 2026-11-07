import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';
const optionalFields = new Set(['platform','problem_url','difficulty','tags','status','solved_at','page_titles']);
export type SavePayload = {title:string;category:string;content:string;[key:string]:unknown};
// Retry only a confirmed schema-validation failure. Never retry permission/network/ambiguous failures.
export async function savePost(payload:SavePayload,id?:string,client:SupabaseClient=supabase){
 const values={...payload};const omitted:string[]=[];
 for(;;){
  const result=id
   ?await client.from('posts').update(values).eq('id',id).select('id').single()
   :await client.from('posts').insert({...values,file_url:''}).select('id').single();
  if(!result.error)return {id:result.data.id as number,omitted};
  const error=result.error;
  const missing=error.code==='PGRST204'?error.message.match(/Could not find the '([a-z_]+)' column/)?.[1]
   :error.code==='42703'?error.message.match(/column "(?:posts\.)?([a-z_]+)"(?: of relation "posts")? does not exist/)?.[1]:undefined;
  if(!missing||!optionalFields.has(missing)||!(missing in values))throw Error(`저장 실패: ${error.message}`);
  delete values[missing];omitted.push(missing);
 }
}
