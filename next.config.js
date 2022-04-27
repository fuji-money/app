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
}

module.exports = nextConfig
