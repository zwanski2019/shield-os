import { useState, useEffect, useRef } from "react";

const glitch = `
@keyframes glitch {
  0% { text-shadow: 2px 0 #ff003c, -2px 0 #00f0ff; }
  20% { text-shadow: -2px 0 #ff003c, 2px 0 #00f0ff; }
  40% { text-shadow: 2px 2px #ff003c, -2px -2px #00f0ff; }
  60% { text-shadow: -2px 2px #ff003c, 2px -2px #00f0ff; }
  80% { text-shadow: 2px -2px #ff003c, -2px 2px #00f0ff; }
  100% { text-shadow: 2px 0 #ff003c, -2px 0 #00f0ff; }
}
@keyframes scan {
  0% { top: -10%; }
  100% { top: 110%; }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;

const getRiskColor = (risk) => {
  if (risk === "safe") return "#00ff88";
  if (risk === "warn") return "#ffcc00";
  if (risk === "danger") return "#ff003c";
  return "#888";
};

const StatusDot = ({ status }) => (
  <span style={{
    display: "inline-block",
    width: 8, height: 8,
    borderRadius: "50%",
    background: getRiskColor(status),
    boxShadow: `0 0 6px ${getRiskColor(status)}`,
    marginRight: 8,
    animation: status === "loading" ? "pulse 1s infinite" : "none"
  }} />
);

const Section = ({ title, children, delay = 0 }) => (
  <div style={{
    border: "1px solid #1a1a2e",
    borderLeft: "3px solid #00f0ff",
    padding: "16px",
    marginBottom: "16px",
    background: "rgba(0,240,255,0.02)",
    animation: `fadeIn 0.5s ease ${delay}s both`,
    position: "relative",
    overflow: "hidden"
  }}>
    <div style={{
      fontSize: 10,
      letterSpacing: 4,
      color: "#00f0ff",
      marginBottom: 12,
      textTransform: "uppercase",
      fontFamily: "monospace"
    }}>▸ {title}</div>
    {children}
  </div>
);

const Row = ({ label, value, risk, mono = true }) => (
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 0",
    borderBottom: "1px solid #0a0a1a",
    gap: 12
  }}>
    <span style={{ color: "#556", fontSize: 11, letterSpacing: 1, fontFamily: "monospace", textTransform: "uppercase", minWidth: 160 }}>{label}</span>
    <span style={{
      color: risk ? getRiskColor(risk) : "#ccd",
      fontFamily: mono ? "monospace" : "inherit",
      fontSize: 12,
      textAlign: "right",
      wordBreak: "break-all"
    }}>
      {risk && <StatusDot status={risk} />}
      {value || <span style={{ color: "#333", animation: "pulse 1s infinite" }}>scanning...</span>}
    </span>
  </div>
);

function getWebRTCIP() {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      pc.createDataChannel("");
      pc.createOffer().then(o => pc.setLocalDescription(o));
      const ips = new Set();
      pc.onicecandidate = (e) => {
        if (!e.candidate) {
          pc.close();
          resolve([...ips]);
          return;
        }
        const m = e.candidate.candidate.match(/(\d+\.\d+\.\d+\.\d+)/g);
        if (m) m.forEach(ip => ips.add(ip));
      };
      setTimeout(() => { pc.close(); resolve([...ips]); }, 3000);
    } catch {
      resolve([]);
    }
  });
}

function getBrowserFingerprint() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.textBaseline = "top";
  ctx.font = "14px 'Arial'";
  ctx.fillStyle = "#f60";
  ctx.fillRect(125, 1, 62, 20);
  ctx.fillStyle = "#069";
  ctx.fillText("BrowserLeaks,com <canvas> 1.0", 2, 15);
  ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
  ctx.fillText("BrowserLeaks,com <canvas> 1.0", 4, 17);
  const hash = canvas.toDataURL().slice(-20);

  const plugins = [...(navigator.plugins || [])].map(p => p.name).join(",");
  const fonts = ["Arial", "Times New Roman", "Courier New", "Verdana", "Comic Sans MS"];

  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: navigator.languages?.join(", "),
    platform: navigator.platform,
    cores: navigator.hardwareConcurrency,
    memory: navigator.deviceMemory,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: `${screen.width}x${screen.height}x${screen.colorDepth}bit`,
    touch: navigator.maxTouchPoints > 0,
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack === "1" ? "Enabled" : "Disabled",
    plugins: plugins || "None detected",
    canvasHash: hash,
  };
}

export default function PrivacyDashboard() {
  const [ip, setIp] = useState(null);
  const [ipData, setIpData] = useState(null);
  const [webrtcIPs, setWebrtcIPs] = useState(null);
  const [fp, setFp] = useState(null);
  const [dnsData, setDnsData] = useState(null);
  const [time, setTime] = useState(new Date());
  const [log, setLog] = useState([]);
  const logRef = useRef(null);

  const addLog = (msg, type = "info") => {
    const colors = { info: "#00f0ff", warn: "#ffcc00", danger: "#ff003c", ok: "#00ff88" };
    setLog(prev => [...prev.slice(-30), { msg, color: colors[type], time: new Date().toLocaleTimeString() }]);
  };

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  useEffect(() => {
    addLog("SHIELD OS v2.4 INITIALIZING...", "info");
    addLog("Starting privacy scan modules...", "info");

    // IP Info
    fetch("https://ipapi.co/json/")
      .then(r => r.json())
      .then(data => {
        setIp(data.ip);
        setIpData(data);
        addLog(`IP resolved: ${data.ip} (${data.country_name})`, "ok");
        if (data.org?.toLowerCase().includes("tor") || data.org?.toLowerCase().includes("vpn")) {
          addLog("VPN/Tor detected in org name", "warn");
        }
      })
      .catch(() => addLog("IP API unreachable", "danger"));

    // DNS Check
    fetch("https://cloudflare-dns.com/dns-query?name=whoami.akamai.net&type=A", {
      headers: { "accept": "application/dns-json" }
    })
      .then(r => r.json())
      .then(data => {
        const answers = data.Answer?.map(a => a.data) || [];
        setDnsData(answers);
        addLog(`DNS resolver: ${answers[0] || "unknown"}`, answers.length > 0 ? "ok" : "warn");
      })
      .catch(() => {
        setDnsData([]);
        addLog("DNS check failed", "warn");
      });

    // WebRTC
    addLog("Probing WebRTC for IP leaks...", "info");
    getWebRTCIP().then(ips => {
      setWebrtcIPs(ips);
      if (ips.length > 0) addLog(`WebRTC exposed IPs: ${ips.join(", ")}`, ips.some(ip => !ip.startsWith("10.") && !ip.startsWith("192.168.") && !ip.startsWith("172.")) ? "danger" : "warn");
      else addLog("No WebRTC leaks detected", "ok");
    });

    // Fingerprint
    const fpData = getBrowserFingerprint();
    setFp(fpData);
    addLog(`Browser fingerprint collected (${fpData.canvasHash})`, "warn");
    addLog(`DNT header: ${fpData.doNotTrack}`, fpData.doNotTrack === "Enabled" ? "ok" : "warn");

  }, []);

  const vpnLikely = ipData?.org?.toLowerCase().match(/vpn|tor|proxy|hosting|cloud|linode|digital.?ocean|ovh|hetzner|amazon|google|microsoft/);
  const webrtcLeak = webrtcIPs?.some(i => !i.startsWith("10.") && !i.startsWith("192.168.") && !i.startsWith("172.") && !i.startsWith("127."));
  const overallRisk = !ip ? "loading" : webrtcLeak ? "danger" : !vpnLikely ? "warn" : "safe";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050510",
      color: "#ccd",
      fontFamily: "monospace",
      padding: "0",
      position: "relative",
      overflow: "hidden"
    }}>
      <style>{glitch}</style>

      {/* Scanline */}
      <div style={{
        position: "fixed", left: 0, right: 0, height: "2px",
        background: "linear-gradient(transparent, rgba(0,240,255,0.15), transparent)",
        animation: "scan 4s linear infinite",
        pointerEvents: "none", zIndex: 0
      }} />

      {/* Grid bg */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: "linear-gradient(rgba(0,240,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.03) 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 860, margin: "0 auto", padding: "24px 16px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 10, letterSpacing: 6, color: "#556", marginBottom: 8 }}>
            {time.toUTCString()}
          </div>
          <h1 style={{
            fontSize: "clamp(24px, 5vw, 48px)",
            fontWeight: 900,
            letterSpacing: 8,
            margin: 0,
            animation: "glitch 3s infinite",
            color: "#fff"
          }}>
            SHIELD OS
          </h1>
          <div style={{ fontSize: 10, letterSpacing: 4, color: "#00f0ff", marginTop: 4 }}>
            PRIVACY & ANONYMITY DASHBOARD
          </div>

          {/* Overall risk */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            marginTop: 16,
            padding: "8px 20px",
            border: `1px solid ${getRiskColor(overallRisk)}`,
            boxShadow: `0 0 20px ${getRiskColor(overallRisk)}33`,
            gap: 8,
            fontSize: 11,
            letterSpacing: 3
          }}>
            <StatusDot status={overallRisk} />
            {overallRisk === "loading" && "SCANNING..."}
            {overallRisk === "safe" && "VPN ACTIVE — PROTECTED"}
            {overallRisk === "warn" && "NO VPN DETECTED — EXPOSED"}
            {overallRisk === "danger" && "CRITICAL — WEBRTC LEAK DETECTED"}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* IP Info */}
          <div style={{ gridColumn: "1 / -1" }}>
            <Section title="IP Intelligence" delay={0.1}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
                <Row label="Public IP" value={ip} risk={ip ? "warn" : null} />
                <Row label="ISP / Org" value={ipData?.org} risk={vpnLikely ? "safe" : ipData ? "warn" : null} />
                <Row label="Country" value={ipData ? `${ipData.country_name} (${ipData.country})` : null} />
                <Row label="Region / City" value={ipData ? `${ipData.region}, ${ipData.city}` : null} />
                <Row label="ASN" value={ipData?.asn} />
                <Row label="Coordinates" value={ipData ? `${ipData.latitude}, ${ipData.longitude}` : null} risk="danger" />
                <Row label="Timezone" value={ipData?.timezone} />
                <Row label="VPN/Proxy Likely" value={vpnLikely ? "YES — PROTECTED" : ipData ? "NOT DETECTED" : null} risk={vpnLikely ? "safe" : ipData ? "warn" : null} />
              </div>
            </Section>
          </div>

          {/* WebRTC */}
          <Section title="WebRTC Leak Test" delay={0.2}>
            <Row label="Status" value={webrtcIPs === null ? null : webrtcLeak ? "LEAK DETECTED" : "CLEAN"} risk={webrtcIPs === null ? null : webrtcLeak ? "danger" : "safe"} />
            {webrtcIPs?.map((ip, i) => (
              <Row key={i} label={`Exposed IP ${i + 1}`} value={ip} risk="danger" />
            ))}
            {webrtcIPs?.length === 0 && <Row label="Local IPs" value="None exposed" risk="safe" />}
            <div style={{ fontSize: 10, color: "#445", marginTop: 8, lineHeight: 1.5 }}>
              WebRTC can bypass VPNs and expose your real IP to websites. A VPN that doesn't block WebRTC leaks is broken.
            </div>
          </Section>

          {/* DNS */}
          <Section title="DNS Leak Test" delay={0.3}>
            <Row label="DNS Resolver" value={dnsData?.[0] || (dnsData ? "Unknown" : null)} risk={dnsData !== null ? "warn" : null} />
            <Row label="Total DNS IPs" value={dnsData !== null ? `${dnsData.length} resolver(s) detected` : null} risk={dnsData?.length > 2 ? "danger" : dnsData ? "warn" : null} />
            <Row label="DNS-over-HTTPS" value="Check browser settings" risk="warn" />
            <div style={{ fontSize: 10, color: "#445", marginTop: 8, lineHeight: 1.5 }}>
              If your DNS resolver IP differs from your VPN's, your ISP can see what sites you visit.
            </div>
          </Section>

          {/* Browser Fingerprint */}
          <div style={{ gridColumn: "1 / -1" }}>
            <Section title="Browser Fingerprint" delay={0.4}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
                <Row label="Platform" value={fp?.platform} risk="warn" />
                <Row label="Language" value={fp?.language} risk="warn" />
                <Row label="Screen" value={fp?.screen} risk="warn" />
                <Row label="Timezone" value={fp?.timezone} risk="warn" />
                <Row label="CPU Cores" value={fp?.cores} risk="warn" />
                <Row label="RAM" value={fp?.memory ? `${fp.memory} GB` : "Hidden"} risk={fp?.memory ? "warn" : "safe"} />
                <Row label="Touch Support" value={fp ? (fp.touch ? "Yes" : "No") : null} />
                <Row label="Do Not Track" value={fp?.doNotTrack} risk={fp?.doNotTrack === "Enabled" ? "safe" : "warn"} />
                <Row label="Cookies" value={fp?.cookiesEnabled ? "Enabled" : "Disabled"} risk={fp?.cookiesEnabled ? "warn" : "safe"} />
                <Row label="Canvas Hash" value={fp?.canvasHash} risk="danger" />
              </div>
              <div style={{ fontSize: 10, color: "#445", marginTop: 12, lineHeight: 1.5 }}>
                ⚠ Your browser leaks a unique fingerprint even in private mode. Use Tor Browser or Firefox with arkenfox for max protection.
              </div>
            </Section>
          </div>

          {/* Recommendations */}
          <div style={{ gridColumn: "1 / -1" }}>
            <Section title="Hardening Recommendations" delay={0.5}>
              {[
                { label: "USE A VPN", desc: "Mullvad or ProtonVPN. No logs, no bullshit.", risk: "warn" },
                { label: "ENABLE DNS-OVER-HTTPS", desc: "Firefox: Settings → DNS over HTTPS. Use Cloudflare or NextDNS.", risk: "warn" },
                { label: "DISABLE WEBRTC", desc: "Firefox: about:config → media.peerconnection.enabled = false", risk: "danger" },
                { label: "USE TOR BROWSER", desc: "For maximum anonymity. Defeats fingerprinting entirely.", risk: "safe" },
                { label: "BLOCK TRACKERS", desc: "Install uBlock Origin. Enable medium mode.", risk: "warn" },
                { label: "DISABLE COOKIES", desc: "Or use containers (Firefox Multi-Account Containers).", risk: "warn" },
              ].map((r, i) => (
                <div key={i} style={{
                  display: "flex", gap: 12, padding: "8px 0",
                  borderBottom: "1px solid #0a0a1a", alignItems: "flex-start"
                }}>
                  <StatusDot status={r.risk} />
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: 2, color: getRiskColor(r.risk) }}>{r.label}</div>
                    <div style={{ fontSize: 10, color: "#556", marginTop: 2 }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </Section>
          </div>

        </div>

        {/* Activity Log */}
        <Section title="System Log" delay={0.6}>
          <div ref={logRef} style={{
            height: 140, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2
          }}>
            {log.map((l, i) => (
              <div key={i} style={{ fontSize: 10, fontFamily: "monospace", display: "flex", gap: 8 }}>
                <span style={{ color: "#334", minWidth: 80 }}>{l.time}</span>
                <span style={{ color: l.color }}>{l.msg}</span>
              </div>
            ))}
            <div style={{ fontSize: 10, color: "#00f0ff", animation: "blink 1s infinite" }}>█</div>
          </div>
        </Section>

        <div style={{ textAlign: "center", fontSize: 9, color: "#223", letterSpacing: 3, marginTop: 8 }}>
          SHIELD OS — BUILT FOR THE PEOPLE — NOT FOR GOVERNMENTS
        </div>

      </div>
    </div>
  );
}
