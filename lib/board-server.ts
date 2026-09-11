import { env } from 'cloudflare:workers';
export const ROLES=['Modeller','Builder','Scripter','Animator','SFX artist','VFX artist'];
export function database():D1Database { const db=(env as unknown as {DB:D1Database}).DB; if(!db) throw new Error('Storage unavailable');return db; }
export function bucket():R2Bucket {return (env as unknown as {BUCKET:R2Bucket}).BUCKET;}
export const hex=(b:ArrayBuffer)=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
export async function digest(s:string){return hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));}
export async function passwordHash(password:string,salt:string){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new TextEncoder().encode(salt),iterations:100000},k,256));}
export async function viewer(request:Request){const token=request.headers.get('cookie')?.match(/(?:^|;\s*)sf_session=([^;]+)/)?.[1];if(!token)return null;return database().prepare('SELECT u.id,u.username,u.about,u.avatar,u.scale,u.roles FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>?').bind(await digest(token),Date.now()).first();}
export function fail(message:string,status=400){return Response.json({error:message},{status});}
export function clean(v:unknown,max=100){return typeof v==='string'?v.trim().slice(0,max):'';}
export async function seed(){const db=database();await db.batch([
db.prepare('INSERT OR IGNORE INTO categories (id,name) VALUES (?,?)').bind('part1','Part 1 Content'),
db.prepare('INSERT OR IGNORE INTO categories (id,name) VALUES (?,?)').bind('part2','Part 2 Content'),
...['Stands','Fighting Styles','Weapons'].map((n,i)=>db.prepare('INSERT OR IGNORE INTO channels (id,category_id,name) VALUES (?,?,?)').bind(['stands','styles','weapons'][i],'part1',n)),
db.prepare('INSERT OR IGNORE INTO cards (id,channel_id,name,description,image,tags) VALUES (?,?,?,?,?,?)').bind('star-platinum','stands','Star Platinum','','','["Close range","Power"]'),
db.prepare('INSERT OR IGNORE INTO task_groups (id,card_id,name) VALUES (?,?,?)').bind('heavy-punch','star-platinum','Heavy Punch'),
...['Animation','SFX','VFX','Backend','Hitbox'].map((n,i)=>db.prepare('INSERT OR IGNORE INTO tasks (id,group_id,name,done) VALUES (?,?,?,?)').bind('heavy-'+i,'heavy-punch',n,i===3?1:0))]);}
