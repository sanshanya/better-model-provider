window.__ModuleLoader__.load({
	id: "better-model-provider",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;

"use strict";var J=Object.defineProperty;var st=Object.getOwnPropertyDescriptor;var at=Object.getOwnPropertyNames;var lt=Object.prototype.hasOwnProperty;var dt=(e,t,n)=>t in e?J(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n;var ct=(e,t)=>{for(var n in t)J(e,n,{get:t[n],enumerable:!0})},pt=(e,t,n,r)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of at(t))!lt.call(e,i)&&i!==n&&J(e,i,{get:()=>t[i],enumerable:!(r=st(t,i))||r.enumerable});return e};var ut=e=>pt(J({},"__esModule",{value:!0}),e);var se=(e,t,n)=>dt(e,typeof t!="symbol"?t+"":t,n);var $t={};ct($t,{CapabilitiesSection:()=>ve,HarnessRpcError:()=>D,apply:()=>Mt,inject:()=>Tt,name:()=>At,refreshIfLoaded:()=>xe});module.exports=ut($t);var nt=require("react");function P(e){return e==null}function Y(e){return e&&typeof e=="object"&&!Array.isArray(e)}function Oe(e,t){return Object.fromEntries(Object.entries(e).filter(([n,r])=>t(n,r)))}function M(e,t){return Object.fromEntries(Object.entries(e).map(([n,r])=>[n,t(r,n)]))}function Ne(e,t,n){if(!t)return{...e};let r={};for(let i of t)(n||e[i]!==void 0)&&(r[i]=e[i]);return r}function j(e,t){return arguments.length===1?n=>j(e,n):e in globalThis&&t instanceof globalThis[e]||Object.prototype.toString.call(t).slice(8,-1)===e}function G(e){return j("ArrayBuffer",e)||j("SharedArrayBuffer",e)}function ft(e){return G(e)||ArrayBuffer.isView(e)}var E;(function(e){e.is=G,e.isSource=ft;function t(s){return ArrayBuffer.isView(s)?s.buffer.slice(s.byteOffset,s.byteOffset+s.byteLength):s}e.fromSource=t;function n(s){if(s=t(s),typeof Buffer<"u")return Buffer.from(s).toString("base64");let a="",p=new Uint8Array(s);for(let d=0;d<p.byteLength;d++)a+=String.fromCharCode(p[d]);return btoa(a)}e.toBase64=n;function r(s){return typeof Buffer<"u"?t(Buffer.from(s,"base64")):Uint8Array.from(atob(s),a=>a.charCodeAt(0))}e.fromBase64=r;function i(s){return s=t(s),typeof Buffer<"u"?Buffer.from(s).toString("hex"):Array.from(new Uint8Array(s),a=>a.toString(16).padStart(2,"0")).join("")}e.toHex=i;function o(s){if(typeof Buffer<"u")return t(Buffer.from(s,"hex"));let a=s.length%2===0?s:s.slice(0,s.length-1),p=[];for(let d=0;d<a.length;d+=2)p.push(parseInt(`${a[d]}${a[d+1]}`,16));return Uint8Array.from(p).buffer}e.fromHex=o})(E||(E={}));var Dt=E.fromBase64,Vt=E.toBase64,_t=E.fromHex,Lt=E.toHex;function q(e,t=new Map){if(!e||typeof e!="object")return e;if(j("Date",e))return new Date(e.valueOf());if(j("RegExp",e))return new RegExp(e.source,e.flags);if(G(e))return e.slice(0);if(ArrayBuffer.isView(e))return e.buffer.slice(e.byteOffset,e.byteOffset+e.byteLength);let n=t.get(e);if(n)return n;if(Array.isArray(e)){let i=[];return t.set(e,i),e.forEach((o,s)=>{i[s]=Reflect.apply(q,null,[o,t])}),i}let r=Object.create(Object.getPrototypeOf(e));t.set(e,r);for(let i of Reflect.ownKeys(e)){let o={...Reflect.getOwnPropertyDescriptor(e,i)};"value"in o&&(o.value=Reflect.apply(q,null,[o.value,t])),Reflect.defineProperty(r,i,o)}return r}function L(e,t,n){if(e===t||!n&&P(e)&&P(t))return!0;if(typeof e!=typeof t||typeof e!="object"||!e||!t)return!1;function r(i,o){return i(e)?i(t)?o(e,t):!1:i(t)?!1:void 0}return r(Array.isArray,(i,o)=>i.length===o.length&&i.every((s,a)=>L(s,o[a])))??r(j("Date"),(i,o)=>i.valueOf()===o.valueOf())??r(j("RegExp"),(i,o)=>i.source===o.source&&i.flags===o.flags)??r(G,(i,o)=>{if(i.byteLength!==o.byteLength)return!1;let s=new Uint8Array(i),a=new Uint8Array(o);for(let p=0;p<s.length;p++)if(s[p]!==a[p])return!1;return!0})??Object.keys({...e,...t}).every(i=>L(e[i],t[i],n))}var Re;(function(e){e.millisecond=1,e.second=1e3,e.minute=e.second*60,e.hour=e.minute*60,e.day=e.hour*24,e.week=e.day*7;let t=new Date().getTimezoneOffset();function n(c){t=c}e.setTimezoneOffset=n;function r(){return t}e.getTimezoneOffset=r;function i(c=new Date,f){return typeof c=="number"&&(c=new Date(c)),f===void 0&&(f=t),Math.floor((c.valueOf()/e.minute-f)/1440)}e.getDateNumber=i;function o(c,f){let x=new Date(c*e.day);return f===void 0&&(f=t),new Date(+x+f*e.minute)}e.fromDateNumber=o;let s=/\d+(?:\.\d+)?/.source,a=new RegExp(`^${["w(?:eek(?:s)?)?","d(?:ay(?:s)?)?","h(?:our(?:s)?)?","m(?:in(?:ute)?(?:s)?)?","s(?:ec(?:ond)?(?:s)?)?"].map(c=>`(${s}${c})?`).join("")}$`);function p(c){let f=a.exec(c);return f?(parseFloat(f[1])*e.week||0)+(parseFloat(f[2])*e.day||0)+(parseFloat(f[3])*e.hour||0)+(parseFloat(f[4])*e.minute||0)+(parseFloat(f[5])*e.second||0):0}e.parseTime=p;function d(c){let f=p(c);return f?c=Date.now()+f:/^\d{1,2}(:\d{1,2}){1,2}$/.test(c)?c=`${new Date().toLocaleDateString()}-${c}`:/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(c)&&(c=`${new Date().getFullYear()}-${c}`),c?new Date(c):new Date}e.parseDate=d;function h(c){let f=Math.abs(c);return f>=e.day-e.hour/2?Math.round(c/e.day)+"d":f>=e.hour-e.minute/2?Math.round(c/e.hour)+"h":f>=e.minute-e.second/2?Math.round(c/e.minute)+"m":f>=e.second?Math.round(c/e.second)+"s":c+"ms"}e.format=h;function y(c,f=2){return c.toString().padStart(f,"0")}e.toDigits=y;function u(c,f=new Date){return c.replace("yyyy",f.getFullYear().toString()).replace("yy",f.getFullYear().toString().slice(2)).replace("MM",y(f.getMonth()+1)).replace("dd",y(f.getDate())).replace("hh",y(f.getHours())).replace("mm",y(f.getMinutes())).replace("ss",y(f.getSeconds())).replace("SSS",y(f.getMilliseconds(),3))}e.template=u})(Re||(Re={}));var Q=Symbol.for("schemastery"),Ee=Symbol.for("ValidationError");globalThis.__schemastery_index__??(globalThis.__schemastery_index__=0);globalThis.__schemastery_refs__=void 0;var v=class extends TypeError{constructor(t,n){let r="$";for(let i of n.path||[])typeof i=="string"?r+="."+i:typeof i=="number"?r+="["+i+"]":typeof i=="symbol"&&(r+=`[Symbol(${i.toString()})]`);r.startsWith(".")&&(r=r.slice(1));super((r==="$"?"":`${r} `)+t);se(this,"options");se(this,"name","ValidationError");this.options=n}static is(t){return!!t?.[Ee]}};Object.defineProperty(v.prototype,Ee,{value:!0});var l=function(e){let t=function(n,r={}){return l.resolve(n,t,r)[0]};if(e.refs){let n=M(e.refs,i=>new l(i)),r=i=>n[i];for(let i in n){let o=n[i];o.sKey=r(o.sKey),o.inner=r(o.inner),o.list=o.list&&o.list.map(r),o.dict=o.dict&&M(o.dict,r)}return n[e.uid]}if(Object.assign(t,e),typeof t.callback=="string")try{t.callback=new Function("return "+t.callback)()}catch{}return Object.defineProperty(t,"uid",{value:globalThis.__schemastery_index__++}),Object.setPrototypeOf(t,l.prototype),t.meta||(t.meta={}),t.toString=t.toString.bind(t),t};l.prototype=Object.create(Function.prototype);l.prototype[Q]=!0;Object.defineProperty(l.prototype,"~standard",{get(){return{version:1,vendor:"schemastery",validate:e=>{try{return{value:l.resolve(e,this,{})[0]}}catch(t){if(v.is(t))return{issues:[{message:t.message,path:t.options.path}]};throw t}}}}});l.ValidationError=v;l.prototype.toJSON=function(){var n,r;if(globalThis.__schemastery_refs__)return(n=globalThis.__schemastery_refs__)[r=this.uid]??(n[r]=JSON.parse(JSON.stringify({...this}))),this.uid;globalThis.__schemastery_refs__={[this.uid]:{...this}},globalThis.__schemastery_refs__[this.uid]=JSON.parse(JSON.stringify({...this}));let t={uid:this.uid,refs:globalThis.__schemastery_refs__};return globalThis.__schemastery_refs__=void 0,t};l.prototype.set=function(t,n){return this.dict[t]=n,this};l.prototype.push=function(t){return this.list.push(t),this};function mt(e,t){let n=typeof e=="string"?{"":e}:{...e};for(let r in t){let i=t[r];i?.$description||i?.$desc?n[r]=i.$description||i.$desc:typeof i=="string"&&(n[r]=i)}return n}function F(e){return e?.$value??e?.$inner}function Pe(e){return Oe(e??{},t=>!t.startsWith("$"))}l.prototype.i18n=function(t){let n=l(this),r=mt(n.meta.description,t);return Object.keys(r).length&&(n.meta.description=r),n.dict&&(n.dict=M(n.dict,(i,o)=>i.i18n(M(t,s=>F(s)?.[o]??s?.[o])))),n.list&&(n.list=n.list.map((i,o)=>i.i18n(M(t,(s={})=>Array.isArray(F(s))?F(s)[o]:Array.isArray(s)?s[o]:Pe(s))))),n.inner&&(n.inner=n.inner.i18n(M(t,i=>F(i)?F(i):Pe(i)))),n.sKey&&(n.sKey=n.sKey.i18n(M(t,i=>i?.$key))),n};l.prototype.extra=function(t,n){let r=l(this);return r.meta={...r.meta,[t]:n},r};for(let e of["required","disabled","collapse","hidden","loose"])Object.assign(l.prototype,{[e](t=!0){let n=l(this);return n.meta={...n.meta,[e]:t},n}});l.prototype.deprecated=function(){var n;let t=l(this);return(n=t.meta).badges||(n.badges=[]),t.meta.badges.push({text:"deprecated",type:"danger"}),t};l.prototype.experimental=function(){var n;let t=l(this);return(n=t.meta).badges||(n.badges=[]),t.meta.badges.push({text:"experimental",type:"warning"}),t};l.prototype.pattern=function(t){let n=l(this),r=Ne(t,["source","flags"]);return n.meta={...n.meta,pattern:r},n};l.prototype.simplify=function(t){if(L(t,this.meta.default,this.type==="dict"))return null;if(P(t))return t;if(this.type==="object"||this.type==="dict"){let n={};for(let r in t){let i=(this.type==="object"?this.dict[r]:this.inner)?.simplify(t[r]);(this.type==="dict"||!P(i))&&(n[r]=i)}return L(n,this.meta.default,this.type==="dict")?null:n}else if(this.type==="array"||this.type==="tuple"){let n=[];return t.forEach((r,i)=>{let o=this.type==="array"?this.inner:this.list[i],s=o?o.simplify(r):r;n.push(s)}),n}else if(this.type==="intersect"){let n={};for(let r of this.list)Object.assign(n,r.simplify(t));return n}else if(this.type==="union")for(let n of this.list)try{return l.resolve(t,n,{}),n.simplify(t)}catch{}return t};l.prototype.toString=function(t){return Te[this.type]?.(this,t)??`Schema<${this.type}>`};l.prototype.role=function(e,t){let n=l(this);return n.meta={...n.meta,role:e,extra:t},n};for(let e of["default","link","comment","description","max","min","step"])Object.assign(l.prototype,{[e](t){let n=l(this);return n.meta={...n.meta,[e]:t},n}});var Ae={};l.extend=function(t,n){Ae[t]=n};l.resolve=function(t,n,r={},i=!1){if(!n)return[t];if(r.ignore?.(t,n))return[t];if(P(t)&&n.type!=="lazy"){if(n.meta.required)throw new v("missing required value",r);let s=n,a=n.meta.default;for(;s?.type==="intersect"&&P(a);)s=s.list[0],a=s?.meta.default;if(P(a))return[t];t=q(a)}let o=Ae[n.type];if(!o)throw new v(`unsupported type "${n.type}"`,r);try{return o(t,n,r,i)}catch(s){if(!n.meta.loose)throw s;return[n.meta.default]}};l.from=function(t){if(P(t))return l.any();if(["string","number","boolean"].includes(typeof t))return l.const(t).required();if(t[Q])return t;if(typeof t=="function")switch(t){case String:return l.string().required();case Number:return l.number().required();case Boolean:return l.boolean().required();case Function:return l.function().required();default:return l.is(t).required()}else throw new TypeError(`cannot infer schema from ${t}`)};l.lazy=function(t){let n=()=>(r.inner[Q]||(r.inner=r.builder(),r.inner.meta={...r.meta,...r.inner.meta}),r.inner.toJSON()),r=new l({type:"lazy",builder:t,inner:{toJSON:n}});return r};l.natural=function(){return l.number().step(1).min(0)};l.percent=function(){return l.number().step(.01).min(0).max(1).role("slider")};l.date=function(){return l.union([l.is(Date),l.transform(l.string().role("datetime"),(t,n)=>{let r=new Date(t);if(isNaN(+r))throw new v(`invalid date "${t}"`,n);return r},!0)])};l.regExp=function(t=""){return l.union([l.is(RegExp),l.transform(l.string().role("regexp",{flag:t}),(n,r)=>{try{return new RegExp(n,t)}catch(i){throw new v(i.message,r)}},!0)])};l.arrayBuffer=function(t){return l.union([l.is(ArrayBuffer),l.is(SharedArrayBuffer),l.transform(l.any(),(n,r)=>{if(E.isSource(n))return E.fromSource(n);throw new v(`expected ArrayBufferSource but got ${n}`,r)},!0),...t?[l.transform(l.string(),(n,r)=>{try{return t==="base64"?E.fromBase64(n):E.fromHex(n)}catch(i){throw new v(i.message,r)}},!0)]:[]])};l.extend("lazy",(e,t,n,r)=>(t.inner[Q]||(t.inner=t.builder(),t.inner.meta={...t.meta,...t.inner.meta}),l.resolve(e,t.inner,n,r)));l.extend("any",e=>[e]);l.extend("never",(e,t,n)=>{throw new v(`expected nullable but got ${e}`,n)});l.extend("const",(e,{value:t},n)=>{if(L(e,t))return[t];throw new v(`expected ${t} but got ${e}`,n)});function de(e,t,n,r,i=!1){let{max:o=1/0,min:s=-1/0}=t;if(e>o)throw new v(`expected ${n} <= ${o} but got ${e}`,r);if(e<s&&!i)throw new v(`expected ${n} >= ${s} but got ${e}`,r)}l.extend("string",(e,{meta:t},n)=>{if(typeof e!="string")throw new v(`expected string but got ${e}`,n);if(t.pattern){let r=new RegExp(t.pattern.source,t.pattern.flags);if(!r.test(e))throw new v(`expect string to match regexp ${r}`,n)}return de(e.length,t,"string length",n),[e]});function ae(e,t){let n=e.toString();if(n.includes("e"))return e*Math.pow(10,t);let r=n.indexOf(".");if(r===-1)return e*Math.pow(10,t);let i=n.slice(r+1),o=n.slice(0,r);return i.length<=t?+(o+i.padEnd(t,"0")):+(o+i.slice(0,t)+"."+i.slice(t))}function gt(e,t,n){if(n=Math.abs(n),!/^\d+\.\d+$/.test(n.toString()))return(e-t)%n===0;let r=n.toString().indexOf("."),i=n.toString().slice(r+1).length;return Math.abs(ae(e,i)-ae(t,i))%ae(n,i)===0}l.extend("number",(e,{meta:t},n)=>{if(typeof e!="number")throw new v(`expected number but got ${e}`,n);de(e,t,"number",n);let{step:r}=t;if(r&&!gt(e,t.min??0,r))throw new v(`expected number multiple of ${r} but got ${e}`,n);return[e]});l.extend("boolean",(e,t,n)=>{if(typeof e=="boolean")return[e];throw new v(`expected boolean but got ${e}`,n)});l.extend("bitset",(e,{bits:t,meta:n},r)=>{let i=0,o=[];if(typeof e=="number"){i=e;for(let s in t)e&t[s]&&o.push(s)}else if(Array.isArray(e)){o=e;for(let s of o){if(typeof s!="string")throw new v(`expected string but got ${s}`,r);s in t&&(i|=t[s])}}else throw new v(`expected number or array but got ${e}`,r);return i===n.default?[i]:[i,o]});l.extend("function",(e,t,n)=>{if(typeof e=="function")return[e];throw new v(`expected function but got ${e}`,n)});l.extend("is",(e,{constructor:t},n)=>{if(typeof t=="function"){if(e instanceof t)return[e];throw new v(`expected ${t.name} but got ${e}`,n)}else{if(P(e))throw new v(`expected ${t} but got ${e}`,n);let r=Object.getPrototypeOf(e);for(;r;){if(r.constructor?.name===t)return[e];r=Object.getPrototypeOf(r)}throw new v(`expected ${t} but got ${e}`,n)}});function X(e,t,n,r){try{let[i,o]=l.resolve(e[t],n,{...r,path:[...r.path||[],t]});return o!==void 0&&(e[t]=o),i}catch(i){if(!r?.autofix)throw i;return delete e[t],n.meta.default}}l.extend("array",(e,{inner:t,meta:n},r)=>{if(!Array.isArray(e))throw new v(`expected array but got ${e}`,r);return de(e.length,n,"array length",r,!P(t.meta.default)),[e.map((i,o)=>X(e,o,t,r))]});l.extend("dict",(e,{inner:t,sKey:n},r,i)=>{if(!Y(e))throw new v(`expected object but got ${e}`,r);let o={};for(let s in e){let a;try{a=l.resolve(s,n,r)[0]}catch(p){if(i)continue;throw p}o[a]=X(e,s,t,r),e[a]=e[s],s!==a&&delete e[s]}return[o]});l.extend("tuple",(e,{list:t},n,r)=>{if(!Array.isArray(e))throw new v(`expected array but got ${e}`,n);let i=t.map((o,s)=>X(e,s,o,n));return r?[i]:(i.push(...e.slice(t.length)),[i])});function le(e,t){for(let n in t)n in e||(e[n]=t[n])}l.extend("object",(e,{dict:t},n,r)=>{if(!Y(e))throw new v(`expected object but got ${e}`,n);let i={};for(let o in t){let s=X(e,o,t[o],n);(!P(s)||o in e)&&(i[o]=s)}return r||le(i,e),[i]});l.extend("union",(e,{list:t,toString:n},r,i)=>{let o=[];for(let s of t)try{return l.resolve(e,s,r,i)}catch(a){o.push(a)}throw new v(`expected ${n()} but got ${JSON.stringify(e)}`,r)});l.extend("intersect",(e,{list:t,toString:n},r,i)=>{if(!t.length)return[e];let o;for(let s of t){let a=l.resolve(e,s,r,!0)[0];if(!P(a))if(P(o))o=a;else{if(typeof o!=typeof a)throw new v(`expected ${n()} but got ${JSON.stringify(e)}`,r);if(typeof a=="object")le(o??(o={}),a);else if(o!==a)throw new v(`expected ${n()} but got ${JSON.stringify(e)}`,r)}}return!i&&Y(e)&&le(o,e),[o]});l.extend("transform",(e,{inner:t,callback:n,preserve:r},i)=>{let[o,s=e]=l.resolve(e,t,i,!0);return r?[n(o)]:[n(o),n(s)]});var Te={};function S(e,t,n){Te[e]=n,Object.assign(l,{[e](...r){let i=new l({type:e});return t.forEach((o,s)=>{switch(o){case"sKey":i.sKey=r[s]??l.string();break;case"inner":i.inner=l.from(r[s]);break;case"list":i.list=r[s].map(l.from);break;case"dict":i.dict=M(r[s],l.from);break;case"bits":i.bits={};for(let a in r[s])typeof r[s][a]=="number"&&(i.bits[a]=r[s][a]);break;case"callback":{let a=i.callback=r[s];a.toJSON||(a.toJSON=()=>a.toString());break}case"constructor":{let a=i.constructor=r[s];typeof a=="function"&&(a.toJSON||(a.toJSON=()=>a.name));break}default:i[o]=r[s]}}),e==="object"||e==="dict"?i.meta.default={}:e==="array"||e==="tuple"?i.meta.default=[]:e==="bitset"&&(i.meta.default=0),i}})}S("is",["constructor"],({constructor:e})=>typeof e=="function"?e.name:e);S("any",[],()=>"any");S("never",[],()=>"never");S("const",["value"],({value:e})=>typeof e=="string"?JSON.stringify(e):e);S("string",[],()=>"string");S("number",[],()=>"number");S("boolean",[],()=>"boolean");S("bitset",["bits"],()=>"bitset");S("function",[],()=>"function");S("array",["inner"],({inner:e})=>`${e.toString(!0)}[]`);S("dict",["inner","sKey"],({inner:e,sKey:t})=>`{ [key: ${t.toString()}]: ${e.toString()} }`);S("tuple",["list"],({list:e})=>`[${e.map(t=>t.toString()).join(", ")}]`);S("object",["dict"],({dict:e})=>Object.keys(e).length===0?"{}":`{ ${Object.entries(e).map(([t,n])=>`${t}${n.meta.required?"":"?"}: ${n.toString()}`).join(", ")} }`);S("union",["list"],({list:e},t)=>{let n=e.map(({toString:r})=>r()).join(" | ");return t?`(${n})`:n});S("intersect",["list"],({list:e})=>`${e.map(t=>t.toString(!0)).join(" & ")}`);S("transform",["inner","callback","preserve"],({inner:e},t)=>e.toString(t));var D=class extends Error{constructor(n,r,i){super(r);this.code=n;this.details=i;this.name="HarnessRpcError"}};function z(e,t){let n=e;for(let r of t){if(Array.isArray(n)){n=n[Number(r)];continue}if(typeof n!="object"||n===null)return;n=n[r]}return n}function ce(e,t){if(t.length===0)return e!==void 0;let n=z(e,t.slice(0,-1)),r=t[t.length-1];return Array.isArray(n)?Number(r)<n.length:typeof n!="object"||n===null?!1:r in n}function Me(e,t){let n=e;for(let r of t){if(n===null||typeof n!="object"&&typeof n!="function")return;let i=n;if(i.type==="object"&&i.dict!==void 0)n=i.dict[r];else if(i.type==="dict"||i.type==="array")n=i.inner;else return}return n}function bt(e){try{return new l(e)}catch{return}}function Z(e){if(!e.result.ok)throw new D(e.result.error.code,e.result.error.message,e.result.error.details);return e.result.value}var W="llm-pi-ai",yt="\0probe";function K(e){return e instanceof Error?e.message:String(e)}function $e(e){let t=e;return t?.type!=="union"||t.list===void 0?[]:t.list.map(n=>n.value).filter(n=>typeof n=="string")}function ht(e){let t={levels:[],modalities:[]};if(e===void 0)return t;let n=Me(bt(e.schema),["providers",yt,"models"]),r=n?.type==="array"?n.inner:void 0;if(r?.type!=="object"||r.dict===void 0)return t;let i=r.dict.reasoningEfforts,o=i?.type==="union"&&i.list!==void 0?i.list.find(d=>d.type==="dict"):void 0,s=o===void 0?[]:$e(o.sKey),a=r.dict.input,p=a?.type==="array"?$e(a.inner):[];return{levels:s,modalities:p}}function Ie(e){if(e===void 0||e===!1)return!0;if(typeof e!="object"||e===null||Array.isArray(e))return!1;let t=Object.entries(e);if(t.length===0)return!1;let n=!1;for(let[r,i]of t){if(r.length===0)return!1;if(i===null){if(r!=="off")return!1}else if(typeof i!="string"||i.length===0)return!1;r!=="off"&&(n=!0)}return n}function je(e,t){return e===void 0?!0:Array.isArray(e)?e.every(n=>typeof n=="string"&&n.length>0&&(t===void 0||t.includes(n))):!1}function De(e,t,n="value"){let r=z((n==="user"?e.user:e.value)??{},t);return typeof r=="object"&&r!==null&&!Array.isArray(r)?r:{}}function H(e,t,n="value"){let r=De(e,t,n).models;return Array.isArray(r)?r.map(i=>typeof i=="object"&&i!==null&&!Array.isArray(i)?i:{}):[]}function te(e,t){return ce(e.user??{},[...t,"models"])}function vt(e,t){return te(e,t)&&H(e,t,"user").length>0}function ne(e,t,n="value"){let r=De(e,t,n).modelOverrides;if(typeof r!="object"||r===null||Array.isArray(r))return{};let i={};for(let[o,s]of Object.entries(r))i[o]=typeof s=="object"&&s!==null&&!Array.isArray(s)?s:{};return i}function wt(e,t){return t.declared!==!1?te(e,t.settingsPath)?"declared-models":"inherited-models":vt(e,t.settingsPath)?"declared-models":H(e,t.settingsPath).length===0?"catalog-overrides":"inherited-models"}function xt(e){let t=e,n=new Set;return{getSnapshot:()=>t,setSnapshot(r){if(Object.is(r,t))return;t=r;let i=Array.from(n);for(let o of i)o()},subscribe(r){return n.add(r),()=>{n.delete(r)}}}}var ee=class{constructor(t){this.api=t;this.store=xt({status:"idle",error:null,writable:!0,namespace:void 0,rows:[],dormant:[],levels:[],modalities:[]});this.generation=0;this.disposed=!1;this.mutationTail=Promise.resolve();this.discoveries=new Map}dispose(){this.disposed=!0,this.generation+=1,this.activeAbort?.abort(),this.activeAbort=void 0,this.discoveries.clear()}discoverOfficialModels(t){if(this.disposed)return Promise.reject(new Error("better-model-provider: controller disposed"));let n=this.discoveries.get(t);if(n!==void 0)return n;let r=this.api.llm.discoverModels({settingsNs:W,provider:t}).then(i=>Z(i).models);return this.discoveries.set(t,r),r.catch(()=>{this.discoveries.get(t)===r&&!this.disposed&&this.discoveries.delete(t)}),r}load(){if(this.disposed)return Promise.resolve();let t=++this.generation;this.discoveries.clear(),this.activeAbort?.abort();let n=new AbortController;return this.activeAbort=n,this.runLoad(t,n.signal).finally(()=>{this.activeAbort===n&&(this.activeAbort=void 0)})}isCurrent(t){return!this.disposed&&t===this.generation}async runLoad(t,n){let r=this.store.getSnapshot();r.namespace===void 0&&this.store.setSnapshot({...r,status:"loading",error:null});try{let[i,o]=await Promise.all([this.api.settings.describe({},n).then(Z),this.api.llm.providers({},n).then(Z)]);if(!this.isCurrent(t))return;let s=i.namespaces.find(p=>p.ns===W),a=o.providers.filter(p=>p.settingsNs===W).map(p=>({entry:p,configured:s!==void 0&&ce(s.value??{},p.settingsPath),models:s===void 0?[]:H(s,p.settingsPath),writeMode:s===void 0?"inherited-models":wt(s,p),overrides:s===void 0?{}:ne(s,p.settingsPath,"user")}));this.store.setSnapshot({status:"ready",error:null,writable:i.writable,namespace:s,rows:a.filter(p=>p.configured&&p.entry.declared!==void 0),dormant:a.filter(p=>!p.configured&&p.entry.declared===!1),...ht(s)})}catch(i){if(!this.isCurrent(t))return;this.store.getSnapshot().namespace===void 0&&this.store.setSnapshot({...this.store.getSnapshot(),status:"error",error:K(i)})}}async commit(t){return this.enqueueMutation(async()=>{try{if(this.disposed)throw new Error("better-model-provider: controller disposed");let n=this.store.getSnapshot().namespace;if(n===void 0)throw new Error("better-model-provider: settings namespace unavailable");let r=t(n);if(r.length===0)return!1;let i=this.prepareMutation(),o=Z(await this.api.settings.mutate({ns:W,ops:r,expectedRevision:i.revision}));return this.store.setSnapshot({...this.store.getSnapshot(),namespace:o}),await this.reload(),!0}catch(n){throw await this.reload(),n}})}enqueueMutation(t){let n=this.mutationTail.then(t,t);return this.mutationTail=n.then(()=>{},()=>{}),n}prepareMutation(){return this.generation+=1,this.activeAbort?.abort(),this.activeAbort=void 0,this.store.getSnapshot().namespace}async reload(){await this.load()}};var Xe=require("react");var A=require("react");function Ve(e,t){let n=e.reasoningEfforts,r=e.input;return t.reasoning!==n&&(t.reasoning===void 0||n===void 0||t.reasoning===!1||n===!1||JSON.stringify(t.reasoning)!==JSON.stringify(n))||t.input!==r&&(t.input===void 0||r===void 0||JSON.stringify(t.input)!==JSON.stringify(r))||t.contextWindow!==e.contextWindow||t.maxTokens!==e.maxTokens}var ue=[["reasoning","reasoningEfforts"],["input","input"],["contextWindow","contextWindow"],["maxTokens","maxTokens"]],pe=ue.map(([,e])=>e);function kt(e,t){let n={...e};for(let[r,i]of ue){let o=t[r];o!==void 0&&(o.value===void 0?Reflect.deleteProperty(n,i):n[i]=Array.isArray(o.value)?[...o.value]:typeof o.value=="object"?{...o.value}:o.value)}return n}function _e(e,t,n,r,i){let o=H(e,t,"user");if(!te(e,t)||n<0||n>=o.length)return[];let s=o[n],a=s!==void 0&&(s.id??"")===r?n:-1;if(a<0&&(a=o.findIndex(d=>(d.id??"")===r)),a<0)return[];let p=o.map((d,h)=>h===a?kt(d,i):{...d});return[{op:"set",path:[...t,"models"],value:p}]}function fe(e){return e===void 0?!1:pe.some(t=>t in e)}function Le(e,t){let n=Object.keys(z(e.user??{},t));return n.length===1&&n[0]==="modelOverrides"}function We(e,t,n,r){let i=ne(e,t,"user"),o=i[n],s=[],a=[];for(let[p,d]of ue){let h=r[p];if(h===void 0)continue;let y=[...t,"modelOverrides",n,d];if(h.value===void 0)o!==void 0&&d in o&&a.push(d);else{let u=h.value;s.push({op:"set",path:y,value:Array.isArray(u)?[...u]:typeof u=="object"?{...u}:u})}}return s.length>0?[...s,...a.map(p=>({op:"unset",path:[...t,"modelOverrides",n,p]}))]:a.length===0||o===void 0?[]:Object.keys(o).filter(p=>!a.includes(p)).length===0?Object.keys(i).length!==1?[{op:"unset",path:[...t,"modelOverrides",n]}]:Le(e,t)?[{op:"unset",path:[...t]}]:[{op:"unset",path:[...t,"modelOverrides"]}]:a.map(p=>({op:"unset",path:[...t,"modelOverrides",n,p]}))}function Be(e,t,n){let r=ne(e,t,"user"),i=r[n];return i===void 0?[]:Object.keys(i).filter(a=>!pe.includes(a)).length>0?pe.filter(a=>a in i).map(a=>({op:"unset",path:[...t,"modelOverrides",n,a]})):Object.keys(r).length===1?Le(e,t)?[{op:"unset",path:[...t]}]:[{op:"unset",path:[...t,"modelOverrides"]}]:[{op:"unset",path:[...t,"modelOverrides",n]}]}var Ct=/^(\d+(?:\.\d+)?)([km])?$/i,U={k:1e3,m:1e6},me={contextWindow:"256K",maxTokens:"32K"};function ge(e){let t=e.trim();if(t.length===0)return;let n=Ct.exec(t);if(n===null)return Number.NaN;let r=n[2]?.toLowerCase(),i=r==="k"||r==="m"?U[r]:1,o=Number(n[1])*i,s=Math.round(o);return Math.abs(o-s)<1e-6?s:o}function I(e){return typeof e!="number"||!Number.isInteger(e)||e<=0?typeof e=="number"||typeof e=="string"?String(e):"":e%U.m===0?`${String(e/U.m)}M`:e%U.k===0?`${String(e/U.k)}K`:String(e)}function be(e){return e===void 0||Number.isInteger(e)&&e>=1}var _=require("react");var V=require("react");var b=require("react/jsx-runtime");function Fe(e,t){return e instanceof D&&e.code==="settings-conflict"?t("conflict"):K(e)}function ye(e){let{pointing:t}=e;return(0,b.jsx)("svg",{viewBox:"0 0 16 16",width:"12",height:"12","aria-hidden":"true",children:(0,b.jsx)("path",{d:t==="up"?"M4 10l4-4 4 4":t==="down"?"M4 6l4 4 4-4":"M6 4l4 4-4 4",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"})})}function ze(e){let{label:t,mode:n,enabled:r,options:i,onChange:o}=e;return(0,b.jsx)("select",{className:"bmp-select","aria-label":t,value:n,disabled:!r,onChange:s=>o(s.target.value),children:i.map(([s,a])=>(0,b.jsx)("option",{value:s,children:a},s))})}function St(e){return e===void 0?"":e===!1?"off":"custom"}function Rt(e,t){let n=e[t];return typeof n=="string"?n:""}function Ke(e){let{levels:t,value:n,onChange:r,enabled:i,t:o,modelId:s,official:a}=e,[p,d]=(0,V.useState)(!1),h=(0,V.useRef)(null),y=St(n);if((0,V.useEffect)(()=>{y!=="custom"&&d(!1)},[y]),(0,V.useEffect)(()=>{if(!p)return;let g=O=>{h.current!==null&&O.target instanceof Node&&!h.current.contains(O.target)&&d(!1)},k=O=>{O.key==="Escape"&&d(!1)};return document.addEventListener("mousedown",g),document.addEventListener("keydown",k),()=>{document.removeEventListener("mousedown",g),document.removeEventListener("keydown",k)}},[p]),t.length===0)return null;let u=typeof n=="object"&&n!==null?n:void 0,c=u===void 0?[]:t.filter(g=>g in u),f=g=>{if(g==="")r(void 0);else if(g==="off")r(!1);else{if(a){r({});return}let k=t.filter(w=>w==="medium"||w==="max"),O=k.length>0?k:t.filter(w=>w!=="off").slice(0,2);O.length===0?r({off:null}):r(Object.fromEntries(O.map(w=>[w,w])))}},x=(g,k,O)=>{let w={...g};O?w[k]=k==="off"?null:a?"":k:Reflect.deleteProperty(w,k),r(w)},T=(g,k,O)=>{let w={...g};O===""&&k==="off"?w[k]=null:w[k]=O,r(w)};return(0,b.jsxs)("div",{className:"bmp-block",ref:h,children:[(0,b.jsx)("div",{className:"bmp-blockLabel",children:o("modelReasoning")}),(0,b.jsxs)("div",{className:"bmp-modeGrid",children:[(0,b.jsx)(ze,{label:o("modelReasoning"),mode:y,enabled:i,options:[["",o(a?"keepOfficial":"inherit")],["off",o(a?"disableReasoning":"reasoningOff")],["custom",o(a?"customMapping":"custom")]],onChange:f}),y==="custom"&&u!==void 0&&(0,b.jsxs)("div",{className:"bmp-msWrap",children:[(0,b.jsxs)("button",{type:"button",className:"bmp-select bmp-msButton","aria-haspopup":"dialog","aria-expanded":p,"aria-controls":`bmp-levels-${s}`,disabled:!i,onClick:()=>d(g=>!g),children:[(0,b.jsx)("span",{children:o("levelsSelected",{count:c.length})}),(0,b.jsx)(ye,{pointing:p?"up":"down"})]}),p&&(0,b.jsx)("div",{className:"bmp-msPanel",id:`bmp-levels-${s}`,role:"group","aria-label":o("levelGroup",{model:s}),children:t.map(g=>(0,b.jsxs)("div",{className:"bmp-msItem",children:[(0,b.jsxs)("label",{className:"bmp-msItemCheck",children:[(0,b.jsx)("input",{type:"checkbox",disabled:!i,checked:g in u,onChange:k=>x(u,g,k.target.checked)}),(0,b.jsx)("span",{children:g})]}),g in u&&(0,b.jsx)("input",{className:"bmp-input bmp-msWire","aria-label":`${g} ${o("wire")}`,placeholder:g==="off"?"null":a?"\u2026":g,value:Rt(u,g),disabled:!i,onChange:k=>T(u,g,k.target.value)})]},g))})]})]}),a&&y==="custom"&&(0,b.jsx)("p",{className:"bmp-muted",children:o("wireMapNote")})]})}function He(e){let{modalities:t,value:n,onChange:r,enabled:i,t:o,modelId:s,official:a}=e;if(t.length===0)return null;let p=n??[],d=p.length===0?"":"custom",h=u=>{r(u===""?void 0:t.slice(0,1))},y=(u,c)=>{let f=c?[...p,u]:p.filter(x=>x!==u);r(f.length===0?void 0:f)};return(0,b.jsxs)("div",{className:"bmp-block",children:[(0,b.jsx)("div",{className:"bmp-blockLabel",children:o("modelInput")}),(0,b.jsxs)("div",{className:"bmp-modeGrid",children:[(0,b.jsx)(ze,{label:o("modelInput"),mode:d,enabled:i,options:[["",o(a?"keepOfficial":"inherit")],["custom",o("custom")]],onChange:h}),d==="custom"&&(0,b.jsx)("div",{className:"bmp-modalityRow",role:"group","aria-label":o("modalityGroup",{model:s}),children:t.map(u=>(0,b.jsxs)("label",{className:"bmp-toggle",children:[(0,b.jsx)("input",{type:"checkbox",disabled:!i,checked:p.includes(u),onChange:c=>y(u,c.target.checked)}),(0,b.jsx)("span",{children:u})]},u))})]})]})}function Ue(e){let{contextText:t,maxText:n,onChange:r,enabled:i,t:o,modelId:s,officialContext:a,officialMax:p}=e,d=(h,y,u,c,f)=>(0,b.jsxs)("label",{className:"bmp-capacityField",children:[(0,b.jsx)("span",{className:"bmp-blockLabel",children:h}),(0,b.jsx)("input",{className:"bmp-input","aria-label":`${h} (${s})`,placeholder:y,inputMode:"numeric",value:u,disabled:!i,onChange:x=>r(c,x.target.value)}),f!==void 0&&(0,b.jsx)("span",{className:"bmp-officialHint",children:o("officialValue",{value:f})})]});return(0,b.jsx)("div",{className:"bmp-block",children:(0,b.jsxs)("div",{className:"bmp-capacityGrid",children:[d(o("modelContextWindow"),me.contextWindow,t,"contextWindowText",a),d(o("modelMaxTokens"),me.maxTokens,n,"maxTokensText",p)]})})}var C=require("react/jsx-runtime"),Je={reasoningTouched:!1,inputTouched:!1,capacityTouched:!1,contextWindowText:"",maxTokensText:""};function Ot(e,t){return{reasoning:t?.reasoningTouched===!0?t.reasoning:e.reasoningEfforts,input:t?.inputTouched===!0?t.input:e.input,contextWindow:t?.capacityTouched===!0?ge(t.contextWindowText):e.contextWindow,maxTokens:t?.capacityTouched===!0?ge(t.maxTokensText):e.maxTokens}}function Nt(e,t){let n={};return t.reasoningTouched&&(n.reasoning={value:e.reasoning}),t.inputTouched&&(n.input={value:e.input}),t.capacityTouched&&(n.contextWindow={value:e.contextWindow},n.maxTokens={value:e.maxTokens}),n}function he(e){let{entry:t,modelId:n,displayName:r,writable:i,levels:o,modalities:s,flavor:a,applyRow:p,resetRow:d,officialContext:h,officialMax:y,t:u}=e,[c,f]=(0,_.useState)(!1),[x,T]=(0,_.useState)(null),[g,k]=(0,_.useState)(!1),[O,w]=(0,_.useState)(null),re=(0,_.useRef)(null),$=Ot(t,x),rt=x!==null&&Ve(t,$),ke=N=>{T(B=>({...Je,...B,...N})),w(null)},Ce=async(N,B)=>{k(!0),w(null);try{await N()&&B?.()}catch(ie){w(Fe(ie,u))}finally{k(!1)}},Se=()=>{re.current?.focus(),T(null)},it=N=>{if(!Ie($.reasoning)){w(u("modelReasoningInvalid"));return}if(!je($.input,s.length===0?void 0:[...s])){w(u("modelInputInvalid"));return}if(!be($.contextWindow)||!be($.maxTokens)){w(u("modelCapacityInvalid"));return}Ce(()=>p(N),Se)},ot=N=>{Ce(N,()=>re.current?.focus())};return(0,C.jsxs)("div",{className:"bmp-modelRow",children:[(0,C.jsxs)("div",{className:"bmp-modelMain",children:[(0,C.jsx)("span",{className:"bmp-modelId",title:n,children:n}),r!==""&&r!==n&&(0,C.jsx)("span",{className:"bmp-modelName",children:r}),x!==null&&(0,C.jsx)("span",{className:"bmp-staged",children:u("staged")}),(0,C.jsx)("button",{ref:re,type:"button",className:"bmp-icon","aria-label":u(c?"collapse":"expand"),"aria-expanded":c,onClick:()=>f(N=>!N),children:(0,C.jsx)(ye,{pointing:c?"down":"right"})})]}),c&&(0,C.jsxs)("div",{className:"bmp-modelAdvanced",children:[(0,C.jsx)(Ue,{contextText:x?.capacityTouched===!0?x.contextWindowText:I(t.contextWindow),maxText:x?.capacityTouched===!0?x.maxTokensText:I(t.maxTokens),onChange:(N,B)=>{T(ie=>{let oe=ie??Je;return{...oe.capacityTouched?oe:{...oe,contextWindowText:I(t.contextWindow),maxTokensText:I(t.maxTokens)},capacityTouched:!0,[N]:B}}),w(null)},enabled:i&&!g,t:u,modelId:n,officialContext:h,officialMax:y}),(0,C.jsx)(Ke,{levels:o,value:$.reasoning,onChange:N=>ke({reasoningTouched:!0,reasoning:N}),enabled:i&&!g,t:u,modelId:n,official:a==="catalog"}),(0,C.jsx)(He,{modalities:s,value:$.input,onChange:N=>ke({inputTouched:!0,input:N}),enabled:i&&!g,t:u,modelId:n,official:a==="catalog"}),O!==null&&(0,C.jsx)("div",{className:"bmp-error",role:"alert",children:O}),d!==void 0&&x===null&&(0,C.jsx)("div",{className:"bmp-rowActions",children:(0,C.jsx)("button",{type:"button",className:"bmp-link bmp-danger",disabled:g,onClick:()=>{d!==void 0&&ot(d)},children:u(g?"applying":"resetOfficial")})}),x!==null&&(0,C.jsxs)("div",{className:"bmp-rowActions",children:[(0,C.jsx)("button",{type:"button",className:"bmp-button",disabled:!rt||g,onClick:()=>{x!==null&&it(Nt($,x))},children:u(g?"applying":"apply")}),(0,C.jsx)("button",{type:"button",className:"bmp-link bmp-danger",disabled:g,onClick:Se,children:u("revert")})]})]})]})}var m=require("react/jsx-runtime");function Pt(e,t){switch(e){case"catalog-overrides":return"officialCatalog";case"inherited-models":return"inheritedRoute";case"declared-models":return t===!1?"officialUserList":"declaredRoute"}}function qe(e){let{row:t,t:n,children:r}=e;return(0,m.jsxs)("section",{className:"bmp-card",children:[(0,m.jsxs)("header",{className:"bmp-cardHeader",children:[(0,m.jsx)("span",{className:"bmp-cardTitle",children:t.entry.displayName}),(0,m.jsx)("span",{className:"bmp-cardMeta",children:t.entry.provider}),(0,m.jsx)("span",{className:"bmp-tag",children:n(Pt(t.writeMode,t.entry.declared))})]}),r]})}function Ye(e){return e.row.writeMode==="catalog-overrides"?(0,m.jsx)(Ge,{...e}):(0,m.jsx)(Et,{...e})}function Et(e){let{row:t,controller:n,levels:r,modalities:i,writable:o,t:s}=e,a=(0,A.useCallback)(async(d,h,y)=>n.commit(u=>_e(u,t.entry.settingsPath,d,h,y)),[n,t.entry.settingsPath]),p=o&&t.writeMode==="declared-models";return(0,m.jsxs)(qe,{row:t,t:s,children:[t.writeMode==="inherited-models"&&(0,m.jsx)("p",{className:"bmp-muted",children:s("inheritedModelList")}),(0,m.jsx)("div",{className:"bmp-models",children:t.models.map((d,h)=>{let y=typeof d.id=="string"?d.id:"";return(0,m.jsx)(he,{entry:d,modelId:y===""?`#${h+1}`:y,displayName:typeof d.name=="string"?d.name:"",writable:p,levels:r,modalities:i,flavor:"declared",applyRow:u=>a(h,y,u),t:s},y===""?`model-${h}`:y)})})]})}function Ge(e){let{row:t,controller:n,levels:r,modalities:i,writable:o,t:s}=e,[a,p]=(0,A.useState)(!1),[d,h]=(0,A.useState)({status:"idle"});(0,A.useEffect)(()=>{!a||d.status!=="idle"||(h({status:"loading"}),n.discoverOfficialModels(t.entry.provider).then(c=>h({status:"ready",models:c}),c=>h({status:"error",message:K(c)})))},[a,d.status,n,t.entry.provider]);let y=Object.keys(t.overrides).filter(c=>fe(t.overrides[c])),u=[d.status==="ready"?s("officialModelsCount",{count:d.models.length}):"",y.length>0?s("overriddenCount",{count:y.length}):""].filter(c=>c.length>0).join(" \xB7 ");return(0,m.jsxs)(qe,{row:t,t:s,children:[(0,m.jsx)("p",{className:"bmp-muted",children:s("catalogIntro")}),t.configured===!1&&(0,m.jsx)("p",{className:"bmp-muted",children:s("dormantHint")}),(0,m.jsxs)("div",{className:"bmp-catalogBar",children:[(0,m.jsx)("span",{className:"bmp-muted",children:u}),(0,m.jsx)("button",{type:"button",className:"bmp-button","aria-expanded":a,onClick:()=>p(c=>!c),children:s(a?"collapse":"manageOfficial")})]}),a&&(0,m.jsxs)("div",{className:"bmp-models",children:[(d.status==="idle"||d.status==="loading")&&(0,m.jsx)("p",{className:"bmp-muted",children:s("loading")}),d.status==="error"&&(0,m.jsxs)(m.Fragment,{children:[(0,m.jsxs)("div",{className:"bmp-error",role:"alert",children:[s("catalogLoadError"),": ",d.message]}),(0,m.jsx)("button",{type:"button",className:"bmp-button",onClick:()=>h({status:"idle"}),children:s("retry")})]}),d.status==="ready"&&d.models.map(c=>{let f=t.overrides[c.id],x={id:c.id,...c.name===void 0?{}:{name:c.name},...f};return(0,m.jsx)(he,{entry:x,modelId:c.id,displayName:c.name??"",writable:o,levels:r,modalities:i,flavor:"catalog",applyRow:T=>n.commit(g=>We(g,t.entry.settingsPath,c.id,T)),resetRow:fe(f)?()=>n.commit(T=>Be(T,t.entry.settingsPath,c.id)):void 0,officialContext:c.contextWindow===void 0?void 0:I(c.contextWindow),officialMax:c.maxTokens===void 0?void 0:I(c.maxTokens),t:s},c.id)})]})]})}function Qe(e){let{dormant:t,...n}=e,{t:r}=e,[i,o]=(0,A.useState)(!1),[s,a]=(0,A.useState)(null);(0,A.useEffect)(()=>{s!==null&&!t.some(d=>d.entry.provider===s)&&a(null)},[t,s]);let p=s===null?void 0:t.find(d=>d.entry.provider===s);return(0,m.jsxs)("div",{className:"bmp-dormant",children:[(0,m.jsx)("button",{type:"button",className:"bmp-button","aria-expanded":i,onClick:()=>o(d=>!d),children:r("manageOfficialProviders",{count:t.length})}),i&&(0,m.jsx)("div",{className:"bmp-dormantList",children:t.map(d=>(0,m.jsxs)("button",{type:"button",className:"bmp-dormantRow","aria-expanded":s===d.entry.provider,onClick:()=>a(h=>h===d.entry.provider?null:d.entry.provider),children:[(0,m.jsx)("span",{className:"bmp-cardTitle",children:d.entry.displayName}),(0,m.jsx)("span",{className:"bmp-cardMeta",children:d.entry.provider}),(0,m.jsx)("span",{className:"bmp-tag",children:r("officialCatalog")})]},d.entry.provider))}),i&&p!==void 0&&(0,m.jsx)(Ge,{...n,row:p}),i&&(0,m.jsx)("p",{className:"bmp-muted",children:r("adapterBoundary")})]})}var R=require("react/jsx-runtime");function ve(e){let{controller:t,useSnapshot:n,t:r}=e,i=n(),o=i.status;(0,Xe.useEffect)(()=>{o==="idle"&&t.load()},[o,t]);let s=i.namespace;return o==="idle"||o==="loading"?(0,R.jsx)("div",{className:"bmp-section",children:(0,R.jsx)("p",{className:"bmp-muted",children:r("loading")})}):o==="error"?(0,R.jsxs)("div",{className:"bmp-section",children:[(0,R.jsx)("div",{className:"bmp-error",role:"alert",children:i.error}),(0,R.jsx)("button",{type:"button",className:"bmp-button",onClick:()=>{t.reload()},children:r("retry")})]}):(0,R.jsxs)("div",{className:"bmp-section",children:[(0,R.jsx)("h2",{className:"bmp-title",children:r("title")}),(0,R.jsx)("p",{className:"bmp-muted",children:r("intro")}),!i.writable&&(0,R.jsx)("p",{className:"bmp-muted",children:r("readOnly")}),i.rows.length===0&&(0,R.jsxs)("div",{className:"bmp-empty",children:[(0,R.jsx)("div",{className:"bmp-emptyTitle",children:r("empty")}),(0,R.jsx)("div",{className:"bmp-muted",children:r("emptyHint")})]}),s!==void 0&&i.rows.map(a=>(0,R.jsx)(Ye,{row:a,controller:t,levels:i.levels,modalities:i.modalities,writable:i.writable,t:r},a.entry.provider)),s!==void 0&&i.dormant.length>0&&(0,R.jsx)(Qe,{dormant:i.dormant,controller:t,levels:i.levels,modalities:i.modalities,writable:i.writable,t:r})]})}var Ze={nav:"Model capabilities",title:"Model capabilities",intro:"Declare, per model, which reasoning-effort levels it accepts, which request modalities it admits, and which token capacities it carries. The declarations land in the provider profile as soon as you apply a row.",loading:"Loading providers\u2026",retry:"Retry now",conflict:"The settings document changed elsewhere. Your edits are kept below \u2014 review the refreshed state, then apply again.",empty:"No configurable providers yet",emptyHint:"Expand Manage official providers below to onboard an installed provider, or configure a custom route on the official Models page first.",declaredRoute:"declared",officialCatalog:"official catalog",catalogIntro:"Sparse capability overrides over the installed official catalog. Untouched fields keep the official defaults and follow future catalog updates \u2014 nothing is copied.",manageOfficial:"Manage official models",officialModelsCount:"{count} official models",overriddenCount:"{count} overridden",keepOfficial:"Keep official",disableReasoning:"Disable reasoning",customMapping:"Custom mapping",wireMapNote:"Overriding reasoning declares its own wire map: every checked level names the exact spelling sent to the endpoint (only off may stay blank).",officialValue:"Official: {value}",resetOfficial:"Reset to official defaults",catalogLoadError:"Could not load the official model list",manageOfficialProviders:"Manage official providers ({count})",dormantHint:"Not configured yet \u2014 the first override you apply creates the profile. The API key still belongs to the official Models page.",officialUserList:"official \xB7 user-listed",inheritedRoute:"inherited list",adapterBoundary:"Routes owned by dedicated adapters (lived under llm-deepseek / llm-openai-codex) declare capabilities in their adapter code and never appear here; a pi-ai catalog route of the same brand name is a different route and does appear.",inheritedModelList:"This model list is inherited from the active composition and is read-only here.",readOnly:"Settings are read-only in this view",expand:"expand",collapse:"collapse",modelContextWindow:"Context window",modelMaxTokens:"Max output tokens",modelReasoning:"Reasoning effort",inherit:"Provider default",reasoningOff:"No reasoning (false)",custom:"Custom",wire:"wire",modelInput:"Input modalities",apply:"Apply",revert:"Revert",applying:"Applying\u2026",modelReasoningInvalid:"invalid reasoning declaration: name a level beyond off, and give each level beyond off a wire value",modelInputInvalid:"invalid input modalities: choose from the declared vocabulary",modelCapacityInvalid:"invalid capacity: use a positive whole count, K for thousands, M for millions (blank inherits)",staged:"unapplied",levelsSelected:"{count} selected",levelGroup:"Reasoning effort levels of {model}",modalityGroup:"Input modalities of {model}"},et={nav:"\u6A21\u578B\u80FD\u529B",title:"\u6A21\u578B\u80FD\u529B",intro:"\u6309\u6A21\u578B\u58F0\u660E\u5B83\u7684\u63A8\u7406\u5F3A\u5EA6\u6863\u4F4D\u3001\u8BF7\u6C42\u6A21\u6001\u4E0E token \u5BB9\u91CF\uFF08\u4E0A\u4E0B\u6587\u7A97\u53E3 / \u6700\u5927\u8F93\u51FA\uFF09\u3002\u5E94\u7528\u540E\uFF0C\u58F0\u660E\u5373\u523B\u5199\u5165\u4F9B\u5E94\u5546 profile\u3002",loading:"\u6B63\u5728\u52A0\u8F7D\u4F9B\u5E94\u5546\u2026",retry:"\u7ACB\u5373\u91CD\u8BD5",conflict:"\u8BBE\u7F6E\u6587\u6863\u5DF2\u5728\u522B\u5904\u53D8\u66F4\u3002\u4F60\u7684\u7F16\u8F91\u4FDD\u7559\u5728\u4E0B\u65B9\u2014\u2014\u8BF7\u5148\u5BF9\u7167\u521A\u5237\u65B0\u7684\u72B6\u6001\uFF0C\u518D\u91CD\u65B0\u5E94\u7528\u3002",empty:"\u6682\u65E0\u53EF\u914D\u7F6E\u7684\u4F9B\u5E94\u5546",emptyHint:"\u5C55\u5F00\u4E0B\u65B9\u300C\u7BA1\u7406\u5B98\u65B9\u4F9B\u5E94\u5546\u300D\u63A5\u5165\u9A7B\u88C5\u7684\u4F9B\u5E94\u5546\uFF0C\u6216\u5148\u5728\u5B98\u65B9\u300C\u6A21\u578B\u300D\u9875\u914D\u7F6E\u4E00\u6761\u81EA\u5B9A\u4E49\u8DEF\u7531\u3002",declaredRoute:"\u624B\u5DE5\u58F0\u660E",officialCatalog:"\u5B98\u65B9\u76EE\u5F55",catalogIntro:"\u5BF9\u968F pi-ai \u9A7B\u88C5\u7684\u5B98\u65B9\u76EE\u5F55\u505A\u7A00\u758F\u80FD\u529B\u8986\u76D6\u3002\u672A\u89E6\u78B0\u7684\u5B57\u6BB5\u4FDD\u6301\u5B98\u65B9\u9ED8\u8BA4\u5E76\u8DDF\u968F\u76EE\u5F55\u5C06\u6765\u66F4\u65B0\u2014\u2014\u4E0D\u590D\u5236\u4EFB\u4F55\u5185\u5BB9\u3002",manageOfficial:"\u7BA1\u7406\u5B98\u65B9\u6A21\u578B",officialModelsCount:"{count} \u4E2A\u5B98\u65B9\u6A21\u578B",overriddenCount:"{count} \u4E2A\u5DF2\u8986\u76D6",keepOfficial:"\u8DDF\u968F\u5B98\u65B9",disableReasoning:"\u7981\u7528\u63A8\u7406",customMapping:"\u81EA\u5B9A\u4E49\u6620\u5C04",wireMapNote:"\u8986\u76D6\u63A8\u7406\u5373\u81EA\u884C\u58F0\u660E\u62FC\u5199\u8868\uFF1A\u52FE\u9009\u7684\u6BCF\u4E2A\u6863\u4F4D\u90FD\u8981\u586B\u53D1\u5F80\u7AEF\u70B9\u7684\u51C6\u786E\u62FC\u5199\uFF08\u53EA\u6709 off \u53EF\u7559\u7A7A\uFF09\u3002",officialValue:"\u5B98\u65B9\uFF1A{value}",resetOfficial:"\u8FD8\u539F\u4E3A\u5B98\u65B9\u9ED8\u8BA4",catalogLoadError:"\u65E0\u6CD5\u52A0\u8F7D\u5B98\u65B9\u6A21\u578B\u5217\u8868",manageOfficialProviders:"\u7BA1\u7406\u5B98\u65B9\u4F9B\u5E94\u5546\uFF08{count}\uFF09",dormantHint:"\u5C1A\u672A\u914D\u7F6E\u2014\u2014\u4F60\u5E94\u7528\u7684\u7B2C\u4E00\u4E2A\u8986\u76D6\u5373\u4F1A\u521B\u5EFA\u8BE5 profile\u3002API \u5BC6\u94A5\u4ECD\u5728\u5B98\u65B9\u300C\u6A21\u578B\u300D\u9875\u8BBE\u7F6E\u3002",officialUserList:"\u5B98\u65B9\xB7\u81EA\u7BA1",inheritedRoute:"\u7EE7\u627F\u6E05\u5355",adapterBoundary:"\u4E13\u5C5E\u9002\u914D\u5668\u8DEF\u7531\uFF08\u5982 llm-deepseek\u3001llm-openai-codex \u540D\u4E0B\u7684\uFF09\u80FD\u529B\u5199\u5728\u5176\u9002\u914D\u5668\u4EE3\u7801\u91CC\uFF0C\u4E0D\u4F1A\u51FA\u73B0\u5728\u672C\u9875\uFF1B\u540C\u54C1\u724C\u540D\u7684 pi-ai \u76EE\u5F55\u8DEF\u7531\u662F\u53E6\u4E00\u6761\u8DEF\u7531\uFF0C\u7167\u5E38\u51FA\u73B0\u3002",inheritedModelList:"\u6B64\u6A21\u578B\u5217\u8868\u7EE7\u627F\u81EA\u5F53\u524D\u7EC4\u88C5\uFF0C\u672C\u9875\u53EA\u8BFB\u3002",readOnly:"\u6B64\u89C6\u56FE\u4E0B\u8BBE\u7F6E\u4E3A\u53EA\u8BFB",expand:"\u5C55\u5F00",collapse:"\u6536\u8D77",modelContextWindow:"\u4E0A\u4E0B\u6587\u7A97\u53E3",modelMaxTokens:"\u6700\u5927\u8F93\u51FA token",modelReasoning:"\u63A8\u7406\u5F3A\u5EA6",inherit:"\u4F7F\u7528\u4F9B\u5E94\u5546\u9ED8\u8BA4",reasoningOff:"\u65E0\u63A8\u7406\uFF08false\uFF09",custom:"\u81EA\u5B9A\u4E49",wire:"\u53D6\u503C",modelInput:"\u8F93\u5165\u6A21\u6001",apply:"\u5E94\u7528",revert:"\u8FD8\u539F",applying:"\u5E94\u7528\u4E2D\u2026",modelReasoningInvalid:"\u63A8\u7406\u58F0\u660E\u65E0\u6548\uFF1A\u81F3\u5C11\u58F0\u660E\u4E00\u4E2A off \u4E4B\u5916\u7684\u6863\u4F4D\uFF0C\u4E14 off \u4E4B\u5916\u7684\u6863\u4F4D\u90FD\u8981\u6709\u53D6\u503C",modelInputInvalid:"\u8F93\u5165\u6A21\u6001\u65E0\u6548\uFF1A\u8BF7\u4ECE\u5DF2\u58F0\u660E\u7684\u8BCD\u6C47\u4E2D\u9009\u62E9",modelCapacityInvalid:"\u5BB9\u91CF\u65E0\u6548\uFF1A\u8BF7\u586B\u6B63\u6574\u6570\u8BA1\u6570\uFF0CK \u8868\u793A\u5343\u3001M \u8868\u793A\u767E\u4E07\uFF08\u7559\u7A7A\u4E3A\u7EE7\u627F\uFF09",staged:"\u672A\u5E94\u7528",levelsSelected:"\u5DF2\u9009\u62E9 {count} \u4E2A",levelGroup:"{model} \u7684\u63A8\u7406\u5F3A\u5EA6\u6863\u4F4D",modalityGroup:"{model} \u7684\u8F93\u5165\u6A21\u6001"};var tt=`
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
`;var At="better-model-provider",we="better-model-provider",Tt=["slots","locale","connection","remote"];function xe(e){e.store.getSnapshot().status!=="idle"&&e.reload()}function Mt(e){e.effect(()=>e.locale.register(we,{zh:et,en:Ze}),"better-model-provider: dictionaries");let t=document.createElement("style");t.dataset.plugin="better-model-provider",t.textContent=tt,document.head.appendChild(t),e.effect(()=>()=>t.remove(),"better-model-provider: stylesheet");let n=new ee(e.connection.api);e.effect(()=>()=>n.dispose(),"better-model-provider: controller");let r=()=>(0,nt.useSyncExternalStore)(n.store.subscribe,n.store.getSnapshot),i=e.locale.bind(we),o=(a,p)=>i(a,p),s=()=>({controller:n,useSnapshot:r,t:o});e.effect(()=>{let a=()=>{xe(n)},p=[e.remote.$on("settings/document-updated",d=>{d===W&&xe(n)}),e.remote.$on("llm/adapters-updated",a),e.on("connection/reset",a)];return()=>{for(let d of p)d()}},"better-model-provider: pushed invalidations"),e.slots.inject("settings.section",()=>e.slots.register({name:"settings.section",id:we,order:11,label:()=>o("nav"),inject:s},ve))}

		return module.exports;
	}
});

