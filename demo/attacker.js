// demo/attacker.js — simulates DDoS attack types

const http = require('http');

const TARGET = 'http://localhost:3000';

// Attack 1: Botnet flood — 100 "different" IPs each sending fast requests
// (We fake different IPs via X-Forwarded-For header in test mode)
/*
function botnetFlood() {
  console.log('🤖 Starting botnet flood simulation...');

  for (let i = 0; i < 100; i++) {
    setInterval(() => {
      const fakeIP = `10.0.${Math.floor(i / 255)}.${i % 255}`;

      const opts = {
        hostname: 'localhost',
        port: 3000,
        path: '/',
        headers: {
          'x-Forwarded-For': fakeIP
        }
      };

      http.get(opts, (res) => {
        console.log(`Bot ${i} (${fakeIP}): ${res.statusCode}`);
      });

    }, 200); // each bot sends 5 req/sec
  }
}*/
//const http = require('http');

function botnetFlood() {
  console.log('🤖 Starting botnet flood simulation...');

  for (let i = 0; i < 10; i++) {
    setInterval(() => {
      const fakeIP = `10.0.${Math.floor(i / 255)}.${i % 255}`;

      const options = {
        hostname: '127.0.0.1',
        port: 3000,
        path: '/',
        method: 'GET',
        headers: {
          'x-forwarded-for': fakeIP,
          'Connection': 'close'   // ✅ VERY IMPORTANT
        }
      };

      const req = http.request(options, (res) => {
        console.log(`Bot ${i} (${fakeIP}): ${res.statusCode}`);
      });

      // req.on('error', (err) => {
      //   console.log(`Bot ${i} ERROR:`, err.code);
      // });
req.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') {
    console.log(`Bot ${i} refused (server overloaded)`);
  } else {
    console.log(`Bot ${i} ERROR:`, err.code);
  }
});
      req.end();

    }, 50);
  }
}

// Attack 2: Single IP hammering (triggers token bucket fast)

function singleIPFlood() {
  console.log('⚡ Starting single IP flood...');

  setInterval(() => {
    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path: '/',
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
    });
    
    req.on('error', (err) => {
      console.log("Error:", err.code);
    });
    
    req.end();
   
  }, 50); // 20 requests per second — bucket drains quickly
}

function stressTest() {
  console.log('🔴 Stress test mode');

  let count = 0;

  const interval = setInterval(() => {
    if (count > 200) {
      clearInterval(interval); // stop automatically
      return;
    }

    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path: '/',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      console.log(`Stress: ${res.statusCode}`);
    });

    req.on('error', () => {});
    req.end();

    count++;
  }, 20); // high rate but bounded
}
function burstTraffic() {
  console.log('🟡 Burst traffic simulation');

  const fakeIP = "192.168.1.50";

  setInterval(() => {
    for (let i = 0; i < 5; i++) {
      const options = {
        hostname: '127.0.0.1',
        port: 3000,
        path: '/',
        method: 'GET',
        headers: {
          'x-forwarded-for': fakeIP
        }
      };

      const req = http.request(options, (res) => {
        console.log(`Burst (${fakeIP}): ${res.statusCode}`);
      });

      req.on('error', () => {});
      req.end();
    }
  }, 500);
}
// Run based on command-line arg:
// node attacker.js botnet
// node attacker.js single

const mode = process.argv[2];

if (mode === 'botnet') {
  botnetFlood();
}
if (mode === 'botnet2') {
  botnetFlood();
}
  else if(mode=='normal'){
    normalTraffic();
  }
  else if(mode=='Burst'){
    burstTraffic();
  }
  else if(mode=='stress'){
    stressTest();
  }
 else {
  singleIPFlood();
}