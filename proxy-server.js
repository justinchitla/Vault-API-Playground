const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Proxy middleware configuration
const apiProxy = createProxyMiddleware({
  target: 'https://api.figment.io',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // remove /api prefix when forwarding to target
  },
  onProxyRes: function (proxyRes, req, res) {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
  },
});

// Use the proxy middleware
app.use('/api', apiProxy);

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));