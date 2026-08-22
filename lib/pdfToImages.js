import { createCanvas } from '@napi-rs/canvas';

// O pdfjs-dist, em ambiente Node, tenta usar o pacote classico "canvas" por
// padrao para desenhar imagens que estao DENTRO da pagina do PDF (nao a
// pagina inteira, so' sub-imagens). Como usamos @napi-rs/canvas (mais leve e
// compativel com a Vercel) em vez do pacote classico, precisamos fornecer
// nossa propria "fabrica" de canvas para o pdfjs-dist usar nesses casos.
class FabricaDeCanvas {
  create(width, height) {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    return { canvas, context };
  }

  reset(canvasAndContext, width, height) {
    try {
      canvasAndContext.canvas.width = width;
      canvasAndContext.canvas.height = height;
    } catch {
      // Se o @napi-rs/canvas nao permitir redimensionar o canvas existente,
      // criamos um novo do tamanho certo.
      const canvas = createCanvas(width, height);
      canvasAndContext.canvas = canvas;
      canvasAndContext.context = canvas.getContext('2d');
    }
  }

  destroy(canvasAndContext) {
    // @napi-rs/canvas nao suporta redimensionar para 0x0 (diferente do
    // pacote classico 'canvas'), entao so soltamos as referencias em vez
    // de tentar zerar as dimensoes.
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

/**
 * Recebe os bytes de um PDF e devolve um array de imagens PNG em base64,
 * uma por pagina, para serem enviadas para o modelo de visao da IA.
 *
 * @param {Buffer} pdfBuffer
 * @param {number} maxPaginas - limite de seguranca para nao estourar tempo/custo
 * @returns {Promise<string[]>} lista de imagens em base64 (sem o prefixo data:)
 */
export async function pdfParaImagens(pdfBuffer, maxPaginas = 30) {
  // A partir da v4, o pdfjs-dist so existe em formato ESM (.mjs), por isso
  // usamos import() dinamico em vez de require().
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

  // Aponta explicitamente onde fica o arquivo do worker. Combinado com o
  // "outputFileTracingIncludes" no next.config.js, isso garante que o
  // arquivo realmente esteja disponivel no pacote publicado na Vercel.
  try {
    const path = await import('path');
    pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(
      process.cwd(),
      'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'
    );
  } catch {
    // Se falhar ao montar o caminho, segue sem definir explicitamente -
    // o pdfjs tenta o "fake worker" padrao como ultimo recurso.
  }

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(pdfBuffer),
    useSystemFonts: true,
    disableFontFace: true,
    canvasFactory: new FabricaDeCanvas()
  });
  const pdf = await loadingTask.promise;

  const totalPaginas = Math.min(pdf.numPages, maxPaginas);
  const imagens = [];

  for (let numeroPagina = 1; numeroPagina <= totalPaginas; numeroPagina++) {
    const pagina = await pdf.getPage(numeroPagina);

    // Escala 1.5 equilibra legibilidade do texto/imagens com tamanho do arquivo
    const viewport = pagina.getViewport({ scale: 1.5 });

    const canvas = createCanvas(viewport.width, viewport.height);
    const contexto = canvas.getContext('2d');

    await pagina.render({
      canvasContext: contexto,
      viewport
    }).promise;

    const pngBuffer = canvas.toBuffer('image/png');
    imagens.push(pngBuffer.toString('base64'));
  }

  return imagens;
}
