const http = require('http');

const TARGET = 'http://localhost:3000';

function botnetFlood2() {
  console.log('🤖 Starting botnet flood simulation...');

  for (let i = 0; i < 10; i++) {
    setInterval(() => {
      const fakeIP = `11.21.${Math.floor(i / 255)}.${i % 255}`;

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

botnetFlood2();