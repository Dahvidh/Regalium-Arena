import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Stars, Text } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import { connectWallet, fromUnits, GAMESTORE_ADDRESS, storeContract, toUnits } from './gameStore'

type Bot = { id: number; x: number; z: number }
type Link = { provider: any; signer: any; address: string }
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
const metaMaskDeepLink = 'https://metamask.app.link/dapp/' + window.location.host + window.location.pathname
const waveSize = (stage:number) => 5 + (stage - 1) * 2

function Arena() {
  return <group>
    <mesh rotation={[-Math.PI / 2,0,0]} position={[0,-0.55,0]} receiveShadow><circleGeometry args={[13,96]}/><meshStandardMaterial color="#100c20" metalness={0.6} roughness={0.42}/></mesh>
    <gridHelper args={[26,52,'#7041c7','#29203e']} position={[0,-0.53,0]}/>
    {[4,6.5,9].map((r,i)=><mesh key={r} rotation={[-Math.PI/2,0,0]} position={[0,-0.51+i*0.002,0]}><ringGeometry args={[r,r+0.025,96]}/><meshBasicMaterial color={i===0?'#e7bd70':'#7041c7'}/></mesh>)}
    {Array.from({length:12},(_,i)=><mesh key={i} position={[Math.sin(i*Math.PI/6)*11,1.1,Math.cos(i*Math.PI/6)*11]}><cylinderGeometry args={[0.12,0.2,2.8,8]}/><meshStandardMaterial color="#b88b43" emissive="#5b3713" emissiveIntensity={0.7}/></mesh>)}
  </group>
}
function Operative({position}:{position:[number,number,number]}) {
  const ref=useRef<THREE.Group>(null)
  useFrame((s)=>{if(ref.current){ref.current.position.set(position[0],0,position[2]);ref.current.rotation.y=Math.sin(s.clock.elapsedTime*.7)*.12}})
  return <group ref={ref}>
    <mesh position={[0,.15,0]}><cylinderGeometry args={[.34,.48,.35,6]}/><meshStandardMaterial color="#d9ad58" metalness={.8} roughness={.2} emissive="#5a3512" emissiveIntensity={.4}/></mesh>
    <mesh position={[0,.55,0]}><octahedronGeometry args={[.32,0]}/><meshStandardMaterial color="#f1d28d" metalness={.65} roughness={.2} emissive="#bd8732" emissiveIntensity={.8}/></mesh>
    <mesh position={[0,.6,-.36]} rotation={[Math.PI/2,0,0]}><coneGeometry args={[.13,.55,8]}/><meshStandardMaterial color="#8d5add" emissive="#6c35d5" emissiveIntensity={1.5}/></mesh>
    <pointLight position={[0,1,0]} color="#d6a94f" intensity={1.5} distance={3}/>
  </group>
}
function Drone({bot}:{bot:Bot}) {
  const ref=useRef<THREE.Group>(null)
  useFrame((s)=>{if(ref.current){ref.current.position.y=.45+Math.sin(s.clock.elapsedTime*3+bot.id)*.08;ref.current.rotation.y+=.008}})
  return <group ref={ref} position={[bot.x,.45,bot.z]}>
    <mesh><icosahedronGeometry args={[.38,1]}/><meshStandardMaterial color="#a83e69" emissive="#9d174d" emissiveIntensity={1.1} metalness={.4}/></mesh>
    <mesh position={[0,0,.3]}><sphereGeometry args={[.12,12,12]}/><meshBasicMaterial color="#ffcf73"/></mesh>
    <pointLight color="#f43f78" intensity={1.1} distance={2.5}/>
  </group>
}
function CameraRig({position}:{position:[number,number,number]}) {
  useFrame(({camera})=>{const target=new THREE.Vector3(position[0]*.22,10.5,position[2]+12);camera.position.lerp(target,.035);camera.lookAt(position[0]*.18,0,position[2]-1)})
  return null
}
function Scene({position,bots}:{position:[number,number,number];bots:Bot[]}) {
  return <Canvas shadows camera={{position:[0,11,15],fov:48}} dpr={[1,1.7]}>
    <color attach="background" args={['#090713']}/><fog attach="fog" args={['#090713',15,34]}/>
    <ambientLight intensity={.65}/><directionalLight position={[5,10,4]} intensity={2} castShadow/>
    <Stars radius={75} depth={35} count={1400} factor={3} saturation={.4} fade speed={.4}/>
    <CameraRig position={position}/><Arena/><Operative position={position}/>{bots.map(b=><Drone key={b.id} bot={b}/>)}
    <Float speed={1.2} floatIntensity={.25}><Text position={[0,4.4,-7]} fontSize={.65} color="#d9b56b" letterSpacing={.18}>REGALIUM ARENA</Text></Float>
  </Canvas>
}
const wave=(stage=1):Bot[]=>Array.from({length:waveSize(stage)},(_,i)=>{const angle=(i/waveSize(stage))*Math.PI*2;const radius=stage===1?5:6+stage*.5;return{id:i+1,x:Math.cos(angle)*radius,z:Math.sin(angle)*radius-1}})

export default function App() {
  const [wallet,setWallet]=useState<Link|null>(null)
  const [owed,setOwed]=useState('—')
  const [owner,setOwner]=useState('')
  const [amount,setAmount]=useState('1')
  const [stage,setStage]=useState(1)
  const [completed,setCompleted]=useState(false)
  const [bots,setBots]=useState<Bot[]>(()=>wave(1))
  const [position,setPosition]=useState<[number,number,number]>([0,0,5])
  const [score,setScore]=useState(0)
  const [health,setHealth]=useState(100)
  const [time,setTime]=useState(90)
  const [active,setActive]=useState(false)
  const [finished,setFinished]=useState(false)
  const [busy,setBusy]=useState(false)
  const [notice,setNotice]=useState('Connect a wallet to read your GameStore reward balance.')
  const panel=useRef<HTMLDivElement>(null)

  const refresh=useCallback(async(w=wallet)=>{
    if(!w||!GAMESTORE_ADDRESS)return
    const c=storeContract(w.provider)
    const [r,o]=await Promise.all([c.rewards(w.address),c.owner()])
    setOwed(fromUnits(r));setOwner(String(o).toLowerCase())
  },[wallet])

  const connect=async()=>{
    setBusy(true)
    try{const w=await connectWallet();setWallet(w);await refresh(w);setNotice('Wallet connected to Polygon Amoy.')}
    catch(e:any){setNotice(e.shortMessage||e.message||'Wallet connection failed.')}
    finally{setBusy(false)}
  }

  useEffect(()=>{
    if(!active)return
    const id=window.setInterval(()=>setTime(t=>{if(t<=1){setActive(false);setFinished(true);setNotice('Time expired. Reset the simulation and redeploy.');return 0}return t-1}),1000)
    return()=>window.clearInterval(id)
  },[active])

  useEffect(()=>{
    if(!active)return
    const id=window.setInterval(()=>{
      setBots(old=>old.map(b=>{
        const dx=position[0]-b.x,dz=position[2]-b.z,d=Math.hypot(dx,dz)||1
        if(d<1.15)setHealth(h=>Math.max(0,h-2))
        return{x:b.x+dx/d*.055,z:b.z+dz/d*.055,id:b.id}
      }))
    },120)
    return()=>window.clearInterval(id)
  },[active,position])

  useEffect(()=>{if(health===0&&active){setActive(false);setFinished(true);setNotice('Operative down. Mission failed.')}},[health,active])

  useEffect(()=>{
    const key=(e:KeyboardEvent)=>{
      if(!active)return
      const step = e.shiftKey ? 0.8 : 0.45
      setPosition(([x,y,z])=>[THREE.MathUtils.clamp(x+(['a','ArrowLeft'].includes(e.key.toLowerCase())?-step:['d','ArrowRight'].includes(e.key.toLowerCase())?step:0),-9,9),y,THREE.MathUtils.clamp(z+(['w','ArrowUp'].includes(e.key.toLowerCase())?-step:['s','ArrowDown'].includes(e.key.toLowerCase())?step:0),-9,9)])
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault()
    }
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)
  },[active])

  const fire=()=>{
    if(!active||!bots.length)return
    const target=[...bots].sort((a,b)=>Math.hypot(a.x-position[0],a.z-position[2])-Math.hypot(b.x-position[0],b.z-position[2]))[0]
    if(Math.hypot(target.x-position[0],target.z-position[2])>12)return
    setBots(old=>old.filter(b=>b.id!==target.id));setScore(s=>s+100)
    if(bots.length===1){if(stage<3){const next=stage+1;setStage(next);setNotice('Wave '+stage+' cleared. Wave '+next+' incoming — stay alert.');window.setTimeout(()=>setBots(wave(next)),1200)}else{setActive(false);setFinished(true);setCompleted(true);setNotice('All three waves cleared. Mission complete!')}}
  }

  const start=()=>{
    setStage(1);setCompleted(false);setBots(wave(1));setPosition([0,0,5]);setScore(0);setHealth(100);setTime(90);setFinished(false);setActive(true)
    gsap.fromTo(panel.current,{opacity:.7,scale:.985},{opacity:1,scale:1,duration:.5,ease:'power3.out'})
    setNotice('Mission live. Eliminate all five hostile drones.')
  }
  const reset=()=>{setActive(false);setFinished(false);setCompleted(false);setStage(1);setBots(wave(1));setScore(0);setHealth(100);setTime(90)}
  const withdraw=async()=>{
    if(!wallet)return
    setBusy(true)
    try{const tx=await storeContract(wallet.signer).withdraw();setNotice('Withdrawal submitted. Waiting for confirmation…');await tx.wait();await refresh();setNotice('RGLM withdrawal confirmed on Polygon Amoy.')}
    catch(e:any){setNotice(e.shortMessage||e.reason||e.message||'Withdrawal failed.')}
    finally{setBusy(false)}
  }
  const assign=async()=>{
    if(!wallet||owner!==wallet.address.toLowerCase())return
    if(!completed||score===0){setNotice('Clear all three waves before assigning a test reward.');return}
    setBusy(true)
    try{const tx=await storeContract(wallet.signer).rewardUser(wallet.address,toUnits(amount));setNotice('Reward assignment submitted. Waiting for confirmation…');await tx.wait();await refresh();setNotice('Reward assigned. You can now test the player withdrawal flow.')}
    catch(e:any){setNotice(e.shortMessage||e.reason||e.message||'Reward assignment failed. Check caps, funding and owner permissions.')}
    finally{setBusy(false)}
  }

  return <main className="shell">
    <header className="topbar"><a className="brand" href="#"><span className="brandmark">R</span><span>REGALIUM <b>ARENA</b></span></a><div className="topright"><span className="network"><i/> POLYGON AMOY TESTNET</span><button className="wallet" onClick={connect} disabled={busy}>{wallet?wallet.address.slice(0,6)+'…'+wallet.address.slice(-4):'CONNECT WALLET'}</button></div></header>
    <section className="intro"><div><div className="eyebrow"><i/> THE PROVING GROUNDS</div><h1>ENTER THE <em>ARENA.</em></h1><p>Survive the mission. Earn your place. Test the RGLM GameStore.</p></div><div className="season"><span>SEASON</span><strong>001</strong><small>AMOY PROTOCOL</small></div></section>
    <section className="layout">
      <div className="game" ref={panel}>
        <div className="hud"><div><small>MISSION 01</small><b>{active?'HOSTILE CONTACT':finished?'MISSION REPORT':'THE FIRST WAVE'}</b></div><div className="metrics"><span>TIME <b>00:{String(time).padStart(2,'0')}</b></span><span>WAVE <b>{stage}/3</b> · ELIMS <b>{score/100}/{waveSize(stage)}</b></span><span>VITALS <b className={health<35?'danger':''}>{health}%</b></span></div></div>
        <div className="viewport" onClick={fire}><Scene position={position} bots={bots}/><div className="crosshair">+</div>{!active&&<div className="overlay"><small>{finished?'MISSION CONCLUDED':'READY WHEN YOU ARE'}</small><h2>{finished?(completed?'ARENA CLEARED':'TRY AGAIN'):'THE ARENA AWAITS.'}</h2><p>{finished?'Combat score: '+score.toLocaleString()+' points':'Wave '+stage+' · '+waveSize(stage)+' hostile drones. Clear all three waves before time runs out.'}</p><button className="primary" onClick={e=>{e.stopPropagation();start()}}>{finished?'RUN IT BACK':'DEPLOY TO ARENA'} ↗</button></div>}</div>
        <div className="gamefoot"><span><i className={active?'live':''}/>{active?'LIVE COMBAT':'SIMULATION STANDBY'}</span><span>W A S D / ARROWS TO MOVE · CLICK TO FIRE</span><button onClick={reset}>RESET SIMULATION ↻</button></div>
      </div>
      <aside>
        <section className="card profile"><div className="cardhead"><span>OPERATIVE PROFILE</span><b>◈</b></div><div className="avatar">R</div><h3>{wallet?wallet.address.slice(0,6)+'…'+wallet.address.slice(-4):'UNIDENTIFIED'}</h3><p>{wallet?'WALLET LINK ESTABLISHED':'CONNECT WALLET TO IDENTIFY'}</p><div className="label">AVAILABLE RGLM REWARDS</div><div className="balance"><strong>{owed}</strong><span>RGLM</span></div><button className="outline" onClick={withdraw} disabled={!wallet||busy||owed==='—'||Number(owed)<=0}>WITHDRAW REWARDS ↗</button><small>Rewards remain in GameStore until withdrawn.</small></section>
        <section className="card intel"><div className="cardhead"><span>MISSION INTEL</span><b className="tag">REWARD TEST</b></div><div className="line"><span>OBJECTIVE</span><b>Clear all 3 waves</b></div><div className="line"><span>TIME LIMIT</span><b>01:30</b></div><div className="line"><span>COMBAT SCORE</span><b>{score.toLocaleString()} PTS</b></div><div className="line"><span>MISSION STATUS</span><b className={finished&&score>0?'success':''}>{finished?(completed?'COMPLETE':'FAILED'):active?'WAVE '+stage+'/3':'NOT STARTED'}</b></div></section>
        {wallet&&owner===wallet.address.toLowerCase()&&<section className="card owner"><div className="cardhead"><span>CONTRACT OWNER</span><b className="tag">OWNER</b></div><label>TEST REWARD AMOUNT (RGLM)</label><input value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal"/><button className="primary full" disabled={busy||!completed||score===0} onClick={assign}>ASSIGN MISSION REWARD ↗</button><small>Calls rewardUser() from your connected owner wallet. The contract enforces ownership, daily caps and available funding.</small></section>}
      </aside>
    </section>
    <footer><span>✦ &nbsp; BUILT FOR THE <b>REGALIUM</b> ECOSYSTEM</span><span>GAMESTORE INTEGRATION · POLYGON AMOY · BUILD 0.1.0</span></footer>
    <div className="notice"><i/>{notice}</div>
    <div className="mobilepad"><button onClick={()=>setPosition(([x,y,z])=>[x,y,Math.max(-9,z-.8)])}>↑</button><div><button onClick={()=>setPosition(([x,y,z])=>[Math.max(-9,x-.8),y,z])}>←</button><button onClick={()=>setPosition(([x,y,z])=>[Math.min(9,x+.8),y,z])}>→</button></div><button onClick={()=>setPosition(([x,y,z])=>[x,y,Math.min(9,z+.8)])}>↓</button><button className="fire" onClick={fire}>FIRE</button></div>
    <div className="contractnote">{GAMESTORE_ADDRESS?'GAMESTORE · '+GAMESTORE_ADDRESS.slice(0,8)+'…'+GAMESTORE_ADDRESS.slice(-6):'GAMESTORE ADDRESS NOT CONFIGURED · SET VITE_GAMESTORE_ADDRESS'}</div>
  </main>
}
