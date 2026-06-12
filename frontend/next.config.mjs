/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }, { protocol: 'http', hostname: '**' }] },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Allow YouTube iframe + media
          {
            key: 'Permissions-Policy',
            value: 'autoplay=*, picture-in-picture=*',
          },
        ],
      },
    ];
  },
};
export default nextConfig;
