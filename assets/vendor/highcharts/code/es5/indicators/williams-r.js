!/**
 * Highstock JS v12.5.0 (2026-01-12)
 * @module highcharts/indicators/williams-r
 * @requires highcharts
 * @requires highcharts/modules/stock
 *
 * Indicator series type for Highcharts Stock
 *
 * (c) 2010-2026 Highsoft AS
 * Author: Wojciech Chmiel
 *
 * A commercial license may be required depending on use.
 * See www.highcharts.com/license
 */function(t,r){"object"==typeof exports&&"object"==typeof module?module.exports=r(require("highcharts"),require("highcharts").SeriesRegistry):"function"==typeof define&&define.amd?define("highcharts/indicators/williams-r",[["highcharts/highcharts"],["highcharts/highcharts","SeriesRegistry"]],r):"object"==typeof exports?exports["highcharts/indicators/williams-r"]=r(require("highcharts"),require("highcharts").SeriesRegistry):t.Highcharts=r(t.Highcharts,t.Highcharts.SeriesRegistry)}(this,function(t,r){return function(){"use strict";var e,n={512:function(t){t.exports=r},944:function(r){r.exports=t}},i={};function o(t){var r=i[t];if(void 0!==r)return r.exports;var e=i[t]={exports:{}};return n[t](e,e.exports,o),e.exports}o.n=function(t){var r=t&&t.__esModule?function(){return t.default}:function(){return t};return o.d(r,{a:r}),r},o.d=function(t,r){for(var e in r)o.o(r,e)&&!o.o(t,e)&&Object.defineProperty(t,e,{enumerable:!0,get:r[e]})},o.o=function(t,r){return Object.prototype.hasOwnProperty.call(t,r)};var s={};o.d(s,{default:function(){return x}});var a=o(944),u=o.n(a),c=function(t,r,e){return t.reduce(function(t,n){return[Math.min(t[0],n[r]),Math.max(t[1],n[e])]},[Number.MAX_VALUE,-Number.MAX_VALUE])},h=o(512),p=o.n(h),f=(e=function(t,r){return(e=Object.setPrototypeOf||({__proto__:[]})instanceof Array&&function(t,r){t.__proto__=r}||function(t,r){for(var e in r)r.hasOwnProperty(e)&&(t[e]=r[e])})(t,r)},function(t,r){function n(){this.constructor=t}e(t,r),t.prototype=null===r?Object.create(r):(n.prototype=r.prototype,new n)}),l=p().seriesTypes.sma,d=u().extend,y=u().isArray,g=u().merge,m=function(t){function r(){return null!==t&&t.apply(this,arguments)||this}return f(r,t),r.prototype.getValues=function(t,r){var e,n,i,o,s,a=r.period,u=t.xData,h=t.yData,p=h?h.length:0,f=[],l=[],d=[];if(!(u.length<a)&&y(h[0])&&4===h[0].length){for(s=a-1;s<p;s++)o=(e=c(h.slice(s-a+1,s+1),2,1))[0],n=-(((i=e[1])-h[s][3])/(i-o)*100),u[s]&&(f.push([u[s],n]),l.push(u[s]),d.push(n));return{values:f,xData:l,yData:d}}},r.defaultOptions=g(l.defaultOptions,{params:{index:void 0,period:14}}),r}(l);d(m.prototype,{nameBase:"Williams %R"}),p().registerSeriesType("williamsr",m);var x=u();return s.default}()});