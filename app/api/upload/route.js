import { handleUpload } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Essa rota autoriza o navegador a enviar o arquivo DIRETO para o Vercel Blob,
// sem passar pelo corpo da nossa funcao serverless (que tem limite de 4.5MB).
export async function POST(request) {
  const body = await request.json();

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const senhaEnviada = clientPayload ? JSON.parse(clientPayload).password : null;

        if (process.env.SITE_PASSWORD && senhaEnviada !== process.env.SITE_PASSWORD) {
          throw new Error('Senha incorreta.');
        }

        return {
          allowedContentTypes: ['application/pdf'],
          maximumSizeInBytes: 80 * 1024 * 1024 // 80MB de folga para books grandes
        };
      },
      onUploadCompleted: async () => {
        // Nao precisamos fazer nada aqui - o processamento acontece
        // depois, quando o front-end chama /api/process com a URL do arquivo.
      }
    });

    return NextResponse.json(jsonResponse);
  } catch (erro) {
    return NextResponse.json({ error: erro.message }, { status: 400 });
  }
}
