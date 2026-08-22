/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@napi-rs/canvas', 'pdfjs-dist'],
    // O pdfjs-dist carrega o "worker" de um jeito dinamico que a Vercel nao
    // detecta sozinha, entao precisamos forcar a inclusao desse arquivo no
    // pacote da funcao serverless, senao ele "some" em producao.
    outputFileTracingIncludes: {
      '/api/process': [
        './node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
        './node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs'
      ]
    }
  }
};

module.exports = nextConfig;
