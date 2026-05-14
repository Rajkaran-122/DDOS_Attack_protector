import { useEffect, useState } from "react";

function App() {
  const [data, setData] = useState({
    stats: {},
    topThreats: []
  });

  const [ip, setIp] = useState("");

  const fetchStats = () => {
    fetch("http://localhost:3000/api/shield/stats")
      .then(res => res.json())
      .then(data => setData(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, []);

  const blockIP = () => {
    fetch("http://localhost:3000/api/shield/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip })
    }).then(fetchStats);
  };

  const whitelistIP = () => {
    fetch("http://localhost:3000/api/shield/whitelist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip })
    }).then(fetchStats);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>ShieldLayer Dashboard</h1>

      {/* Stats */}
      <div style={styles.cardContainer}>
        <Card title="Allowed" value={data.stats.allowed} />
        <Card title="Blocked" value={data.stats.blocked} />
        <Card title="Throttled" value={data.stats.throttled} />
        <Card title="Rate Limited" value={data.stats.rateLimited} />
      </div>

      {/* Table */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Top Threat IPs</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>IP</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {data.topThreats.map((item) => (
              <tr key={item.ip}>
                <td>{item.ip}</td>
                <td>{item.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Controls */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Manual Control</h3>
        <div style={styles.controlRow}>
          <input
            placeholder="Enter IP..."
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            style={styles.input}
          />
          <button style={styles.blockBtn} onClick={blockIP}>
            Block
          </button>
          <button style={styles.whiteBtn} onClick={whitelistIP}>
            Whitelist
          </button>
        </div>
      </div>
    </div>
  );
}

// Card
function Card({ title, value }) {
  return (
    <div style={styles.card}>
      <p style={styles.cardTitle}>{title}</p>
      <h2 style={styles.cardValue}>{value || 0}</h2>
    </div>
  );
}

// 🎨 Styles
const styles = {
  container: {
    background: "#F2F5E9",
    minHeight: "100vh",
    padding: "40px",
    fontFamily: "Segoe UI, sans-serif",
    color: "#3A4D39"
  },
  heading: {
    marginBottom: "30px"
  },
  cardContainer: {
    display: "flex",
    gap: "20px",
    marginBottom: "30px"
  },
  card: {
    background: "rgba(255,255,255,0.6)",
    border: "1px solid #A9BAA9",
    borderRadius: "12px",
    padding: "20px",
    width: "160px",
    backdropFilter: "blur(6px)"
  },
  cardTitle: {
    color: "#7C8F7A",
    marginBottom: "10px"
  },
  cardValue: {
    color: "#3A4D39"
  },
  section: {
    background: "rgba(255,255,255,0.6)",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "25px",
    border: "1px solid #A9BAA9",
    backdropFilter: "blur(6px)"
  },
  sectionTitle: {
    marginBottom: "15px"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  controlRow: {
    display: "flex",
    gap: "10px"
  },
  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #A9BAA9",
    outline: "none",
    width: "200px"
  },
  blockBtn: {
    background: "#C0554D",
    color: "white",
    border: "none",
    padding: "10px 15px",
    borderRadius: "8px",
    cursor: "pointer"
  },
  whiteBtn: {
    background: "#3A4D39",
    color: "white",
    border: "none",
    padding: "10px 15px",
    borderRadius: "8px",
    cursor: "pointer"
  }
};

export default App;