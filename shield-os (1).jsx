import { useState, useEffect, useRef } from "react";

/* ─────────────── GLOBAL CSS ─────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');

@keyframes glitch {
  0%,100% { text-shadow: 2px 0 #ff003c, -2px 0 #00f0ff; clip-path: none; }
  20% { text-shadow: -2px 0 #ff003c, 2px 0 #00f0ff; clip-path: inset(10% 0 80% 0); transform: translate(-2px); }
  40% { clip-path: inset(60% 0 20% 0); transform: translate(2px); }
  60% { clip-path: none; transform: translate(0); }
}
@keyframes scan { 0% { top: -5%; } 100% { top: 105%; } }
@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
@keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
@keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0; } }
@keyframes slideIn { from { transform: translateX(-10px); opacity:0; } to { transform: translateX(0); opacity:1; } }
@keyframes scoreReveal { from { stroke-dashoffset: 440; } to { stroke-dashoffset: var(--target); } }
@keyframes neonPop { 0%,100%{box-shadow:0 0 8px #00f0ff44;} 50%{box-shadow:0 0 24px #00f0ffaa;} }
@keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
@keyframes barFill { from{width:0} to{width:var(--w)} }
@keyframes matrixDrop { 0%{opacity:0;transform:translateY(-20px)} 100%{opacity:1;transform:translateY(0)} }
@keyframes borderGlow { 0%,100%{border-color:#00f0ff22;} 50%{border-color:#00f0ff66;} }

* { box-sizing: border-box; margin:0; padding:0; }
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: #050510; }
::-webkit-scrollbar-thumb { background: #00f0ff33; border-radius: 2px; }
::selection { background: #00f0ff33; }

input::placeholder { color: #223; }
input:focus { border-color: #00f0ff55 !important; box-shadow: 0 0 12px #00f0ff11; }

.tab-btn:hover { background: #00f0ff12 !important; color: #00f0ff !important; border-color: #00f0ff55 !important; }
.tool-card:hover { background: #0d0d20 !important; transform: translateY(-2px); box-shadow: 0 8px 24px #00000066; }
.tool-card { transition: all 0.2s ease; }
.quick-btn:hover { border-color: #00f0ff !important; color: #00f0ff !important; }
.risk-row:hover { background: #0a0a18; }
.copy-btn:hover { background: #00f0ff22 !important; color: #00f0ff !important; }
.export-btn:hover { background: #00ff8822 !important; color: #00ff88 !important; }
`;

/* ─────────────── THEME ─────────────── */
const C = {
  safe: "#00ff88", warn: "#ffcc00", danger: "#ff003c",
  info: "#00f0ff", bg: "#050510", card: "#08081a",
  border: "#0d0d2a", card2: "#06060f",
};
const rc = (r) => r==="safe"?C.safe:r==="warn"?C.warn:r==="danger"?C.danger:C.info;

/* ─────────────── ATOMS ─────────────── */
const Dot = ({ s }) => (
  <span style={{
    display:"inline-block",width:7,height:7,borderRadius:"50%",
    background:rc(s),boxShadow:`0 0 8px ${rc(s)}`,marginRight:8,flexShrink:0,
    animation:s==="loading"?"pulse 1s infinite":"none"
  }}/>
);

const Badge = ({ label, risk }) => (
  <span style={{
    fontSize:8,letterSpacing:2,padding:"2px 8px",
    color:rc(risk),border:`1px solid ${rc(risk)}44`,
    fontFamily:"'Share Tech Mono',monospace"
  }}>{label?.toUpperCase()}</span>
);

const Card = ({ title, icon, children, delay=0, accent=C.info, style={} }) => (
  <div style={{
    background:C.card,border:`1px solid ${C.border}`,
    borderTop:`2px solid ${accent}`,padding:"20px",
    animation:`fadeUp 0.5s ease ${delay}s both`,
    position:"relative",overflow:"hidden",...style
  }}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:"1px",
      background:`linear-gradient(90deg,transparent,${accent}66,transparent)`}}/>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,
      fontFamily:"'Orbitron',monospace",fontSize:10,letterSpacing:3,
      color:accent,textTransform:"uppercase"}}>
      <span>{icon}</span>{title}
    </div>
    {children}
  </div>
);

const Row = ({ label, value, risk, loading, mono=true }) => (
  <div className="risk-row" style={{display:"flex",justifyContent:"space-between",alignItems:"center",
    padding:"7px 4px",borderBottom:`1px solid ${C.border}`,gap:8,transition:"background 0.15s"}}>
    <span style={{color:"#445",fontSize:10,letterSpacing:1,
      fontFamily:"'Share Tech Mono',monospace",textTransform:"uppercase",minWidth:130,flexShrink:0}}>{label}</span>
    <span style={{color:risk?rc(risk):"#99a",fontFamily:mono?"'Share Tech Mono',monospace":"inherit",
      fontSize:11,textAlign:"right",wordBreak:"break-all",display:"flex",alignItems:"center"}}>
      {risk&&<Dot s={risk}/>}
      {loading||!value
        ?<span style={{color:"#223",animation:"pulse 1.2s infinite"}}>scanning...</span>
        :value}
    </span>
  </div>
);

/* ─────────────── PRIVACY SCORE GAUGE ─────────────── */
const ScoreGauge = ({ score }) => {
  const r = 66, circ = 2*Math.PI*r;
  const offset = circ - (score/100)*circ;
  const color = score>=70?C.safe:score>=40?C.warn:C.danger;
  const label = score>=70?"PROTECTED":score>=40?"AT RISK":"EXPOSED";
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
      <svg width={170} height={170} style={{transform:"rotate(-90deg)"}}>
        <circle cx={85} cy={85} r={r} fill="none" stroke="#0d0d2a" strokeWidth={10}/>
        <circle cx={85} cy={85} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{transition:"stroke-dashoffset 1.5s ease, stroke 0.5s",filter:`drop-shadow(0 0 8px ${color})`}}/>
      </svg>
      <div style={{marginTop:-130,textAlign:"center",position:"relative",zIndex:1}}>
        <div style={{fontFamily:"'Orbitron',monospace",fontSize:36,fontWeight:900,color,lineHeight:1,
          textShadow:`0 0 20px ${color}88`}}>{score}</div>
        <div style={{fontSize:9,letterSpacing:3,color:"#445",marginTop:4}}>/100</div>
        <div style={{fontSize:8,letterSpacing:4,color,marginTop:6,marginBottom:100}}>{label}</div>
      </div>
    </div>
  );
};

/* ─────────────── THREAT BAR ─────────────── */
const ThreatBar = ({ label, value, max=100, risk="warn" }) => {
  const pct = Math.min(100,(value/max)*100);
  return (
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontSize:9,letterSpacing:2,color:"#445",fontFamily:"'Share Tech Mono',monospace"}}>{label}</span>
        <span style={{fontSize:9,color:rc(risk)}}>{value}/{max}</span>
      </div>
      <div style={{height:3,background:"#0d0d2a",position:"relative",overflow:"hidden"}}>
        <div style={{
          position:"absolute",top:0,left:0,height:"100%",width:`${pct}%`,
          background:rc(risk),boxShadow:`0 0 6px ${rc(risk)}`,
          transition:"width 1.5s ease",animation:`barFill 1.5s ease forwards`
        }}/>
      </div>
    </div>
  );
};

/* ─────────────── WEBRTC ─────────────── */
function getWebRTC() {
  return new Promise(resolve => {
    try {
      const pc = new RTCPeerConnection({iceServers:[{urls:"stun:stun.l.google.com:19302"}]});
      pc.createDataChannel("");
      pc.createOffer().then(o=>pc.setLocalDescription(o));
      const ips=new Set();
      pc.onicecandidate=e=>{
        if(!e.candidate){pc.close();return resolve([...ips]);}
        const m=e.candidate.candidate.match(/(\d+\.\d+\.\d+\.\d+)/g);
        if(m) m.forEach(ip=>ips.add(ip));
      };
      setTimeout(()=>{pc.close();resolve([...ips]);},3000);
    } catch{resolve([]);}
  });
}

/* ─────────────── FINGERPRINT ─────────────── */
function fingerprint() {
  const c=document.createElement("canvas");
  const g=c.getContext("2d");
  g.fillStyle="#069";g.fillText("shield",2,15);
  // Audio fingerprint check
  let audioSupport="Unknown";
  try{new AudioContext();audioSupport="Available";}catch{audioSupport="Blocked";}
  // Battery API
  const hasBattery="getBattery" in navigator?"Exposed":"Not available";
  return {
    ua:navigator.userAgent,lang:navigator.language,
    cores:navigator.hardwareConcurrency,ram:navigator.deviceMemory,
    tz:Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen:`${screen.width}×${screen.height}@${screen.colorDepth}bit`,
    touch:navigator.maxTouchPoints>0,dnt:navigator.doNotTrack==="1",
    canvas:c.toDataURL().slice(-20),plugins:navigator.plugins?.length||0,
    audioCtx:audioSupport,battery:hasBattery,
    webgl:(()=>{try{const g2=document.createElement("canvas").getContext("webgl");
      const d=g2?.getExtension("WEBGL_debug_renderer_info");
      return d?g2.getParameter(d.UNMASKED_RENDERER_WEBGL):"Hidden";}catch{return "Hidden";}})(),
    pdfViewer:navigator.pdfViewerEnabled?"Enabled":"Disabled",
    cookieEnabled:navigator.cookieEnabled,
    platform:navigator.platform||"Unknown",
  };
}

/* ─────────────── DATA ─────────────── */
const CENSORED_SITES = [
  {name:"Twitter/X",url:"https://twitter.com",cat:"Social"},
  {name:"Facebook",url:"https://facebook.com",cat:"Social"},
  {name:"Instagram",url:"https://instagram.com",cat:"Social"},
  {name:"YouTube",url:"https://youtube.com",cat:"Media"},
  {name:"TikTok",url:"https://tiktok.com",cat:"Social"},
  {name:"Wikipedia",url:"https://wikipedia.org",cat:"Info"},
  {name:"Reddit",url:"https://reddit.com",cat:"Forum"},
  {name:"Telegram",url:"https://telegram.org",cat:"Messaging"},
  {name:"Signal",url:"https://signal.org",cat:"Messaging"},
  {name:"ProtonMail",url:"https://proton.me",cat:"Privacy"},
  {name:"Tor Project",url:"https://torproject.org",cat:"Privacy"},
  {name:"DuckDuckGo",url:"https://duckduckgo.com",cat:"Search"},
  {name:"Discord",url:"https://discord.com",cat:"Social"},
  {name:"LinkedIn",url:"https://linkedin.com",cat:"Social"},
  {name:"GitHub",url:"https://github.com",cat:"Dev"},
];

const GOV_ISSUES = [
  {country:"🇨🇳 China",issue:"The Great Firewall blocks 10,000+ domains including Google, Facebook, Wikipedia & most Western news.",risk:"danger"},
  {country:"🇷🇺 Russia",issue:"Roskomnadzor maintains a blocklist of 500K+ URLs. Twitter/Instagram restricted since 2022.",risk:"danger"},
  {country:"🇮🇷 Iran",issue:"Blocks social media, VPNs, and most Western services. Deep Packet Inspection used.",risk:"danger"},
  {country:"🇰🇵 North Korea",issue:"Near total internet blackout. Only ~5,500 IP addresses exist. Citizens use Kwangmyong intranet only.",risk:"danger"},
  {country:"🇧🇾 Belarus",issue:"Internet shutdowns during protests. Telegram, social media blocked during elections.",risk:"danger"},
  {country:"🇹🇷 Turkey",issue:"Wikipedia blocked 2017-2019. Twitter/YouTube blocked multiple times. 400K+ sites blocked.",risk:"warn"},
  {country:"🇵🇰 Pakistan",issue:"Frequent social media throttling during political unrest. Wikipedia briefly blocked 2023.",risk:"warn"},
  {country:"🇮🇳 India",issue:"World's most internet shutdowns (~84 in 2023). Jammu & Kashmir had 552-day blackout.",risk:"warn"},
  {country:"🇺🇸 USA",issue:"FISA 702 mass surveillance. NSA collects bulk metadata. No comprehensive federal privacy law.",risk:"warn"},
  {country:"🇬🇧 UK",issue:"Investigatory Powers Act ('Snoopers Charter') — bulk data collection, mandatory ISP logs for 12 months.",risk:"warn"},
  {country:"🇩🇪 EU/Germany",issue:"GDPR protects users but Chat Control proposal could mandate E2E encryption backdoors.",risk:"safe"},
  {country:"🇮🇸 Iceland",issue:"Strong privacy laws, no mass surveillance. One of the world's freest internet access countries.",risk:"safe"},
  {country:"🇸🇦 Saudi Arabia",issue:"VoIP blocked (WhatsApp calls). Heavy filtering of political/religious content. CyberCrime laws used against critics.",risk:"danger"},
  {country:"🇦🇪 UAE",issue:"VoIP services blocked (Skype, WhatsApp). Surveillance on dissidents and journalists well documented.",risk:"danger"},
  {country:"🇪🇬 Egypt",issue:"Blocked 500+ news/VPN sites. Tor partially blocked. Journalists arrested for social media posts.",risk:"warn"},
];

const TOOLS = [
  {name:"Tor Browser",desc:"Routes traffic through 3 encrypted nodes. Near-perfect anonymity.",link:"https://torproject.org",level:"Max",icon:"🧅"},
  {name:"Mullvad VPN",desc:"No-logs, anonymous accounts (no email), RAM-only servers.",link:"https://mullvad.net",level:"High",icon:"🔒"},
  {name:"ProtonVPN",desc:"Swiss-based, open source, free tier available. Audited.",link:"https://protonvpn.com",level:"High",icon:"⚡"},
  {name:"uBlock Origin",desc:"Best ad/tracker blocker. Medium mode = maximum protection.",link:"https://ublockorigin.com",level:"Essential",icon:"🛡️"},
  {name:"Signal",desc:"E2E encrypted messages & calls. Open source. No metadata.",link:"https://signal.org",level:"Essential",icon:"💬"},
  {name:"Proton Mail",desc:"E2E encrypted email. Swiss privacy law protection.",link:"https://proton.me",level:"High",icon:"📧"},
  {name:"Session",desc:"No phone number needed. Decentralized messaging on Oxen network.",link:"https://getsession.org",level:"High",icon:"🌐"},
  {name:"Tails OS",desc:"Amnesic OS. Boots from USB, leaves zero trace on host.",link:"https://tails.boum.org",level:"Max",icon:"💾"},
  {name:"GrapheneOS",desc:"Privacy-focused Android. De-Googled, hardened kernel.",link:"https://grapheneos.org",level:"Max",icon:"📱"},
  {name:"Nextcloud",desc:"Self-hosted cloud. Full control over your data.",link:"https://nextcloud.com",level:"High",icon:"☁️"},
  {name:"Bitwarden",desc:"Open source password manager. E2E encrypted vault.",link:"https://bitwarden.com",level:"Essential",icon:"🔑"},
  {name:"SimpleX Chat",desc:"No user IDs, no phone/email needed. Truly private.",link:"https://simplex.chat",level:"Max",icon:"🔏"},
];

const SURVEILLANCE_PROGRAMS = [
  {name:"NSA PRISM (USA)",desc:"Collects internet comms from major US tech companies. Legal under FISA Section 702.",agencies:"NSA, FBI, CIA",risk:"danger"},
  {name:"GCHQ Tempora (UK)",desc:"Taps fiber optic cables. Stores all internet data for 3 days, metadata for 30 days.",agencies:"GCHQ, NSA",risk:"danger"},
  {name:"Five Eyes Alliance",desc:"Intelligence sharing between USA, UK, Canada, Australia, New Zealand.",agencies:"NSA, GCHQ, CSE, ASD, GCSB",risk:"danger"},
  {name:"China Great Firewall",desc:"Deep Packet Inspection at national backbone level. Real-time keyword filtering.",agencies:"MSS, MPS",risk:"danger"},
  {name:"Russia SORM-3",desc:"ISPs required to install FSB hardware for passive interception of all traffic.",agencies:"FSB",risk:"danger"},
  {name:"EU Chat Control",desc:"Proposed regulation would mandate client-side scanning of encrypted messages.",agencies:"Europol, EDPS",risk:"warn"},
  {name:"India CMS",desc:"Centralized Monitoring System — real-time lawful intercept across all ISPs.",agencies:"DoT, IB",risk:"warn"},
  {name:"Israel Unit 8200",desc:"Signals intelligence. Exports surveillance tech to authoritarian governments.",agencies:"IDF, Mossad",risk:"danger"},
];

const TABS = ["🛡️ Privacy Scan","📊 Privacy Score","🌍 Censorship Map","🔬 Surveillance","🔧 Arsenal"];

/* ─────────────── MAIN COMPONENT ─────────────── */
export default function ShieldOS() {
  const [tab, setTab]=useState(0);
  const [ip, setIp]=useState(null);
  const [ipData, setIpData]=useState(null);
  const [webrtc, setWebrtc]=useState(null);
  const [dns, setDns]=useState(null);
  const [fp]=useState(()=>fingerprint());
  const [log, setLog]=useState([]);
  const [time, setTime]=useState(new Date());
  const [censorSearch, setCensorSearch]=useState("");
  const [customUrl, setCustomUrl]=useState("");
  const [customResults, setCustomResults]=useState([]);
  const [copied, setCopied]=useState(false);
  const logRef=useRef(null);

  const addLog=(msg,type="info")=>setLog(p=>[...p.slice(-40),{msg,color:C[type]||C.info,t:new Date().toLocaleTimeString()}]);

  useEffect(()=>{const t=setInterval(()=>setTime(new Date()),1000);return()=>clearInterval(t);},[]);
  useEffect(()=>{if(logRef.current)logRef.current.scrollTop=logRef.current.scrollHeight;},[log]);

  useEffect(()=>{
    addLog("SHIELD OS v4.0 — INITIALIZING ALL MODULES","info");

    fetch("https://ipapi.co/json/")
      .then(r=>r.json())
      .then(d=>{setIp(d.ip);setIpData(d);addLog(`IP: ${d.ip} → ${d.city}, ${d.country_name}`,"warn");})
      .catch(()=>addLog("IP lookup failed","danger"));

    fetch("https://cloudflare-dns.com/dns-query?name=whoami.akamai.net&type=A",{headers:{"accept":"application/dns-json"}})
      .then(r=>r.json())
      .then(d=>{setDns(d.Answer?.map(a=>a.data)||[]);addLog("DNS resolver identified","info");})
      .catch(()=>setDns([]));

    addLog("Probing WebRTC leaks...","info");
    getWebRTC().then(ips=>{
      setWebrtc(ips);
      if(ips.length) addLog(`WebRTC exposed ${ips.length} IP(s): ${ips.join(", ")}`,"danger");
      else addLog("WebRTC: No leaks detected","safe");
    });

    addLog(`Canvas fingerprint: ${fingerprint().canvas}`,"warn");
    addLog(`Browser platform: ${navigator.platform||"unknown"}`,"warn");
    addLog("All modules loaded. Stay anonymous.","safe");
  },[]);

  const vpn=ipData?.org?.toLowerCase().match(/vpn|tor|proxy|hosting|cloud|linode|digital.?ocean|ovh|hetzner|amazon|google|microsoft/);
  const webrtcLeak=webrtc?.some(i=>!i.startsWith("10.")&&!i.startsWith("192.168.")&&!i.startsWith("172.")&&!i.startsWith("127."));
  const overallRisk=!ip?"loading":webrtcLeak?"danger":!vpn?"warn":"safe";

  /* PRIVACY SCORE calculation */
  const calcScore=()=>{
    if(!ip) return 50;
    let s=100;
    if(!vpn) s-=25;
    if(webrtcLeak) s-=20;
    if(fp.cookieEnabled) s-=5;
    if(fp.canvas) s-=10;
    if(fp.webgl!=="Hidden") s-=8;
    if(!fp.dnt) s-=5;
    if(fp.battery==="Exposed") s-=5;
    if(fp.audioCtx==="Available") s-=5;
    if(dns&&dns.length>1) s-=5;
    return Math.max(0,Math.min(100,s));
  };
  const privacyScore=calcScore();

  const checkUrl=(url)=>{
    if(!url) return;
    const u=url.startsWith("http")?url:"https://"+url;
    const img=new Image();
    const start=Date.now();
    const result={url:u,name:url};
    img.onload=()=>setCustomResults(p=>[{...result,status:"reachable",ms:Date.now()-start},...p.slice(0,9)]);
    img.onerror=()=>setCustomResults(p=>[{...result,status:"blocked",ms:Date.now()-start},...p.slice(0,9)]);
    img.src=u+"/favicon.ico?_="+Date.now();
    setTimeout(()=>setCustomResults(p=>{
      if(!p.find(r=>r.url===u)) return [{...result,status:"timeout",ms:5000},...p.slice(0,9)];
      return p;
    }),5000);
  };

  const exportReport=()=>{
    const report=`SHIELD OS — PRIVACY REPORT
Generated: ${new Date().toUTCString()}
Privacy Score: ${privacyScore}/100

── IP INTELLIGENCE ──
IP Address: ${ip||"Unknown"}
Country: ${ipData?.country_name||"Unknown"}
City: ${ipData?.city||"Unknown"}
ISP/Org: ${ipData?.org||"Unknown"}
VPN Detected: ${vpn?"Yes":"No"}

── LEAK TESTS ──
WebRTC Leak: ${webrtc===null?"Scanning...":webrtcLeak?"VULNERABLE — "+webrtc?.join(", "):"CLEAN"}
DNS Resolvers: ${dns?.length||0} detected (${dns?.join(", ")||"none"})

── BROWSER FINGERPRINT ──
Platform: ${fp.platform}
Language: ${fp.lang}
Screen: ${fp.screen}
Timezone: ${fp.tz}
CPU Cores: ${fp.cores}
RAM: ${fp.ram||"Hidden"}
Canvas Hash: ${fp.canvas}
WebGL Renderer: ${fp.webgl}
Do Not Track: ${fp.dnt?"Enabled":"Disabled"}
Audio Context: ${fp.audioCtx}
Battery API: ${fp.battery}

── RECOMMENDATIONS ──
${!vpn?"• Use a no-log VPN (Mullvad or ProtonVPN)":"• ✓ VPN active"}
${webrtcLeak?"• Disable WebRTC in your browser IMMEDIATELY":"• ✓ No WebRTC leak"}
• Use Tor Browser for maximum anonymity
• Enable DNS-over-HTTPS
• Install uBlock Origin (medium mode)
• Use Signal for all communications

SHIELD OS — BUILT FOR THE PEOPLE`;
    const blob=new Blob([report],{type:"text/plain"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=`shield-os-report-${Date.now()}.txt`;
    a.click();
  };

  const copyIP=()=>{
    if(ip){navigator.clipboard.writeText(ip);setCopied(true);setTimeout(()=>setCopied(false),1500);}
  };

  const filteredGov=GOV_ISSUES.filter(g=>!censorSearch||g.country.toLowerCase().includes(censorSearch.toLowerCase()));

  const SectionLabel=({children})=>(
    <div style={{fontSize:8,letterSpacing:4,color:"#223",marginBottom:8,marginTop:4,
      fontFamily:"'Share Tech Mono',monospace"}}>{children}</div>
  );

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:"#ccd",fontFamily:"'Share Tech Mono',monospace"}}>
      <style>{CSS}</style>

      {/* Scanline */}
      <div style={{position:"fixed",left:0,right:0,height:"3px",pointerEvents:"none",zIndex:100,
        background:"linear-gradient(transparent,rgba(0,240,255,0.1),transparent)",
        animation:"scan 5s linear infinite"}}/>

      {/* Grid bg */}
      <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",
        backgroundImage:"linear-gradient(rgba(0,240,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,0.02) 1px,transparent 1px)",
        backgroundSize:"50px 50px"}}/>

      <div style={{position:"relative",zIndex:1,maxWidth:1040,margin:"0 auto",padding:"20px 12px"}}>

        {/* ── HEADER ── */}
        <div style={{textAlign:"center",marginBottom:24,animation:"fadeUp 0.4s ease"}}>
          <div style={{fontSize:9,letterSpacing:6,color:"#223",marginBottom:6}}>
            {time.toUTCString()} — CLASSIFIED SYSTEM
          </div>
          <h1 style={{fontFamily:"'Orbitron',monospace",fontSize:"clamp(26px,6vw,52px)",
            fontWeight:900,letterSpacing:10,margin:0,color:"#fff",animation:"glitch 4s infinite"}}>
            SHIELD OS
          </h1>
          <div style={{fontSize:9,letterSpacing:4,color:C.info,marginTop:4}}>
            CITIZEN PRIVACY INTELLIGENCE PLATFORM v4.0
          </div>

          {/* Status pill */}
          <div style={{display:"inline-flex",alignItems:"center",marginTop:14,
            padding:"8px 24px",border:`1px solid ${rc(overallRisk)}`,
            boxShadow:`0 0 24px ${rc(overallRisk)}33,inset 0 0 24px ${rc(overallRisk)}08`,
            gap:8,fontSize:10,letterSpacing:3}}>
            <Dot s={overallRisk}/>
            {overallRisk==="loading"&&"INITIALIZING SCAN..."}
            {overallRisk==="safe"&&"VPN ACTIVE — IDENTITY MASKED"}
            {overallRisk==="warn"&&"WARNING — NO VPN DETECTED"}
            {overallRisk==="danger"&&"CRITICAL — WEBRTC LEAK ACTIVE"}
          </div>

          {/* Action buttons */}
          <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:12,flexWrap:"wrap"}}>
            <button className="export-btn" onClick={exportReport} style={{
              padding:"6px 16px",background:"transparent",border:`1px solid ${C.safe}44`,
              color:"#445",cursor:"pointer",fontFamily:"'Share Tech Mono',monospace",
              fontSize:9,letterSpacing:2,transition:"all 0.2s"
            }}>⬇ EXPORT REPORT</button>
            <button className="copy-btn" onClick={copyIP} style={{
              padding:"6px 16px",background:"transparent",border:`1px solid #0d0d2a`,
              color:"#445",cursor:"pointer",fontFamily:"'Share Tech Mono',monospace",
              fontSize:9,letterSpacing:2,transition:"all 0.2s"
            }}>{copied?"✓ COPIED":"◈ COPY MY IP"}</button>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{display:"flex",gap:4,marginBottom:20,flexWrap:"wrap"}}>
          {TABS.map((t,i)=>(
            <button key={i} className="tab-btn" onClick={()=>setTab(i)} style={{
              flex:1,minWidth:110,padding:"10px 6px",
              background:tab===i?C.info+"18":"transparent",
              border:`1px solid ${tab===i?C.info:"#0d0d2a"}`,
              color:tab===i?C.info:"#445",cursor:"pointer",
              fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:1,
              transition:"all 0.2s",textTransform:"uppercase"
            }}>{t}</button>
          ))}
        </div>

        {/* ══════════════ TAB 0 — PRIVACY SCAN ══════════════ */}
        {tab===0 && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16,animation:"fadeUp 0.3s ease"}}>
            {/* IP Card */}
            <Card title="IP Intelligence" icon="🌐" accent={C.warn}>
              <Row label="Your IP" value={
                ip?<span style={{cursor:"pointer"}} onClick={copyIP}>{ip}</span>:null
              } risk="warn" loading={!ip}/>
              <Row label="Country" value={ipData?.country_name} loading={!ipData}/>
              <Row label="City / Region" value={ipData?`${ipData.city}, ${ipData.region}`:null} loading={!ipData}/>
              <Row label="ISP / Org" value={ipData?.org} loading={!ipData}/>
              <Row label="ASN" value={ipData?.asn} loading={!ipData}/>
              <Row label="Timezone" value={ipData?.timezone} loading={!ipData}/>
              <Row label="VPN/Proxy" value={vpn?"LIKELY DETECTED":"NOT DETECTED"} risk={vpn?"safe":"danger"} loading={!ipData}/>
            </Card>

            {/* WebRTC + DNS */}
            <Card title="Leak Detection" icon="💧" accent={C.danger}>
              <Row label="WebRTC Status"
                value={webrtc===null?null:webrtcLeak?"LEAKING":"SECURE"}
                risk={webrtc===null?null:webrtcLeak?"danger":"safe"}
                loading={webrtc===null}/>
              {webrtcLeak&&webrtc?.map((i2,idx)=>(
                <Row key={idx} label={`  ↳ Leaked IP #${idx+1}`} value={i2} risk="danger"/>
              ))}
              <Row label="DNS Resolver" value={dns?.[0]||(dns?"None found":null)} risk={dns?"warn":null} loading={dns===null}/>
              <Row label="Resolver Count" value={dns!==null?`${dns.length} detected`:null}
                risk={dns?.length>1?"warn":"safe"} loading={dns===null}/>
              <Row label="DNS-over-HTTPS" value="Manual check needed" risk="warn"/>
              <div style={{marginTop:10,padding:8,background:"#ff003c08",border:"1px solid #ff003c22",fontSize:10,color:"#556",lineHeight:1.7}}>
                {webrtcLeak
                  ?"⚠ Real IP exposed via WebRTC. Disable WebRTC in browser settings or use Tor Browser."
                  :"✓ No WebRTC leak detected. Your tunnel appears intact."}
              </div>
            </Card>

            {/* Fingerprint */}
            <div style={{gridColumn:"1/-1"}}>
              <Card title="Browser Fingerprint — You Are Being Tracked" icon="🖥️" accent={C.danger} delay={0.1}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"0 32px"}}>
                  <Row label="Platform" value={fp.platform} risk="warn"/>
                  <Row label="Language" value={fp.lang} risk="warn"/>
                  <Row label="Screen" value={fp.screen} risk="warn"/>
                  <Row label="Timezone" value={fp.tz} risk="warn"/>
                  <Row label="CPU Cores" value={fp.cores} risk="warn"/>
                  <Row label="RAM" value={fp.ram?`${fp.ram} GB`:"Hidden"} risk={fp.ram?"warn":"safe"}/>
                  <Row label="Canvas Hash" value={fp.canvas} risk="danger"/>
                  <Row label="WebGL Renderer" value={fp.webgl?.slice(0,30)+(fp.webgl?.length>30?"…":"")} risk={fp.webgl!=="Hidden"?"danger":"safe"}/>
                  <Row label="Touch Points" value={fp.touch?"Yes":"No"}/>
                  <Row label="Plugin Count" value={fp.plugins}/>
                  <Row label="Do Not Track" value={fp.dnt?"ENABLED":"DISABLED"} risk={fp.dnt?"safe":"danger"}/>
                  <Row label="Audio Context" value={fp.audioCtx} risk={fp.audioCtx==="Available"?"warn":"safe"}/>
                  <Row label="Battery API" value={fp.battery} risk={fp.battery==="Exposed"?"warn":"safe"}/>
                  <Row label="PDF Viewer" value={fp.pdfViewer} risk="warn"/>
                </div>
                <div style={{marginTop:12,padding:10,background:"#ff003c0a",border:"1px solid #ff003c22",fontSize:10,color:"#667",lineHeight:1.7}}>
                  ⚠ This fingerprint combo is statistically unique across 1 in 286,777 browsers. You are trackable across every site — even in incognito. Use Tor Browser or Firefox + arkenfox user.js to spoof/randomize this data.
                </div>
              </Card>
            </div>

            {/* System Log */}
            <div style={{gridColumn:"1/-1"}}>
              <Card title="System Log" icon="📋" delay={0.2}>
                <div ref={logRef} style={{height:140,overflowY:"auto",display:"flex",flexDirection:"column",gap:2}}>
                  {log.map((l,i)=>(
                    <div key={i} style={{fontSize:10,display:"flex",gap:8,animation:"slideIn 0.2s ease"}}>
                      <span style={{color:"#223",minWidth:76,flexShrink:0}}>{l.t}</span>
                      <span style={{color:l.color}}>{l.msg}</span>
                    </div>
                  ))}
                  <span style={{color:C.info,animation:"blink 1s infinite",fontSize:12}}>█</span>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ══════════════ TAB 1 — PRIVACY SCORE ══════════════ */}
        {tab===1 && (
          <div style={{animation:"fadeUp 0.3s ease",display:"grid",gap:16}}>
            <Card title="Your Privacy Score" icon="📊" accent={C.info}>
              <div style={{display:"flex",flexWrap:"wrap",gap:24,alignItems:"center",justifyContent:"center"}}>
                <ScoreGauge score={privacyScore}/>
                <div style={{flex:1,minWidth:200}}>
                  <div style={{marginBottom:16,fontSize:10,color:"#556",lineHeight:1.8}}>
                    Score calculated from your current session data. Higher = more private.
                    Maximum score requires VPN, WebRTC disabled, and Tor Browser.
                  </div>
                  <ThreatBar label="VPN Protection" value={vpn?100:0} risk={vpn?"safe":"danger"}/>
                  <ThreatBar label="WebRTC Security" value={webrtcLeak?0:100} risk={webrtcLeak?"danger":"safe"}/>
                  <ThreatBar label="Fingerprint Uniqueness" value={fp.canvas?85:20} max={100} risk="warn"/>
                  <ThreatBar label="DNS Security" value={dns&&dns.length<=1?60:20} risk={dns?.length>1?"warn":"safe"}/>
                  <ThreatBar label="Tracking Resistance" value={fp.dnt?45:15} risk="warn"/>
                </div>
              </div>
            </Card>

            <Card title="Risk Factor Breakdown" icon="⚠️" accent={C.warn}>
              {[
                {factor:"No VPN Detected", impact:-25, present:!vpn, fix:"Install Mullvad or ProtonVPN"},
                {factor:"WebRTC IP Leak", impact:-20, present:webrtcLeak, fix:"Disable WebRTC in browser flags"},
                {factor:"Canvas Fingerprint", impact:-10, present:!!fp.canvas, fix:"Use Tor Browser or arkenfox"},
                {factor:"WebGL Fingerprint", impact:-8, present:fp.webgl!=="Hidden", fix:"Use Firefox with resistFingerprinting"},
                {factor:"Cookies Enabled", impact:-5, present:fp.cookieEnabled, fix:"Use private mode + cookie autodelete"},
                {factor:"Do Not Track OFF", impact:-5, present:!fp.dnt, fix:"Enable DNT in browser settings"},
                {factor:"Battery API Exposed", impact:-5, present:fp.battery==="Exposed", fix:"Tor Browser blocks this automatically"},
                {factor:"Audio Context Exposed", impact:-5, present:fp.audioCtx==="Available", fix:"Firefox+arkenfox spoofs audio hash"},
                {factor:"Multiple DNS Resolvers", impact:-5, present:dns?.length>1, fix:"Configure single trusted DoH resolver"},
              ].map((f,i)=>(
                <div key={i} style={{
                  display:"grid",gridTemplateColumns:"1fr auto auto",
                  gap:12,padding:"8px 0",borderBottom:`1px solid ${C.border}`,
                  alignItems:"center",opacity:f.present?1:0.35
                }}>
                  <div>
                    <div style={{fontSize:10,color:f.present?"#ccd":"#334",marginBottom:2}}>{f.factor}</div>
                    {f.present&&<div style={{fontSize:9,color:C.safe}}>→ {f.fix}</div>}
                  </div>
                  <span style={{fontSize:9,color:f.present?C.danger:C.safe,letterSpacing:1,whiteSpace:"nowrap"}}>
                    {f.present?f.impact:"✓ OK"}
                  </span>
                  <Dot s={f.present?"danger":"safe"}/>
                </div>
              ))}
            </Card>

            <Card title="How to Reach 100" icon="🎯" accent={C.safe}>
              <div style={{display:"grid",gap:8}}>
                {[
                  {step:"1",action:"Use Tor Browser",note:"Eliminates WebRTC, canvas, WebGL, and audio fingerprinting in one step",impact:"+45 pts"},
                  {step:"2",action:"Enable a no-log VPN",note:"Mullvad or ProtonVPN. Hides your real IP from every site",impact:"+25 pts"},
                  {step:"3",action:"Use DNS-over-HTTPS",note:"Cloudflare (1.1.1.1) or NextDNS. Hides domains from your ISP",impact:"+10 pts"},
                  {step:"4",action:"Disable WebRTC",note:"In Firefox: media.peerconnection.enabled → false in about:config",impact:"+20 pts"},
                ].map((s,i)=>(
                  <div key={i} style={{display:"flex",gap:12,padding:"10px 12px",
                    background:C.card2,borderLeft:`3px solid ${C.safe}`,
                    animation:`fadeUp 0.3s ease ${i*0.07}s both`}}>
                    <span style={{fontFamily:"'Orbitron',monospace",fontSize:16,color:C.safe,minWidth:24}}>{s.step}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,color:"#ccd",marginBottom:3}}>{s.action}</div>
                      <div style={{fontSize:9,color:"#445",lineHeight:1.6}}>{s.note}</div>
                    </div>
                    <span style={{fontSize:9,color:C.safe,whiteSpace:"nowrap",alignSelf:"center"}}>{s.impact}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ══════════════ TAB 2 — CENSORSHIP MAP ══════════════ */}
        {tab===2 && (
          <div style={{animation:"fadeUp 0.3s ease",display:"grid",gap:16}}>
            <Card title="Global Internet Censorship Intelligence" icon="🌍">
              <input placeholder="🔍  Filter by country..." value={censorSearch}
                onChange={e=>setCensorSearch(e.target.value)}
                style={{width:"100%",background:"#0a0a1a",border:`1px solid ${C.border}`,
                  color:"#ccd",padding:"8px 12px",fontFamily:"'Share Tech Mono',monospace",
                  fontSize:11,letterSpacing:1,outline:"none",marginBottom:16}}/>
              <div style={{display:"grid",gap:8}}>
                {filteredGov.map((g,i)=>(
                  <div key={i} style={{padding:"12px 14px",background:C.card2,
                    borderLeft:`3px solid ${rc(g.risk)}`,animation:`fadeUp 0.3s ease ${i*0.03}s both`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <span style={{fontFamily:"'Orbitron',monospace",fontSize:11,color:"#ccd",letterSpacing:1}}>{g.country}</span>
                      <Badge label={g.risk} risk={g.risk}/>
                    </div>
                    <div style={{fontSize:10,color:"#556",lineHeight:1.7}}>{g.issue}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* URL Checker */}
            <Card title="Live URL Reachability Checker" icon="🔎" accent={C.warn}>
              <div style={{fontSize:10,color:"#445",lineHeight:1.7,marginBottom:12}}>
                Test if a URL is reachable from your network. Blocked = potentially censored by your ISP or government.
              </div>
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                <input placeholder="Enter URL to test (e.g. wikipedia.org)" value={customUrl}
                  onChange={e=>setCustomUrl(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&checkUrl(customUrl)}
                  style={{flex:1,background:"#0a0a1a",border:`1px solid ${C.border}`,
                    color:"#ccd",padding:"8px 12px",fontFamily:"'Share Tech Mono',monospace",
                    fontSize:11,outline:"none"}}/>
                <button onClick={()=>checkUrl(customUrl)} style={{
                  padding:"8px 20px",background:C.info+"22",border:`1px solid ${C.info}`,
                  color:C.info,cursor:"pointer",fontFamily:"'Share Tech Mono',monospace",fontSize:10,letterSpacing:2}}>TEST</button>
              </div>
              <SectionLabel>QUICK TEST — COMMON SITES:</SectionLabel>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
                {CENSORED_SITES.map((s,i)=>(
                  <button key={i} className="quick-btn" onClick={()=>checkUrl(s.url)} style={{
                    padding:"4px 10px",background:C.card2,border:`1px solid ${C.border}`,
                    color:"#667",cursor:"pointer",fontFamily:"'Share Tech Mono',monospace",
                    fontSize:9,letterSpacing:1,transition:"all 0.2s"}}>{s.name}</button>
                ))}
              </div>
              {customResults.length>0&&(
                <div>
                  <SectionLabel>RESULTS:</SectionLabel>
                  {customResults.map((r,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                      padding:"7px 10px",background:C.card2,marginBottom:4,
                      borderLeft:`3px solid ${r.status==="reachable"?C.safe:r.status==="blocked"?C.danger:C.warn}`,
                      animation:"slideIn 0.3s ease"}}>
                      <span style={{fontSize:10,color:"#ccd"}}>{r.name}</span>
                      <div style={{display:"flex",gap:12,alignItems:"center"}}>
                        <span style={{fontSize:9,color:"#445"}}>{r.ms}ms</span>
                        <span style={{fontSize:9,letterSpacing:2,
                          color:r.status==="reachable"?C.safe:r.status==="blocked"?C.danger:C.warn}}>
                          {r.status==="reachable"?"✓ REACHABLE":r.status==="blocked"?"✗ BLOCKED":"⚡ TIMEOUT"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{marginTop:8,fontSize:9,color:"#334",lineHeight:1.7}}>
                Note: Uses image loading heuristics. Results are indicative. Use Tor or a VPN for authoritative testing.
              </div>
            </Card>
          </div>
        )}

        {/* ══════════════ TAB 3 — SURVEILLANCE ══════════════ */}
        {tab===3 && (
          <div style={{animation:"fadeUp 0.3s ease",display:"grid",gap:16}}>
            <Card title="Network Threat Intelligence" icon="🔬" accent={C.danger}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"0 32px"}}>
                <Row label="Your IP" value={ip} risk="warn" loading={!ip}/>
                <Row label="ISP" value={ipData?.org} loading={!ipData}/>
                <Row label="ASN" value={ipData?.asn} loading={!ipData}/>
                <Row label="WebRTC Leak" value={webrtc===null?null:webrtcLeak?"VULNERABLE":"CLEAN"}
                  risk={webrtc===null?null:webrtcLeak?"danger":"safe"} loading={webrtc===null}/>
                <Row label="DNS Security" value={dns!==null?dns.length>1?"MULTIPLE RESOLVERS":"SINGLE RESOLVER":null}
                  risk={dns?.length>1?"warn":"safe"} loading={dns===null}/>
                <Row label="HTTPS Session" value="Active" risk="safe"/>
                <Row label="Browser Cookies" value={navigator.cookieEnabled?"ENABLED":"DISABLED"} risk={navigator.cookieEnabled?"warn":"safe"}/>
                <Row label="JS Fingerprinting" value="EXPOSED" risk="danger"/>
              </div>
            </Card>

            <Card title="Known Surveillance Programs" icon="👁️" accent={C.danger}>
              {SURVEILLANCE_PROGRAMS.map((p,i)=>(
                <div key={i} style={{padding:"12px 14px",background:C.card2,
                  borderLeft:`3px solid ${rc(p.risk)}`,marginBottom:8,
                  animation:`fadeUp 0.3s ease ${i*0.05}s both`}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:11,color:"#ccd",letterSpacing:1}}>{p.name}</span>
                    <span style={{fontSize:9,color:"#445"}}>{p.agencies}</span>
                  </div>
                  <div style={{fontSize:10,color:"#556",lineHeight:1.7}}>{p.desc}</div>
                </div>
              ))}
            </Card>

            <Card title="Your Threat Surface" icon="⚠️" accent={C.warn}>
              <div style={{display:"grid",gap:2}}>
                {[
                  {threat:"IP Address",exposure:"Sites see your real IP → geolocation, ISP, country",mitigation:"VPN or Tor",risk:!vpn?"danger":"safe"},
                  {threat:"DNS Queries",exposure:"ISP logs every domain you visit",mitigation:"DNS-over-HTTPS + VPN",risk:"warn"},
                  {threat:"Browser Fingerprint",exposure:"Unique ID across all sites, even private mode",mitigation:"Tor Browser or arkenfox",risk:"danger"},
                  {threat:"WebRTC Leaks",exposure:"Real IP exposed even through VPN",mitigation:"Disable WebRTC in browser",risk:webrtcLeak?"danger":"safe"},
                  {threat:"HTTP Traffic",exposure:"Unencrypted data readable by ISP/attackers",mitigation:"HTTPS everywhere + VPN",risk:"warn"},
                  {threat:"Metadata",exposure:"Who you talk to, when, how often",mitigation:"Session/Signal, Tor",risk:"warn"},
                  {threat:"Device Tracking",exposure:"MAC address, device ID trackable on networks",mitigation:"MAC randomization",risk:"warn"},
                  {threat:"Canvas/Audio FP",exposure:"Invisible fingerprinting via browser APIs",mitigation:"Firefox+resistFingerprinting",risk:"danger"},
                ].map((t,i)=>(
                  <div key={i} className="risk-row" style={{
                    display:"grid",gridTemplateColumns:"1fr 1.5fr 1.5fr auto",
                    gap:8,padding:"8px 4px",borderBottom:`1px solid ${C.border}`,
                    alignItems:"center",fontSize:10,transition:"background 0.15s"
                  }}>
                    <span style={{color:"#99a"}}>{t.threat}</span>
                    <span style={{color:"#445",fontSize:9}}>{t.exposure}</span>
                    <span style={{color:C.safe,fontSize:9}}>→ {t.mitigation}</span>
                    <Dot s={t.risk}/>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ══════════════ TAB 4 — ARSENAL ══════════════ */}
        {tab===4 && (
          <div style={{animation:"fadeUp 0.3s ease",display:"grid",gap:16}}>
            <Card title="Privacy & Anonymity Arsenal" icon="🔧" accent={C.safe}>
              <div style={{marginBottom:12,fontSize:10,color:"#445",lineHeight:1.7}}>
                Verified tools used by journalists, activists and security researchers worldwide. All open source or independently audited.
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:10}}>
                {TOOLS.map((t,i)=>{
                  const color=t.level==="Max"?C.danger:t.level==="Essential"?C.safe:C.info;
                  return (
                    <div key={i} className="tool-card" style={{
                      padding:"14px",background:C.card2,borderLeft:`3px solid ${color}`,
                      animation:`fadeUp 0.3s ease ${i*0.04}s both`,cursor:"pointer"
                    }} onClick={()=>window.open(t.link,"_blank")}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,alignItems:"center"}}>
                        <span style={{fontSize:14,marginRight:6}}>{t.icon}</span>
                        <span style={{flex:1,fontSize:11,color:"#dde",letterSpacing:1}}>{t.name}</span>
                        <span style={{fontSize:7,letterSpacing:2,padding:"2px 6px",color,border:`1px solid ${color}44`}}>
                          {t.level.toUpperCase()}
                        </span>
                      </div>
                      <div style={{fontSize:10,color:"#556",lineHeight:1.6}}>{t.desc}</div>
                      <div style={{fontSize:9,color:C.info,marginTop:6,opacity:0.5}}>{t.link} →</div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card title="Quick Hardening Checklist" icon="✅" accent={C.safe}>
              {[
                ["Install uBlock Origin (medium mode)",true],
                ["Use Firefox or Tor Browser",true],
                ["Enable DNS-over-HTTPS (1.1.1.1)",false],
                ["Disable WebRTC in browser",false],
                ["Use a no-log VPN (Mullvad/ProtonVPN)",false],
                ["Use Signal for all messages",false],
                ["Enable HTTPS-Only mode",false],
                ["Use strong unique passwords + 2FA",false],
                ["Enable MAC address randomization",false],
                ["Review app permissions monthly",false],
                ["Self-host your email/cloud",false],
                ["Use Bitwarden for password management",false],
              ].map(([item,done],i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,
                  padding:"8px 0",borderBottom:`1px solid ${C.border}`,
                  animation:`fadeUp 0.2s ease ${i*0.03}s both`}}>
                  <span style={{color:done?C.safe:"#334",fontSize:12,minWidth:16}}>{done?"✓":"○"}</span>
                  <span style={{fontSize:10,color:done?C.safe:"#667"}}>{item}</span>
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* Footer */}
        <div style={{textAlign:"center",fontSize:8,color:"#112",letterSpacing:4,marginTop:24,paddingBottom:8}}>
          SHIELD OS v4.0 — BUILT FOR THE PEOPLE — NOT FOR GOVERNMENTS ◈ STAY ANONYMOUS ◈ STAY FREE
        </div>
      </div>
    </div>
  );
}
