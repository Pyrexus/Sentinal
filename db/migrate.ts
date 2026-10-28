import {readFile} from 'node:fs/promises';
import {drizzle} from 'drizzle-orm/postgres-js';
import {sql} from 'drizzle-orm';
import postgres from 'postgres';

const url=process.env.DATABASE_URL;
if(!url)throw new Error('Set DATABASE_URL to the Railway public PostgreSQL connection string.');
const client=postgres(url,{max:1,ssl:'require'});
try {
  const migration=await readFile(new URL('./migrations/0000_sentinel.sql',import.meta.url),'utf8');
  const db=drizzle(client);
  await db.transaction(async tx=>{for(const statement of migration.split(';').map(item=>item.trim()).filter(Boolean))await tx.execute(sql.raw(statement));});
  console.log('Sentinel migration applied.');
}finally{await client.end();}
