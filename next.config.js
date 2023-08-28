/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/contracts/:txid/close',
        destination: '/contracts/:txid/close/channel',
        permanent: true,
      },
      {
        source: '/',
        destination: '/dashboard',
        permanent: true,
      },
    ]
  },
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, buffer: require.resolve('buffer/'), fs: false }
    config.experiments.asyncWebAssembly = true
    return config
  },
}

module.exports = nextConfig
