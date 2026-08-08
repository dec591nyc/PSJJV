/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pg', '@libsql/client'],
  },
};

export default nextConfig;
