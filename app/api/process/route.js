import { NextResponse } from 'next/server';
import { pdfParaImagens } from '@/lib/pdfToImages';
import { processarBook } from '@/lib/openaiVision';
import { salvarCatalogo } from '@/lib/kv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // teto do plano Hobby da Vercel

export async function POST(request) {
  try {
    const { url, password } = await request.json();

    if (process.env.SITE_PASSWORD && password !== process.env.SITE_PASSWORD) {
      return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
    }

    if (!url) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    // Busca o PDF que ja esta hospedado no Vercel Blob (evita o limite de
    // 4.5MB do corpo da requisicao, ja que so a URL trafega ate aqui)
    const respostaArquivo = await fetch(url);
    if (!respostaArquivo.ok) {
      return NextResponse.json({ error: 'Nao foi possivel baixar o arquivo enviado.' }, { status: 422 });
    }
    const bytes = await respostaArquivo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const imagens = await pdfParaImagens(buffer);

    if (imagens.length === 0) {
      return NextResponse.json(
        { error: 'Nao foi possivel ler nenhuma pagina desse PDF.' },
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
