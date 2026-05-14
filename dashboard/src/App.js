import React, { useEffect, useState } from "react";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

function App() {
  const [data, setData] = useState({
    stats: {
      allowed: 0,
      blocked: 0,
      throttled: 0,
      rateLimited: 0
    },
    topThreats: []
  });

  const [ip, setIp] = useState("");

  const fetchStats = () => {
    fetch(`${API_BASE_URL}/api/shield/stats`)
      .then((res) => res.json())
      .then((data) => setData(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, []);

  const blockIP = () => {
    if (!ip) return;
    fetch(`${API_BASE_URL}/api/shield/block`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip })
    }).then(fetchStats);
  };

  const whitelistIP = () => {
    if (!ip) return;
    fetch(`${API_BASE_URL}/api/shield/whitelist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip })
    }).then(fetchStats);
  };

  return (
    <div style={styles.pageBackground}>
      {/* Tiny bit of standard CSS for hover/focus effects */}
      <style>{`
        .action-btn { transition: all 0.2s ease; }
        .action-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .action-btn:active { transform: translateY(1px); }
        .threat-row { transition: background-color 0.2s ease; }
        .threat-row:hover { background-color: rgba(169, 186, 169, 0.15); }
        .ip-input:focus { border-color: #3A4D39 !important; box-shadow: 0 0 0 3px rgba(124, 143, 122, 0.3) !important; }
      `}</style>

      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>ShieldLayer Dashboard</h1>
          <span style={styles.statusBadge}>🟢 Active</span>
        </div>

        {/* ✅ FULL WIDTH STATS */}
        <div style={styles.grid}>
          <Card title="Allowed" value={data.stats?.allowed} />
          <Card title="Blocked" value={data.stats?.blocked} />
          <Card title="Throttled" value={data.stats?.throttled} />
          <Card title="Rate Limited" value={data.stats?.rateLimited} />
        </div>

        {/* ✅ TABLE */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Top Threat IPs</h2>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>IP Address</th>
                  <th style={styles.th}>Behavior</th>
                  <th style={styles.th}>Reputation</th>
                  <th style={styles.th}>Bucket</th>
                  <th style={styles.th}>Final Score</th>
                </tr>
              </thead>
              <tbody>
                {data.topThreats && data.topThreats.length > 0 ? (
                  data.topThreats.map((item) => (
                    <tr key={item.ip} className="threat-row">
                      <td style={styles.td}>
                        {isLocalIp(item.ip) ? (
                          <span style={styles.localBadge}>Local</span>
                        ) : (
                          item.ip
                        )}
                      </td>
                      <td style={styles.td}>{item.behaviorScore ?? 0}</td>
                      <td style={styles.td}>{item.reputationScore ?? 0}</td>
                      <td style={styles.td}>
                        {item.tokenBucketEmpty ? (
                          <span style={{ color: "#C0554D", fontWeight: "bold" }}>Empty</span>
                        ) : (
                          <span style={{ color: "#7C8F7A" }}>Full</span>
                        )}
                      </td>
                      <td style={{ ...styles.td, fontWeight: "bold", color: "#C0554D" }}>
                        {item.finalScore ?? item.score ?? 0}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={styles.emptyState}>
                      No current threats detected.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ✅ CONTROL */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Manual Access Control</h3>
          <div style={styles.controlBox}>
            <input
              placeholder="Enter IP Address (e.g. 192.168.1.1)"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              style={styles.input}
              className="ip-input"
            />
            <button onClick={blockIP} style={styles.blockBtn} className="action-btn">
              Block IP
            </button>
            <button onClick={whitelistIP} style={styles.whiteBtn} className="action-btn">
              Whitelist IP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function isLocalIp(ip) {
  return ip === "::1" || ip === "127.0.0.1" || ip === "::ffff:127.0.0.1";
}

// 🔹 Card Component
function Card({ title, value }) {
  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>{title}</h3>
      <p style={styles.cardValue}>{value || 0}</p>
    </div>
  );
}

// 🎨 THEME STYLES
const styles = {
  pageBackground: {
    backgroundColor: "#F2F5E9", // Creme Mint
    minHeight: "100vh",
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    color: "#3A4D39", // Deep Moss
    padding: "40px 20px",
    boxSizing: "border-box"
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    borderBottom: "2px solid rgba(169, 186, 169, 0.4)", // Soft Laurel border
    paddingBottom: "15px"
  },

  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: "700",
    color: "#3A4D39" // Deep Moss
  },

  statusBadge: {
    backgroundColor: "rgba(124, 143, 122, 0.15)",
    color: "#3A4D39",
    padding: "8px 16px",
    borderRadius: "20px",
    fontWeight: "bold",
    fontSize: "14px",
    border: "1px solid #7C8F7A"
  },

  localBadge: {
    backgroundColor: "rgba(169, 186, 169, 0.3)",
    color: "#3A4D39",
    padding: "4px 10px",
    borderRadius: "12px",
    fontWeight: "bold",
    fontSize: "12px",
    border: "1px solid #A9BAA9"
  },

  section: {
    marginTop: "40px"
  },

  sectionTitle: {
    margin: "0 0 15px 0",
    fontSize: "22px",
    color: "#3A4D39", // Deep Moss
    fontWeight: "600"
  },

  // ✅ GRID FOR FULL WIDTH CARDS
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px"
  },

  card: {
    background: "rgba(169, 186, 169, 0.15)", // Translucent Soft Laurel
    borderRadius: "12px",
    padding: "25px",
    textAlign: "center",
    boxShadow: "0 4px 15px rgba(58, 77, 57, 0.05)",
    border: "1px solid rgba(169, 186, 169, 0.6)", // Soft Laurel
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  },

  cardTitle: {
    margin: "0 0 10px 0",
    fontSize: "16px",
    color: "#7C8F7A", // Sage
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "1px"
  },

  cardValue: {
    margin: 0,
    fontSize: "36px",
    fontWeight: "800",
    color: "#3A4D39" // Deep Moss
  },

  tableWrapper: {
    background: "#FFFFFF",
    borderRadius: "12px",
    overflowX: "auto",
    boxShadow: "0 4px 15px rgba(58, 77, 57, 0.08)",
    border: "1px solid #A9BAA9" // Soft Laurel
  },

  table: {
    width: "100%",
    borderCollapse: "collapse"
  },

  th: {
    backgroundColor: "#7C8F7A", // Sage
    color: "#FFFFFF",
    padding: "16px 24px",
    textAlign: "left",
    fontWeight: "600",
    fontSize: "15px",
    letterSpacing: "0.5px"
  },

  td: {
    padding: "16px 24px",
    borderBottom: "1px solid rgba(169, 186, 169, 0.3)", // Light Soft Laurel border
    color: "#3A4D39", // Deep Moss
    fontSize: "15px"
  },

  emptyState: {
    padding: "30px",
    textAlign: "center",
    color: "#7C8F7A",
    fontStyle: "italic"
  },

  controlBox: {
    display: "flex",
    gap: "12px",
    background: "#FFFFFF",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(58, 77, 57, 0.08)",
    border: "1px solid #A9BAA9", // Soft Laurel
    flexWrap: "wrap"
  },

  input: {
    padding: "14px 18px",
    borderRadius: "8px",
    border: "2px solid #A9BAA9", // Soft Laurel
    flex: 1,
    minWidth: "250px",
    fontSize: "15px",
    color: "#3A4D39",
    outline: "none",
    transition: "all 0.2s ease"
  },

  blockBtn: {
    backgroundColor: "#C0554D", // Muted Berry (Red)
    color: "#FFFFFF",
    border: "none",
    padding: "14px 24px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "15px",
    boxShadow: "0 4px 10px rgba(192, 85, 77, 0.3)"
  },

  whiteBtn: {
    backgroundColor: "#7C8F7A", // Sage
    color: "#FFFFFF",
    border: "none",
    padding: "14px 24px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "15px",
    boxShadow: "0 4px 10px rgba(124, 143, 122, 0.3)"
  }
};

export default App;
