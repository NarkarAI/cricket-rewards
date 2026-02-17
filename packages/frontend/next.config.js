/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com', 'firebasestorage.googleapis.com'],
  },
  allowedDevOrigins: ['rewardsbyfan.com', 'www.rewardsbyfan.com'],
};

module.exports = nextConfig;
