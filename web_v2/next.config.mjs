/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Enable static HTML export
  trailingSlash: true, // Add trailing slashes to all routes

  // Note: Built-in i18n is not compatible with 'output: export'
  // We're using a custom i18n implementation instead

  // Configure API proxy
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3909/api/:path*',
      },
    ];
  },
};

export default nextConfig;
