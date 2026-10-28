import {drizzle} from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {radarItems} from './schema';
import {radarSeeds} from '../shared/content';

const url=process.env.DATABASE_URL;
if(!url)throw new Error('Set DATABASE_URL to the Railway public PostgreSQL connection string.');
const client=postgres(url,{max:1,ssl:'require'});
try {
  const db=drizzle(client);
  for(const item of radarSeeds)await db.insert(radarItems).values({id:item.id,date:item.date,title:item.title,type:item.type,severity:item.severity,source:'seed',payloadJson:item}).onConflictDoNothing();
  console.log(`Seeded ${radarSeeds.length} labeled fictional awareness patterns.`);
}finally{await client.end();}
