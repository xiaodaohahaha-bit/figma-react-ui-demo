import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css';

type FrameId='8:206'|'13:379'|'8:377'|'9:4'|'14:867'|'16:1283';
type Frame={id:FrameId;name:string;src:string};

const frames:Frame[]=[
  {id:'8:206',name:'第一步弹窗',src:'./figma/frame-8-206.svg'},
  {id:'13:379',name:'弹窗进一步点击',src:'./figma/frame-13-379.svg'},
  {id:'8:377',name:'弹窗进一步展开',src:'./figma/frame-8-377.svg'},
  {id:'9:4',name:'节点进一步加载',src:'./figma/frame-9-4.svg'},
  {id:'14:867',name:'生成结果',src:'./figma/frame-14-867.svg'},
  {id:'16:1283',name:'结果进一步展示',src:'./figma/frame-16-1283.svg'},
];
const carouselImages=['./carousel/group-318.png','./carousel/group-49.png','./carousel/group-319.png'];
const progressRanges:Partial<Record<FrameId,[number,number]>>={
  '8:206':[.22,.48],
  '13:379':[.46,.64],
  '8:377':[.62,.80],
  '9:4':[.78,.98],
};
const loadingNodes=[
  {left:26,top:389,width:19,height:18,at:.84},
  {left:26,top:443,width:19,height:18,at:.91},
  {left:26,top:508,width:19,height:18,at:.98},
];

const clickTargets:Partial<Record<FrameId,{label:string;left:number;top:number;to:FrameId}>>={
  '8:206':{label:'展开思考过程',left:327.5,top:172.5,to:'13:379'},
  '13:379':{label:'展开地理位置内容',left:131.5,top:326.5,to:'8:377'},
  '8:377':{label:'收起地理位置内容',left:131.5,top:323.5,to:'9:4'},
  '14:867':{label:'展开信息来源',left:330,top:178.5,to:'16:1283'},
  '16:1283':{label:'收起信息来源',left:330,top:182.5,to:'14:867'},
};

function initialFrame():FrameId{
  const requested=Number(new URLSearchParams(location.search).get('frame')??0);
  return frames[Math.min(frames.length-1,Math.max(0,Number.isFinite(requested)?requested:0))].id;
}

function App(){
  const [frameId,setFrameId]=useState<FrameId>(initialFrame);
  const [frameReady,setFrameReady]=useState(false);
  const [progress,setProgress]=useState(progressRanges[initialFrame()]?.[0]??0);
  const [slide,setSlide]=useState(1);
  const [dragX,setDragX]=useState(0);
  const dragStart=useRef<number|null>(null);
  const frame=frames.find(item=>item.id===frameId)!;
  const target=clickTargets[frameId];

  useEffect(()=>{
    const index=frames.findIndex(item=>item.id===frameId);
    history.replaceState(null,'',`?frame=${index}`);
  },[frameId]);

  useEffect(()=>{
    const range=progressRanges[frameId];
    if(!range||!frameReady)return;
    setProgress(range[0]);
    let completionTimer=0;
    const step=frameId==='9:4'?.004:.002;
    const tick=frameId==='9:4'?50:100;
    const timer=window.setInterval(()=>setProgress(value=>{
      const next=Math.min(frameId==='9:4'?1:range[1],value+step);
      if(frameId==='9:4'&&next>=1){
        window.clearInterval(timer);
        completionTimer=window.setTimeout(()=>{setFrameReady(false);setFrameId('14:867')},3000);
      }
      return next;
    }),tick);
    return()=>{window.clearInterval(timer);window.clearTimeout(completionTimer)};
  },[frameId,frameReady]);

  const isResult=frameId==='14:867';
  const isThinking=frameReady&&(frameId==='8:206'||frameId==='13:379'||frameId==='8:377'||frameId==='9:4');
  const finishDrag=(clientX:number)=>{
    if(dragStart.current===null)return;
    const delta=clientX-dragStart.current;
    if(delta<-45)setSlide(value=>Math.min(2,value+1));
    if(delta>45)setSlide(value=>Math.max(0,value-1));
    dragStart.current=null;setDragX(0);
  };

  return (
    <main className="preview">
      <figure data-node-id={frame.id}>
        <img
          src={frame.src}
          width="375"
          height="812"
          alt={`${frame.name}（Figma ${frame.id}）`}
          draggable={false}
          onLoad={()=>requestAnimationFrame(()=>requestAnimationFrame(()=>setFrameReady(true)))}
        />
        {isThinking&&<>
          <div className="thinking-spinner"><img src="./figma/thinking-spinner.svg" alt="" draggable={false}/></div>
          <div className="progress-cover" aria-label={`思考进度 ${Math.round(progress*100)}%`}>
            <div className="progress-track"/>
            <div className="live-progress" style={{width:324*progress}}/>
          </div>
          <img className="progress-node" src="./figma/progress-node.svg" alt="" draggable={false} style={{left:26+324*progress-5.5}}/>
          {frameId==='8:377'&&<div className="gray-node-mask"><img className="rotating-gray-node" src="./figma/gray-node-rectangle285.svg" alt="" draggable={false}/></div>}
          {frameId==='9:4'&&loadingNodes.map((slot,index)=><div className={`loading-node ${progress>=slot.at?'lit':''}`} key={index} style={{left:slot.left,top:slot.top,width:slot.width,height:slot.height}}>
            <span className="loading-gray"><img src="./figma/frame-9-4.svg" alt="" draggable={false} style={{left:-slot.left,top:-slot.top}}/></span>
            <span className="loading-color"><img src="./figma/frame-9-4.svg" alt="" draggable={false} style={{left:-slot.left,top:-slot.top}}/></span>
          </div>)}
        </>}
        {isResult&&(
          <div
            className="carousel-window"
            aria-label="演出推荐轮播图"
            onPointerDown={event=>{dragStart.current=event.clientX;event.currentTarget.setPointerCapture(event.pointerId)}}
            onPointerMove={event=>{if(dragStart.current!==null)setDragX(event.clientX-dragStart.current)}}
            onPointerUp={event=>finishDrag(event.clientX)}
            onPointerCancel={()=>{dragStart.current=null;setDragX(0)}}
          >
            <div className="carousel-track" style={{transform:`translateX(${25-slide*304+dragX}px)`}}>
              {carouselImages.map((src,index)=><div className="carousel-slide" key={src}><img src={src} alt={['北京·薛之谦“万兽之王”演唱会','长沙·2026长沙草莓音乐节','广州·《房间里的大象》杨丞琳演唱会'][index]} draggable={false}/></div>)}
            </div>
          </div>
        )}
        {target&&(
          <button
            className="prototype-hotspot"
            aria-label={target.label}
            title={target.label}
            style={{left:target.left,top:target.top,width:32,height:32}}
            onClick={()=>{setFrameReady(false);setFrameId(target.to)}}
          />
        )}
      </figure>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App/>);
