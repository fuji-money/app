/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/contracts/:txid',
        destination: '/contracts/:txid/topup',
        permanent: false,
      },
    ]
  },
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    return config;
  },
}

module.exports = nextConfig
