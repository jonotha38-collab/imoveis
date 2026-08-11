import { NextResponse } from 'next/server';
import { pdfParaImagens } from '@/lib/pdfToImages';
import { processarBook } from '@/lib/openaiVision';
import { salvarCatalogo } from '@/lib/kv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutos - books grandes demoram para processar

export async function POST(request) {
  try {
    const formData = await request.formData();
    const senhaEnviada = formData.get('password');

    if (process.env.SITE_PASSWORD && senhaEnviada !== process.env.SITE_PASSWORD) {
      return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
    }

    const arquivo = formData.get('file');
    if (!arquivo) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const bytes = await arquivo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const imagens = await pdfParaImagens(buffer);

    if (imagens.length === 0) {
      return NextResponse.json(
        { error: 'Não foi possível ler nenhuma página desse PDF.' },
        { status: 422 }
      );
    }

    const catalogo = await processarBook(imagens);
    await salvarCatalogo(catalogo);

    return NextResponse.json({ catalogo });
  } catch (erro) {
    console.error('Erro ao processar book:', erro);
    return NextResponse.json(
      { error: 'Ocorreu um erro ao processar o arquivo. Tente novamente.' },
      { status: 500 }
    );
  }
}
