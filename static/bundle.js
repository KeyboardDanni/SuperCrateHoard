(()=>{"use strict";class t{constructor(t){this.imageElement=new Image,this.imageElement.loading="eager",this.imageElement.src=t}image(){return this.imageElement}waitForLoad(){return t=this,e=void 0,s=function*(){yield this.imageElement.decode()},new((i=void 0)||(i=Promise))((function(a,n){function r(t){try{h(s.next(t))}catch(t){n(t)}}function c(t){try{h(s.throw(t))}catch(t){n(t)}}function h(t){var e;t.done?a(t.value):(e=t.value,e instanceof i?e:new i((function(t){t(e)}))).then(r,c)}h((s=s.apply(t,e||[])).next())}));var t,e,i,s}}class e{constructor(i){if(!e.dataCache[i]){let s=new t(i);e.dataCache[i]=s}this.pictureData=e.dataCache[i]}sharedData(){return this.pictureData}static waitForLoad(){for(const t of Object.values(e.dataCache))t.waitForLoad()}}e.dataCache={};class i{constructor(){if(this.canvas=document.getElementById("game_surface"),!this.canvas||!this.canvas.getContext)throw new Error("Missing canvas");const t=this.canvas.getContext("2d");if(!t)throw new Error("Could not create canvas context");this.context=t}drawBackgroundColor(t,e,i,s=1){this.context.fillStyle=`rgb(${t}, ${e}, ${i}, ${s})`,this.context.fillRect(-1,-1,this.canvas.width+2,this.canvas.height+2)}drawPicture(t,e,i){this.context.drawImage(t.sharedData().image(),e,i)}drawSprite(t,e,i,s){this.context.drawImage(t.sharedData().image(),e.x,e.y,e.w,e.h,i,s,e.w,e.h)}canvasRaw(){return this.canvas}contextRaw(){return this.context}}class s{constructor(){this.tickLogic=[],this.drawLogic=[]}tick(t){for(const e of this.tickLogic)e.tick(t,this)}draw(t,e){for(const i of this.drawLogic)i.draw(t,this,e)}addTickLogic(t){this.tickLogic.push(t)}addDrawLogic(t){this.drawLogic.push(t)}}const a=1e3/60;class n{constructor(){this.timestamp=0,this.goodSamples=0,this.timings=[],this.lastGoodAverage=a}updateTimings(){const t=performance.now();if(this.timestamp<=0)return void(this.timestamp=t);const e=t-this.timestamp;this.timestamp=t,e>20.1||(this.timings.length>=60&&this.timings.shift(),this.timings.length>0&&(Math.abs(this.timings[this.timings.length-1]-e)>6||Math.abs(this.averageRateRaw()-e)>6?this.goodSamples=0:this.goodSamples+=1),this.timings.push(e))}averageRateRaw(){let t=0;for(const e of this.timings)t+=e;return t/this.timings.length}averageRate(){return this.hasEnoughSamples()&&(this.lastGoodAverage=this.averageRateRaw()),this.lastGoodAverage}shouldLerp(){const t=this.averageRate();return Math.abs(t-a)>1}hasEnoughSamples(){return this.goodSamples>60}reset(){this.timestamp=0,this.goodSamples=0,this.timings=[]}}class r{constructor(){this.gameRenderer=new i,this.currentScene=new s,this.pendingSceneFunc=null,this.vsyncRate=new n,this.lastTick=performance.now(),this.tickQueue=0,this.framesSinceTickLag=0,this.doDraw=!1,this.doLerp=!1,this.running=!1}run(){if(this.running)throw new Error("run() already called");this.running=!0,this.lastTick=performance.now(),this.tickQueue=0,requestAnimationFrame(this.timerUpdate.bind(this))}scene(){return this.currentScene}setScene(t){this.pendingSceneFunc=t}renderer(){return this.gameRenderer}timerUpdate(){this.vsyncRate.updateTimings(),null!==this.pendingSceneFunc&&(this.currentScene=this.pendingSceneFunc(),this.pendingSceneFunc=null),this.updateTicks(),this.updateDraw(),requestAnimationFrame(this.timerUpdate.bind(this))}updateTicks(){const t=performance.now();for(this.tickQueue+=t-this.lastTick,this.lastTick=t;this.tickQueue>=a;){this.currentScene.tick(this),this.framesSinceTickLag++,this.doDraw=!0,this.tickQueue-=a;const e=performance.now();if(e-t>33.333333333333336){this.tickQueue=0,this.lastTick=e,this.framesSinceTickLag=0;break}}this.doLerp=this.vsyncRate.shouldLerp()&&this.framesSinceTickLag>=4}updateDraw(){if(!this.doDraw)return;let t;this.doLerp?t=this.tickQueue/a:(t=1,this.doDraw=!1),this.gameRenderer.drawBackgroundColor(0,0,0),this.currentScene.draw(this,t)}}const c={x:0,y:160,w:32,h:32};class h{constructor(){this.tickCount=0,this.picture=new e("res/GameAtlas.png"),e.waitForLoad()}tick(t,e){this.tickCount+=1}draw(t,e,i){t.renderer().contextRaw().imageSmoothingEnabled=!1;const s=64+this.tickCount%60*4,a=64+(this.tickCount-1)%60*4;var n,r,h;t.renderer().drawSprite(this.picture,c,(n=a,r=s,(h=i)<=0?n:h>=1?r:n+h*(r-n)),64)}}window.onload=function(){const t=new r;t.setScene((()=>{const t=new s,e=new h;return t.addTickLogic(e),t.addDrawLogic(e),t})),t.run()}})();