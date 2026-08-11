import { NextResponse } from 'next/server';
import { lerCatalogo } from '@/lib/kv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // nunca pre-renderizar; sempre ler dados atuais

// Esta e a URL fixa que o node "get Product Brochure" do n8n deve consultar.
// Sempre retorna o catalogo mais recente que foi processado no site.
export async function GET() {
  const catalogo = await lerCatalogo();
  return NextResponse.json(catalogo);
}
