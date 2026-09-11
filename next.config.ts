import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  },
  async redirects() {
    return [
      {
        source: '/acervo',
        destination: '/catalogo',
        permanent: true,
      },
      {
        source: '/acervo/:path*',
        destination: '/catalogo/:path*',
        permanent: true,
      },
    ]
  }
};

export default nextConfig;
