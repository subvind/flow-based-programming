// proxy-server.ts
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import vhost from 'vhost';
import fs from 'fs';
import path from 'path';

const app = express();

// Load services from JSON file
const servicesPath = path.join(__dirname, '../data/services.json');
const services = JSON.parse(fs.readFileSync(servicesPath, 'utf8'));

console.log('Loaded services:', services);

// Create proxy middleware for each service
const proxies = services.map(service => {
  const proxy = createProxyMiddleware({
    target: `http://${service.ip}:${service.port}`,
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq: any, req: any, res: any) => {
        console.log(`Proxying request to ${service.host}: ${req.method} ${req.url}`);
      },
      proxyRes: (proxyRes, req, res) => {
        console.log(`Received response from ${service.host}: ${proxyRes.statusCode}`);
      },
    }
  });

  return { service, proxy };
});

// Route traffic based on the host (domain name)
proxies.forEach(({ service, proxy }) => {
  console.log(`traffic http://${service.host} -> http://${service.ip}:${service.port}`);
  app.use(vhost(service.host, (req, res, next) => {
    console.log(`Routing request to ${service.host}`);
    proxy(req, res, next);
  }));
});

// Start the server
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Reverse proxy running at http://localhost:${PORT}`);
});

// Add a catch-all middleware to log unhandled requests
app.use((req, res) => {
  console.log(`Unhandled request: ${req.method} ${req.url}`);
  res.status(404).send('Not Found');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', err);
  res.status(500).send('Internal Server Error');
});