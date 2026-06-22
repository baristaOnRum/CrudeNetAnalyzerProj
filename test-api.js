const http = require('http');

async function doRequest(path, method, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 8585,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    
    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  try {
    console.log("1. Logging in...");
    const loginRes = await doRequest('/api/auth/login', 'POST', { username: 'SYS-01-LOCAL', password: 'ADMIN-ACCESS-SECRET-KEY' });
    console.log("Login Response: ", loginRes);

    console.log("2. Starting analysis...");
    const analysisRes = await doRequest('/api/analysis', 'POST', { interfaceId: 'eth0', active: true });
    console.log("Analysis Response: ", analysisRes);

    console.log("3. Executing ping...");
    const pingRes = await doRequest('/api/diagnostics/ping?target=127.0.0.1', 'POST');
    console.log("Ping Response: ", pingRes);

  } catch (e) {
    console.error("Error: ", e);
  }
}

run();
