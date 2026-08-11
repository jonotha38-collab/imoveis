import { kv } from '@vercel/kv';

const CHAVE_CATALOGO = 'catalogo_imoveis_atual';
const CATALOGO_VAZIO = { imoveis: [], gerado_em: null, total_paginas: 0 };

export async function salvarCatalogo(catalogo) {
  await kv.set(CHAVE_CATALOGO, catalogo);
}

export async function lerCatalogo() {
  // Se o Vercel KV ainda nao estiver conectado (variaveis de ambiente ausentes),
  // devolve um catalogo vazio em vez de quebrar a rota.
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return CATALOGO_VAZIO;
  }

  const catalogo = await kv.get(CHAVE_CATALOGO);
  return catalogo || CATALOGO_VAZIO;
}
