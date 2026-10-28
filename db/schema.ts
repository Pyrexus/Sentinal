import { pgTable,text,integer,jsonb,timestamp,primaryKey,index,uniqueIndex } from 'drizzle-orm/pg-core';
import type { AnalysisResult } from '../apps/api/ai/schemas';
import type { RadarItem } from '../shared/types';

const createdAt=()=>timestamp('created_at',{withTimezone:true,mode:'string'}).notNull().defaultNow();
export const users=pgTable('users',{id:text('id').primaryKey(),displayName:text('display_name').notNull(),createdAt:createdAt()});
export const analyses=pgTable('analyses',{
  id:text('id').primaryKey(),userId:text('user_id').references(()=>users.id,{onDelete:'cascade'}),inputHash:text('input_hash').notNull(),
  category:text('category').notNull(),riskScore:integer('risk_score').notNull(),resultJson:jsonb('result_json').$type<AnalysisResult>().notNull(),encryptedContent:text('encrypted_content'),createdAt:createdAt(),
},table=>[index('analyses_hash_date_idx').on(table.inputHash,table.createdAt),index('analyses_user_idx').on(table.userId)]);
export const radarItems=pgTable('radar_items',{id:text('id').primaryKey(),date:text('date').notNull(),title:text('title').notNull(),type:text('type').notNull(),severity:text('severity').notNull(),payloadJson:jsonb('payload_json').$type<RadarItem>().notNull(),source:text('source').notNull()},table=>[index('radar_date_idx').on(table.date)]);
export const activities=pgTable('activities',{
  id:text('id').primaryKey(),userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),key:text('event_key').notNull(),kind:text('kind').notNull(),title:text('title').notNull(),description:text('description').notNull(),xp:integer('xp').notNull().default(0),payload:jsonb('payload').$type<Record<string,unknown>>().notNull().default({}),createdAt:createdAt(),
},table=>[uniqueIndex('activities_user_key_idx').on(table.userId,table.key),index('activities_user_date_idx').on(table.userId,table.createdAt)]);
export const labAttempts=pgTable('lab_attempts',{id:text('id').primaryKey(),userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),scenarioId:text('scenario_id').notNull(),score:integer('score').notNull(),payloadJson:jsonb('payload_json').$type<Record<string,unknown>>().notNull(),createdAt:createdAt()});
export const progress=pgTable('progress',{userId:text('user_id').primaryKey().references(()=>users.id,{onDelete:'cascade'}),xp:integer('xp').notNull().default(0),level:integer('level').notNull().default(1),streak:integer('streak').notNull().default(0),lastActive:text('last_active')});
export const badges=pgTable('badges',{userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),key:text('key').notNull(),createdAt:createdAt()},table=>[primaryKey({columns:[table.userId,table.key]})]);
export const privacyAudits=pgTable('privacy_audits',{id:text('id').primaryKey(),userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),payloadJson:jsonb('payload_json').$type<Record<string,unknown>>().notNull(),createdAt:createdAt()});
export const checklistState=pgTable('checklist_state',{userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),key:text('key').notNull(),checked:integer('checked').notNull().default(0)},table=>[primaryKey({columns:[table.userId,table.key]})]);
export const auditLog=pgTable('audit_log',{id:text('id').primaryKey(),actor:text('actor').references(()=>users.id,{onDelete:'cascade'}),action:text('action').notNull(),ipHash:text('ip_hash').notNull(),createdAt:createdAt()});
export const rateLimits=pgTable('rate_limits',{key:text('key').primaryKey(),count:integer('count').notNull(),expiresAt:timestamp('expires_at',{withTimezone:true,mode:'date'}).notNull()},table=>[index('rate_limits_expiry_idx').on(table.expiresAt)]);
