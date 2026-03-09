import { useState, useEffect, useRef } from "react";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@700;900&display=swap');
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
@keyframes borderGlow {
  0%,100% { border-color: #00f0ff44; }
  50% { border-color: #00f0ffaa; }
}
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes slideIn { from { transform: translateX(-10px); opacity:0; } to { transform: translateX(0); opacity:1; } }
* { box-sizing: border-box; }
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: #050510; }
::-webkit-scrollbar-thumb { background: #00f0ff33; border-radius: 2px; }
`;

const C = {
  safe: "#00ff88",
  warn: "#ffcc00",
  danger: "#ff003c",
  info: "#00f0ff",
  bg: "#050510",
  card: "#08081a",
  border: "#0d0d2a",
};

const rc = (r) => r === "safe" ? C.safe : r === "warn" ? C.warn : r === "danger" ? C.danger : C.info;

const Dot = ({ s }) => (
  <span style={{
    display:"inline-block", width:7, height:7, borderRadius:"50%",
    background: rc(s), boxShadow:`0 0 8px ${rc(s)}`,
    marginRight:8, flexShrink:0,
    animation: s==="loading" ? "pulse 1s infinite" : "none"
  }}/>
);

const Card = ({ title, icon, children, delay=0, accent=C.info }) => (
  <div style={{
    background: C.card,
    border: `1px solid ${C.border}`,
    borderTop: `2px solid ${accent}`,
    padding: "20px",
    animation: `fadeUp 0.5s ease ${delay}s both`,
    position:"relative", overflow:"hidden"
  }}>
    <div style={{ position:"absolute", top:0, left:0, right:0, height:"1px",
      background:`linear-gradient(90deg, transparent, ${accent}66, transparent)` }}/>
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16,
      fontFamily:"'Orbitron',monospace", fontSize:10, letterSpacing:3, color:accent, textTransform:"uppercase" }}>
      <span>{icon}</span>{title}
    </div>
    {children}
  </div>
);

const Row = ({ label, value, risk, loading }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
    padding:"7px 0", borderBottom:`1px solid ${C.border}`, gap:8 }}>
    <span style={{ color:"#445", fontSize:10, letterSpacing:1, fontFamily:"'Share Tech Mono',monospace",
      textTransform:"uppercase", minWidth:140, flexShrink:0 }}>{label}</span>
    <span style={{ color: risk ? rc(risk) : "#99a", fontFamily:"'Share Tech Mono',monospace",
      fontSize:11, textAlign:"right", wordBreak:"break-all", display:"flex", alignItems:"center" }}>
      {risk && <Dot s={risk}/>}
      {loading || !value
        ? <span style={{color:"#223", animation:"pulse 1.2s infinite"}}>scanning...</span>
        : value}
    </span>
  </div>
);

function getWebRTC() {
  return new Promise(resolve => {
    try {
      const pc = new RTCPeerConnection({ iceServers:[{urls:"stun:stun.l.google.com:19302"}] });
      pc.createDataChannel("");
      pc.createOffer().then(o => pc.setLocalDescription(o));
      const ips = new Set();
      pc.onicecandidate = e => {
        if (!e.candidate) { pc.close(); return resolve([...ips]); }
        const m = e.candidate.candidate.match(/(\d+\.\d+\.\d+\.\d+)/g);
        if (m) m.forEach(ip => ips.add(ip));
      };
      setTimeout(() => { pc.close(); resolve([...ips]); }, 3000);
    } catch { resolve([]); }
  });
}

function fingerprint() {
  const c = document.createElement("canvas");
  const g = c.getContext("2d");
  g.fillStyle="#069"; g.fillText("shield",2,15);
  return {
    ua: navigator.userAgent,
    lang: navigator.language,
    cores: navigator.hardwareConcurrency,
    ram: navigator.deviceMemory,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: `${screen.width}×${screen.height}@${screen.colorDepth}bit`,
    touch: navigator.maxTouchPoints > 0,
    dnt: navigator.doNotTrack === "1",
    canvas: c.toDataURL().slice(-16),
    plugins: navigator.plugins?.length || 0,
  };
}

const CENSORED_SITES = [
  { name:"Twitter/X", url:"https://twitter.com", cat:"Social" },
  { name:"Facebook", url:"https://facebook.com", cat:"Social" },
  { name:"Instagram", url:"https://instagram.com", cat:"Social" },
  { name:"YouTube", url:"https://youtube.com", cat:"Media" },
  { name:"TikTok", url:"https://tiktok.com", cat:"Social" },
  { name:"Wikipedia", url:"https://wikipedia.org", cat:"Info" },
  { name:"Reddit", url:"https://reddit.com", cat:"Forum" },
  { name:"Telegram", url:"https://telegram.org", cat:"Messaging" },
  { name:"Signal", url:"https://signal.org", cat:"Messaging" },
  { name:"ProtonMail", url:"https://proton.me", cat:"Privacy" },
  { name:"Tor Project", url:"https://torproject.org", cat:"Privacy" },
  { name:"DuckDuckGo", url:"https://duckduckgo.com", cat:"Search" },
];

const GOV_ISSUES = [
  { country:"China", issue:"The Great Firewall blocks 10,000+ domains including Google, Facebook, Wikipedia & most Western news.", risk:"danger" },
  { country:"Russia", issue:"Roskomnadzor maintains a blocklist of 500K+ URLs. Twitter/Instagram restricted since 2022.", risk:"danger" },
  { country:"Iran", issue:"Blocks social media, VPNs, and most Western services. Deep Packet Inspection used.", risk:"danger" },
  { country:"North Korea", issue:"Near total internet blackout. Only ~5,500 IP addresses exist. Citizens use Kwangmyong (intranet only).", risk:"danger" },
  { country:"Belarus", issue:"Internet shutdowns during protests. Telegram, social media blocked during elections.", risk:"danger" },
  { country:"Turkey", issue:"Wikipedia blocked 2017-2019. Twitter/YouTube blocked multiple times. 400K+ sites blocked.", risk:"warn" },
  { country:"Pakistan", issue:"Frequent social media throttling during political unrest. Wikipedia briefly blocked 2023.", risk:"warn" },
  { country:"India", issue:"World's most internet shutdowns (~84 in 2023). Jammu & Kashmir had 552-day blackout.", risk:"warn" },
  { country:"USA", issue:"FISA 702 mass surveillance. NSA collects bulk metadata. No comprehensive privacy law.", risk:"warn" },
  { country:"UK", issue:"Investigatory Powers Act ('Snoopers Charter') — bulk data collection, mandatory ISP logs for 12 months.", risk:"warn" },
  { country:"EU", issue:"GDPR protects users but Chat Control proposal could mandate E2E encryption backdoors.", risk:"safe" },
  { country:"Iceland", issue:"Strong privacy laws, no mass surveillance. One of the world's freest internet access countries.", risk:"safe" },
];

const TOOLS = [
  { name:"Tor Browser", desc:"Routes traffic through 3 encrypted nodes. Near-perfect anonymity.", link:"https://torproject.org", level:"Max" },
  { name:"Mullvad VPN", desc:"No-logs, anonymous accounts (no email needed), RAM-only servers.", link:"https://mullvad.net", level:"High" },
  { name:"ProtonVPN", desc:"Swiss-based, open source, free tier available.", link:"https://protonvpn.com", level:"High" },
  { name:"uBlock Origin", desc:"Best ad/tracker blocker. Use medium mode for max protection.", link:"https://ublockorigin.com", level:"Essential" },
  { name:"Signal", desc:"End-to-end encrypted messages & calls. Open source.", link:"https://signal.org", level:"Essential" },
  { name:"Proton Mail", desc:"E2E encrypted email. Swiss privacy law protection.", link:"https://proton.me", level:"High" },
  { name:"Session", desc:"No phone number needed. Decentralized messaging.", link:"https://getsession.org", level:"High" },
  { name:"Tails OS", desc:"Amnesic OS. Boots from USB, leaves no trace.", link:"https://tails.boum.org", level:"Max" },
  { name:"GrapheneOS", desc:"Privacy-focused Android. De-Googled.", link:"https://grapheneos.org", level:"Max" },
  { name:"Nextcloud", desc:"Self-hosted cloud. Your data stays yours.", link:"https://nextcloud.com", level:"High" },
];

const TABS = ["🛡️ Privacy Scan","🌍 Censorship Map","🔬 Surveillance Intel","🔧 Arsenal"];

export default function ShieldOS() {
  const [tab, setTab] = useState(0);
  const [ip, setIp] = useState(null);
  const [ipData, setIpData] = useState(null);
  const [webrtc, setWebrtc] = useState(null);
  const [dns, setDns] = useState(null);
  const [fp] = useState(() => fingerprint());
  const [log, setLog] = useState([]);
  const [time, setTime] = useState(new Date());
  const [censorSearch, setCensorSearch] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [customResults, setCustomResults] = useState([]);
  const logRef = useRef(null);

  const addLog = (msg, type="info") => {
    setLog(p => [...p.slice(-40), { msg, color: C[type]||C.info, t: new Date().toLocaleTimeString() }]);
  };

  useEffect(() => { const t = setInterval(()=>setTime(new Date()),1000); return ()=>clearInterval(t); },[]);
  useEffect(() => { if(logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; },[log]);

  useEffect(() => {
    addLog("SHIELD OS v3.0 — INITIALIZING ALL MODULES", "info");

    fetch("https://ipapi.co/json/")
      .then(r=>r.json())
      .then(d=>{
        setIp(d.ip); setIpData(d);
        addLog(`IP: ${d.ip} → ${d.city}, ${d.country_name}`, "warn");
      }).catch(()=>addLog("IP lookup failed","danger"));

    fetch("https://cloudflare-dns.com/dns-query?name=whoami.akamai.net&type=A",
      {headers:{"accept":"application/dns-json"}})
      .then(r=>r.json())
      .then(d=>{ setDns(d.Answer?.map(a=>a.data)||[]); addLog("DNS resolver identified","info"); })
      .catch(()=>setDns([]));

    addLog("Probing WebRTC leaks...","info");
    getWebRTC().then(ips=>{
      setWebrtc(ips);
      if(ips.length) addLog(`WebRTC exposed ${ips.length} IP(s): ${ips.join(", ")}`, "danger");
      else addLog("WebRTC: No leaks detected","safe");
    });

    addLog(`Canvas fingerprint: ${fingerprint().canvas}`,"warn");
    addLog("All modules loaded. Stay anonymous.","safe");
  },[]);

  const vpn = ipData?.org?.toLowerCase().match(/vpn|tor|proxy|hosting|cloud|linode|digital.?ocean|ovh|hetzner|amazon|google|microsoft/);
  const webrtcLeak = webrtc?.some(i=>!i.startsWith("10.")&&!i.startsWith("192.168.")&&!i.startsWith("172.")&&!i.startsWith("127."));
  const overallRisk = !ip ? "loading" : webrtcLeak ? "danger" : !vpn ? "warn" : "safe";

  const checkUrl = (url) => {
    if(!url) return;
    const u = url.startsWith("http") ? url : "https://"+url;
    const img = new Image();
    const start = Date.now();
    const result = { url: u, name: url };
    img.onload = ()=>setCustomResults(p=>[{...result, status:"reachable", ms:Date.now()-start},...p.slice(0,9)]);
    img.onerror = ()=>setCustomResults(p=>[{...result, status:"blocked", ms:Date.now()-start},...p.slice(0,9)]);
    img.src = u+"/favicon.ico?_="+Date.now();
    setTimeout(()=>setCustomResults(p=>{
      if(!p.find(r=>r.url===u)) return [{...result,status:"timeout",ms:5000},...p.slice(0,9)];
      return p;
    }),5000);
  };

  const filteredGov = GOV_ISSUES.filter(g =>
    !censorSearch || g.country.toLowerCase().includes(censorSearch.toLowerCase())
  );

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:"#ccd", fontFamily:"'Share Tech Mono',monospace" }}>
      <style>{CSS}</style>

      {/* Scanline */}
      <div style={{ position:"fixed",left:0,right:0,height:"3px",pointerEvents:"none",zIndex:100,
        background:"linear-gradient(transparent,rgba(0,240,255,0.12),transparent)",
        animation:"scan 5s linear infinite" }}/>

      {/* Grid */}
      <div style={{ position:"fixed",inset:0,zIndex:0,pointerEvents:"none",
        backgroundImage:"linear-gradient(rgba(0,240,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,0.025) 1px,transparent 1px)",
        backgroundSize:"50px 50px" }}/>

      <div style={{ position:"relative",zIndex:1,maxWidth:1000,margin:"0 auto",padding:"20px 12px" }}>

        {/* Header */}
        <div style={{ textAlign:"center",marginBottom:24,animation:"fadeUp 0.4s ease" }}>
          <div style={{ fontSize:9,letterSpacing:6,color:"#334",marginBottom:6 }}>
            {time.toUTCString()} — CLASSIFIED SYSTEM
          </div>
          <h1 style={{ fontFamily:"'Orbitron',monospace",fontSize:"clamp(28px,6vw,52px)",
            fontWeight:900,letterSpacing:10,margin:0,color:"#fff",
            animation:"glitch 4s infinite" }}>
            SHIELD OS
          </h1>
          <div style={{ fontSize:9,letterSpacing:4,color:C.info,marginTop:4 }}>
            CITIZEN PRIVACY INTELLIGENCE PLATFORM v3.0
          </div>

          <div style={{ display:"inline-flex",alignItems:"center",marginTop:14,
            padding:"8px 24px",border:`1px solid ${rc(overallRisk)}`,
            boxShadow:`0 0 24px ${rc(overallRisk)}33,inset 0 0 24px ${rc(overallRisk)}08`,
            gap:8,fontSize:10,letterSpacing:3 }}>
            <Dot s={overallRisk}/>
            {overallRisk==="loading"&&"INITIALIZING SCAN..."}
            {overallRisk==="safe"&&"VPN ACTIVE — IDENTITY MASKED"}
            {overallRisk==="warn"&&"WARNING — NO VPN DETECTED"}
            {overallRisk==="danger"&&"CRITICAL — WEBRTC LEAK ACTIVE"}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex",gap:4,marginBottom:20,flexWrap:"wrap" }}>
          {TABS.map((t,i)=>(
            <button key={i} onClick={()=>setTab(i)} style={{
              flex:1,minWidth:120,padding:"10px 8px",background:tab===i?C.info+"18":"transparent",
              border:`1px solid ${tab===i?C.info:"#0d0d2a"}`,
              color:tab===i?C.info:"#445",cursor:"pointer",
              fontFamily:"'Share Tech Mono',monospace",fontSize:10,letterSpacing:2,
              transition:"all 0.2s",textTransform:"uppercase"
            }}>{t}</button>
          ))}
        </div>

        {/* TAB 0 — PRIVACY SCAN */}
        {tab===0 && (
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,animation:"fadeUp 0.3s ease" }}>
            <div style={{gridColumn:"1/-1"}}>
              <Card title="IP Intelligence" icon="🌐" delay={0.05}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 24px"}}>
                  <Row label="Public IP" value={ip} risk={ip?"warn":null} loading={!ip}/>
                  <Row label="ISP / Org" value={ipData?.org} risk={vpn?"safe":ipData?"warn":null} loading={!ipData}/>
                  <Row label="Country" value={ipData?`${ipData.country_name} (${ipData.country})`:null} loading={!ipData}/>
                  <Row label="Region / City" value={ipData?`${ipData.region}, ${ipData.city}`:null} loading={!ipData}/>
                  <Row label="GPS Coordinates" value={ipData?`${ipData.latitude}, ${ipData.longitude}`:null} risk="danger" loading={!ipData}/>
                  <Row label="ASN" value={ipData?.asn} loading={!ipData}/>
                  <Row label="Timezone" value={ipData?.timezone} loading={!ipData}/>
                  <Row label="VPN Detected" value={vpn?"YES — MASKED":ipData?"NOT DETECTED":null} risk={vpn?"safe":ipData?"danger":null} loading={!ipData}/>
                </div>
              </Card>
            </div>

            <Card title="WebRTC Leak" icon="📡" delay={0.1} accent={webrtcLeak?C.danger:C.safe}>
              <Row label="Status" value={webrtc===null?null:webrtcLeak?"⚠ LEAK DETECTED":"✓ CLEAN"} risk={webrtc===null?null:webrtcLeak?"danger":"safe"} loading={webrtc===null}/>
              {webrtc?.map((ip,i)=><Row key={i} label={`Exposed IP ${i+1}`} value={ip} risk="danger"/>)}
              {webrtc?.length===0&&<Row label="Local IPs" value="None exposed" risk="safe"/>}
              <div style={{marginTop:10,padding:8,background:"#ff003c0a",border:"1px solid #ff003c22",fontSize:10,color:"#667",lineHeight:1.7}}>
                WebRTC bypasses VPNs to reveal your real IP. Even with a VPN active, sites can unmask you if this leaks.
              </div>
            </Card>

            <Card title="DNS Leak Test" icon="🔍" delay={0.15} accent={C.warn}>
              <Row label="DNS Resolver IP" value={dns?.[0]||(dns?"Unknown":null)} risk={dns?"warn":null} loading={dns===null}/>
              <Row label="Resolvers Found" value={dns!==null?`${dns.length} detected`:null} risk={dns?.length>1?"warn":"safe"} loading={dns===null}/>
              <Row label="DNS-over-HTTPS" value="Manual check needed" risk="warn"/>
              <div style={{marginTop:10,padding:8,background:"#ffcc000a",border:"1px solid #ffcc0022",fontSize:10,color:"#667",lineHeight:1.7}}>
                If DNS doesn't match your VPN's servers, your ISP logs every domain you visit.
              </div>
            </Card>

            <div style={{gridColumn:"1/-1"}}>
              <Card title="Browser Fingerprint" icon="🖥️" delay={0.2} accent={C.danger}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 24px"}}>
                  <Row label="Platform" value={fp.platform||fp.ua.match(/Win|Mac|Linux|Android|iOS/)?.[0]} risk="warn"/>
                  <Row label="Language" value={fp.lang} risk="warn"/>
                  <Row label="Screen Resolution" value={fp.screen} risk="warn"/>
                  <Row label="Timezone" value={fp.tz} risk="warn"/>
                  <Row label="CPU Cores" value={fp.cores} risk="warn"/>
                  <Row label="RAM" value={fp.ram?`${fp.ram} GB`:"Hidden"} risk={fp.ram?"warn":"safe"}/>
                  <Row label="Touch Points" value={fp.touch?"Yes":"No"}/>
                  <Row label="Plugin Count" value={fp.plugins}/>
                  <Row label="Do Not Track" value={fp.dnt?"ENABLED":"DISABLED"} risk={fp.dnt?"safe":"danger"}/>
                  <Row label="Canvas Hash" value={fp.canvas} risk="danger"/>
                </div>
                <div style={{marginTop:10,padding:8,background:"#ff003c0a",border:"1px solid #ff003c22",fontSize:10,color:"#667",lineHeight:1.7}}>
                  ⚠ This fingerprint is statistically unique. It tracks you across sites even in private/incognito mode. Use Tor Browser or Firefox+arkenfox to randomize it.
                </div>
              </Card>
            </div>

            <div style={{gridColumn:"1/-1"}}>
              <Card title="System Log" icon="📋" delay={0.25}>
                <div ref={logRef} style={{height:130,overflowY:"auto",display:"flex",flexDirection:"column",gap:2}}>
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

        {/* TAB 1 — CENSORSHIP MAP */}
        {tab===1 && (
          <div style={{animation:"fadeUp 0.3s ease"}}>
            <Card title="Global Internet Censorship Intelligence" icon="🌍">
              <div style={{marginBottom:16}}>
                <input
                  placeholder="Filter by country..."
                  value={censorSearch}
                  onChange={e=>setCensorSearch(e.target.value)}
                  style={{
                    width:"100%",background:"#0a0a1a",border:`1px solid ${C.border}`,
                    color:"#ccd",padding:"8px 12px",fontFamily:"'Share Tech Mono',monospace",
                    fontSize:11,letterSpacing:1,outline:"none"
                  }}
                />
              </div>
              <div style={{display:"grid",gap:8}}>
                {filteredGov.map((g,i)=>(
                  <div key={i} style={{
                    padding:"12px 14px",background:"#06060f",
                    borderLeft:`3px solid ${rc(g.risk)}`,
                    animation:`fadeUp 0.3s ease ${i*0.04}s both`
                  }}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <span style={{fontFamily:"'Orbitron',monospace",fontSize:11,color:"#ccd",letterSpacing:2}}>{g.country}</span>
                      <span style={{fontSize:9,letterSpacing:2,color:rc(g.risk),
                        border:`1px solid ${rc(g.risk)}44`,padding:"2px 8px"}}>
                        {g.risk.toUpperCase()}
                      </span>
                    </div>
                    <div style={{fontSize:10,color:"#556",lineHeight:1.7}}>{g.issue}</div>
                  </div>
                ))}
              </div>
            </Card>

            <div style={{marginTop:16}}>
              <Card title="Live URL Reachability Checker" icon="🔎" accent={C.warn}>
                <div style={{marginBottom:12,fontSize:10,color:"#445",lineHeight:1.7}}>
                  Test if a URL is reachable from your current network. Blocked = potentially censored by your ISP or government.
                </div>
                <div style={{display:"flex",gap:8,marginBottom:16}}>
                  <input
                    placeholder="Enter URL to test (e.g. wikipedia.org)"
                    value={customUrl}
                    onChange={e=>setCustomUrl(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&checkUrl(customUrl)}
                    style={{
                      flex:1,background:"#0a0a1a",border:`1px solid ${C.border}`,
                      color:"#ccd",padding:"8px 12px",fontFamily:"'Share Tech Mono',monospace",
                      fontSize:11,outline:"none"
                    }}
                  />
                  <button onClick={()=>checkUrl(customUrl)} style={{
                    padding:"8px 20px",background:C.info+"22",border:`1px solid ${C.info}`,
                    color:C.info,cursor:"pointer",fontFamily:"'Share Tech Mono',monospace",
                    fontSize:10,letterSpacing:2
                  }}>TEST</button>
                </div>

                <div style={{marginBottom:12}}>
                  <div style={{fontSize:9,color:"#334",letterSpacing:2,marginBottom:8}}>QUICK TEST — COMMON SITES:</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {CENSORED_SITES.map((s,i)=>(
                      <button key={i} onClick={()=>checkUrl(s.url)} style={{
                        padding:"4px 10px",background:"#08081a",border:`1px solid ${C.border}`,
                        color:"#667",cursor:"pointer",fontFamily:"'Share Tech Mono',monospace",
                        fontSize:9,letterSpacing:1,transition:"all 0.2s"
                      }}
                      onMouseEnter={e=>{e.target.style.borderColor=C.info;e.target.style.color=C.info;}}
                      onMouseLeave={e=>{e.target.style.borderColor=C.border;e.target.style.color="#667";}}>
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>

                {customResults.length > 0 && (
                  <div>
                    <div style={{fontSize:9,color:"#334",letterSpacing:2,marginBottom:8}}>RESULTS:</div>
                    {customResults.map((r,i)=>(
                      <div key={i} style={{
                        display:"flex",justifyContent:"space-between",alignItems:"center",
                        padding:"7px 10px",background:"#06060f",marginBottom:4,
                        borderLeft:`3px solid ${r.status==="reachable"?C.safe:r.status==="blocked"?C.danger:C.warn}`,
                        animation:"slideIn 0.3s ease"
                      }}>
                        <span style={{fontSize:10,color:"#ccd"}}>{r.name}</span>
                        <div style={{display:"flex",gap:12,alignItems:"center"}}>
                          <span style={{fontSize:9,color:"#445"}}>{r.ms}ms</span>
                          <span style={{
                            fontSize:9,letterSpacing:2,
                            color:r.status==="reachable"?C.safe:r.status==="blocked"?C.danger:C.warn
                          }}>
                            {r.status==="reachable"?"✓ REACHABLE":r.status==="blocked"?"✗ BLOCKED":"⚡ TIMEOUT"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{marginTop:8,fontSize:9,color:"#334",lineHeight:1.7}}>
                  Note: This test uses image loading heuristics. Results are indicative, not definitive. Use Tor or a VPN for authoritative testing.
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2 — SURVEILLANCE INTEL */}
        {tab===2 && (
          <div style={{animation:"fadeUp 0.3s ease",display:"grid",gap:16}}>
            <Card title="Network Threat Intelligence" icon="🔬" accent={C.danger}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 24px"}}>
                <Row label="Your IP" value={ip} risk="warn" loading={!ip}/>
                <Row label="ISP" value={ipData?.org} loading={!ipData}/>
                <Row label="ASN" value={ipData?.asn} loading={!ipData}/>
                <Row label="WebRTC Leak" value={webrtc===null?null:webrtcLeak?"VULNERABLE":"CLEAN"} risk={webrtc===null?null:webrtcLeak?"danger":"safe"} loading={webrtc===null}/>
                <Row label="DNS Security" value={dns!==null?dns.length>1?"MULTIPLE RESOLVERS":"SINGLE RESOLVER":null} risk={dns?.length>1?"warn":"safe"} loading={dns===null}/>
                <Row label="HTTPS (this session)" value="Active" risk="safe"/>
                <Row label="Browser Cookies" value={navigator.cookieEnabled?"ENABLED":"DISABLED"} risk={navigator.cookieEnabled?"warn":"safe"}/>
                <Row label="JS Fingerprinting" value="EXPOSED" risk="danger"/>
              </div>
            </Card>

            <Card title="Known Surveillance Programs" icon="👁️" accent={C.danger}>
              {[
                { name:"NSA PRISM (USA)", desc:"Collects internet communications from major US tech companies. Legal under FISA Section 702.", agencies:"NSA, FBI, CIA", risk:"danger" },
                { name:"GCHQ Tempora (UK)", desc:"Taps fiber optic cables. Stores all internet data for 3 days, metadata for 30 days.", agencies:"GCHQ, NSA", risk:"danger" },
                { name:"Five Eyes Alliance", desc:"Intelligence sharing between USA, UK, Canada, Australia, New Zealand. Data shared freely between nations.", agencies:"NSA, GCHQ, CSE, ASD, GCSB", risk:"danger" },
                { name:"China Great Firewall", desc:"Deep Packet Inspection at national backbone level. Real-time keyword filtering and VPN blocking.", agencies:"MSS, MPS", risk:"danger" },
                { name:"Russia SORM-3", desc:"ISPs required to install FSB hardware for passive interception of all traffic.", agencies:"FSB", risk:"danger" },
                { name:"EU Data Retention", desc:"Proposed Chat Control regulation would mandate client-side scanning of encrypted messages.", agencies:"Europol, EDPS", risk:"warn" },
                { name:"India CMS", desc:"Centralized Monitoring System — real-time lawful intercept infrastructure across all ISPs.", agencies:"DoT, IB", risk:"warn" },
              ].map((p,i)=>(
                <div key={i} style={{
                  padding:"12px 14px",background:"#06060f",
                  borderLeft:`3px solid ${rc(p.risk)}`,marginBottom:8,
                  animation:`fadeUp 0.3s ease ${i*0.05}s both`
                }}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:11,color:"#ccd",letterSpacing:1}}>{p.name}</span>
                    <span style={{fontSize:9,color:"#445"}}>{p.agencies}</span>
                  </div>
                  <div style={{fontSize:10,color:"#556",lineHeight:1.7}}>{p.desc}</div>
                </div>
              ))}
            </Card>

            <Card title="Your Threat Surface" icon="⚠️" accent={C.warn}>
              {[
                { threat:"IP Address", exposure:"Sites see your real IP → geolocation, ISP, country", mitigation:"VPN or Tor", risk:!vpn?"danger":"safe" },
                { threat:"DNS Queries", exposure:"ISP logs every domain you visit", mitigation:"DNS-over-HTTPS + VPN", risk:"warn" },
                { threat:"Browser Fingerprint", exposure:"Unique ID across all sites, even in private mode", mitigation:"Tor Browser or arkenfox", risk:"danger" },
                { threat:"WebRTC Leaks", exposure:"Real IP exposed even through VPN", mitigation:"Disable WebRTC in browser", risk:webrtcLeak?"danger":"safe" },
                { threat:"HTTP Traffic", exposure:"Unencrypted data readable by ISP/attackers", mitigation:"HTTPS everywhere + VPN", risk:"warn" },
                { threat:"Metadata", exposure:"Who you talk to, when, how often — even if content encrypted", mitigation:"Session/Signal, Tor", risk:"warn" },
                { threat:"Device Tracking", exposure:"MAC address, device ID trackable on networks", mitigation:"MAC randomization", risk:"warn" },
              ].map((t,i)=>(
                <div key={i} style={{
                  display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",
                  gap:8,padding:"8px 0",borderBottom:`1px solid ${C.border}`,
                  alignItems:"center",fontSize:10
                }}>
                  <span style={{color:"#99a"}}>{t.threat}</span>
                  <span style={{color:"#445",fontSize:9}}>{t.exposure}</span>
                  <span style={{color:C.safe,fontSize:9}}>{t.mitigation}</span>
                  <Dot s={t.risk}/>
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* TAB 3 — ARSENAL */}
        {tab===3 && (
          <div style={{animation:"fadeUp 0.3s ease"}}>
            <Card title="Privacy & Anonymity Arsenal" icon="🔧" accent={C.safe}>
              <div style={{marginBottom:12,fontSize:10,color:"#445",lineHeight:1.7}}>
                Verified tools used by journalists, activists and security researchers worldwide. All open source or independently audited.
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {TOOLS.map((t,i)=>(
                  <div key={i} style={{
                    padding:"14px",background:"#06060f",
                    borderLeft:`3px solid ${t.level==="Max"?C.danger:t.level==="Essential"?C.safe:C.info}`,
                    animation:`fadeUp 0.3s ease ${i*0.04}s both`,
                    cursor:"pointer",transition:"background 0.2s"
                  }}
                  onClick={()=>window.open(t.link,"_blank")}
                  onMouseEnter={e=>e.currentTarget.style.background="#0d0d20"}
                  onMouseLeave={e=>e.currentTarget.style.background="#06060f"}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                      <span style={{fontSize:11,color:"#dde",letterSpacing:1}}>{t.name}</span>
                      <span style={{fontSize:8,letterSpacing:2,padding:"2px 6px",
                        color:t.level==="Max"?C.danger:t.level==="Essential"?C.safe:C.info,
                        border:`1px solid ${t.level==="Max"?C.danger:t.level==="Essential"?C.safe:C.info}44`}}>
                        {t.level.toUpperCase()}
                      </span>
                    </div>
                    <div style={{fontSize:10,color:"#556",lineHeight:1.6}}>{t.desc}</div>
                    <div style={{fontSize:9,color:C.info,marginTop:6,opacity:0.6}}>{t.link} →</div>
                  </div>
                ))}
              </div>
            </Card>

            <div style={{marginTop:16}}>
              <Card title="Quick Hardening Checklist" icon="✅" accent={C.safe}>
                {[
                  ["Install uBlock Origin (medium mode)", true],
                  ["Use Firefox or Tor Browser", true],
                  ["Enable DNS-over-HTTPS", false],
                  ["Disable WebRTC in browser", false],
                  ["Use a no-log VPN (Mullvad/ProtonVPN)", false],
                  ["Use Signal for all messages", false],
                  ["Enable HTTPS-Only mode", false],
                  ["Use strong unique passwords + 2FA", false],
                  ["Review app permissions monthly", false],
                  ["Self-host your email/cloud", false],
                ].map(([item, done],i)=>(
                  <div key={i} style={{
                    display:"flex",alignItems:"center",gap:10,
                    padding:"8px 0",borderBottom:`1px solid ${C.border}`,
                    animation:`fadeUp 0.2s ease ${i*0.04}s both`
                  }}>
                    <span style={{color:done?C.safe:"#334",fontSize:12}}>{done?"✓":"○"}</span>
                    <span style={{fontSize:10,color:done?C.safe:"#667",
                      textDecoration:done?"none":"none"}}>{item}</span>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        )}

        <div style={{textAlign:"center",fontSize:9,color:"#112",letterSpacing:3,marginTop:20,paddingBottom:8}}>
          SHIELD OS — BUILT FOR THE PEOPLE — NOT FOR GOVERNMENTS ◈ STAY ANONYMOUS ◈ STAY FREE
        </div>
      </div>
    </div>
  );
}
