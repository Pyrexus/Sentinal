/** Bounded isolate-local optimization; database caching is the persistent source of truth. */
export class ExpiringCache<T> {
  private values = new Map<string, {value:T;expires:number}>();
  private inflight = new Map<string, Promise<T>>();
  constructor(private readonly maxEntries = 100) {}
  get(key:string, now=Date.now()):T|undefined {
    const entry = this.values.get(key);
    if (!entry) return undefined;
    if(entry.expires <= now) {this.values.delete(key);return undefined;}
    return structuredClone(entry.value);
  }
  set(key:string,value:T,ttlMs:number,now=Date.now()) {
    if(this.values.size >= this.maxEntries) {const first = this.values.keys().next().value;if(first) this.values.delete(first);}
    this.values.set(key,{value:structuredClone(value),expires:now+ttlMs});
  }
  async dedupe(key:string,producer:()=>Promise<T>):Promise<T> {
    const existing=this.inflight.get(key);if(existing) return structuredClone(await existing);
    const promise=producer();this.inflight.set(key,promise);
    try{return structuredClone(await promise);}finally{this.inflight.delete(key);}
  }
}
