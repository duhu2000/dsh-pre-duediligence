export function receiptStorage() {
 const records=new Map();let open=false;
 return {records,async open(spec){
  if(open)throw new Error('already-open');open=true;
  const schema=spec.tables.views.valueSchema;
  return {table:()=>({get:k=>structuredClone(records.get(k)),entries:()=>[...records].map(([k,v])=>[k,structuredClone(v)]),put:async(k,v)=>{records.set(k,structuredClone(schema.parse(v)));},delete:async k=>records.delete(k)}),close:async()=>{open=false;}};
 }};
}
