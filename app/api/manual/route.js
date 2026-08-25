import { NextResponse } from 'next/server';
import { salvarCatalogo, lerCatalogo } from '@/lib/kv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function checarSenha(senhaEnviada) {
  return !process.env.SITE_PASSWORD || senhaEnviada === process.env.SITE_PASSWORD;
}

// Adiciona um novo imovel cadastrado manualmente ao catalogo existente
export async function POST(request) {
  try {
    const { password, imovel } = await request.json();

    if (!checarSenha(password)) {
      return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
    }

    if (!imovel || !imovel.titulo) {
      return NextResponse.json({ error: 'O imóvel precisa ao menos de um título.' }, { status: 400 });
    }

    const catalogoAtual = await lerCatalogo();

    const novoImovel = {
      id: crypto.randomUUID(),
      origem: 'manual',
      titulo: imovel.titulo || null,
      tipo: imovel.tipo || null,
      localizacao: imovel.localizacao || null,
      area_m2: imovel.area_m2 ? Number(imovel.area_m2) : null,
      quartos: imovel.quartos ? Number(imovel.quartos) : null,
      banheiros: imovel.banheiros ? Number(imovel.banheiros) : null,
      vagas_garagem: imovel.vagas_garagem ? Number(imovel.vagas_garagem) : null,
      preco: imovel.preco || null,
      diferenciais: Array.isArray(imovel.diferenciais)
        ? imovel.diferenciais
        : (imovel.diferenciais || '')
            .split(',')
            .map((d) => d.trim())
            .filter(Boolean),
      descricao: imovel.descricao || null
    };

    const catalogo = {
      imoveis: [...(catalogoAtual.imoveis || []), novoImovel],
      gerado_em: new Date().toISOString(),
      total_paginas: catalogoAtual.total_paginas || 0
    };

    await salvarCatalogo(catalogo);

    return NextResponse.json({ catalogo, imovel: novoImovel });
  } catch (erro) {
    console.error('Erro ao cadastrar imovel manual:', erro);
    return NextResponse.json({ error: 'Ocorreu um erro ao salvar o imóvel.' }, { status: 500 });
  }
}

// Remove um imovel do catalogo pelo id
export async function DELETE(request) {
  try {
    const { password, id } = await request.json();

    if (!checarSenha(password)) {
      return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: 'ID do imóvel não informado.' }, { status: 400 });
    }

    const catalogoAtual = await lerCatalogo();
    const catalogo = {
      ...catalogoAtual,
      imoveis: (catalogoAtual.imoveis || []).filter((i) => i.id !== id),
      gerado_em: new Date().toISOString()
    };

    await salvarCatalogo(catalogo);

    return NextResponse.json({ catalogo });
  } catch (erro) {
    console.error('Erro ao excluir imovel:', erro);
    return NextResponse.json({ error: 'Ocorreu um erro ao excluir o imóvel.' }, { status: 500 });
  }
}
