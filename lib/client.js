window.__ModuleLoader__.load({
	id: "better-model-provider",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;

"use strict";var q=Object.defineProperty;var ct=Object.getOwnPropertyDescriptor;var pt=Object.getOwnPropertyNames;var ut=Object.prototype.hasOwnProperty;var ft=(e,t,n)=>t in e?q(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n;var mt=(e,t)=>{for(var n in t)q(e,n,{get:t[n],enumerable:!0})},gt=(e,t,n,r)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of pt(t))!ut.call(e,i)&&i!==n&&q(e,i,{get:()=>t[i],enumerable:!(r=ct(t,i))||r.enumerable});return e};var bt=e=>gt(q({},"__esModule",{value:!0}),e);var ae=(e,t,n)=>ft(e,typeof t!="symbol"?t+"":t,n);var Ut={};mt(Ut,{CapabilitiesSection:()=>we,HarnessRpcError:()=>D,apply:()=>Bt,inject:()=>Wt,name:()=>Ft,refreshIfLoaded:()=>Re});module.exports=bt(Ut);var st=require("react");function O(e){return e==null}function G(e){return e&&typeof e=="object"&&!Array.isArray(e)}function Ne(e,t){return Object.fromEntries(Object.entries(e).filter(([n,r])=>t(n,r)))}function M(e,t){return Object.fromEntries(Object.entries(e).map(([n,r])=>[n,t(r,n)]))}function Oe(e,t,n){if(!t)return{...e};let r={};for(let i of t)(n||e[i]!==void 0)&&(r[i]=e[i]);return r}function j(e,t){return arguments.length===1?n=>j(e,n):e in globalThis&&t instanceof globalThis[e]||Object.prototype.toString.call(t).slice(8,-1)===e}function Y(e){return j("ArrayBuffer",e)||j("SharedArrayBuffer",e)}function yt(e){return Y(e)||ArrayBuffer.isView(e)}var P;(function(e){e.is=Y,e.isSource=yt;function t(o){return ArrayBuffer.isView(o)?o.buffer.slice(o.byteOffset,o.byteOffset+o.byteLength):o}e.fromSource=t;function n(o){if(o=t(o),typeof Buffer<"u")return Buffer.from(o).toString("base64");let a="",d=new Uint8Array(o);for(let c=0;c<d.byteLength;c++)a+=String.fromCharCode(d[c]);return btoa(a)}e.toBase64=n;function r(o){return typeof Buffer<"u"?t(Buffer.from(o,"base64")):Uint8Array.from(atob(o),a=>a.charCodeAt(0))}e.fromBase64=r;function i(o){return o=t(o),typeof Buffer<"u"?Buffer.from(o).toString("hex"):Array.from(new Uint8Array(o),a=>a.toString(16).padStart(2,"0")).join("")}e.toHex=i;function s(o){if(typeof Buffer<"u")return t(Buffer.from(o,"hex"));let a=o.length%2===0?o:o.slice(0,o.length-1),d=[];for(let c=0;c<a.length;c+=2)d.push(parseInt(`${a[c]}${a[c+1]}`,16));return Uint8Array.from(d).buffer}e.fromHex=s})(P||(P={}));var qt=P.fromBase64,Jt=P.toBase64,Gt=P.fromHex,Yt=P.toHex;function J(e,t=new Map){if(!e||typeof e!="object")return e;if(j("Date",e))return new Date(e.valueOf());if(j("RegExp",e))return new RegExp(e.source,e.flags);if(Y(e))return e.slice(0);if(ArrayBuffer.isView(e))return e.buffer.slice(e.byteOffset,e.byteOffset+e.byteLength);let n=t.get(e);if(n)return n;if(Array.isArray(e)){let i=[];return t.set(e,i),e.forEach((s,o)=>{i[o]=Reflect.apply(J,null,[s,t])}),i}let r=Object.create(Object.getPrototypeOf(e));t.set(e,r);for(let i of Reflect.ownKeys(e)){let s={...Reflect.getOwnPropertyDescriptor(e,i)};"value"in s&&(s.value=Reflect.apply(J,null,[s.value,t])),Reflect.defineProperty(r,i,s)}return r}function L(e,t,n){if(e===t||!n&&O(e)&&O(t))return!0;if(typeof e!=typeof t||typeof e!="object"||!e||!t)return!1;function r(i,s){return i(e)?i(t)?s(e,t):!1:i(t)?!1:void 0}return r(Array.isArray,(i,s)=>i.length===s.length&&i.every((o,a)=>L(o,s[a])))??r(j("Date"),(i,s)=>i.valueOf()===s.valueOf())??r(j("RegExp"),(i,s)=>i.source===s.source&&i.flags===s.flags)??r(Y,(i,s)=>{if(i.byteLength!==s.byteLength)return!1;let o=new Uint8Array(i),a=new Uint8Array(s);for(let d=0;d<o.length;d++)if(o[d]!==a[d])return!1;return!0})??Object.keys({...e,...t}).every(i=>L(e[i],t[i],n))}var Ae;(function(e){e.millisecond=1,e.second=1e3,e.minute=e.second*60,e.hour=e.minute*60,e.day=e.hour*24,e.week=e.day*7;let t=new Date().getTimezoneOffset();function n(p){t=p}e.setTimezoneOffset=n;function r(){return t}e.getTimezoneOffset=r;function i(p=new Date,f){return typeof p=="number"&&(p=new Date(p)),f===void 0&&(f=t),Math.floor((p.valueOf()/e.minute-f)/1440)}e.getDateNumber=i;function s(p,f){let x=new Date(p*e.day);return f===void 0&&(f=t),new Date(+x+f*e.minute)}e.fromDateNumber=s;let o=/\d+(?:\.\d+)?/.source,a=new RegExp(`^${["w(?:eek(?:s)?)?","d(?:ay(?:s)?)?","h(?:our(?:s)?)?","m(?:in(?:ute)?(?:s)?)?","s(?:ec(?:ond)?(?:s)?)?"].map(p=>`(${o}${p})?`).join("")}$`);function d(p){let f=a.exec(p);return f?(parseFloat(f[1])*e.week||0)+(parseFloat(f[2])*e.day||0)+(parseFloat(f[3])*e.hour||0)+(parseFloat(f[4])*e.minute||0)+(parseFloat(f[5])*e.second||0):0}e.parseTime=d;function c(p){let f=d(p);return f?p=Date.now()+f:/^\d{1,2}(:\d{1,2}){1,2}$/.test(p)?p=`${new Date().toLocaleDateString()}-${p}`:/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(p)&&(p=`${new Date().getFullYear()}-${p}`),p?new Date(p):new Date}e.parseDate=c;function m(p){let f=Math.abs(p);return f>=e.day-e.hour/2?Math.round(p/e.day)+"d":f>=e.hour-e.minute/2?Math.round(p/e.hour)+"h":f>=e.minute-e.second/2?Math.round(p/e.minute)+"m":f>=e.second?Math.round(p/e.second)+"s":p+"ms"}e.format=m;function h(p,f=2){return p.toString().padStart(f,"0")}e.toDigits=h;function u(p,f=new Date){return p.replace("yyyy",f.getFullYear().toString()).replace("yy",f.getFullYear().toString().slice(2)).replace("MM",h(f.getMonth()+1)).replace("dd",h(f.getDate())).replace("hh",h(f.getHours())).replace("mm",h(f.getMinutes())).replace("ss",h(f.getSeconds())).replace("SSS",h(f.getMilliseconds(),3))}e.template=u})(Ae||(Ae={}));var Q=Symbol.for("schemastery"),Ee=Symbol.for("ValidationError");globalThis.__schemastery_index__??(globalThis.__schemastery_index__=0);globalThis.__schemastery_refs__=void 0;var v=class extends TypeError{constructor(t,n){let r="$";for(let i of n.path||[])typeof i=="string"?r+="."+i:typeof i=="number"?r+="["+i+"]":typeof i=="symbol"&&(r+=`[Symbol(${i.toString()})]`);r.startsWith(".")&&(r=r.slice(1));super((r==="$"?"":`${r} `)+t);ae(this,"options");ae(this,"name","ValidationError");this.options=n}static is(t){return!!t?.[Ee]}};Object.defineProperty(v.prototype,Ee,{value:!0});var l=function(e){let t=function(n,r={}){return l.resolve(n,t,r)[0]};if(e.refs){let n=M(e.refs,i=>new l(i)),r=i=>n[i];for(let i in n){let s=n[i];s.sKey=r(s.sKey),s.inner=r(s.inner),s.list=s.list&&s.list.map(r),s.dict=s.dict&&M(s.dict,r)}return n[e.uid]}if(Object.assign(t,e),typeof t.callback=="string")try{t.callback=new Function("return "+t.callback)()}catch{}return Object.defineProperty(t,"uid",{value:globalThis.__schemastery_index__++}),Object.setPrototypeOf(t,l.prototype),t.meta||(t.meta={}),t.toString=t.toString.bind(t),t};l.prototype=Object.create(Function.prototype);l.prototype[Q]=!0;Object.defineProperty(l.prototype,"~standard",{get(){return{version:1,vendor:"schemastery",validate:e=>{try{return{value:l.resolve(e,this,{})[0]}}catch(t){if(v.is(t))return{issues:[{message:t.message,path:t.options.path}]};throw t}}}}});l.ValidationError=v;l.prototype.toJSON=function(){var n,r;if(globalThis.__schemastery_refs__)return(n=globalThis.__schemastery_refs__)[r=this.uid]??(n[r]=JSON.parse(JSON.stringify({...this}))),this.uid;globalThis.__schemastery_refs__={[this.uid]:{...this}},globalThis.__schemastery_refs__[this.uid]=JSON.parse(JSON.stringify({...this}));let t={uid:this.uid,refs:globalThis.__schemastery_refs__};return globalThis.__schemastery_refs__=void 0,t};l.prototype.set=function(t,n){return this.dict[t]=n,this};l.prototype.push=function(t){return this.list.push(t),this};function ht(e,t){let n=typeof e=="string"?{"":e}:{...e};for(let r in t){let i=t[r];i?.$description||i?.$desc?n[r]=i.$description||i.$desc:typeof i=="string"&&(n[r]=i)}return n}function B(e){return e?.$value??e?.$inner}function Pe(e){return Ne(e??{},t=>!t.startsWith("$"))}l.prototype.i18n=function(t){let n=l(this),r=ht(n.meta.description,t);return Object.keys(r).length&&(n.meta.description=r),n.dict&&(n.dict=M(n.dict,(i,s)=>i.i18n(M(t,o=>B(o)?.[s]??o?.[s])))),n.list&&(n.list=n.list.map((i,s)=>i.i18n(M(t,(o={})=>Array.isArray(B(o))?B(o)[s]:Array.isArray(o)?o[s]:Pe(o))))),n.inner&&(n.inner=n.inner.i18n(M(t,i=>B(i)?B(i):Pe(i)))),n.sKey&&(n.sKey=n.sKey.i18n(M(t,i=>i?.$key))),n};l.prototype.extra=function(t,n){let r=l(this);return r.meta={...r.meta,[t]:n},r};for(let e of["required","disabled","collapse","hidden","loose"])Object.assign(l.prototype,{[e](t=!0){let n=l(this);return n.meta={...n.meta,[e]:t},n}});l.prototype.deprecated=function(){var n;let t=l(this);return(n=t.meta).badges||(n.badges=[]),t.meta.badges.push({text:"deprecated",type:"danger"}),t};l.prototype.experimental=function(){var n;let t=l(this);return(n=t.meta).badges||(n.badges=[]),t.meta.badges.push({text:"experimental",type:"warning"}),t};l.prototype.pattern=function(t){let n=l(this),r=Oe(t,["source","flags"]);return n.meta={...n.meta,pattern:r},n};l.prototype.simplify=function(t){if(L(t,this.meta.default,this.type==="dict"))return null;if(O(t))return t;if(this.type==="object"||this.type==="dict"){let n={};for(let r in t){let i=(this.type==="object"?this.dict[r]:this.inner)?.simplify(t[r]);(this.type==="dict"||!O(i))&&(n[r]=i)}return L(n,this.meta.default,this.type==="dict")?null:n}else if(this.type==="array"||this.type==="tuple"){let n=[];return t.forEach((r,i)=>{let s=this.type==="array"?this.inner:this.list[i],o=s?s.simplify(r):r;n.push(o)}),n}else if(this.type==="intersect"){let n={};for(let r of this.list)Object.assign(n,r.simplify(t));return n}else if(this.type==="union")for(let n of this.list)try{return l.resolve(t,n,{}),n.simplify(t)}catch{}return t};l.prototype.toString=function(t){return Me[this.type]?.(this,t)??`Schema<${this.type}>`};l.prototype.role=function(e,t){let n=l(this);return n.meta={...n.meta,role:e,extra:t},n};for(let e of["default","link","comment","description","max","min","step"])Object.assign(l.prototype,{[e](t){let n=l(this);return n.meta={...n.meta,[e]:t},n}});var Te={};l.extend=function(t,n){Te[t]=n};l.resolve=function(t,n,r={},i=!1){if(!n)return[t];if(r.ignore?.(t,n))return[t];if(O(t)&&n.type!=="lazy"){if(n.meta.required)throw new v("missing required value",r);let o=n,a=n.meta.default;for(;o?.type==="intersect"&&O(a);)o=o.list[0],a=o?.meta.default;if(O(a))return[t];t=J(a)}let s=Te[n.type];if(!s)throw new v(`unsupported type "${n.type}"`,r);try{return s(t,n,r,i)}catch(o){if(!n.meta.loose)throw o;return[n.meta.default]}};l.from=function(t){if(O(t))return l.any();if(["string","number","boolean"].includes(typeof t))return l.const(t).required();if(t[Q])return t;if(typeof t=="function")switch(t){case String:return l.string().required();case Number:return l.number().required();case Boolean:return l.boolean().required();case Function:return l.function().required();default:return l.is(t).required()}else throw new TypeError(`cannot infer schema from ${t}`)};l.lazy=function(t){let n=()=>(r.inner[Q]||(r.inner=r.builder(),r.inner.meta={...r.meta,...r.inner.meta}),r.inner.toJSON()),r=new l({type:"lazy",builder:t,inner:{toJSON:n}});return r};l.natural=function(){return l.number().step(1).min(0)};l.percent=function(){return l.number().step(.01).min(0).max(1).role("slider")};l.date=function(){return l.union([l.is(Date),l.transform(l.string().role("datetime"),(t,n)=>{let r=new Date(t);if(isNaN(+r))throw new v(`invalid date "${t}"`,n);return r},!0)])};l.regExp=function(t=""){return l.union([l.is(RegExp),l.transform(l.string().role("regexp",{flag:t}),(n,r)=>{try{return new RegExp(n,t)}catch(i){throw new v(i.message,r)}},!0)])};l.arrayBuffer=function(t){return l.union([l.is(ArrayBuffer),l.is(SharedArrayBuffer),l.transform(l.any(),(n,r)=>{if(P.isSource(n))return P.fromSource(n);throw new v(`expected ArrayBufferSource but got ${n}`,r)},!0),...t?[l.transform(l.string(),(n,r)=>{try{return t==="base64"?P.fromBase64(n):P.fromHex(n)}catch(i){throw new v(i.message,r)}},!0)]:[]])};l.extend("lazy",(e,t,n,r)=>(t.inner[Q]||(t.inner=t.builder(),t.inner.meta={...t.meta,...t.inner.meta}),l.resolve(e,t.inner,n,r)));l.extend("any",e=>[e]);l.extend("never",(e,t,n)=>{throw new v(`expected nullable but got ${e}`,n)});l.extend("const",(e,{value:t},n)=>{if(L(e,t))return[t];throw new v(`expected ${t} but got ${e}`,n)});function ce(e,t,n,r,i=!1){let{max:s=1/0,min:o=-1/0}=t;if(e>s)throw new v(`expected ${n} <= ${s} but got ${e}`,r);if(e<o&&!i)throw new v(`expected ${n} >= ${o} but got ${e}`,r)}l.extend("string",(e,{meta:t},n)=>{if(typeof e!="string")throw new v(`expected string but got ${e}`,n);if(t.pattern){let r=new RegExp(t.pattern.source,t.pattern.flags);if(!r.test(e))throw new v(`expect string to match regexp ${r}`,n)}return ce(e.length,t,"string length",n),[e]});function le(e,t){let n=e.toString();if(n.includes("e"))return e*Math.pow(10,t);let r=n.indexOf(".");if(r===-1)return e*Math.pow(10,t);let i=n.slice(r+1),s=n.slice(0,r);return i.length<=t?+(s+i.padEnd(t,"0")):+(s+i.slice(0,t)+"."+i.slice(t))}function vt(e,t,n){if(n=Math.abs(n),!/^\d+\.\d+$/.test(n.toString()))return(e-t)%n===0;let r=n.toString().indexOf("."),i=n.toString().slice(r+1).length;return Math.abs(le(e,i)-le(t,i))%le(n,i)===0}l.extend("number",(e,{meta:t},n)=>{if(typeof e!="number")throw new v(`expected number but got ${e}`,n);ce(e,t,"number",n);let{step:r}=t;if(r&&!vt(e,t.min??0,r))throw new v(`expected number multiple of ${r} but got ${e}`,n);return[e]});l.extend("boolean",(e,t,n)=>{if(typeof e=="boolean")return[e];throw new v(`expected boolean but got ${e}`,n)});l.extend("bitset",(e,{bits:t,meta:n},r)=>{let i=0,s=[];if(typeof e=="number"){i=e;for(let o in t)e&t[o]&&s.push(o)}else if(Array.isArray(e)){s=e;for(let o of s){if(typeof o!="string")throw new v(`expected string but got ${o}`,r);o in t&&(i|=t[o])}}else throw new v(`expected number or array but got ${e}`,r);return i===n.default?[i]:[i,s]});l.extend("function",(e,t,n)=>{if(typeof e=="function")return[e];throw new v(`expected function but got ${e}`,n)});l.extend("is",(e,{constructor:t},n)=>{if(typeof t=="function"){if(e instanceof t)return[e];throw new v(`expected ${t.name} but got ${e}`,n)}else{if(O(e))throw new v(`expected ${t} but got ${e}`,n);let r=Object.getPrototypeOf(e);for(;r;){if(r.constructor?.name===t)return[e];r=Object.getPrototypeOf(r)}throw new v(`expected ${t} but got ${e}`,n)}});function X(e,t,n,r){try{let[i,s]=l.resolve(e[t],n,{...r,path:[...r.path||[],t]});return s!==void 0&&(e[t]=s),i}catch(i){if(!r?.autofix)throw i;return delete e[t],n.meta.default}}l.extend("array",(e,{inner:t,meta:n},r)=>{if(!Array.isArray(e))throw new v(`expected array but got ${e}`,r);return ce(e.length,n,"array length",r,!O(t.meta.default)),[e.map((i,s)=>X(e,s,t,r))]});l.extend("dict",(e,{inner:t,sKey:n},r,i)=>{if(!G(e))throw new v(`expected object but got ${e}`,r);let s={};for(let o in e){let a;try{a=l.resolve(o,n,r)[0]}catch(d){if(i)continue;throw d}s[a]=X(e,o,t,r),e[a]=e[o],o!==a&&delete e[o]}return[s]});l.extend("tuple",(e,{list:t},n,r)=>{if(!Array.isArray(e))throw new v(`expected array but got ${e}`,n);let i=t.map((s,o)=>X(e,o,s,n));return r?[i]:(i.push(...e.slice(t.length)),[i])});function de(e,t){for(let n in t)n in e||(e[n]=t[n])}l.extend("object",(e,{dict:t},n,r)=>{if(!G(e))throw new v(`expected object but got ${e}`,n);let i={};for(let s in t){let o=X(e,s,t[s],n);(!O(o)||s in e)&&(i[s]=o)}return r||de(i,e),[i]});l.extend("union",(e,{list:t,toString:n},r,i)=>{let s=[];for(let o of t)try{return l.resolve(e,o,r,i)}catch(a){s.push(a)}throw new v(`expected ${n()} but got ${JSON.stringify(e)}`,r)});l.extend("intersect",(e,{list:t,toString:n},r,i)=>{if(!t.length)return[e];let s;for(let o of t){let a=l.resolve(e,o,r,!0)[0];if(!O(a))if(O(s))s=a;else{if(typeof s!=typeof a)throw new v(`expected ${n()} but got ${JSON.stringify(e)}`,r);if(typeof a=="object")de(s??(s={}),a);else if(s!==a)throw new v(`expected ${n()} but got ${JSON.stringify(e)}`,r)}}return!i&&G(e)&&de(s,e),[s]});l.extend("transform",(e,{inner:t,callback:n,preserve:r},i)=>{let[s,o=e]=l.resolve(e,t,i,!0);return r?[n(s)]:[n(s),n(o)]});var Me={};function C(e,t,n){Me[e]=n,Object.assign(l,{[e](...r){let i=new l({type:e});return t.forEach((s,o)=>{switch(s){case"sKey":i.sKey=r[o]??l.string();break;case"inner":i.inner=l.from(r[o]);break;case"list":i.list=r[o].map(l.from);break;case"dict":i.dict=M(r[o],l.from);break;case"bits":i.bits={};for(let a in r[o])typeof r[o][a]=="number"&&(i.bits[a]=r[o][a]);break;case"callback":{let a=i.callback=r[o];a.toJSON||(a.toJSON=()=>a.toString());break}case"constructor":{let a=i.constructor=r[o];typeof a=="function"&&(a.toJSON||(a.toJSON=()=>a.name));break}default:i[s]=r[o]}}),e==="object"||e==="dict"?i.meta.default={}:e==="array"||e==="tuple"?i.meta.default=[]:e==="bitset"&&(i.meta.default=0),i}})}C("is",["constructor"],({constructor:e})=>typeof e=="function"?e.name:e);C("any",[],()=>"any");C("never",[],()=>"never");C("const",["value"],({value:e})=>typeof e=="string"?JSON.stringify(e):e);C("string",[],()=>"string");C("number",[],()=>"number");C("boolean",[],()=>"boolean");C("bitset",["bits"],()=>"bitset");C("function",[],()=>"function");C("array",["inner"],({inner:e})=>`${e.toString(!0)}[]`);C("dict",["inner","sKey"],({inner:e,sKey:t})=>`{ [key: ${t.toString()}]: ${e.toString()} }`);C("tuple",["list"],({list:e})=>`[${e.map(t=>t.toString()).join(", ")}]`);C("object",["dict"],({dict:e})=>Object.keys(e).length===0?"{}":`{ ${Object.entries(e).map(([t,n])=>`${t}${n.meta.required?"":"?"}: ${n.toString()}`).join(", ")} }`);C("union",["list"],({list:e},t)=>{let n=e.map(({toString:r})=>r()).join(" | ");return t?`(${n})`:n});C("intersect",["list"],({list:e})=>`${e.map(t=>t.toString(!0)).join(" & ")}`);C("transform",["inner","callback","preserve"],({inner:e},t)=>e.toString(t));var D=class extends Error{constructor(n,r,i){super(r);this.code=n;this.details=i;this.name="HarnessRpcError"}};function z(e,t){let n=e;for(let r of t){if(Array.isArray(n)){n=n[Number(r)];continue}if(typeof n!="object"||n===null)return;n=n[r]}return n}function pe(e,t){if(t.length===0)return e!==void 0;let n=z(e,t.slice(0,-1)),r=t[t.length-1];return Array.isArray(n)?Number(r)<n.length:typeof n!="object"||n===null?!1:r in n}function Ie(e,t){let n=e;for(let r of t){if(n===null||typeof n!="object"&&typeof n!="function")return;let i=n;if(i.type==="object"&&i.dict!==void 0)n=i.dict[r];else if(i.type==="dict"||i.type==="array")n=i.inner;else return}return n}function wt(e){try{return new l(e)}catch{return}}function Z(e){if(!e.result.ok)throw new D(e.result.error.code,e.result.error.message,e.result.error.details);return e.result.value}var F="llm-pi-ai",xt="\0probe";function U(e){return e instanceof Error?e.message:String(e)}function $e(e){let t=e;return t?.type!=="union"||t.list===void 0?[]:t.list.map(n=>n.value).filter(n=>typeof n=="string")}function Rt(e){let t={levels:[],modalities:[]};if(e===void 0)return t;let n=Ie(wt(e.schema),["providers",xt,"models"]),r=n?.type==="array"?n.inner:void 0;if(r?.type!=="object"||r.dict===void 0)return t;let i=r.dict.reasoningEfforts,s=i?.type==="union"&&i.list!==void 0?i.list.find(c=>c.type==="dict"):void 0,o=s===void 0?[]:$e(s.sKey),a=r.dict.input,d=a?.type==="array"?$e(a.inner):[];return{levels:o,modalities:d}}function je(e){if(e===void 0||e===!1)return!0;if(typeof e!="object"||e===null||Array.isArray(e))return!1;let t=Object.entries(e);if(t.length===0)return!1;let n=!1;for(let[r,i]of t){if(r.length===0)return!1;if(i===null){if(r!=="off")return!1}else if(typeof i!="string"||i.length===0)return!1;r!=="off"&&(n=!0)}return n}function De(e,t){return e===void 0?!0:Array.isArray(e)?e.every(n=>typeof n=="string"&&n.length>0&&(t===void 0||t.includes(n))):!1}function Ve(e,t,n="value"){let r=z((n==="user"?e.user:e.value)??{},t);return typeof r=="object"&&r!==null&&!Array.isArray(r)?r:{}}function K(e,t,n="value"){let r=Ve(e,t,n).models;return Array.isArray(r)?r.map(i=>typeof i=="object"&&i!==null&&!Array.isArray(i)?i:{}):[]}function te(e,t){return pe(e.user??{},[...t,"models"])}function kt(e,t){return te(e,t)&&K(e,t,"user").length>0}function ne(e,t,n="value"){let r=Ve(e,t,n).modelOverrides;if(typeof r!="object"||r===null||Array.isArray(r))return{};let i={};for(let[s,o]of Object.entries(r))i[s]=typeof o=="object"&&o!==null&&!Array.isArray(o)?o:{};return i}function Ct(e,t){return t.declared!==!1?te(e,t.settingsPath)?"declared-models":"inherited-models":kt(e,t.settingsPath)?"declared-models":K(e,t.settingsPath).length===0?"catalog-overrides":"inherited-models"}function St(e){let t=e,n=new Set;return{getSnapshot:()=>t,setSnapshot(r){if(Object.is(r,t))return;t=r;let i=Array.from(n);for(let s of i)s()},subscribe(r){return n.add(r),()=>{n.delete(r)}}}}var ee=class{constructor(t){this.api=t;this.store=St({status:"idle",error:null,writable:!0,namespace:void 0,rows:[],dormant:[],levels:[],modalities:[]});this.generation=0;this.disposed=!1;this.mutationTail=Promise.resolve();this.discoveries=new Map}dispose(){this.disposed=!0,this.generation+=1,this.activeAbort?.abort(),this.activeAbort=void 0,this.discoveries.clear()}discoverOfficialModels(t){if(this.disposed)return Promise.reject(new Error("better-model-provider: controller disposed"));let n=this.discoveries.get(t);if(n!==void 0)return n;let r=this.api.llm.discoverModels({settingsNs:F,provider:t}).then(i=>Z(i).models);return this.discoveries.set(t,r),r.catch(()=>{this.discoveries.get(t)===r&&!this.disposed&&this.discoveries.delete(t)}),r}load(){if(this.disposed)return Promise.resolve();let t=++this.generation;this.discoveries.clear(),this.activeAbort?.abort();let n=new AbortController;return this.activeAbort=n,this.runLoad(t,n.signal).finally(()=>{this.activeAbort===n&&(this.activeAbort=void 0)})}isCurrent(t){return!this.disposed&&t===this.generation}async runLoad(t,n){let r=this.store.getSnapshot();r.namespace===void 0&&this.store.setSnapshot({...r,status:"loading",error:null});try{let[i,s]=await Promise.all([this.api.settings.describe({},n).then(Z),this.api.llm.providers({},n).then(Z)]);if(!this.isCurrent(t))return;let o=i.namespaces.find(d=>d.ns===F),a=s.providers.filter(d=>d.settingsNs===F).map(d=>({entry:d,configured:o!==void 0&&pe(o.value??{},d.settingsPath),models:o===void 0?[]:K(o,d.settingsPath),writeMode:o===void 0?"inherited-models":Ct(o,d),overrides:o===void 0?{}:ne(o,d.settingsPath,"user")}));this.store.setSnapshot({status:"ready",error:null,writable:i.writable,namespace:o,rows:a.filter(d=>d.configured&&d.entry.declared!==void 0),dormant:a.filter(d=>!d.configured&&d.entry.declared===!1),...Rt(o)})}catch(i){if(!this.isCurrent(t))return;this.store.getSnapshot().namespace===void 0&&this.store.setSnapshot({...this.store.getSnapshot(),status:"error",error:U(i)})}}async commit(t){return this.enqueueMutation(async()=>{try{if(this.disposed)throw new Error("better-model-provider: controller disposed");let n=this.store.getSnapshot().namespace;if(n===void 0)throw new Error("better-model-provider: settings namespace unavailable");let r=t(n);if(r.length===0)return!1;let i=this.prepareMutation(),s=Z(await this.api.settings.mutate({ns:F,ops:r,expectedRevision:i.revision}));return this.store.setSnapshot({...this.store.getSnapshot(),namespace:s}),await this.reload(),!0}catch(n){throw await this.reload(),n}})}enqueueMutation(t){let n=this.mutationTail.then(t,t);return this.mutationTail=n.then(()=>{},()=>{}),n}prepareMutation(){return this.generation+=1,this.activeAbort?.abort(),this.activeAbort=void 0,this.store.getSnapshot().namespace}async reload(){await this.load()}};var _e="bmp-alpha",At={"settings/conflict":"settings-conflict"};function Nt(e){return{code:At[e.code]??e.code,message:e.message,details:e.details}}function re(e){return e.then(t=>t.ok?{rpcId:_e,result:t}:{rpcId:_e,result:{ok:!1,error:Nt(t.error)}})}async function Le(e,t){let n=await e;return n.ok?{ok:!0,value:t(n.value)}:n}function Ot(e,t){return{settings:{describe:(o,a)=>re(e.describe()),mutate:(o,a)=>re(e.mutate(o.ns,o.ops,o.expectedRevision))},llm:{providers:(o,a)=>re(Le(t.listConfigurableProviders(),d=>({providers:d}))),discoverModels:(o,a)=>{let{settingsNs:d,...c}=o;return re(Le(t.discoverModels(d,c,a),m=>({models:m})))}}}}function Pt(e){let t=e.get("remote.settings"),n=e.get("remote.llm");if(t!==void 0&&n!==void 0)return{kind:"ready",api:Ot(t,n)};if(t!==void 0)return{kind:"partial",awaiting:"remote.llm"};if(n!==void 0)return{kind:"partial",awaiting:"remote.settings"};let r=e.connection.api;return r===void 0?{kind:"absent"}:{kind:"ready",api:r}}var Et="internal/service";function Tt(e){return e.kind==="absent"?"better-model-provider: no harness Remote face is available yet \u2014 neither the remote.settings/remote.llm pair (dsh \u22650.1.2) nor connection.api (dsh \u22640.1.1) has arrived; the capabilities section stays idle and registers the moment either is announced":e.awaiting==="remote.llm"?"better-model-provider: remote.settings answered but remote.llm has not \u2014 dsh \u22650.1.2 mounts its Remote namespaces sequentially; the capabilities section registers as soon as remote.llm arrives":"better-model-provider: remote.llm answered but remote.settings has not \u2014 dsh \u22650.1.2 mounts its Remote namespaces sequentially; the capabilities section registers as soon as remote.settings arrives"}function Fe(e,t){let n=!1,r=!1,i=()=>{if(r)return!0;let o=Pt(e);if(o.kind!=="ready")return n||(n=!0,console.warn(Tt(o))),!1;r=!0;try{t(o.api)}catch(a){console.error("better-model-provider: the Remote face resolved but mounting the capabilities section threw \u2014 the section stays unregistered rather than taking the harness dispatch down",a)}return!0};if(i())return;let s=e.on(Et,()=>{i()&&s()});e.effect(()=>s,"better-model-provider: remote face await")}var nt=require("react");var E=require("react");function We(e,t){let n=e.reasoningEfforts,r=e.input;return t.reasoning!==n&&(t.reasoning===void 0||n===void 0||t.reasoning===!1||n===!1||JSON.stringify(t.reasoning)!==JSON.stringify(n))||t.input!==r&&(t.input===void 0||r===void 0||JSON.stringify(t.input)!==JSON.stringify(r))||t.contextWindow!==e.contextWindow||t.maxTokens!==e.maxTokens}var fe=[["reasoning","reasoningEfforts"],["input","input"],["contextWindow","contextWindow"],["maxTokens","maxTokens"]],ue=fe.map(([,e])=>e);function Mt(e,t){let n={...e};for(let[r,i]of fe){let s=t[r];s!==void 0&&(s.value===void 0?Reflect.deleteProperty(n,i):n[i]=Array.isArray(s.value)?[...s.value]:typeof s.value=="object"?{...s.value}:s.value)}return n}function Be(e,t,n,r,i){let s=K(e,t,"user");if(!te(e,t)||n<0||n>=s.length)return[];let o=s[n],a=o!==void 0&&(o.id??"")===r?n:-1;if(a<0&&(a=s.findIndex(c=>(c.id??"")===r)),a<0)return[];let d=s.map((c,m)=>m===a?Mt(c,i):{...c});return[{op:"set",path:[...t,"models"],value:d}]}function me(e){return e===void 0?!1:ue.some(t=>t in e)}function ze(e,t){let n=Object.keys(z(e.user??{},t));return n.length===1&&n[0]==="modelOverrides"}function Ue(e,t,n,r){let i=ne(e,t,"user"),s=i[n],o=[],a=[];for(let[d,c]of fe){let m=r[d];if(m===void 0)continue;let h=[...t,"modelOverrides",n,c];if(m.value===void 0)s!==void 0&&c in s&&a.push(c);else{let u=m.value;o.push({op:"set",path:h,value:Array.isArray(u)?[...u]:typeof u=="object"?{...u}:u})}}return o.length>0?[...o,...a.map(d=>({op:"unset",path:[...t,"modelOverrides",n,d]}))]:a.length===0||s===void 0?[]:Object.keys(s).filter(d=>!a.includes(d)).length===0?Object.keys(i).length!==1?[{op:"unset",path:[...t,"modelOverrides",n]}]:ze(e,t)?[{op:"unset",path:[...t]}]:[{op:"unset",path:[...t,"modelOverrides"]}]:a.map(d=>({op:"unset",path:[...t,"modelOverrides",n,d]}))}function Ke(e,t,n){let r=ne(e,t,"user"),i=r[n];return i===void 0?[]:Object.keys(i).filter(a=>!ue.includes(a)).length>0?ue.filter(a=>a in i).map(a=>({op:"unset",path:[...t,"modelOverrides",n,a]})):Object.keys(r).length===1?ze(e,t)?[{op:"unset",path:[...t]}]:[{op:"unset",path:[...t,"modelOverrides"]}]:[{op:"unset",path:[...t,"modelOverrides",n]}]}var It=/^(\d+(?:\.\d+)?)([km])?$/i,H={k:1e3,m:1e6},ge={contextWindow:"256K",maxTokens:"32K"};function be(e){let t=e.trim();if(t.length===0)return;let n=It.exec(t);if(n===null)return Number.NaN;let r=n[2]?.toLowerCase(),i=r==="k"||r==="m"?H[r]:1,s=Number(n[1])*i,o=Math.round(s);return Math.abs(s-o)<1e-6?o:s}function $(e){return typeof e!="number"||!Number.isInteger(e)||e<=0?typeof e=="number"||typeof e=="string"?String(e):"":e%H.m===0?`${String(e/H.m)}M`:e%H.k===0?`${String(e/H.k)}K`:String(e)}function ye(e){return e===void 0||Number.isInteger(e)&&e>=1}var _=require("react");var V=require("react");var y=require("react/jsx-runtime");function He(e,t){return e instanceof D&&e.code==="settings-conflict"?t("conflict"):U(e)}function he(e){let{pointing:t}=e;return(0,y.jsx)("svg",{viewBox:"0 0 16 16",width:"12",height:"12","aria-hidden":"true",children:(0,y.jsx)("path",{d:t==="up"?"M4 10l4-4 4 4":t==="down"?"M4 6l4 4 4-4":"M6 4l4 4-4 4",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"})})}function qe(e){let{label:t,mode:n,enabled:r,options:i,onChange:s}=e;return(0,y.jsx)("select",{className:"bmp-select","aria-label":t,value:n,disabled:!r,onChange:o=>s(o.target.value),children:i.map(([o,a])=>(0,y.jsx)("option",{value:o,children:a},o))})}function $t(e){return e===void 0?"":e===!1?"off":"custom"}function jt(e,t){let n=e[t];return typeof n=="string"?n:""}function Je(e){let{levels:t,value:n,onChange:r,enabled:i,t:s,modelId:o,official:a}=e,[d,c]=(0,V.useState)(!1),m=(0,V.useRef)(null),h=$t(n);if((0,V.useEffect)(()=>{h!=="custom"&&c(!1)},[h]),(0,V.useEffect)(()=>{if(!d)return;let b=A=>{m.current!==null&&A.target instanceof Node&&!m.current.contains(A.target)&&c(!1)},R=A=>{A.key==="Escape"&&c(!1)};return document.addEventListener("mousedown",b),document.addEventListener("keydown",R),()=>{document.removeEventListener("mousedown",b),document.removeEventListener("keydown",R)}},[d]),t.length===0)return null;let u=typeof n=="object"&&n!==null?n:void 0,p=u===void 0?[]:t.filter(b=>b in u),f=b=>{if(b==="")r(void 0);else if(b==="off")r(!1);else{if(a){r({});return}let R=t.filter(w=>w==="medium"||w==="max"),A=R.length>0?R:t.filter(w=>w!=="off").slice(0,2);A.length===0?r({off:null}):r(Object.fromEntries(A.map(w=>[w,w])))}},x=(b,R,A)=>{let w={...b};A?w[R]=R==="off"?null:a?"":R:Reflect.deleteProperty(w,R),r(w)},T=(b,R,A)=>{let w={...b};A===""&&R==="off"?w[R]=null:w[R]=A,r(w)};return(0,y.jsxs)("div",{className:"bmp-block",ref:m,children:[(0,y.jsx)("div",{className:"bmp-blockLabel",children:s("modelReasoning")}),(0,y.jsxs)("div",{className:"bmp-modeGrid",children:[(0,y.jsx)(qe,{label:s("modelReasoning"),mode:h,enabled:i,options:[["",s(a?"keepOfficial":"inherit")],["off",s(a?"disableReasoning":"reasoningOff")],["custom",s(a?"customMapping":"custom")]],onChange:f}),h==="custom"&&u!==void 0&&(0,y.jsxs)("div",{className:"bmp-msWrap",children:[(0,y.jsxs)("button",{type:"button",className:"bmp-select bmp-msButton","aria-haspopup":"dialog","aria-expanded":d,"aria-controls":`bmp-levels-${o}`,disabled:!i,onClick:()=>c(b=>!b),children:[(0,y.jsx)("span",{children:s("levelsSelected",{count:p.length})}),(0,y.jsx)(he,{pointing:d?"up":"down"})]}),d&&(0,y.jsx)("div",{className:"bmp-msPanel",id:`bmp-levels-${o}`,role:"group","aria-label":s("levelGroup",{model:o}),children:t.map(b=>(0,y.jsxs)("div",{className:"bmp-msItem",children:[(0,y.jsxs)("label",{className:"bmp-msItemCheck",children:[(0,y.jsx)("input",{type:"checkbox",disabled:!i,checked:b in u,onChange:R=>x(u,b,R.target.checked)}),(0,y.jsx)("span",{children:b})]}),b in u&&(0,y.jsx)("input",{className:"bmp-input bmp-msWire","aria-label":`${b} ${s("wire")}`,placeholder:b==="off"?"null":a?"\u2026":b,value:jt(u,b),disabled:!i,onChange:R=>T(u,b,R.target.value)})]},b))})]})]}),a&&h==="custom"&&(0,y.jsx)("p",{className:"bmp-muted",children:s("wireMapNote")})]})}function Ge(e){let{modalities:t,value:n,onChange:r,enabled:i,t:s,modelId:o,official:a}=e;if(t.length===0)return null;let d=n??[],c=d.length===0?"":"custom",m=u=>{r(u===""?void 0:t.slice(0,1))},h=(u,p)=>{let f=p?[...d,u]:d.filter(x=>x!==u);r(f.length===0?void 0:f)};return(0,y.jsxs)("div",{className:"bmp-block",children:[(0,y.jsx)("div",{className:"bmp-blockLabel",children:s("modelInput")}),(0,y.jsxs)("div",{className:"bmp-modeGrid",children:[(0,y.jsx)(qe,{label:s("modelInput"),mode:c,enabled:i,options:[["",s(a?"keepOfficial":"inherit")],["custom",s("custom")]],onChange:m}),c==="custom"&&(0,y.jsx)("div",{className:"bmp-modalityRow",role:"group","aria-label":s("modalityGroup",{model:o}),children:t.map(u=>(0,y.jsxs)("label",{className:"bmp-toggle",children:[(0,y.jsx)("input",{type:"checkbox",disabled:!i,checked:d.includes(u),onChange:p=>h(u,p.target.checked)}),(0,y.jsx)("span",{children:u})]},u))})]})]})}function Ye(e){let{contextText:t,maxText:n,onChange:r,enabled:i,t:s,modelId:o,officialContext:a,officialMax:d}=e,c=(m,h,u,p,f)=>(0,y.jsxs)("label",{className:"bmp-capacityField",children:[(0,y.jsx)("span",{className:"bmp-blockLabel",children:m}),(0,y.jsx)("input",{className:"bmp-input","aria-label":`${m} (${o})`,placeholder:h,inputMode:"numeric",value:u,disabled:!i,onChange:x=>r(p,x.target.value)}),f!==void 0&&(0,y.jsx)("span",{className:"bmp-officialHint",children:s("officialValue",{value:f})})]});return(0,y.jsx)("div",{className:"bmp-block",children:(0,y.jsxs)("div",{className:"bmp-capacityGrid",children:[c(s("modelContextWindow"),ge.contextWindow,t,"contextWindowText",a),c(s("modelMaxTokens"),ge.maxTokens,n,"maxTokensText",d)]})})}var k=require("react/jsx-runtime"),Qe={reasoningTouched:!1,inputTouched:!1,capacityTouched:!1,contextWindowText:"",maxTokensText:""};function Dt(e,t){return{reasoning:t?.reasoningTouched===!0?t.reasoning:e.reasoningEfforts,input:t?.inputTouched===!0?t.input:e.input,contextWindow:t?.capacityTouched===!0?be(t.contextWindowText):e.contextWindow,maxTokens:t?.capacityTouched===!0?be(t.maxTokensText):e.maxTokens}}function Vt(e,t){let n={};return t.reasoningTouched&&(n.reasoning={value:e.reasoning}),t.inputTouched&&(n.input={value:e.input}),t.capacityTouched&&(n.contextWindow={value:e.contextWindow},n.maxTokens={value:e.maxTokens}),n}function ve(e){let{entry:t,modelId:n,displayName:r,writable:i,levels:s,modalities:o,flavor:a,applyRow:d,resetRow:c,officialContext:m,officialMax:h,t:u}=e,[p,f]=(0,_.useState)(!1),[x,T]=(0,_.useState)(null),[b,R]=(0,_.useState)(!1),[A,w]=(0,_.useState)(null),ie=(0,_.useRef)(null),I=Dt(t,x),at=x!==null&&We(t,I),ke=N=>{T(W=>({...Qe,...W,...N})),w(null)},Ce=async(N,W)=>{R(!0),w(null);try{await N()&&W?.()}catch(oe){w(He(oe,u))}finally{R(!1)}},Se=()=>{ie.current?.focus(),T(null)},lt=N=>{if(!je(I.reasoning)){w(u("modelReasoningInvalid"));return}if(!De(I.input,o.length===0?void 0:[...o])){w(u("modelInputInvalid"));return}if(!ye(I.contextWindow)||!ye(I.maxTokens)){w(u("modelCapacityInvalid"));return}Ce(()=>d(N),Se)},dt=N=>{Ce(N,()=>ie.current?.focus())};return(0,k.jsxs)("div",{className:"bmp-modelRow",children:[(0,k.jsxs)("div",{className:"bmp-modelMain",children:[(0,k.jsx)("span",{className:"bmp-modelId",title:n,children:n}),r!==""&&r!==n&&(0,k.jsx)("span",{className:"bmp-modelName",children:r}),x!==null&&(0,k.jsx)("span",{className:"bmp-staged",children:u("staged")}),(0,k.jsx)("button",{ref:ie,type:"button",className:"bmp-icon","aria-label":u(p?"collapse":"expand"),"aria-expanded":p,onClick:()=>f(N=>!N),children:(0,k.jsx)(he,{pointing:p?"down":"right"})})]}),p&&(0,k.jsxs)("div",{className:"bmp-modelAdvanced",children:[(0,k.jsx)(Ye,{contextText:x?.capacityTouched===!0?x.contextWindowText:$(t.contextWindow),maxText:x?.capacityTouched===!0?x.maxTokensText:$(t.maxTokens),onChange:(N,W)=>{T(oe=>{let se=oe??Qe;return{...se.capacityTouched?se:{...se,contextWindowText:$(t.contextWindow),maxTokensText:$(t.maxTokens)},capacityTouched:!0,[N]:W}}),w(null)},enabled:i&&!b,t:u,modelId:n,officialContext:m,officialMax:h}),(0,k.jsx)(Je,{levels:s,value:I.reasoning,onChange:N=>ke({reasoningTouched:!0,reasoning:N}),enabled:i&&!b,t:u,modelId:n,official:a==="catalog"}),(0,k.jsx)(Ge,{modalities:o,value:I.input,onChange:N=>ke({inputTouched:!0,input:N}),enabled:i&&!b,t:u,modelId:n,official:a==="catalog"}),A!==null&&(0,k.jsx)("div",{className:"bmp-error",role:"alert",children:A}),c!==void 0&&x===null&&(0,k.jsx)("div",{className:"bmp-rowActions",children:(0,k.jsx)("button",{type:"button",className:"bmp-link bmp-danger",disabled:b,onClick:()=>{c!==void 0&&dt(c)},children:u(b?"applying":"resetOfficial")})}),x!==null&&(0,k.jsxs)("div",{className:"bmp-rowActions",children:[(0,k.jsx)("button",{type:"button",className:"bmp-button",disabled:!at||b,onClick:()=>{x!==null&&lt(Vt(I,x))},children:u(b?"applying":"apply")}),(0,k.jsx)("button",{type:"button",className:"bmp-link bmp-danger",disabled:b,onClick:Se,children:u("revert")})]})]})]})}var g=require("react/jsx-runtime");function _t(e,t){switch(e){case"catalog-overrides":return"officialCatalog";case"inherited-models":return"inheritedRoute";case"declared-models":return t===!1?"officialUserList":"declaredRoute"}}function Xe(e){let{row:t,t:n,children:r}=e;return(0,g.jsxs)("section",{className:"bmp-card",children:[(0,g.jsxs)("header",{className:"bmp-cardHeader",children:[(0,g.jsx)("span",{className:"bmp-cardTitle",children:t.entry.displayName}),(0,g.jsx)("span",{className:"bmp-cardMeta",children:t.entry.provider}),(0,g.jsx)("span",{className:"bmp-tag",children:n(_t(t.writeMode,t.entry.declared))})]}),r]})}function Ze(e){return e.row.writeMode==="catalog-overrides"?(0,g.jsx)(et,{...e}):(0,g.jsx)(Lt,{...e})}function Lt(e){let{row:t,controller:n,levels:r,modalities:i,writable:s,t:o}=e,a=(0,E.useCallback)(async(c,m,h)=>n.commit(u=>Be(u,t.entry.settingsPath,c,m,h)),[n,t.entry.settingsPath]),d=s&&t.writeMode==="declared-models";return(0,g.jsxs)(Xe,{row:t,t:o,children:[t.writeMode==="inherited-models"&&(0,g.jsx)("p",{className:"bmp-muted",children:o("inheritedModelList")}),(0,g.jsx)("div",{className:"bmp-models",children:t.models.map((c,m)=>{let h=typeof c.id=="string"?c.id:"";return(0,g.jsx)(ve,{entry:c,modelId:h===""?`#${m+1}`:h,displayName:typeof c.name=="string"?c.name:"",writable:d,levels:r,modalities:i,flavor:"declared",applyRow:u=>a(m,h,u),t:o},h===""?`model-${m}`:h)})})]})}function et(e){let{row:t,controller:n,levels:r,modalities:i,writable:s,t:o}=e,[a,d]=(0,E.useState)(!1),[c,m]=(0,E.useState)({status:"idle"});(0,E.useEffect)(()=>{!a||c.status!=="idle"||(m({status:"loading"}),n.discoverOfficialModels(t.entry.provider).then(p=>m({status:"ready",models:p}),p=>m({status:"error",message:U(p)})))},[a,c.status,n,t.entry.provider]);let h=Object.keys(t.overrides).filter(p=>me(t.overrides[p])),u=[c.status==="ready"?o("officialModelsCount",{count:c.models.length}):"",h.length>0?o("overriddenCount",{count:h.length}):""].filter(p=>p.length>0).join(" \xB7 ");return(0,g.jsxs)(Xe,{row:t,t:o,children:[(0,g.jsx)("p",{className:"bmp-muted",children:o("catalogIntro")}),t.configured===!1&&(0,g.jsx)("p",{className:"bmp-muted",children:o("dormantHint")}),(0,g.jsxs)("div",{className:"bmp-catalogBar",children:[(0,g.jsx)("span",{className:"bmp-muted",children:u}),(0,g.jsx)("button",{type:"button",className:"bmp-button","aria-expanded":a,onClick:()=>d(p=>!p),children:o(a?"collapse":"manageOfficial")})]}),a&&(0,g.jsxs)("div",{className:"bmp-models",children:[(c.status==="idle"||c.status==="loading")&&(0,g.jsx)("p",{className:"bmp-muted",children:o("loading")}),c.status==="error"&&(0,g.jsxs)(g.Fragment,{children:[(0,g.jsxs)("div",{className:"bmp-error",role:"alert",children:[o("catalogLoadError"),": ",c.message]}),(0,g.jsx)("button",{type:"button",className:"bmp-button",onClick:()=>m({status:"idle"}),children:o("retry")})]}),c.status==="ready"&&c.models.map(p=>{let f=t.overrides[p.id],x={id:p.id,...p.name===void 0?{}:{name:p.name},...f};return(0,g.jsx)(ve,{entry:x,modelId:p.id,displayName:p.name??"",writable:s,levels:r,modalities:i,flavor:"catalog",applyRow:T=>n.commit(b=>Ue(b,t.entry.settingsPath,p.id,T)),resetRow:me(f)?()=>n.commit(T=>Ke(T,t.entry.settingsPath,p.id)):void 0,officialContext:p.contextWindow===void 0?void 0:$(p.contextWindow),officialMax:p.maxTokens===void 0?void 0:$(p.maxTokens),t:o},p.id)})]})]})}function tt(e){let{dormant:t,...n}=e,{t:r}=e,[i,s]=(0,E.useState)(!1),[o,a]=(0,E.useState)(null);(0,E.useEffect)(()=>{o!==null&&!t.some(c=>c.entry.provider===o)&&a(null)},[t,o]);let d=o===null?void 0:t.find(c=>c.entry.provider===o);return(0,g.jsxs)("div",{className:"bmp-dormant",children:[(0,g.jsx)("button",{type:"button",className:"bmp-button","aria-expanded":i,onClick:()=>s(c=>!c),children:r("manageOfficialProviders",{count:t.length})}),i&&(0,g.jsx)("div",{className:"bmp-dormantList",children:t.map(c=>(0,g.jsxs)("button",{type:"button",className:"bmp-dormantRow","aria-expanded":o===c.entry.provider,onClick:()=>a(m=>m===c.entry.provider?null:c.entry.provider),children:[(0,g.jsx)("span",{className:"bmp-cardTitle",children:c.entry.displayName}),(0,g.jsx)("span",{className:"bmp-cardMeta",children:c.entry.provider}),(0,g.jsx)("span",{className:"bmp-tag",children:r("officialCatalog")})]},c.entry.provider))}),i&&d!==void 0&&(0,g.jsx)(et,{...n,row:d}),i&&(0,g.jsx)("p",{className:"bmp-muted",children:r("adapterBoundary")})]})}var S=require("react/jsx-runtime");function we(e){let{controller:t,useSnapshot:n,t:r}=e,i=n(),s=i.status;(0,nt.useEffect)(()=>{s==="idle"&&t.load()},[s,t]);let o=i.namespace;return s==="idle"||s==="loading"?(0,S.jsx)("div",{className:"bmp-section",children:(0,S.jsx)("p",{className:"bmp-muted",children:r("loading")})}):s==="error"?(0,S.jsxs)("div",{className:"bmp-section",children:[(0,S.jsx)("div",{className:"bmp-error",role:"alert",children:i.error}),(0,S.jsx)("button",{type:"button",className:"bmp-button",onClick:()=>{t.reload()},children:r("retry")})]}):(0,S.jsxs)("div",{className:"bmp-section",children:[(0,S.jsx)("h2",{className:"bmp-title",children:r("title")}),(0,S.jsx)("p",{className:"bmp-muted",children:r("intro")}),!i.writable&&(0,S.jsx)("p",{className:"bmp-muted",children:r("readOnly")}),i.rows.length===0&&(0,S.jsxs)("div",{className:"bmp-empty",children:[(0,S.jsx)("div",{className:"bmp-emptyTitle",children:r("empty")}),(0,S.jsx)("div",{className:"bmp-muted",children:r("emptyHint")})]}),o!==void 0&&i.rows.map(a=>(0,S.jsx)(Ze,{row:a,controller:t,levels:i.levels,modalities:i.modalities,writable:i.writable,t:r},a.entry.provider)),o!==void 0&&i.dormant.length>0&&(0,S.jsx)(tt,{dormant:i.dormant,controller:t,levels:i.levels,modalities:i.modalities,writable:i.writable,t:r})]})}var rt={nav:"Model capabilities",title:"Model capabilities",intro:"Declare, per model, which reasoning-effort levels it accepts, which request modalities it admits, and which token capacities it carries. The declarations land in the provider profile as soon as you apply a row.",loading:"Loading providers\u2026",retry:"Retry now",conflict:"The settings document changed elsewhere. Your edits are kept below \u2014 review the refreshed state, then apply again.",empty:"No configurable providers yet",emptyHint:"Expand Manage official providers below to onboard an installed provider, or configure a custom route on the official Models page first.",declaredRoute:"declared",officialCatalog:"official catalog",catalogIntro:"Sparse capability overrides over the installed official catalog. Untouched fields keep the official defaults and follow future catalog updates \u2014 nothing is copied.",manageOfficial:"Manage official models",officialModelsCount:"{count} official models",overriddenCount:"{count} overridden",keepOfficial:"Keep official",disableReasoning:"Disable reasoning",customMapping:"Custom mapping",wireMapNote:"Overriding reasoning declares its own wire map: every checked level names the exact spelling sent to the endpoint (only off may stay blank).",officialValue:"Official: {value}",resetOfficial:"Reset to official defaults",catalogLoadError:"Could not load the official model list",manageOfficialProviders:"Manage official providers ({count})",dormantHint:"Not configured yet \u2014 the first override you apply creates the profile. The API key still belongs to the official Models page.",officialUserList:"official \xB7 user-listed",inheritedRoute:"inherited list",adapterBoundary:"Routes owned by dedicated adapters (lived under llm-deepseek / llm-openai-codex) declare capabilities on their own settings pages and never appear here; a pi-ai catalog route of the same brand name is a different route and does appear.",inheritedModelList:"This model list is inherited from the active composition and is read-only here.",readOnly:"Settings are read-only in this view",expand:"expand",collapse:"collapse",modelContextWindow:"Context window",modelMaxTokens:"Max output tokens",modelReasoning:"Reasoning effort",inherit:"Provider default",reasoningOff:"No reasoning (false)",custom:"Custom",wire:"wire",modelInput:"Input modalities",apply:"Apply",revert:"Revert",applying:"Applying\u2026",modelReasoningInvalid:"invalid reasoning declaration: name a level beyond off, and give each level beyond off a wire value",modelInputInvalid:"invalid input modalities: choose from the declared vocabulary",modelCapacityInvalid:"invalid capacity: use a positive whole count, K for thousands, M for millions (blank inherits)",staged:"unapplied",levelsSelected:"{count} selected",levelGroup:"Reasoning effort levels of {model}",modalityGroup:"Input modalities of {model}"},it={nav:"\u6A21\u578B\u80FD\u529B",title:"\u6A21\u578B\u80FD\u529B",intro:"\u6309\u6A21\u578B\u58F0\u660E\u5B83\u7684\u63A8\u7406\u5F3A\u5EA6\u6863\u4F4D\u3001\u8BF7\u6C42\u6A21\u6001\u4E0E token \u5BB9\u91CF\uFF08\u4E0A\u4E0B\u6587\u7A97\u53E3 / \u6700\u5927\u8F93\u51FA\uFF09\u3002\u5E94\u7528\u540E\uFF0C\u58F0\u660E\u5373\u523B\u5199\u5165\u4F9B\u5E94\u5546 profile\u3002",loading:"\u6B63\u5728\u52A0\u8F7D\u4F9B\u5E94\u5546\u2026",retry:"\u7ACB\u5373\u91CD\u8BD5",conflict:"\u8BBE\u7F6E\u6587\u6863\u5DF2\u5728\u522B\u5904\u53D8\u66F4\u3002\u4F60\u7684\u7F16\u8F91\u4FDD\u7559\u5728\u4E0B\u65B9\u2014\u2014\u8BF7\u5148\u5BF9\u7167\u521A\u5237\u65B0\u7684\u72B6\u6001\uFF0C\u518D\u91CD\u65B0\u5E94\u7528\u3002",empty:"\u6682\u65E0\u53EF\u914D\u7F6E\u7684\u4F9B\u5E94\u5546",emptyHint:"\u5C55\u5F00\u4E0B\u65B9\u300C\u7BA1\u7406\u5B98\u65B9\u4F9B\u5E94\u5546\u300D\u63A5\u5165\u9A7B\u88C5\u7684\u4F9B\u5E94\u5546\uFF0C\u6216\u5148\u5728\u5B98\u65B9\u300C\u6A21\u578B\u300D\u9875\u914D\u7F6E\u4E00\u6761\u81EA\u5B9A\u4E49\u8DEF\u7531\u3002",declaredRoute:"\u624B\u5DE5\u58F0\u660E",officialCatalog:"\u5B98\u65B9\u76EE\u5F55",catalogIntro:"\u5BF9\u968F pi-ai \u9A7B\u88C5\u7684\u5B98\u65B9\u76EE\u5F55\u505A\u7A00\u758F\u80FD\u529B\u8986\u76D6\u3002\u672A\u89E6\u78B0\u7684\u5B57\u6BB5\u4FDD\u6301\u5B98\u65B9\u9ED8\u8BA4\u5E76\u8DDF\u968F\u76EE\u5F55\u5C06\u6765\u66F4\u65B0\u2014\u2014\u4E0D\u590D\u5236\u4EFB\u4F55\u5185\u5BB9\u3002",manageOfficial:"\u7BA1\u7406\u5B98\u65B9\u6A21\u578B",officialModelsCount:"{count} \u4E2A\u5B98\u65B9\u6A21\u578B",overriddenCount:"{count} \u4E2A\u5DF2\u8986\u76D6",keepOfficial:"\u8DDF\u968F\u5B98\u65B9",disableReasoning:"\u7981\u7528\u63A8\u7406",customMapping:"\u81EA\u5B9A\u4E49\u6620\u5C04",wireMapNote:"\u8986\u76D6\u63A8\u7406\u5373\u81EA\u884C\u58F0\u660E\u62FC\u5199\u8868\uFF1A\u52FE\u9009\u7684\u6BCF\u4E2A\u6863\u4F4D\u90FD\u8981\u586B\u53D1\u5F80\u7AEF\u70B9\u7684\u51C6\u786E\u62FC\u5199\uFF08\u53EA\u6709 off \u53EF\u7559\u7A7A\uFF09\u3002",officialValue:"\u5B98\u65B9\uFF1A{value}",resetOfficial:"\u8FD8\u539F\u4E3A\u5B98\u65B9\u9ED8\u8BA4",catalogLoadError:"\u65E0\u6CD5\u52A0\u8F7D\u5B98\u65B9\u6A21\u578B\u5217\u8868",manageOfficialProviders:"\u7BA1\u7406\u5B98\u65B9\u4F9B\u5E94\u5546\uFF08{count}\uFF09",dormantHint:"\u5C1A\u672A\u914D\u7F6E\u2014\u2014\u4F60\u5E94\u7528\u7684\u7B2C\u4E00\u4E2A\u8986\u76D6\u5373\u4F1A\u521B\u5EFA\u8BE5 profile\u3002API \u5BC6\u94A5\u4ECD\u5728\u5B98\u65B9\u300C\u6A21\u578B\u300D\u9875\u8BBE\u7F6E\u3002",officialUserList:"\u5B98\u65B9\xB7\u81EA\u7BA1",inheritedRoute:"\u7EE7\u627F\u6E05\u5355",adapterBoundary:"\u4E13\u5C5E\u9002\u914D\u5668\u8DEF\u7531\uFF08\u5982 llm-deepseek\u3001llm-openai-codex \u540D\u4E0B\u7684\uFF09\u80FD\u529B\u5728\u5B83\u4EEC\u81EA\u5DF1\u7684\u8BBE\u7F6E\u9875\u58F0\u660E\uFF0C\u4E0D\u4F1A\u51FA\u73B0\u5728\u672C\u9875\uFF1B\u540C\u54C1\u724C\u540D\u7684 pi-ai \u76EE\u5F55\u8DEF\u7531\u662F\u53E6\u4E00\u6761\u8DEF\u7531\uFF0C\u7167\u5E38\u51FA\u73B0\u3002",inheritedModelList:"\u6B64\u6A21\u578B\u5217\u8868\u7EE7\u627F\u81EA\u5F53\u524D\u7EC4\u88C5\uFF0C\u672C\u9875\u53EA\u8BFB\u3002",readOnly:"\u6B64\u89C6\u56FE\u4E0B\u8BBE\u7F6E\u4E3A\u53EA\u8BFB",expand:"\u5C55\u5F00",collapse:"\u6536\u8D77",modelContextWindow:"\u4E0A\u4E0B\u6587\u7A97\u53E3",modelMaxTokens:"\u6700\u5927\u8F93\u51FA token",modelReasoning:"\u63A8\u7406\u5F3A\u5EA6",inherit:"\u4F7F\u7528\u4F9B\u5E94\u5546\u9ED8\u8BA4",reasoningOff:"\u65E0\u63A8\u7406\uFF08false\uFF09",custom:"\u81EA\u5B9A\u4E49",wire:"\u53D6\u503C",modelInput:"\u8F93\u5165\u6A21\u6001",apply:"\u5E94\u7528",revert:"\u8FD8\u539F",applying:"\u5E94\u7528\u4E2D\u2026",modelReasoningInvalid:"\u63A8\u7406\u58F0\u660E\u65E0\u6548\uFF1A\u81F3\u5C11\u58F0\u660E\u4E00\u4E2A off \u4E4B\u5916\u7684\u6863\u4F4D\uFF0C\u4E14 off \u4E4B\u5916\u7684\u6863\u4F4D\u90FD\u8981\u6709\u53D6\u503C",modelInputInvalid:"\u8F93\u5165\u6A21\u6001\u65E0\u6548\uFF1A\u8BF7\u4ECE\u5DF2\u58F0\u660E\u7684\u8BCD\u6C47\u4E2D\u9009\u62E9",modelCapacityInvalid:"\u5BB9\u91CF\u65E0\u6548\uFF1A\u8BF7\u586B\u6B63\u6574\u6570\u8BA1\u6570\uFF0CK \u8868\u793A\u5343\u3001M \u8868\u793A\u767E\u4E07\uFF08\u7559\u7A7A\u4E3A\u7EE7\u627F\uFF09",staged:"\u672A\u5E94\u7528",levelsSelected:"\u5DF2\u9009\u62E9 {count} \u4E2A",levelGroup:"{model} \u7684\u63A8\u7406\u5F3A\u5EA6\u6863\u4F4D",modalityGroup:"{model} \u7684\u8F93\u5165\u6A21\u6001"};var ot=`
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
`;var Ft="better-model-provider",xe="better-model-provider",Wt=["slots","locale","connection","remote"];function Re(e){e.store.getSnapshot().status!=="idle"&&e.reload()}function Bt(e){Fe(e,t=>zt(e,t))}function zt(e,t){e.effect(()=>e.locale.register(xe,{zh:it,en:rt}),"better-model-provider: dictionaries");let n=document.createElement("style");n.dataset.plugin="better-model-provider",n.textContent=ot,document.head.appendChild(n),e.effect(()=>()=>n.remove(),"better-model-provider: stylesheet");let r=new ee(t);e.effect(()=>()=>r.dispose(),"better-model-provider: controller");let i=()=>(0,st.useSyncExternalStore)(r.store.subscribe,r.store.getSnapshot),s=e.locale.bind(xe),o=(d,c)=>s(d,c),a=()=>({controller:r,useSnapshot:i,t:o});e.effect(()=>{let d=()=>{Re(r)},c=[e.remote.$on("settings/document-updated",m=>{m===F&&Re(r)}),e.remote.$on("llm/adapters-updated",d),e.on("connection/reset",d)];return()=>{for(let m of c)m()}},"better-model-provider: pushed invalidations"),e.slots.inject("settings.section",()=>e.slots.register({name:"settings.section",id:xe,order:11,label:()=>o("nav"),inject:a},we))}

		return module.exports;
	}
});

