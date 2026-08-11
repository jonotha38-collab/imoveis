import OpenAI from 'openai';

const PROMPT_EXTRACAO = `Você está analisando uma página de um book (catálogo) de imóveis.

Extraia TODOS os imóveis/unidades descritos ou mostrados nessa página específica.
Se a página for uma capa, índice, ou não tiver nenhum imóvel, devolva uma lista vazia.

Devolva SOMENTE um JSON no formato:
{
  "imoveis": [
    {
      "titulo": "string curta que identifica o imovel/unidade",
      "tipo": "apartamento | casa | terreno | comercial | outro",
      "localizacao": "bairro/cidade, se houver",
      "area_m2": número ou null,
      "quartos": número ou null,
      "banheiros": número ou null,
      "vagas_garagem": número ou null,
      "preco": "string com o preço como aparece na página, ou null",
      "diferenciais": ["lista curta de destaques/comodidades mencionadas"],
      "descricao": "resumo em 1-2 frases do que a página mostra sobre esse imóvel"
    }
  ]
}

Não invente dados que não estão na página. Use null quando a informação não aparecer.`;

/**
 * Envia uma imagem (base64 PNG) de uma pagina do book para o modelo de visao
 * da OpenAI e retorna a lista de imoveis extraidos daquela pagina.
 *
 * @param {string} imagemBase64
 * @param {OpenAI} client
 * @returns {Promise<object[]>}
 */
export async function extrairImoveisDaPagina(imagemBase64, client) {
  const resposta = await client.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    temperature: 0,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: PROMPT_EXTRACAO },
          {
            type: 'image_url',
            image_url: { url: `data:image/png;base64,${imagemBase64}` }
          }
        ]
      }
    ]
  });

  const texto = resposta.choices[0]?.message?.content || '{"imoveis": []}';

  try {
    const dados = JSON.parse(texto);
    return Array.isArray(dados.imoveis) ? dados.imoveis : [];
  } catch {
    return [];
  }
}

/**
 * Processa todas as paginas (em paralelo, em lotes) e devolve o catalogo
 * final consolidado, no formato que o n8n vai consumir.
 *
 * @param {string[]} imagensBase64
 * @returns {Promise<{ imoveis: object[], gerado_em: string, total_paginas: number }>}
 */
export async function processarBook(imagensBase64) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const TAMANHO_LOTE = 4; // evita estourar limite de requisicoes simultaneas
  const todosImoveis = [];

  for (let i = 0; i < imagensBase64.length; i += TAMANHO_LOTE) {
    const lote = imagensBase64.slice(i, i + TAMANHO_LOTE);
    const resultadosLote = await Promise.all(
      lote.map((img) => extrairImoveisDaPagina(img, client))
    );
    resultadosLote.forEach((imoveis) => todosImoveis.push(...imoveis));
  }

  return {
    imoveis: todosImoveis,
    gerado_em: new Date().toISOString(),
    total_paginas: imagensBase64.length
  };
}
