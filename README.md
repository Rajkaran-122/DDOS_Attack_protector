# ShieldLayer: DDoS Mitigation Middleware for Node.js Applications

## 1. Introduction
With the increasing dependency on web applications, security has become a major concern. One of the most common threats is Distributed Denial of Service (DDoS) attacks, where attackers flood a server with requests to make it unavailable to legitimate users.

Most applications use rate limiting to prevent such attacks. However, modern DDoS attacks can easily bypass these techniques. ShieldLayer is designed as a middleware solution for Node.js applications that provides advanced protection using multiple detection techniques instead of relying only on request limits.

## 2. Problem Statement
Traditional rate limiting fails due to the following reasons:
*   **Distributed Botnet Attacks**: Multiple IP addresses send requests below the limit → system still crashes
*   **Slow-Loris Attacks**: Requests are sent very slowly → connections remain open and exhaust server resources
*   **Application Layer (L7) Attacks**: Requests look like real users but target heavy APIs → high CPU/DB usage
*   **IP Rotation / Proxy Usage**: Attackers change IPs frequently → bypass IP-based restrictions

Therefore, a smarter system is needed that can analyze behavior and patterns, not just request count.

## 3. Objectives
The main objectives of ShieldLayer are:
*   To detect and mitigate modern DDoS attacks
*   To go beyond traditional rate limiting
*   To analyze request behavior and patterns
*   To provide real-time monitoring and control
*   To maintain low latency and high performance

## 4. System Architecture
*   ShieldLayer works as a middleware between the client and the server.
*   **Client Request** → **ShieldLayer Middleware** → **Decision Engine** → **Application Server**
*   Every incoming request is intercepted and analyzed before reaching the application.

## 5. System Modules
### 5.1 Traffic Classifier
*   Identifies request characteristics such as IP, headers, and user-agent
*   Detects unusual or suspicious request patterns

### 5.2 Token Bucket Engine
*   Implements rate limiting using token bucket algorithm
*   Supports: Per-IP limits, Per-endpoint limits, and Global limits

### 5.3 Behavioral Analyzer
*   Monitors user behavior over time
*   Detects: Bots with constant request intervals, Abnormal request sequences, and Slow-Loris attack patterns

### 5.4 Reputation Store (Redis)
*   Stores IP reputation scores (0–100)
*   Scores decrease over time (decay mechanism)
*   Helps identify repeat attackers

### 5.5 Decision Engine
*   Combines all module outputs
*   Calculates a threat score
*   Decides action based on score

### 5.6 Dashboard API
*   Provides system monitoring
*   Displays: Requests per second, Blocked requests, Top attacking IPs
*   Allows manual IP control

### 5.7 Data Storage (MongoDB)
*   MongoDB is used to store: Request logs, Attack patterns, Historical traffic data
*   It helps in analyzing past attacks and improving detection accuracy

## 6. Threat Scoring Mechanism
Threat score is calculated as:
*   IP Reputation : 30% 
*   Behavioral Score : 40%
*   Traffic Pattern Score : 30%

## 7. Performance & Requirements
*   **Performance**: < 2 ms delay per request
*   **Throughput**: ≥ 50,000 requests/sec
*   **Availability**: 99.9% uptime
*   **False Positives**: < 0.5%
*   **Scalability**: Redis-based scaling
*   **Reliability**: Fail-open mechanism

## 8. Technology Stack
*   **Backend**: Node.js, Express
*   **Cache/Storage**: Redis (ioredis)
*   **Database**: MongoDB
*   **Testing**: k6, Jest
*   **Frontend**: React

## 9. Limitations
*   Works only for Node.js/Express applications
*   Does not handle network-layer attacks

## 10. Conclusion
ShieldLayer provides an efficient and scalable solution for protecting web applications against modern DDoS attacks. By combining multiple detection techniques such as behavioral analysis, reputation scoring, and rate limiting, it overcomes the limitations of traditional systems. It is suitable for both educational purposes and real-world applications, especially where lightweight and flexible security is required.
