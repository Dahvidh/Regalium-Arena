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
  const pillars = Array.from({length:24},(_,i)=> {
    const a=i/24*Math.PI*2;
    return {x:Math.sin(a)*12.1,z:Math.cos(a)*12.1,rotation:a};
  });
  return <group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.58,0]} receiveShadow>
      <circleGeometry args={[14,128]}/>
      <meshStandardMaterial color="#111020" metalness={.72} roughness={.34}/>
    </mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.565,0]}>
      <circleGeometry args={[10.8,96]}/>
      <meshStandardMaterial color="#19132a" metalness={.5} roughness={.48}/>
    </mesh>
    <gridHelper args={[28,56,'#65419b','#28203d']} position={[0,-.55,0]}/>
    {[3.4,5.8,8.2,10.7,13.7].map((r,i)=><mesh key={r} rotation={[-Math.PI/2,0,0]} position={[0,-.535+i*.001,0]}>
      <ringGeometry args={[r,r+(i===4?.16:.035),128]}/>
      <meshStandardMaterial color={i===0?'#e7bd70':'#8052bd'} emissive={i===0?'#9b6424':'#32185c'} emissiveIntensity={i===0?.75:.55} metalness={.8} roughness={.25}/>
    </mesh>)}
    {Array.from({length:32},(_,i)=>{
      const a=i*Math.PI/16;
      return <mesh key={'tile'+i} rotation={[-Math.PI/2,0,-a]} position={[Math.sin(a)*6.95,-.525,Math.cos(a)*6.95]}>
        <boxGeometry args={[1.75,.025,.08]}/>
        <meshStandardMaterial color={i%2?'#5c3b8b':'#b88b48'} emissive="#42266d" emissiveIntensity={.45}/>
      </mesh>
    })}
    {pillars.map((p,i)=><group key={i} position={[p.x,0,p.z]} rotation={[0,p.rotation,0]}>
      <mesh position={[0,.82,0]} castShadow receiveShadow><cylinderGeometry args={[.25,.38,1.65,8]}/><meshStandardMaterial color="#4a365e" metalness={.8} roughness={.28}/></mesh>
      <mesh position={[0,1.68,0]} castShadow><cylinderGeometry args={[.42,.3,.16,8]}/><meshStandardMaterial color="#bd914e" metalness={.85} roughness={.2} emissive="#654018" emissiveIntensity={.5}/></mesh>
      <mesh position={[0,2.1,0]}><sphereGeometry args={[.12,12,12]}/><meshBasicMaterial color="#d7b56e"/></mesh>
      <pointLight position={[0,2,0]} color="#a56aff" intensity={.5} distance={3}/>
    </group>)}
    {Array.from({length:8},(_,i)=>{
      const a=i*Math.PI/4;
      return <group key={'gate'+i} position={[Math.sin(a)*9.5,.1,Math.cos(a)*9.5]} rotation={[0,a,0]}>
        <mesh position={[0,1.8,0]} castShadow><boxGeometry args={[.16,3.6,.22]}/><meshStandardMaterial color="#a77b3c" metalness={.9} roughness={.2}/></mesh>
        <mesh position={[0,3.62,0]}><boxGeometry args={[1.4,.12,.25]}/><meshStandardMaterial color="#d8b66e" emissive="#b37a30" emissiveIntensity={1.3}/></mesh>
        <mesh position={[0,1.8,.14]}><boxGeometry args={[.035,2.6,.025]}/><meshBasicMaterial color="#9d5dff"/></mesh>
      </group>
    })}
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.49,0]}><ringGeometry args={[13.8,14.2,128]}/><meshBasicMaterial color="#d2a65b" /></mesh>
  </group>
}
function Operative({position}:{position:[number,number,number]}) {
  const ref=useRef<THREE.Group>(null);
  useFrame((s,dt)=>{if(ref.current){ref.current.position.set(position[0],-.48,position[2]);ref.current.rotation.y=THREE.MathUtils.damp(ref.current.rotation.y,Math.sin(s.clock.elapsedTime*.45)*.08,4,dt)}});
  const armor = <meshStandardMaterial color="#30233f" metalness={.78} roughness={.28}/>;
  const gold = <meshStandardMaterial color="#c79b51" metalness={.9} roughness={.2}/>;
  return <group ref={ref}>
    <group position={[0,0,0]}>
      <mesh position={[0,.22,0]} castShadow><boxGeometry args={[.62,.28,.78]}/><meshStandardMaterial color="#171321" metalness={.65}/></mesh>
      <mesh position={[0,.48,0]} castShadow><capsuleGeometry args={[.23,.5,5,10]}/>{armor}</mesh>
      <mesh position={[0,.58,-.22]} castShadow><boxGeometry args={[.42,.36,.12]}/><meshStandardMaterial color="#5b3b75" metalness={.85} roughness={.2}/></mesh>
      <mesh position={[0,.61,-.292]}><boxGeometry args={[.24,.055,.025]}/><meshBasicMaterial color="#e2b95f"/></mesh>
      <mesh position={[0,.92,0]} castShadow><cylinderGeometry args={[.13,.17,.16,10]}/>{gold}</mesh>
      <mesh position={[0,1.13,0]} castShadow><sphereGeometry args={[.22,16,12]}/><meshStandardMaterial color="#282132" metalness={.75} roughness={.22}/></mesh>
      <mesh position={[0,1.14,-.19]}><boxGeometry args={[.25,.09,.045]}/><meshStandardMaterial color="#9b59e8" emissive="#8e40ff" emissiveIntensity={2}/></mesh>
      <mesh position={[0,1.37,.02]} castShadow><coneGeometry args={[.2,.2,6]}/>{gold}</mesh>
      <mesh position={[-.32,.7,0]} castShadow><icosahedronGeometry args={[.2,1]}/>{armor}</mesh>
      <mesh position={[.32,.7,0]} castShadow><icosahedronGeometry args={[.2,1]}/>{armor}</mesh>
      {[-1,1].map(side=><group key={side} position={[side*.39,.48,0]}>
        <mesh position={[0,-.13,0]} castShadow><capsuleGeometry args={[.09,.34,4,8]}/>{armor}</mesh>
        <mesh position={[0,-.32,-.02]} castShadow><sphereGeometry args={[.105,10,8]}/>{gold}</mesh>
      </group>)}
      {[-1,1].map(side=><group key={'leg'+side} position={[side*.15,.2,0]}>
        <mesh position={[0,-.2,0]} castShadow><capsuleGeometry args={[.105,.34,4,8]}/>{armor}</mesh>
        <mesh position={[0,-.39,-.09]} castShadow><boxGeometry args={[.22,.12,.34]}/><meshStandardMaterial color="#17131e" metalness={.6}/></mesh>
        <mesh position={[0,-.39,-.26]}><boxGeometry args={[.13,.035,.025]}/><meshBasicMaterial color="#c89d55"/></mesh>
      </group>)}
      <group position={[.28,.53,-.34]} rotation={[0,0,-.08]}>
        <mesh position={[.05,0,-.22]} castShadow><boxGeometry args={[.13,.13,.66]}/><meshStandardMaterial color="#191522" metalness={.8}/></mesh>
        <mesh position={[.05,.02,-.58]}><cylinderGeometry args={[.035,.035,.28,8]}/><meshStandardMaterial color="#c39a58" metalness={.9}/></mesh>
        <mesh position={[.05,.1,-.2]}><boxGeometry args={[.08,.035,.26]}/><meshBasicMaterial color="#a85cff"/></mesh>
      </group>
      <mesh position={[-.24,.75,.2]} castShadow><boxGeometry args={[.22,.34,.2]}/><meshStandardMaterial color="#5b3a75" metalness={.8}/></mesh>
      <pointLight position={[0,1.2,-.5]} color="#b46cff" intensity={.7} distance={3}/>
    </group>
  </group>
}
function Drone({bot}:{bot:Bot}) {
  const ref=useRef<THREE.Group>(null);
  useFrame((s,dt)=>{if(ref.current){ref.current.position.y=.85+Math.sin(s.clock.elapsedTime*2.8+bot.id)*.16;ref.current.rotation.y+=dt*(.65+bot.id*.025);ref.current.rotation.z=Math.sin(s.clock.elapsedTime*1.7+bot.id)*.08}});
  return <group ref={ref} position={[bot.x,.85,bot.z]}>
    <mesh castShadow><icosahedronGeometry args={[.42,2]}/><meshStandardMaterial color="#55233f" metalness={.85} roughness={.18} emissive="#a11c55" emissiveIntensity={.65}/></mesh>
    <mesh><sphereGeometry args={[.2,20,16]}/><meshStandardMaterial color="#ff4c87" emissive="#ff1767" emissiveIntensity={2.4} metalness={.4}/></mesh>
    {[0,1,2,3].map(i=><group key={i} rotation={[0,i*Math.PI/2,0]}>
      <mesh position={[.52,0,0]} rotation={[0,0,Math.PI/2]} castShadow><capsuleGeometry args={[.075,.42,4,8]}/><meshStandardMaterial color="#a38a9f" metalness={.9} roughness={.2}/></mesh>
      <mesh position={[.78,.02,0]}><torusGeometry args={[.19,.035,8,24]}/><meshBasicMaterial color="#ff477e"/></mesh>
      <mesh position={[.78,.02,0]} rotation={[0,0,Math.PI/2]}><boxGeometry args={[.04,.32,.04]}/><meshBasicMaterial color="#e7c16e"/></mesh>
    </group>)}
    <mesh position={[0,.34,0]}><coneGeometry args={[.16,.28,6]}/><meshStandardMaterial color="#d4aa65" metalness={.9}/></mesh>
    <pointLight color="#ff286d" intensity={1.8} distance={3.5}/>
  </group>
}
function CameraRig({position}:{position:[number,number,number]}) {
  useFrame(({camera},dt)=>{
    const desired=new THREE.Vector3(position[0],position[1]+4.8,position[2]+8.5);
    camera.position.lerp(desired,1-Math.exp(-3.5*dt));
    camera.lookAt(position[0],position[1]+1.05,position[2]-4.2);
  });
  return null;
}
function Scene({position,bots}:{position:[number,number,number];bots:Bot[]}) {
  return <Canvas shadows camera={{position:[0,5,13.5],fov:56}} dpr={[1,1.5]} gl={{antialias:true, powerPreference:'high-performance'}}>
    <color attach="background" args={['#090713']}/><fog attach="fog" args={['#090713',18,38]}/>
    <ambientLight intensity={.45}/>
    <hemisphereLight args={['#b7a0ff','#171020',.65]}/>
    <directionalLight position={[-7,12,5]} intensity={2.1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024}/>
    <spotLight position={[0,12,-4]} angle={.55} penumbra={.7} intensity={85} distance={28} color="#8d55e8"/>
    <pointLight position={[0,4,0]} color="#d7a64f" intensity={16} distance={18}/>
    <Stars radius={85} depth={45} count={1900} factor={3.4} saturation={.55} fade speed={.35}/>
    <CameraRig position={position}/><Arena/><Operative position={position}/>{bots.map(b=><Drone key={b.id} bot={b}/>)}
    <Float speed={1.1} floatIntensity={.16}><Text position={[0,4.8,-8]} fontSize={.62} color="#e0bc76" letterSpacing={.2} outlineWidth={.012} outlineColor="#28173d">REGALIUM ARENA</Text></Float>
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
    <header className="topbar"><a className="brand" href="#"><span className="brandmark">R</span><span>REGALIUM <b>ARENA</b></span></a><div className="topright"><span className="network"><i/> POLYGON AMOY TESTNET</span><button className="wallet" onClick={connect} disabled={busy}>{wallet?wallet.address.slice(0,6)+'…'+wallet.address.slice(-4):'CONNECT WALLET'}</button>{!wallet&&isMobile&&<a className="wallet" href={metaMaskDeepLink}>OPEN IN METAMASK ↗</a>}</div></header>
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
