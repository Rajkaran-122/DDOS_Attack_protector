const http = require('http');

const TARGET = 'http://localhost:3000';

function normalTraffic() {
  console.log('🟢 Normal traffic started');

  setInterval(() => {
    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path: '/',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      console.log(`Normal user: ${res.statusCode}`);
    });

    req.on('error', () => {});
    req.end();
  }, 10000); // slow, human-like
}

normalTraffic();