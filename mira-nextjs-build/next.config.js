/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development"
});

module.exports = withPWA({
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["cdn.openai.com", "anthropic.ai"],
  },
  env: {
    NEXT_PUBLIC_APP_NAME: "Mira"
  },
  experimental: {
    serverActions: true,
  }
});