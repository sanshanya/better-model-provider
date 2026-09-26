window.__ModuleLoader__.load({
	id: "better-model-provider",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;

"use strict";var J=Object.defineProperty;var lt=Object.getOwnPropertyDescriptor;var dt=Object.getOwnPropertyNames;var ct=Object.prototype.hasOwnProperty;var pt=(e,t,n)=>t in e?J(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n;var ft=(e,t)=>{for(var n in t)J(e,n,{get:t[n],enumerable:!0})},ut=(e,t,n,r)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of dt(t))!ct.call(e,i)&&i!==n&&J(e,i,{get:()=>t[i],enumerable:!(r=lt(t,i))||r.enumerable});return e};var mt=e=>ut(J({},"__esModule",{value:!0}),e);var le=(e,t,n)=>pt(e,typeof t!="symbol"?t+"":t,n);var Wt={};ft(Wt,{CapabilitiesSection:()=>xe,HarnessRpcError:()=>D,apply:()=>_t,inject:()=>Lt,name:()=>Dt,refreshIfLoaded:()=>Se});module.exports=mt(Wt);var it=require("react");function E(e){return e==null}function Y(e){return e&&typeof e=="object"&&!Array.isArray(e)}function Pe(e,t){return Object.fromEntries(Object.entries(e).filter(([n,r])=>t(n,r)))}function M(e,t){return Object.fromEntries(Object.entries(e).map(([n,r])=>[n,t(r,n)]))}function Ee(e,t,n){if(!t)return{...e};let r={};for(let i of t)(n||e[i]!==void 0)&&(r[i]=e[i]);return r}var gt=Symbol.for("cosmokit.volatile.write");function q(e){return typeof e=="object"&&e!==null&&gt in e}function $(e,t){return arguments.length===1?n=>$(e,n):e in globalThis&&t instanceof globalThis[e]||Object.prototype.toString.call(t).slice(8,-1)===e}function Q(e){return $("ArrayBuffer",e)||$("SharedArrayBuffer",e)}function bt(e){return Q(e)||ArrayBuffer.isView(e)}var A;(function(e){e.is=Q,e.isSource=bt;function t(s){return ArrayBuffer.isView(s)?s.buffer.slice(s.byteOffset,s.byteOffset+s.byteLength):s}e.fromSource=t;function n(s){if(s=t(s),typeof Buffer<"u")return Buffer.from(s).toString("base64");let a="",p=new Uint8Array(s);for(let d=0;d<p.byteLength;d++)a+=String.fromCharCode(p[d]);return btoa(a)}e.toBase64=n;function r(s){return typeof Buffer<"u"?t(Buffer.from(s,"base64")):Uint8Array.from(atob(s),a=>a.charCodeAt(0))}e.fromBase64=r;function i(s){return s=t(s),typeof Buffer<"u"?Buffer.from(s).toString("hex"):Array.from(new Uint8Array(s),a=>a.toString(16).padStart(2,"0")).join("")}e.toHex=i;function o(s){if(typeof Buffer<"u")return t(Buffer.from(s,"hex"));let a=s.length%2===0?s:s.slice(0,s.length-1),p=[];for(let d=0;d<a.length;d+=2)p.push(parseInt(`${a[d]}${a[d+1]}`,16));return Uint8Array.from(p).buffer}e.fromHex=o})(A||(A={}));var zt=A.fromBase64,Kt=A.toBase64,Ut=A.fromHex,Ht=A.toHex;function G(e,t=new Map){if(!e||typeof e!="object")return e;if($("Date",e))return new Date(e.valueOf());if($("RegExp",e))return new RegExp(e.source,e.flags);if(Q(e))return e.slice(0);if(ArrayBuffer.isView(e))return e.buffer.slice(e.byteOffset,e.byteOffset+e.byteLength);let n=t.get(e);if(n)return n;if(Array.isArray(e)){let i=[];return t.set(e,i),e.forEach((o,s)=>{i[s]=Reflect.apply(G,null,[o,t])}),i}let r=Object.create(Object.getPrototypeOf(e));t.set(e,r);for(let i of Reflect.ownKeys(e)){let o={...Reflect.getOwnPropertyDescriptor(e,i)};"value"in o&&(o.value=Reflect.apply(G,null,[o.value,t])),Reflect.defineProperty(r,i,o)}return r}function X(e,t,n){let r=new Set;function i(o,s){if(o===s)return!0;if(q(o)||q(s))return q(o)&&q(s);if(!n&&E(o)&&E(s))return!0;if(typeof o!=typeof s||typeof o!="object"||!o||!s||r.has(o))return!1;function a(p,d){return p(o)?p(s)?d(o,s):!1:p(s)?!1:void 0}r.add(o);try{return a(Array.isArray,(p,d)=>{if(p.length!==d.length)return!1;for(let g=0;g<p.length;g++)if(!i(p[g],d[g]))return!1;return!0})??a($("Date"),(p,d)=>p.valueOf()===d.valueOf())??a($("URL"),(p,d)=>p.href===d.href)??a($("RegExp"),(p,d)=>p.source===d.source&&p.flags===d.flags)??a(Q,(p,d)=>{if(p.byteLength!==d.byteLength)return!1;let g=new Uint8Array(p),v=new Uint8Array(d);for(let f=0;f<g.length;f++)if(g[f]!==v[f])return!1;return!0})??((!n||[o,s].every(p=>Object.getPrototypeOf(p)===Object.prototype||Object.getPrototypeOf(p)===null))&&Object.keys({...o,...s}).every(p=>i(o[p],s[p])))}finally{r.delete(o)}}return i(e,t)}var Ne;(function(e){e.millisecond=1,e.second=1e3,e.minute=e.second*60,e.hour=e.minute*60,e.day=e.hour*24,e.week=e.day*7;let t=new Date().getTimezoneOffset();function n(c){t=c}e.setTimezoneOffset=n;function r(){return t}e.getTimezoneOffset=r;function i(c=new Date,u){return typeof c=="number"&&(c=new Date(c)),u===void 0&&(u=t),Math.floor((c.valueOf()/e.minute-u)/1440)}e.getDateNumber=i;function o(c,u){let h=new Date(c*e.day);return u===void 0&&(u=t),new Date(+h+u*e.minute)}e.fromDateNumber=o;let s=/\d+(?:\.\d+)?/.source,a=new RegExp(`^${["w(?:eek(?:s)?)?","d(?:ay(?:s)?)?","h(?:our(?:s)?)?","m(?:in(?:ute)?(?:s)?)?","s(?:ec(?:ond)?(?:s)?)?"].map(c=>`(${s}${c})?`).join("")}$`);function p(c){let u=a.exec(c);return u?(parseFloat(u[1])*e.week||0)+(parseFloat(u[2])*e.day||0)+(parseFloat(u[3])*e.hour||0)+(parseFloat(u[4])*e.minute||0)+(parseFloat(u[5])*e.second||0):0}e.parseTime=p;function d(c){let u=p(c);return u?c=Date.now()+u:/^\d{1,2}(:\d{1,2}){1,2}$/.test(c)?c=`${new Date().toLocaleDateString()}-${c}`:/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(c)&&(c=`${new Date().getFullYear()}-${c}`),c?new Date(c):new Date}e.parseDate=d;function g(c){let u=Math.abs(c);return u>=e.day-e.hour/2?Math.round(c/e.day)+"d":u>=e.hour-e.minute/2?Math.round(c/e.hour)+"h":u>=e.minute-e.second/2?Math.round(c/e.minute)+"m":u>=e.second?Math.round(c/e.second)+"s":c+"ms"}e.format=g;function v(c,u=2){return c.toString().padStart(u,"0")}e.toDigits=v;function f(c,u=new Date){return c.replace("yyyy",u.getFullYear().toString()).replace("yy",u.getFullYear().toString().slice(2)).replace("MM",v(u.getMonth()+1)).replace("dd",v(u.getDate())).replace("hh",v(u.getHours())).replace("mm",v(u.getMinutes())).replace("ss",v(u.getSeconds())).replace("SSS",v(u.getMilliseconds(),3))}e.template=f})(Ne||(Ne={}));var Z=Symbol.for("schemastery"),Ae=Symbol.for("ValidationError");globalThis.__schemastery_index__??(globalThis.__schemastery_index__=0);globalThis.__schemastery_refs__=void 0;var w=class extends TypeError{constructor(t,n){let r="$";for(let i of n.path||[])typeof i=="string"?r+="."+i:typeof i=="number"?r+="["+i+"]":typeof i=="symbol"&&(r+=`[Symbol(${i.toString()})]`);r.startsWith(".")&&(r=r.slice(1));super((r==="$"?"":`${r} `)+t);le(this,"options");le(this,"name","ValidationError");this.options=n}static is(t){return!!t?.[Ae]}};Object.defineProperty(w.prototype,Ae,{value:!0});var l=function(e){let t=function(n,r={}){return l.resolve(n,t,r)[0]};if(e.refs){let n=M(e.refs,i=>new l(i)),r=i=>n[i];for(let i in n){let o=n[i];o.sKey=r(o.sKey),o.inner=r(o.inner),o.list=o.list&&o.list.map(r),o.dict=o.dict&&M(o.dict,r)}return n[e.uid]}if(Object.assign(t,e),typeof t.callback=="string")try{t.callback=new Function("return "+t.callback)()}catch{}return Object.defineProperty(t,"uid",{value:globalThis.__schemastery_index__++}),Object.setPrototypeOf(t,l.prototype),t.meta||(t.meta={}),t.toString=t.toString.bind(t),t};l.prototype=Object.create(Function.prototype);l.prototype[Z]=!0;Object.defineProperty(l.prototype,"~standard",{get(){return{version:1,vendor:"schemastery",validate:e=>{try{return{value:l.resolve(e,this,{})[0]}}catch(t){if(w.is(t))return{issues:[{message:t.message,path:t.options.path}]};throw t}}}}});l.ValidationError=w;l.prototype.toJSON=function(){var n,r;if(globalThis.__schemastery_refs__)return(n=globalThis.__schemastery_refs__)[r=this.uid]??(n[r]=JSON.parse(JSON.stringify({...this}))),this.uid;globalThis.__schemastery_refs__={[this.uid]:{...this}},globalThis.__schemastery_refs__[this.uid]=JSON.parse(JSON.stringify({...this}));let t={uid:this.uid,refs:globalThis.__schemastery_refs__};return globalThis.__schemastery_refs__=void 0,t};l.prototype.set=function(t,n){return this.dict[t]=n,this};l.prototype.push=function(t){return this.list.push(t),this};function yt(e,t){let n=typeof e=="string"?{"":e}:{...e};for(let r in t){let i=t[r];i?.$description||i?.$desc?n[r]=i.$description||i.$desc:typeof i=="string"&&(n[r]=i)}return n}function F(e){return e?.$value??e?.$inner}function Te(e){return Pe(e??{},t=>!t.startsWith("$"))}l.prototype.i18n=function(t){let n=l(this),r=yt(n.meta.description,t);return Object.keys(r).length&&(n.meta.description=r),n.dict&&(n.dict=M(n.dict,(i,o)=>i.i18n(M(t,s=>F(s)?.[o]??s?.[o])))),n.list&&(n.list=n.list.map((i,o)=>i.i18n(M(t,(s={})=>Array.isArray(F(s))?F(s)[o]:Array.isArray(s)?s[o]:Te(s))))),n.inner&&(n.inner=n.inner.i18n(M(t,i=>F(i)?F(i):Te(i)))),n.sKey&&(n.sKey=n.sKey.i18n(M(t,i=>i?.$key))),n};l.prototype.extra=function(t,n){let r=l(this);return r.meta={...r.meta,[t]:n},r};for(let e of["required","disabled","collapse","hidden","loose"])Object.assign(l.prototype,{[e](t=!0){let n=l(this);return n.meta={...n.meta,[e]:t},n}});l.prototype.deprecated=function(){var n;let t=l(this);return(n=t.meta).badges||(n.badges=[]),t.meta.badges.push({text:"deprecated",type:"danger"}),t};l.prototype.experimental=function(){var n;let t=l(this);return(n=t.meta).badges||(n.badges=[]),t.meta.badges.push({text:"experimental",type:"warning"}),t};l.prototype.pattern=function(t){let n=l(this),r=Ee(t,["source","flags"]);return n.meta={...n.meta,pattern:r},n};l.prototype.simplify=function(t){if(X(t,this.meta.default,this.type==="dict"))return null;if(E(t))return t;if(this.type==="object"||this.type==="dict"){let n={};for(let r in t){let i=(this.type==="object"?this.dict[r]:this.inner)?.simplify(t[r]);(this.type==="dict"||!E(i))&&(n[r]=i)}return X(n,this.meta.default,this.type==="dict")?null:n}else if(this.type==="array"||this.type==="tuple"){let n=[];return t.forEach((r,i)=>{let o=this.type==="array"?this.inner:this.list[i],s=o?o.simplify(r):r;n.push(s)}),n}else if(this.type==="intersect"){let n={};for(let r of this.list)Object.assign(n,r.simplify(t));return n}else if(this.type==="union")for(let n of this.list)try{return l.resolve(t,n,{}),n.simplify(t)}catch{}return t};l.prototype.toString=function(t){return je[this.type]?.(this,t)??`Schema<${this.type}>`};l.prototype.role=function(e,t){let n=l(this);return n.meta={...n.meta,role:e,extra:t},n};for(let e of["default","link","comment","description","max","min","step"])Object.assign(l.prototype,{[e](t){let n=l(this);return n.meta={...n.meta,[e]:t},n}});var Me={};l.extend=function(t,n){Me[t]=n};l.resolve=function(t,n,r={},i=!1){if(!n)return[t];if(r.ignore?.(t,n))return[t];if(E(t)&&n.type!=="lazy"){if(n.meta.required)throw new w("missing required value",r);let s=n,a=n.meta.default;for(;s?.type==="intersect"&&E(a);)s=s.list[0],a=s?.meta.default;if(E(a))return[t];t=G(a)}let o=Me[n.type];if(!o)throw new w(`unsupported type "${n.type}"`,r);try{return o(t,n,r,i)}catch(s){if(!n.meta.loose)throw s;return[n.meta.default]}};l.from=function(t){if(E(t))return l.any();if(["string","number","boolean"].includes(typeof t))return l.const(t).required();if(t[Z])return t;if(typeof t=="function")switch(t){case String:return l.string().required();case Number:return l.number().required();case Boolean:return l.boolean().required();case Function:return l.function().required();default:return l.is(t).required()}else throw new TypeError(`cannot infer schema from ${t}`)};l.lazy=function(t){let n=()=>(r.inner[Z]||(r.inner=r.builder(),r.inner.meta={...r.meta,...r.inner.meta}),r.inner.toJSON()),r=new l({type:"lazy",builder:t,inner:{toJSON:n}});return r};l.natural=function(){return l.number().step(1).min(0)};l.percent=function(){return l.number().step(.01).min(0).max(1).role("slider")};l.date=function(){return l.union([l.is(Date),l.transform(l.string().role("datetime"),(t,n)=>{let r=new Date(t);if(isNaN(+r))throw new w(`invalid date "${t}"`,n);return r},!0)])};l.regExp=function(t=""){return l.union([l.is(RegExp),l.transform(l.string().role("regexp",{flag:t}),(n,r)=>{try{return new RegExp(n,t)}catch(i){throw new w(i.message,r)}},!0)])};l.arrayBuffer=function(t){return l.union([l.is(ArrayBuffer),l.is(SharedArrayBuffer),l.transform(l.any(),(n,r)=>{if(A.isSource(n))return A.fromSource(n);throw new w(`expected ArrayBufferSource but got ${n}`,r)},!0),...t?[l.transform(l.string(),(n,r)=>{try{return t==="base64"?A.fromBase64(n):A.fromHex(n)}catch(i){throw new w(i.message,r)}},!0)]:[]])};l.extend("lazy",(e,t,n,r)=>(t.inner[Z]||(t.inner=t.builder(),t.inner.meta={...t.meta,...t.inner.meta}),l.resolve(e,t.inner,n,r)));l.extend("any",e=>[e]);l.extend("never",(e,t,n)=>{throw new w(`expected nullable but got ${e}`,n)});l.extend("const",(e,{value:t},n)=>{if(X(e,t))return[t];throw new w(`expected ${t} but got ${e}`,n)});function pe(e,t,n,r,i=!1){let{max:o=1/0,min:s=-1/0}=t;if(e>o)throw new w(`expected ${n} <= ${o} but got ${e}`,r);if(e<s&&!i)throw new w(`expected ${n} >= ${s} but got ${e}`,r)}l.extend("string",(e,{meta:t},n)=>{if(typeof e!="string")throw new w(`expected string but got ${e}`,n);if(t.pattern){let r=new RegExp(t.pattern.source,t.pattern.flags);if(!r.test(e))throw new w(`expect string to match regexp ${r}`,n)}return pe(e.length,t,"string length",n),[e]});function de(e,t){let n=e.toString();if(n.includes("e"))return e*Math.pow(10,t);let r=n.indexOf(".");if(r===-1)return e*Math.pow(10,t);let i=n.slice(r+1),o=n.slice(0,r);return i.length<=t?+(o+i.padEnd(t,"0")):+(o+i.slice(0,t)+"."+i.slice(t))}function ht(e,t,n){if(n=Math.abs(n),!/^\d+\.\d+$/.test(n.toString()))return(e-t)%n===0;let r=n.toString().indexOf("."),i=n.toString().slice(r+1).length;return Math.abs(de(e,i)-de(t,i))%de(n,i)===0}l.extend("number",(e,{meta:t},n)=>{if(typeof e!="number")throw new w(`expected number but got ${e}`,n);pe(e,t,"number",n);let{step:r}=t;if(r&&!ht(e,t.min??0,r))throw new w(`expected number multiple of ${r} but got ${e}`,n);return[e]});l.extend("boolean",(e,t,n)=>{if(typeof e=="boolean")return[e];throw new w(`expected boolean but got ${e}`,n)});l.extend("bitset",(e,{bits:t,meta:n},r)=>{let i=0,o=[];if(typeof e=="number"){i=e;for(let s in t)e&t[s]&&o.push(s)}else if(Array.isArray(e)){o=e;for(let s of o){if(typeof s!="string")throw new w(`expected string but got ${s}`,r);s in t&&(i|=t[s])}}else throw new w(`expected number or array but got ${e}`,r);return i===n.default?[i]:[i,o]});l.extend("function",(e,t,n)=>{if(typeof e=="function")return[e];throw new w(`expected function but got ${e}`,n)});l.extend("is",(e,{constructor:t},n)=>{if(typeof t=="function"){if(e instanceof t)return[e];throw new w(`expected ${t.name} but got ${e}`,n)}else{if(E(e))throw new w(`expected ${t} but got ${e}`,n);let r=Object.getPrototypeOf(e);for(;r;){if(r.constructor?.name===t)return[e];r=Object.getPrototypeOf(r)}throw new w(`expected ${t} but got ${e}`,n)}});function ee(e,t,n,r){try{let[i,o]=l.resolve(e[t],n,{...r,path:[...r.path||[],t]});return o!==void 0&&(e[t]=o),i}catch(i){if(!r?.autofix)throw i;return delete e[t],n.meta.default}}l.extend("array",(e,{inner:t,meta:n},r)=>{if(!Array.isArray(e))throw new w(`expected array but got ${e}`,r);return pe(e.length,n,"array length",r,!E(t.meta.default)),[e.map((i,o)=>ee(e,o,t,r))]});l.extend("dict",(e,{inner:t,sKey:n},r,i)=>{if(!Y(e))throw new w(`expected object but got ${e}`,r);let o={};for(let s in e){let a;try{a=l.resolve(s,n,r)[0]}catch(p){if(i)continue;throw p}o[a]=ee(e,s,t,r),e[a]=e[s],s!==a&&delete e[s]}return[o]});l.extend("tuple",(e,{list:t},n,r)=>{if(!Array.isArray(e))throw new w(`expected array but got ${e}`,n);let i=t.map((o,s)=>ee(e,s,o,n));return r?[i]:(i.push(...e.slice(t.length)),[i])});function ce(e,t){for(let n in t)n in e||(e[n]=t[n])}l.extend("object",(e,{dict:t},n,r)=>{if(!Y(e))throw new w(`expected object but got ${e}`,n);let i={};for(let o in t){let s=ee(e,o,t[o],n);(!E(s)||o in e)&&(i[o]=s)}return r||ce(i,e),[i]});l.extend("union",(e,{list:t,toString:n},r,i)=>{let o=[];for(let s of t)try{return l.resolve(e,s,r,i)}catch(a){o.push(a)}throw new w(`expected ${n()} but got ${JSON.stringify(e)}`,r)});l.extend("intersect",(e,{list:t,toString:n},r,i)=>{if(!t.length)return[e];let o;for(let s of t){let a=l.resolve(e,s,r,!0)[0];if(!E(a))if(E(o))o=a;else{if(typeof o!=typeof a)throw new w(`expected ${n()} but got ${JSON.stringify(e)}`,r);if(typeof a=="object")ce(o??(o={}),a);else if(o!==a)throw new w(`expected ${n()} but got ${JSON.stringify(e)}`,r)}}return!i&&Y(e)&&ce(o,e),[o]});l.extend("transform",(e,{inner:t,callback:n,preserve:r},i)=>{let[o,s=e]=l.resolve(e,t,i,!0);return r?[n(o)]:[n(o),n(s)]});var je={};function C(e,t,n){je[e]=n,Object.assign(l,{[e](...r){let i=new l({type:e});return t.forEach((o,s)=>{switch(o){case"sKey":i.sKey=r[s]??l.string();break;case"inner":i.inner=l.from(r[s]);break;case"list":i.list=r[s].map(l.from);break;case"dict":i.dict=M(r[s],l.from);break;case"bits":i.bits={};for(let a in r[s])typeof r[s][a]=="number"&&(i.bits[a]=r[s][a]);break;case"callback":{let a=i.callback=r[s];a.toJSON||(a.toJSON=()=>a.toString());break}case"constructor":{let a=i.constructor=r[s];typeof a=="function"&&(a.toJSON||(a.toJSON=()=>a.name));break}default:i[o]=r[s]}}),e==="object"||e==="dict"?i.meta.default={}:e==="array"||e==="tuple"?i.meta.default=[]:e==="bitset"&&(i.meta.default=0),i}})}C("is",["constructor"],({constructor:e})=>typeof e=="function"?e.name:e);C("any",[],()=>"any");C("never",[],()=>"never");C("const",["value"],({value:e})=>typeof e=="string"?JSON.stringify(e):e);C("string",[],()=>"string");C("number",[],()=>"number");C("boolean",[],()=>"boolean");C("bitset",["bits"],()=>"bitset");C("function",[],()=>"function");C("array",["inner"],({inner:e})=>`${e.toString(!0)}[]`);C("dict",["inner","sKey"],({inner:e,sKey:t})=>`{ [key: ${t.toString()}]: ${e.toString()} }`);C("tuple",["list"],({list:e})=>`[${e.map(t=>t.toString()).join(", ")}]`);C("object",["dict"],({dict:e})=>Object.keys(e).length===0?"{}":`{ ${Object.entries(e).map(([t,n])=>`${t}${n.meta.required?"":"?"}: ${n.toString()}`).join(", ")} }`);C("union",["list"],({list:e},t)=>{let n=e.map(({toString:r})=>r()).join(" | ");return t?`(${n})`:n});C("intersect",["list"],({list:e})=>`${e.map(t=>t.toString(!0)).join(" & ")}`);C("transform",["inner","callback","preserve"],({inner:e},t)=>e.toString(t));var D=class extends Error{constructor(n,r,i){super(r);this.code=n;this.details=i;this.name="HarnessRpcError"}};function z(e,t){let n=e;for(let r of t){if(Array.isArray(n)){n=n[Number(r)];continue}if(typeof n!="object"||n===null)return;n=n[r]}return n}function fe(e,t){if(t.length===0)return e!==void 0;let n=z(e,t.slice(0,-1)),r=t[t.length-1];return Array.isArray(n)?Number(r)<n.length:typeof n!="object"||n===null?!1:r in n}function $e(e,t){let n=e;for(let r of t){if(n===null||typeof n!="object"&&typeof n!="function")return;let i=n;if(i.type==="object"&&i.dict!==void 0)n=i.dict[r];else if(i.type==="dict"||i.type==="array")n=i.inner;else return}return n}function wt(e){try{return new l(e)}catch{return}}function te(e){if(!e.ok)throw new D(e.error.code,e.error.message,e.error.details);return e.value}var V="llm-pi-ai",vt="\0probe";function K(e){return e instanceof Error?e.message:String(e)}function Ie(e){let t=e;return t?.type!=="union"||t.list===void 0?[]:t.list.map(n=>n.value).filter(n=>typeof n=="string")}function xt(e){let t={levels:[],modalities:[]};if(e===void 0)return t;let n=$e(wt(e.schema),["providers",vt,"models"]),r=n?.type==="array"?n.inner:void 0;if(r?.type!=="object"||r.dict===void 0)return t;let i=r.dict.reasoningEfforts,o=i?.type==="union"&&i.list!==void 0?i.list.find(d=>d.type==="dict"):void 0,s=o===void 0?[]:Ie(o.sKey),a=r.dict.input,p=a?.type==="array"?Ie(a.inner):[];return{levels:s,modalities:p}}function De(e){if(e===void 0||e===!1)return!0;if(typeof e!="object"||e===null||Array.isArray(e))return!1;let t=Object.entries(e);if(t.length===0)return!1;let n=!1;for(let[r,i]of t){if(r.length===0)return!1;if(i===null){if(r!=="off")return!1}else if(typeof i!="string"||i.length===0)return!1;r!=="off"&&(n=!0)}return n}function Le(e,t){return e===void 0?!0:Array.isArray(e)?e.every(n=>typeof n=="string"&&n.length>0&&(t===void 0||t.includes(n))):!1}function _e(e,t,n="value"){let r=z((n==="user"?e.user:e.value)??{},t);return typeof r=="object"&&r!==null&&!Array.isArray(r)?r:{}}function U(e,t,n="value"){let r=_e(e,t,n).models;return Array.isArray(r)?r.map(i=>typeof i=="object"&&i!==null&&!Array.isArray(i)?i:{}):[]}function re(e,t){return fe(e.user??{},[...t,"models"])}function kt(e,t){return re(e,t)&&U(e,t,"user").length>0}function W(e,t,n="value"){let r=_e(e,t,n).modelOverrides;if(typeof r!="object"||r===null||Array.isArray(r))return{};let i={};for(let[o,s]of Object.entries(r))i[o]=typeof s=="object"&&s!==null&&!Array.isArray(s)?s:{};return i}function St(e,t){return t.declared!==!1?re(e,t.settingsPath)?"declared-models":"inherited-models":kt(e,t.settingsPath)?"declared-models":U(e,t.settingsPath).length===0?"catalog-overrides":"inherited-models"}function Ct(e){let t=e,n=new Set;return{getSnapshot:()=>t,setSnapshot(r){if(Object.is(r,t))return;t=r;let i=Array.from(n);for(let o of i)o()},subscribe(r){return n.add(r),()=>{n.delete(r)}}}}var ne=class{constructor(t){this.api=t;this.store=Ct({status:"idle",error:null,writable:!0,namespace:void 0,rows:[],dormant:[],levels:[],modalities:[]});this.generation=0;this.disposed=!1;this.mutationTail=Promise.resolve();this.discoveries=new Map}dispose(){this.disposed=!0,this.generation+=1,this.discoveries.clear()}discoverOfficialModels(t){if(this.disposed)return Promise.reject(new Error("better-model-provider: controller disposed"));let n=this.discoveries.get(t);if(n!==void 0)return n;let r=this.api.llm.discoverModels(V,{provider:t}).then(te);return this.discoveries.set(t,r),r.catch(()=>{this.discoveries.get(t)===r&&!this.disposed&&this.discoveries.delete(t)}),r}load(){if(this.disposed)return Promise.resolve();let t=++this.generation;return this.discoveries.clear(),this.runLoad(t)}isCurrent(t){return!this.disposed&&t===this.generation}async runLoad(t){let n=this.store.getSnapshot();n.namespace===void 0&&this.store.setSnapshot({...n,status:"loading",error:null});try{let[r,i]=await Promise.all([this.api.settings.describe().then(te),this.api.llm.listConfigurableProviders().then(te)]);if(!this.isCurrent(t))return;let o=r.namespaces.find(a=>a.ns===V),s=i.filter(a=>a.settingsNs===V).map(a=>({entry:a,configured:o!==void 0&&fe(o.value??{},a.settingsPath),models:o===void 0?[]:U(o,a.settingsPath),writeMode:o===void 0?"inherited-models":St(o,a),overrides:o===void 0?{}:W(o,a.settingsPath,"user")}));this.store.setSnapshot({status:"ready",error:null,writable:r.writable,namespace:o,rows:s.filter(a=>a.configured&&a.entry.declared!==void 0),dormant:s.filter(a=>!a.configured&&a.entry.declared===!1),...xt(o)})}catch(r){if(!this.isCurrent(t))return;this.store.getSnapshot().namespace===void 0&&this.store.setSnapshot({...this.store.getSnapshot(),status:"error",error:K(r)})}}async commit(t){return this.enqueueMutation(async()=>{try{if(this.disposed)throw new Error("better-model-provider: controller disposed");let n=this.store.getSnapshot().namespace;if(n===void 0)throw new Error("better-model-provider: settings namespace unavailable");let r=t(n);if(r.length===0)return!1;let i=this.prepareMutation(),o=te(await this.api.settings.mutate(V,r,i.revision));return this.store.setSnapshot({...this.store.getSnapshot(),namespace:o}),await this.reload(),!0}catch(n){throw await this.reload(),n}})}enqueueMutation(t){let n=this.mutationTail.then(t,t);return this.mutationTail=n.then(()=>{},()=>{}),n}prepareMutation(){return this.generation+=1,this.store.getSnapshot().namespace}async reload(){await this.load()}};function Rt(e){let t=e.get("remote.settings"),n=e.get("remote.llm");return t!==void 0&&n!==void 0?{kind:"ready",api:{settings:t,llm:n}}:t!==void 0?{kind:"partial",awaiting:"remote.llm"}:n!==void 0?{kind:"partial",awaiting:"remote.settings"}:{kind:"absent"}}var Ot="internal/service";function Nt(e){return e.kind==="absent"?"better-model-provider: no harness Remote face is available yet \u2014 neither remote.settings nor remote.llm has arrived; the capabilities section stays idle and registers the moment the pair is announced":`better-model-provider: ${e.awaiting} has not arrived \u2014 the harness mounts its Remote namespaces sequentially; the capabilities section registers as soon as it does`}function Ve(e,t){let n=!1,r=!1,i=()=>{if(r)return!0;let s=Rt(e);if(s.kind!=="ready")return n||(n=!0,console.warn(Nt(s))),!1;r=!0;try{t(s.api)}catch(a){console.error("better-model-provider: the Remote face resolved but mounting the capabilities section threw \u2014 the section stays unregistered rather than taking the harness dispatch down",a)}return!0};if(i())return;let o=e.on(Ot,()=>{i()&&o()});e.effect(()=>o,"better-model-provider: remote face await")}var et=require("react");var T=require("react");function We(e,t){let n=e.reasoningEfforts,r=e.input;return t.reasoning!==n&&(t.reasoning===void 0||n===void 0||t.reasoning===!1||n===!1||JSON.stringify(t.reasoning)!==JSON.stringify(n))||t.input!==r&&(t.input===void 0||r===void 0||JSON.stringify(t.input)!==JSON.stringify(r))||t.contextWindow!==e.contextWindow||t.maxTokens!==e.maxTokens}var me=[["reasoning","reasoningEfforts"],["input","input"],["contextWindow","contextWindow"],["maxTokens","maxTokens"]],ue=me.map(([,e])=>e);function Pt(e,t){let n={...e};for(let[r,i]of me){let o=t[r];o!==void 0&&(o.value===void 0?Reflect.deleteProperty(n,i):n[i]=Array.isArray(o.value)?[...o.value]:typeof o.value=="object"?{...o.value}:o.value)}return n}function Be(e,t,n,r,i){let o=U(e,t,"user");if(!re(e,t)||n<0||n>=o.length)return[];let s=o[n],a=s!==void 0&&(s.id??"")===r?n:-1;if(a<0&&(a=o.findIndex(d=>(d.id??"")===r)),a<0)return[];let p=o.map((d,g)=>g===a?Pt(d,i):{...d});return[{op:"set",path:[...t,"models"],value:p}]}function ge(e){return e===void 0?!1:ue.some(t=>t in e)}function Fe(e,t){let n=Object.keys(z(e.user??{},t));return n.length===1&&n[0]==="modelOverrides"}function ze(e,t,n,r){let i=W(e,t,"user"),o=i[n],s=[],a=[];for(let[p,d]of me){let g=r[p];if(g===void 0)continue;let v=[...t,"modelOverrides",n,d];if(g.value===void 0)o!==void 0&&d in o&&a.push(d);else{let f=g.value;s.push({op:"set",path:v,value:Array.isArray(f)?[...f]:typeof f=="object"?{...f}:f})}}return s.length>0?[...s,...a.map(p=>({op:"unset",path:[...t,"modelOverrides",n,p]}))]:a.length===0||o===void 0?[]:Object.keys(o).filter(p=>!a.includes(p)).length===0?Object.keys(i).length!==1?[{op:"unset",path:[...t,"modelOverrides",n]}]:Fe(e,t)?[{op:"unset",path:[...t]}]:[{op:"unset",path:[...t,"modelOverrides"]}]:a.map(p=>({op:"unset",path:[...t,"modelOverrides",n,p]}))}function Ke(e,t,n){let r=W(e,t,"user"),i=r[n];return i===void 0?[]:Object.keys(i).filter(a=>!ue.includes(a)).length>0?ue.filter(a=>a in i).map(a=>({op:"unset",path:[...t,"modelOverrides",n,a]})):Object.keys(r).length===1?Fe(e,t)?[{op:"unset",path:[...t]}]:[{op:"unset",path:[...t,"modelOverrides"]}]:[{op:"unset",path:[...t,"modelOverrides",n]}]}var Et=/^(\d+(?:\.\d+)?)([km])?$/i,H={k:1e3,m:1e6},be={contextWindow:"256K",maxTokens:"32K"};function ye(e){let t=e.trim();if(t.length===0)return;let n=Et.exec(t);if(n===null)return Number.NaN;let r=n[2]?.toLowerCase(),i=r==="k"||r==="m"?H[r]:1,o=Number(n[1])*i,s=Math.round(o);return Math.abs(o-s)<1e-6?s:o}function I(e){return typeof e!="number"||!Number.isInteger(e)||e<=0?typeof e=="number"||typeof e=="string"?String(e):"":e%H.m===0?`${String(e/H.m)}M`:e%H.k===0?`${String(e/H.k)}K`:String(e)}function he(e){return e===void 0||Number.isInteger(e)&&e>=1}var _=require("react");var L=require("react");var y=require("react/jsx-runtime");function ie(e,t){return e instanceof D&&e.code==="settings/conflict"?t("conflict"):K(e)}function we(e){let{pointing:t}=e;return(0,y.jsx)("svg",{viewBox:"0 0 16 16",width:"12",height:"12","aria-hidden":"true",children:(0,y.jsx)("path",{d:t==="up"?"M4 10l4-4 4 4":t==="down"?"M4 6l4 4 4-4":"M6 4l4 4-4 4",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"})})}function Ue(e){let{label:t,mode:n,enabled:r,options:i,onChange:o}=e;return(0,y.jsx)("select",{className:"bmp-select","aria-label":t,value:n,disabled:!r,onChange:s=>o(s.target.value),children:i.map(([s,a])=>(0,y.jsx)("option",{value:s,children:a},s))})}function Tt(e){return e===void 0?"":e===!1?"off":"custom"}function At(e,t){let n=e[t];return typeof n=="string"?n:""}function He(e){let{levels:t,value:n,onChange:r,enabled:i,t:o,modelId:s,official:a}=e,[p,d]=(0,L.useState)(!1),g=(0,L.useRef)(null),v=Tt(n);if((0,L.useEffect)(()=>{v!=="custom"&&d(!1)},[v]),(0,L.useEffect)(()=>{if(!p)return;let m=N=>{g.current!==null&&N.target instanceof Node&&!g.current.contains(N.target)&&d(!1)},x=N=>{N.key==="Escape"&&d(!1)};return document.addEventListener("mousedown",m),document.addEventListener("keydown",x),()=>{document.removeEventListener("mousedown",m),document.removeEventListener("keydown",x)}},[p]),t.length===0)return null;let f=typeof n=="object"&&n!==null?n:void 0,c=f===void 0?[]:t.filter(m=>m in f),u=m=>{if(m==="")r(void 0);else if(m==="off")r(!1);else{if(a){r({});return}let x=t.filter(k=>k==="medium"||k==="max"),N=x.length>0?x:t.filter(k=>k!=="off").slice(0,2);N.length===0?r({off:null}):r(Object.fromEntries(N.map(k=>[k,k])))}},h=(m,x,N)=>{let k={...m};N?k[x]=x==="off"?null:a?"":x:Reflect.deleteProperty(k,x),r(k)},O=(m,x,N)=>{let k={...m};N===""&&x==="off"?k[x]=null:k[x]=N,r(k)};return(0,y.jsxs)("div",{className:"bmp-block",ref:g,children:[(0,y.jsx)("div",{className:"bmp-blockLabel",children:o("modelReasoning")}),(0,y.jsxs)("div",{className:"bmp-modeGrid",children:[(0,y.jsx)(Ue,{label:o("modelReasoning"),mode:v,enabled:i,options:[["",o(a?"keepOfficial":"inherit")],["off",o(a?"disableReasoning":"reasoningOff")],["custom",o(a?"customMapping":"custom")]],onChange:u}),v==="custom"&&f!==void 0&&(0,y.jsxs)("div",{className:"bmp-msWrap",children:[(0,y.jsxs)("button",{type:"button",className:"bmp-select bmp-msButton","aria-haspopup":"dialog","aria-expanded":p,"aria-controls":`bmp-levels-${s}`,disabled:!i,onClick:()=>d(m=>!m),children:[(0,y.jsx)("span",{children:o("levelsSelected",{count:c.length})}),(0,y.jsx)(we,{pointing:p?"up":"down"})]}),p&&(0,y.jsx)("div",{className:"bmp-msPanel",id:`bmp-levels-${s}`,role:"group","aria-label":o("levelGroup",{model:s}),children:t.map(m=>(0,y.jsxs)("div",{className:"bmp-msItem",children:[(0,y.jsxs)("label",{className:"bmp-msItemCheck",children:[(0,y.jsx)("input",{type:"checkbox",disabled:!i,checked:m in f,onChange:x=>h(f,m,x.target.checked)}),(0,y.jsx)("span",{children:m})]}),m in f&&(0,y.jsx)("input",{className:"bmp-input bmp-msWire","aria-label":`${m} ${o("wire")}`,placeholder:m==="off"?"null":a?"\u2026":m,value:At(f,m),disabled:!i,onChange:x=>O(f,m,x.target.value)})]},m))})]})]}),a&&v==="custom"&&(0,y.jsx)("p",{className:"bmp-muted",children:o("wireMapNote")})]})}function Je(e){let{modalities:t,value:n,onChange:r,enabled:i,t:o,modelId:s,official:a}=e;if(t.length===0)return null;let p=n??[],d=p.length===0?"":"custom",g=f=>{r(f===""?void 0:t.slice(0,1))},v=(f,c)=>{let u=c?[...p,f]:p.filter(h=>h!==f);r(u.length===0?void 0:u)};return(0,y.jsxs)("div",{className:"bmp-block",children:[(0,y.jsx)("div",{className:"bmp-blockLabel",children:o("modelInput")}),(0,y.jsxs)("div",{className:"bmp-modeGrid",children:[(0,y.jsx)(Ue,{label:o("modelInput"),mode:d,enabled:i,options:[["",o(a?"keepOfficial":"inherit")],["custom",o("custom")]],onChange:g}),d==="custom"&&(0,y.jsx)("div",{className:"bmp-modalityRow",role:"group","aria-label":o("modalityGroup",{model:s}),children:t.map(f=>(0,y.jsxs)("label",{className:"bmp-toggle",children:[(0,y.jsx)("input",{type:"checkbox",disabled:!i,checked:p.includes(f),onChange:c=>v(f,c.target.checked)}),(0,y.jsx)("span",{children:f})]},f))})]})]})}function qe(e){let{contextText:t,maxText:n,onChange:r,enabled:i,t:o,modelId:s,officialContext:a,officialMax:p}=e,d=(g,v,f,c,u)=>(0,y.jsxs)("label",{className:"bmp-capacityField",children:[(0,y.jsx)("span",{className:"bmp-blockLabel",children:g}),(0,y.jsx)("input",{className:"bmp-input","aria-label":`${g} (${s})`,placeholder:v,inputMode:"numeric",value:f,disabled:!i,onChange:h=>r(c,h.target.value)}),u!==void 0&&(0,y.jsx)("span",{className:"bmp-officialHint",children:o("officialValue",{value:u})})]});return(0,y.jsx)("div",{className:"bmp-block",children:(0,y.jsxs)("div",{className:"bmp-capacityGrid",children:[d(o("modelContextWindow"),be.contextWindow,t,"contextWindowText",a),d(o("modelMaxTokens"),be.maxTokens,n,"maxTokensText",p)]})})}var S=require("react/jsx-runtime"),Ge={reasoningTouched:!1,inputTouched:!1,capacityTouched:!1,contextWindowText:"",maxTokensText:""};function Mt(e,t){return{reasoning:t?.reasoningTouched===!0?t.reasoning:e.reasoningEfforts,input:t?.inputTouched===!0?t.input:e.input,contextWindow:t?.capacityTouched===!0?ye(t.contextWindowText):e.contextWindow,maxTokens:t?.capacityTouched===!0?ye(t.maxTokensText):e.maxTokens}}function jt(e,t){let n={};return t.reasoningTouched&&(n.reasoning={value:e.reasoning}),t.inputTouched&&(n.input={value:e.input}),t.capacityTouched&&(n.contextWindow={value:e.contextWindow},n.maxTokens={value:e.maxTokens}),n}function ve(e){let{entry:t,modelId:n,displayName:r,writable:i,levels:o,modalities:s,flavor:a,applyRow:p,resetRow:d,officialContext:g,officialMax:v,t:f}=e,[c,u]=(0,_.useState)(!1),[h,O]=(0,_.useState)(null),[m,x]=(0,_.useState)(!1),[N,k]=(0,_.useState)(null),oe=(0,_.useRef)(null),j=Mt(t,h),ot=h!==null&&We(t,j),Ce=P=>{O(B=>({...Ge,...B,...P})),k(null)},Re=async(P,B)=>{x(!0),k(null);try{await P()&&B?.()}catch(se){k(ie(se,f))}finally{x(!1)}},Oe=()=>{oe.current?.focus(),O(null)},st=P=>{if(!De(j.reasoning)){k(f("modelReasoningInvalid"));return}if(!Le(j.input,s.length===0?void 0:[...s])){k(f("modelInputInvalid"));return}if(!he(j.contextWindow)||!he(j.maxTokens)){k(f("modelCapacityInvalid"));return}Re(()=>p(P),Oe)},at=P=>{Re(P,()=>oe.current?.focus())};return(0,S.jsxs)("div",{className:"bmp-modelRow",children:[(0,S.jsxs)("div",{className:"bmp-modelMain",children:[(0,S.jsx)("span",{className:"bmp-modelId",title:n,children:n}),r!==""&&r!==n&&(0,S.jsx)("span",{className:"bmp-modelName",children:r}),h!==null&&(0,S.jsx)("span",{className:"bmp-staged",children:f("staged")}),(0,S.jsx)("button",{ref:oe,type:"button",className:"bmp-icon","aria-label":f(c?"collapse":"expand"),"aria-expanded":c,onClick:()=>u(P=>!P),children:(0,S.jsx)(we,{pointing:c?"down":"right"})})]}),c&&(0,S.jsxs)("div",{className:"bmp-modelAdvanced",children:[(0,S.jsx)(qe,{contextText:h?.capacityTouched===!0?h.contextWindowText:I(t.contextWindow),maxText:h?.capacityTouched===!0?h.maxTokensText:I(t.maxTokens),onChange:(P,B)=>{O(se=>{let ae=se??Ge;return{...ae.capacityTouched?ae:{...ae,contextWindowText:I(t.contextWindow),maxTokensText:I(t.maxTokens)},capacityTouched:!0,[P]:B}}),k(null)},enabled:i&&!m,t:f,modelId:n,officialContext:g,officialMax:v}),(0,S.jsx)(He,{levels:o,value:j.reasoning,onChange:P=>Ce({reasoningTouched:!0,reasoning:P}),enabled:i&&!m,t:f,modelId:n,official:a==="catalog"}),(0,S.jsx)(Je,{modalities:s,value:j.input,onChange:P=>Ce({inputTouched:!0,input:P}),enabled:i&&!m,t:f,modelId:n,official:a==="catalog"}),N!==null&&(0,S.jsx)("div",{className:"bmp-error",role:"alert",children:N}),d!==void 0&&h===null&&(0,S.jsx)("div",{className:"bmp-rowActions",children:(0,S.jsx)("button",{type:"button",className:"bmp-link bmp-danger",disabled:m,onClick:()=>{d!==void 0&&at(d)},children:f(m?"applying":"resetOfficial")})}),h!==null&&(0,S.jsxs)("div",{className:"bmp-rowActions",children:[(0,S.jsx)("button",{type:"button",className:"bmp-button",disabled:!ot||m,onClick:()=>{h!==null&&st(jt(j,h))},children:f(m?"applying":"apply")}),(0,S.jsx)("button",{type:"button",className:"bmp-link bmp-danger",disabled:m,onClick:Oe,children:f("revert")})]})]})]})}var b=require("react/jsx-runtime");function $t(e,t){switch(e){case"catalog-overrides":return"officialCatalog";case"inherited-models":return"inheritedRoute";case"declared-models":return t===!1?"officialUserList":"declaredRoute"}}function Ye(e){let{row:t,t:n,children:r}=e;return(0,b.jsxs)("section",{className:"bmp-card",children:[(0,b.jsxs)("header",{className:"bmp-cardHeader",children:[(0,b.jsx)("span",{className:"bmp-cardTitle",children:t.entry.displayName}),(0,b.jsx)("span",{className:"bmp-cardMeta",children:t.entry.provider}),(0,b.jsx)("span",{className:"bmp-tag",children:n($t(t.writeMode,t.entry.declared))})]}),r]})}function Qe(e){return e.row.writeMode==="catalog-overrides"?(0,b.jsx)(Xe,{...e}):(0,b.jsx)(It,{...e})}function It(e){let{row:t,controller:n,levels:r,modalities:i,writable:o,t:s}=e,a=(0,T.useCallback)(async(h,O,m)=>n.commit(x=>Be(x,t.entry.settingsPath,h,O,m)),[n,t.entry.settingsPath]),p=o&&t.writeMode==="declared-models",d=t.entry.declared===!1&&t.models.length>0&&Object.keys(t.overrides).length>0,[g,v]=(0,T.useState)(!1),[f,c]=(0,T.useState)(null),u=()=>{v(!0),c(null),n.commit(h=>Object.keys(W(h,t.entry.settingsPath,"user")).length===0?[]:[{op:"unset",path:[...t.entry.settingsPath,"modelOverrides"]}]).catch(h=>c(ie(h,s))).finally(()=>v(!1))};return(0,b.jsxs)(Ye,{row:t,t:s,children:[t.writeMode==="inherited-models"&&(0,b.jsx)("p",{className:"bmp-muted",children:s("inheritedModelList")}),d&&(0,b.jsxs)("div",{className:"bmp-rowActions",children:[(0,b.jsx)("span",{className:"bmp-muted",children:s("residualOverrides")}),(0,b.jsx)("button",{type:"button",className:"bmp-link bmp-danger",disabled:!o||g,onClick:u,children:s(g?"applying":"removeResidualOverrides")})]}),f!==null&&(0,b.jsx)("div",{className:"bmp-error",role:"alert",children:f}),(0,b.jsx)("div",{className:"bmp-models",children:t.models.map((h,O)=>{let m=typeof h.id=="string"?h.id:"";return(0,b.jsx)(ve,{entry:h,modelId:m===""?`#${O+1}`:m,displayName:typeof h.name=="string"?h.name:"",writable:p,levels:r,modalities:i,flavor:"declared",applyRow:x=>a(O,m,x),t:s},m===""?`model-${O}`:m)})})]})}function Xe(e){let{row:t,controller:n,levels:r,modalities:i,writable:o,t:s}=e,[a,p]=(0,T.useState)(!1),[d,g]=(0,T.useState)({status:"idle"});(0,T.useEffect)(()=>{!a||d.status!=="idle"||(g({status:"loading"}),n.discoverOfficialModels(t.entry.provider).then(c=>g({status:"ready",models:c}),c=>g({status:"error",message:K(c)})))},[a,d.status,n,t.entry.provider]);let v=Object.keys(t.overrides).filter(c=>ge(t.overrides[c])),f=[d.status==="ready"?s("officialModelsCount",{count:d.models.length}):"",v.length>0?s("overriddenCount",{count:v.length}):""].filter(c=>c.length>0).join(" \xB7 ");return(0,b.jsxs)(Ye,{row:t,t:s,children:[(0,b.jsx)("p",{className:"bmp-muted",children:s("catalogIntro")}),t.configured===!1&&(0,b.jsx)("p",{className:"bmp-muted",children:s("dormantHint")}),(0,b.jsxs)("div",{className:"bmp-catalogBar",children:[(0,b.jsx)("span",{className:"bmp-muted",children:f}),(0,b.jsx)("button",{type:"button",className:"bmp-button","aria-expanded":a,onClick:()=>p(c=>!c),children:s(a?"collapse":"manageOfficial")})]}),a&&(0,b.jsxs)("div",{className:"bmp-models",children:[(d.status==="idle"||d.status==="loading")&&(0,b.jsx)("p",{className:"bmp-muted",children:s("loading")}),d.status==="error"&&(0,b.jsxs)(b.Fragment,{children:[(0,b.jsxs)("div",{className:"bmp-error",role:"alert",children:[s("catalogLoadError"),": ",d.message]}),(0,b.jsx)("button",{type:"button",className:"bmp-button",onClick:()=>g({status:"idle"}),children:s("retry")})]}),d.status==="ready"&&d.models.map(c=>{let u=t.overrides[c.id],h={id:c.id,...c.name===void 0?{}:{name:c.name},...u};return(0,b.jsx)(ve,{entry:h,modelId:c.id,displayName:c.name??"",writable:o,levels:r,modalities:i,flavor:"catalog",applyRow:O=>n.commit(m=>ze(m,t.entry.settingsPath,c.id,O)),resetRow:ge(u)?()=>n.commit(O=>Ke(O,t.entry.settingsPath,c.id)):void 0,officialContext:c.contextWindow===void 0?void 0:I(c.contextWindow),officialMax:c.maxTokens===void 0?void 0:I(c.maxTokens),t:s},c.id)})]})]})}function Ze(e){let{dormant:t,...n}=e,{t:r}=e,[i,o]=(0,T.useState)(!1),[s,a]=(0,T.useState)(null);(0,T.useEffect)(()=>{s!==null&&!t.some(d=>d.entry.provider===s)&&a(null)},[t,s]);let p=s===null?void 0:t.find(d=>d.entry.provider===s);return(0,b.jsxs)("div",{className:"bmp-dormant",children:[(0,b.jsx)("button",{type:"button",className:"bmp-button","aria-expanded":i,onClick:()=>o(d=>!d),children:r("manageOfficialProviders",{count:t.length})}),i&&(0,b.jsx)("div",{className:"bmp-dormantList",children:t.map(d=>(0,b.jsxs)("button",{type:"button",className:"bmp-dormantRow","aria-expanded":s===d.entry.provider,onClick:()=>a(g=>g===d.entry.provider?null:d.entry.provider),children:[(0,b.jsx)("span",{className:"bmp-cardTitle",children:d.entry.displayName}),(0,b.jsx)("span",{className:"bmp-cardMeta",children:d.entry.provider}),(0,b.jsx)("span",{className:"bmp-tag",children:r("officialCatalog")})]},d.entry.provider))}),i&&p!==void 0&&(0,b.jsx)(Xe,{...n,row:p}),i&&(0,b.jsx)("p",{className:"bmp-muted",children:r("adapterBoundary")})]})}var R=require("react/jsx-runtime");function xe(e){let{controller:t,useSnapshot:n,t:r}=e,i=n(),o=i.status;(0,et.useEffect)(()=>{o==="idle"&&t.load()},[o,t]);let s=i.namespace;return o==="idle"||o==="loading"?(0,R.jsx)("div",{className:"bmp-section",children:(0,R.jsx)("p",{className:"bmp-muted",children:r("loading")})}):o==="error"?(0,R.jsxs)("div",{className:"bmp-section",children:[(0,R.jsx)("div",{className:"bmp-error",role:"alert",children:i.error}),(0,R.jsx)("button",{type:"button",className:"bmp-button",onClick:()=>{t.reload()},children:r("retry")})]}):(0,R.jsxs)("div",{className:"bmp-section",children:[(0,R.jsx)("h2",{className:"bmp-title",children:r("title")}),(0,R.jsx)("p",{className:"bmp-muted",children:r("intro")}),!i.writable&&(0,R.jsx)("p",{className:"bmp-muted",children:r("readOnly")}),i.rows.length===0&&(0,R.jsxs)("div",{className:"bmp-empty",children:[(0,R.jsx)("div",{className:"bmp-emptyTitle",children:r("empty")}),(0,R.jsx)("div",{className:"bmp-muted",children:r("emptyHint")})]}),s!==void 0&&i.rows.map(a=>(0,R.jsx)(Qe,{row:a,controller:t,levels:i.levels,modalities:i.modalities,writable:i.writable,t:r},a.entry.provider)),s!==void 0&&i.dormant.length>0&&(0,R.jsx)(Ze,{dormant:i.dormant,controller:t,levels:i.levels,modalities:i.modalities,writable:i.writable,t:r})]})}var tt={nav:"Model capabilities",title:"Model capabilities",intro:"Declare, per model, which reasoning-effort levels it accepts, which request modalities it admits, and which token capacities it carries. The declarations land in the provider profile as soon as you apply a row.",loading:"Loading providers\u2026",retry:"Retry now",conflict:"The settings document changed elsewhere. Your edits are kept below \u2014 review the refreshed state, then apply again.",empty:"No configurable providers yet",emptyHint:"Expand Manage official providers below to onboard an installed provider, or configure a custom route on the official Models page first.",declaredRoute:"declared",officialCatalog:"official catalog",catalogIntro:"Sparse capability overrides over the installed official catalog. Untouched fields keep the official defaults and follow future catalog updates \u2014 nothing is copied.",manageOfficial:"Manage official models",officialModelsCount:"{count} official models",overriddenCount:"{count} overridden",keepOfficial:"Keep official",disableReasoning:"Disable reasoning",customMapping:"Custom mapping",wireMapNote:"Overriding reasoning declares its own wire map: every checked level names the exact spelling sent to the endpoint (only off may stay blank).",officialValue:"Official: {value}",resetOfficial:"Reset to official defaults",catalogLoadError:"Could not load the official model list",manageOfficialProviders:"Manage official providers ({count})",dormantHint:"Not configured yet \u2014 the first override you apply creates the profile. The API key still belongs to the official Models page.",officialUserList:"official \xB7 user-listed",inheritedRoute:"inherited list",residualOverrides:"Leftover catalog overrides sit beside this route's model list \u2014 write validation rejects the route while both exist.",removeResidualOverrides:"Remove leftover overrides",adapterBoundary:"Routes owned by dedicated adapters (lived under llm-deepseek / llm-openai-codex) declare capabilities on their own settings pages and never appear here; a pi-ai catalog route of the same brand name is a different route and does appear.",inheritedModelList:"This model list is inherited from the active composition and is read-only here.",readOnly:"Settings are read-only in this view",expand:"expand",collapse:"collapse",modelContextWindow:"Context window",modelMaxTokens:"Max output tokens",modelReasoning:"Reasoning effort",inherit:"Provider default",reasoningOff:"No reasoning (false)",custom:"Custom",wire:"wire",modelInput:"Input modalities",apply:"Apply",revert:"Revert",applying:"Applying\u2026",modelReasoningInvalid:"invalid reasoning declaration: name a level beyond off, and give each level beyond off a wire value",modelInputInvalid:"invalid input modalities: choose from the declared vocabulary",modelCapacityInvalid:"invalid capacity: use a positive whole count, K for thousands, M for millions (blank inherits)",staged:"unapplied",levelsSelected:"{count} selected",levelGroup:"Reasoning effort levels of {model}",modalityGroup:"Input modalities of {model}"},nt={nav:"\u6A21\u578B\u80FD\u529B",title:"\u6A21\u578B\u80FD\u529B",intro:"\u6309\u6A21\u578B\u58F0\u660E\u5B83\u7684\u63A8\u7406\u5F3A\u5EA6\u6863\u4F4D\u3001\u8BF7\u6C42\u6A21\u6001\u4E0E token \u5BB9\u91CF\uFF08\u4E0A\u4E0B\u6587\u7A97\u53E3 / \u6700\u5927\u8F93\u51FA\uFF09\u3002\u5E94\u7528\u540E\uFF0C\u58F0\u660E\u5373\u523B\u5199\u5165\u4F9B\u5E94\u5546 profile\u3002",loading:"\u6B63\u5728\u52A0\u8F7D\u4F9B\u5E94\u5546\u2026",retry:"\u7ACB\u5373\u91CD\u8BD5",conflict:"\u8BBE\u7F6E\u6587\u6863\u5DF2\u5728\u522B\u5904\u53D8\u66F4\u3002\u4F60\u7684\u7F16\u8F91\u4FDD\u7559\u5728\u4E0B\u65B9\u2014\u2014\u8BF7\u5148\u5BF9\u7167\u521A\u5237\u65B0\u7684\u72B6\u6001\uFF0C\u518D\u91CD\u65B0\u5E94\u7528\u3002",empty:"\u6682\u65E0\u53EF\u914D\u7F6E\u7684\u4F9B\u5E94\u5546",emptyHint:"\u5C55\u5F00\u4E0B\u65B9\u300C\u7BA1\u7406\u5B98\u65B9\u4F9B\u5E94\u5546\u300D\u63A5\u5165\u9A7B\u88C5\u7684\u4F9B\u5E94\u5546\uFF0C\u6216\u5148\u5728\u5B98\u65B9\u300C\u6A21\u578B\u300D\u9875\u914D\u7F6E\u4E00\u6761\u81EA\u5B9A\u4E49\u8DEF\u7531\u3002",declaredRoute:"\u624B\u5DE5\u58F0\u660E",officialCatalog:"\u5B98\u65B9\u76EE\u5F55",catalogIntro:"\u5BF9\u968F pi-ai \u9A7B\u88C5\u7684\u5B98\u65B9\u76EE\u5F55\u505A\u7A00\u758F\u80FD\u529B\u8986\u76D6\u3002\u672A\u89E6\u78B0\u7684\u5B57\u6BB5\u4FDD\u6301\u5B98\u65B9\u9ED8\u8BA4\u5E76\u8DDF\u968F\u76EE\u5F55\u5C06\u6765\u66F4\u65B0\u2014\u2014\u4E0D\u590D\u5236\u4EFB\u4F55\u5185\u5BB9\u3002",manageOfficial:"\u7BA1\u7406\u5B98\u65B9\u6A21\u578B",officialModelsCount:"{count} \u4E2A\u5B98\u65B9\u6A21\u578B",overriddenCount:"{count} \u4E2A\u5DF2\u8986\u76D6",keepOfficial:"\u8DDF\u968F\u5B98\u65B9",disableReasoning:"\u7981\u7528\u63A8\u7406",customMapping:"\u81EA\u5B9A\u4E49\u6620\u5C04",wireMapNote:"\u8986\u76D6\u63A8\u7406\u5373\u81EA\u884C\u58F0\u660E\u62FC\u5199\u8868\uFF1A\u52FE\u9009\u7684\u6BCF\u4E2A\u6863\u4F4D\u90FD\u8981\u586B\u53D1\u5F80\u7AEF\u70B9\u7684\u51C6\u786E\u62FC\u5199\uFF08\u53EA\u6709 off \u53EF\u7559\u7A7A\uFF09\u3002",officialValue:"\u5B98\u65B9\uFF1A{value}",resetOfficial:"\u8FD8\u539F\u4E3A\u5B98\u65B9\u9ED8\u8BA4",catalogLoadError:"\u65E0\u6CD5\u52A0\u8F7D\u5B98\u65B9\u6A21\u578B\u5217\u8868",manageOfficialProviders:"\u7BA1\u7406\u5B98\u65B9\u4F9B\u5E94\u5546\uFF08{count}\uFF09",dormantHint:"\u5C1A\u672A\u914D\u7F6E\u2014\u2014\u4F60\u5E94\u7528\u7684\u7B2C\u4E00\u4E2A\u8986\u76D6\u5373\u4F1A\u521B\u5EFA\u8BE5 profile\u3002API \u5BC6\u94A5\u4ECD\u5728\u5B98\u65B9\u300C\u6A21\u578B\u300D\u9875\u8BBE\u7F6E\u3002",officialUserList:"\u5B98\u65B9\xB7\u81EA\u7BA1",inheritedRoute:"\u7EE7\u627F\u6E05\u5355",residualOverrides:"\u6B64\u8DEF\u7531\u5DF2\u6709\u6A21\u578B\u5217\u8868\uFF0C\u4E0E\u6B8B\u7559\u7684\u76EE\u5F55\u8986\u76D6\u5E76\u5B58\u2014\u2014\u5199\u5165\u6821\u9A8C\u5373\u5224\u8BE5\u8DEF\u7531\u975E\u6CD5\u3002",removeResidualOverrides:"\u79FB\u9664\u6B8B\u7559\u8986\u76D6",adapterBoundary:"\u4E13\u5C5E\u9002\u914D\u5668\u8DEF\u7531\uFF08\u5982 llm-deepseek\u3001llm-openai-codex \u540D\u4E0B\u7684\uFF09\u80FD\u529B\u5728\u5B83\u4EEC\u81EA\u5DF1\u7684\u8BBE\u7F6E\u9875\u58F0\u660E\uFF0C\u4E0D\u4F1A\u51FA\u73B0\u5728\u672C\u9875\uFF1B\u540C\u54C1\u724C\u540D\u7684 pi-ai \u76EE\u5F55\u8DEF\u7531\u662F\u53E6\u4E00\u6761\u8DEF\u7531\uFF0C\u7167\u5E38\u51FA\u73B0\u3002",inheritedModelList:"\u6B64\u6A21\u578B\u5217\u8868\u7EE7\u627F\u81EA\u5F53\u524D\u7EC4\u88C5\uFF0C\u672C\u9875\u53EA\u8BFB\u3002",readOnly:"\u6B64\u89C6\u56FE\u4E0B\u8BBE\u7F6E\u4E3A\u53EA\u8BFB",expand:"\u5C55\u5F00",collapse:"\u6536\u8D77",modelContextWindow:"\u4E0A\u4E0B\u6587\u7A97\u53E3",modelMaxTokens:"\u6700\u5927\u8F93\u51FA token",modelReasoning:"\u63A8\u7406\u5F3A\u5EA6",inherit:"\u4F7F\u7528\u4F9B\u5E94\u5546\u9ED8\u8BA4",reasoningOff:"\u65E0\u63A8\u7406\uFF08false\uFF09",custom:"\u81EA\u5B9A\u4E49",wire:"\u53D6\u503C",modelInput:"\u8F93\u5165\u6A21\u6001",apply:"\u5E94\u7528",revert:"\u8FD8\u539F",applying:"\u5E94\u7528\u4E2D\u2026",modelReasoningInvalid:"\u63A8\u7406\u58F0\u660E\u65E0\u6548\uFF1A\u81F3\u5C11\u58F0\u660E\u4E00\u4E2A off \u4E4B\u5916\u7684\u6863\u4F4D\uFF0C\u4E14 off \u4E4B\u5916\u7684\u6863\u4F4D\u90FD\u8981\u6709\u53D6\u503C",modelInputInvalid:"\u8F93\u5165\u6A21\u6001\u65E0\u6548\uFF1A\u8BF7\u4ECE\u5DF2\u58F0\u660E\u7684\u8BCD\u6C47\u4E2D\u9009\u62E9",modelCapacityInvalid:"\u5BB9\u91CF\u65E0\u6548\uFF1A\u8BF7\u586B\u6B63\u6574\u6570\u8BA1\u6570\uFF0CK \u8868\u793A\u5343\u3001M \u8868\u793A\u767E\u4E07\uFF08\u7559\u7A7A\u4E3A\u7EE7\u627F\uFF09",staged:"\u672A\u5E94\u7528",levelsSelected:"\u5DF2\u9009\u62E9 {count} \u4E2A",levelGroup:"{model} \u7684\u63A8\u7406\u5F3A\u5EA6\u6863\u4F4D",modalityGroup:"{model} \u7684\u8F93\u5165\u6A21\u6001"};var rt=`
.bmp-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.bmp-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.bmp-muted {
  margin: 0;
  color: var(--dsw-alias-label-tertiary, rgba(0, 0, 0, 0.45));
  font-size: 13px;
  line-height: 1.5;
}
.bmp-empty,
.bmp-card {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
}
.bmp-empty {
  gap: 4px;
  padding: 24px;
  border: 1px dashed var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.12));
}
.bmp-emptyTitle {
  font-weight: 600;
}
.bmp-card {
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.12));
}
.bmp-cardHeader {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.bmp-cardTitle {
  font-weight: 600;
}
.bmp-cardMeta {
  color: var(--dsw-alias-label-tertiary, rgba(0, 0, 0, 0.45));
  font-size: 12px;
}
.bmp-tag,
.bmp-staged {
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
}
.bmp-tag {
  background: var(--dsw-alias-bg-layer-3, rgba(0, 0, 0, 0.06));
  color: var(--dsw-alias-label-secondary, rgba(0, 0, 0, 0.65));
}
.bmp-modelRow {
  border-top: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.12));
  padding-top: 6px;
}
.bmp-modelMain {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bmp-modelId {
  font-family: var(--dsw-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 12px;
  word-break: break-all;
}
.bmp-modelName {
  color: var(--dsw-alias-label-secondary, rgba(0, 0, 0, 0.65));
  font-size: 12px;
}
.bmp-staged {
  background: var(--dsw-alias-state-warn-tertiary, rgba(240, 160, 0, 0.15));
  color: var(--dsw-alias-state-warn-primary, #a06800);
}
.bmp-modelMain .bmp-icon {
  margin-left: auto;
}
.bmp-modelAdvanced {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px 0 4px;
}
.bmp-block,
.bmp-models {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.bmp-blockLabel {
  font-size: 12px;
  color: var(--dsw-alias-label-secondary, rgba(0, 0, 0, 0.65));
}
.bmp-capacityGrid,
.bmp-modeGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.bmp-capacityField {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.bmp-officialHint {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary, rgba(0, 0, 0, 0.45));
}
.bmp-catalogBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 2px 0 8px;
}
.bmp-dormant {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}
.bmp-dormantList {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 260px;
  overflow-y: auto;
}
.bmp-dormantRow {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid var(--dsh-border);
  border-radius: 6px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: inherit;
}
.bmp-dormantRow:hover,
.bmp-dormantRow[aria-expanded="true"] {
  background-color: color-mix(in srgb, currentColor 6%, transparent);
}
.bmp-toggle,
.bmp-msItemCheck {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.bmp-toggle {
  font-size: 13px;
}
.bmp-modeGrid {
  align-items: center;
}
.bmp-modeGrid .bmp-select {
  max-width: none;
  width: 100%;
}
.bmp-modalityRow {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 30px;
  flex-wrap: wrap;
}
.bmp-msWrap {
  position: relative;
}
.bmp-msButton {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}
.bmp-msPanel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px;
  max-height: 240px;
  overflow: auto;
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.12));
  border-radius: 6px;
  background: var(--dsw-alias-bg-layer-1, #fff);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}
.bmp-msItem {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 8px;
  padding: 3px 4px;
  border-radius: 4px;
  font-size: 13px;
}
.bmp-msItem:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.06));
}
.bmp-msItemCheck {
  cursor: pointer;
}
.bmp-msWire {
  padding: 2px 6px;
  font-size: 12px;
}
.bmp-select,
.bmp-input {
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.12));
  border-radius: 6px;
  background: var(--dsw-alias-bg-layer-1, #fff);
  color: inherit;
  font-size: 13px;
}
.bmp-select {
  max-width: 280px;
  padding: 6px 8px;
}
.bmp-input {
  padding: 4px 8px;
}
.bmp-input:disabled,
.bmp-select:disabled,
.bmp-button:disabled {
  opacity: 0.6;
}
.bmp-rowActions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.bmp-button {
  padding: 6px 12px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.12));
  border-radius: 6px;
  background: var(--dsw-alias-bg-layer-3, rgba(0, 0, 0, 0.06));
  color: inherit;
  font-size: 13px;
  cursor: pointer;
}
.bmp-button:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.1));
}
.bmp-button:disabled {
  cursor: default;
}
.bmp-link {
  border: none;
  background: none;
  padding: 0;
  color: var(--dsw-alias-label-secondary, rgba(0, 0, 0, 0.65));
  font-size: 12px;
  cursor: pointer;
}
.bmp-link:hover:not(:disabled) {
  text-decoration: underline;
}
.bmp-danger {
  color: var(--dsw-alias-state-error-primary, #c0342b);
  font-weight: 600;
}
.bmp-error {
  padding: 8px;
  border-radius: 6px;
  /* No soft-error token exists in the platform palette; a translucent red
     overlay alpha-blends acceptably on both themes. */
  background: rgba(192, 52, 43, 0.12);
  color: var(--dsw-alias-state-error-primary, #c0342b);
  font-size: 12px;
  word-break: break-word;
}
.bmp-icon {
  border: none;
  background: none;
  padding: 4px;
  color: var(--dsw-alias-label-tertiary, rgba(0, 0, 0, 0.45));
  cursor: pointer;
  border-radius: 4px;
  line-height: 0;
}
.bmp-icon:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.06));
  color: inherit;
}
`;var Dt="better-model-provider",ke="better-model-provider",Lt=["slots","locale","remote"];function Se(e){e.store.getSnapshot().status!=="idle"&&e.reload()}function _t(e){Ve(e,t=>Vt(e,t))}function Vt(e,t){e.effect(()=>e.locale.register(ke,{zh:nt,en:tt}),"better-model-provider: dictionaries");let n=document.createElement("style");n.dataset.plugin="better-model-provider",n.textContent=rt,document.head.appendChild(n),e.effect(()=>()=>n.remove(),"better-model-provider: stylesheet");let r=new ne(t);e.effect(()=>()=>r.dispose(),"better-model-provider: controller");let i=()=>(0,it.useSyncExternalStore)(r.store.subscribe,r.store.getSnapshot),o=e.locale.bind(ke),s=(p,d)=>o(p,d),a=()=>({controller:r,useSnapshot:i,t:s});e.effect(()=>{let p=()=>{Se(r)},d=[e.remote.$on("settings/document-updated",g=>{g===V&&Se(r)}),e.remote.$on("llm/adapters-updated",p),e.on("connection/reset",p)];return()=>{for(let g of d)g()}},"better-model-provider: pushed invalidations"),e.slots.inject("settings.section",()=>e.slots.register({name:"settings.section",id:ke,order:11,label:()=>s("nav"),inject:a},xe))}

		return module.exports;
	}
});

