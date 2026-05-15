const { getDefaultConfig } = require('expo/metro-config')
const https = require('https')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

config.resolver.unstable_enablePackageExports = false
config.resolver.unstable_conditionNames = ['require']

function proxyV2ex(req, res) {
  const targetPath = req.url.replace(/^\/__v2ex_proxy/, '') || '/'
  const targetUrl = new URL(targetPath, 'https://www.v2ex.com')
  const headers = {
    ...req.headers,
    host: targetUrl.host,
    origin: targetUrl.origin,
    referer: `${targetUrl.origin}/`,
  }

  delete headers.connection

  const proxyReq = https.request(
    targetUrl,
    {
      method: req.method,
      headers,
    },
    proxyRes => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers)
      proxyRes.pipe(res)
    }
  )

  proxyReq.on('error', error => {
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(error.message)
  })

  req.pipe(proxyReq)
}

// Add custom resolveRequest function
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'axios') {
    // Specifically use 'browser' condition for axios
    return context.resolveRequest(
      { ...context, unstable_conditionNames: ['browser'] },
      moduleName,
      platform
    )
  }
  // Fallback to default resolver for other modules
  return context.resolveRequest(context, moduleName, platform)
}

const originalEnhanceMiddleware = config.server.enhanceMiddleware

config.server.enhanceMiddleware = (middleware, server) => {
  const enhancedMiddleware = originalEnhanceMiddleware
    ? originalEnhanceMiddleware(middleware, server)
    : middleware

  return (req, res, next) => {
    if (req.url.startsWith('/__v2ex_proxy')) {
      proxyV2ex(req, res)
      return
    }

    return enhancedMiddleware(req, res, next)
  }
}

module.exports = config
