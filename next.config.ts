import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'logo.clearbit.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'www.asifma.org', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'join.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'app.the-trackr.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'www.jumptrading.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'rivalsense.co', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'www.bamfunds.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'optiver.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'www.behance.net', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'cryptocurrencyjobs.co', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'github.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'www.stickpng.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'www.tecnologia-web.info', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'www.streamlinehq.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'uk.pinterest.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'startupvalencia.org', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'media.licdn.com', port: '', pathname: '/**' },
    ],
  },
};

export default nextConfig;
