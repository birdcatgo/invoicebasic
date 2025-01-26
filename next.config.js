/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
// next.config.js
module.exports = {
  eslint: {
    ignoreDuringBuilds: true, // Disable ESLint during builds
  },
};