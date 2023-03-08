/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/contracts/:txid/close',
        destination: '/contracts/:txid/close/channel',
        permanent: true,
      },
    ]
  },
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, buffer: require.resolve('buffer/'), fs: false }
    config.experiments.asyncWebAssembly = true
    return config;
  },
}

module.exports = nextConfig
