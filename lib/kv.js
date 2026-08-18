import { Redis } from '@upstash/redis';

const CHAVE_CATALOGO = 'catalogo_imoveis_atual';
const CATALOGO_VAZIO = { imoveis: [], gerado_em: null, total_paginas: 0 };

function getClient() {
  return new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN
  });
}

export async function salvarCatalogo(catalogo) {
  const redis = getClient();
  await redis.set(CHAVE_CATALOGO, catalogo);
}

export async function lerCatalogo() {
  // Se a integracao Upstash Redis ainda nao estiver conectada (variaveis de
  // ambiente ausentes), devolve um catalogo vazio em vez de quebrar a rota.
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return CATALOGO_VAZIO;
  }

  const redis = getClient();
  const catalogo = await redis.get(CHAVE_CATALOGO);
  return catalogo || CATALOGO_VAZIO;
}
