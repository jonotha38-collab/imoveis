# Leitor de Catálogo de Imóveis

Site que lê books de imóveis em PDF (com fotos e informações), usa IA para
extrair os dados de cada imóvel, e publica tudo num JSON numa URL fixa —
pronta para o seu workflow no n8n consumir no node "get Product Brochure".

## Como funciona

1. Você faz upload do PDF na página inicial.
2. Cada página do PDF vira uma imagem.
3. Cada imagem é enviada para a OpenAI (modelo com visão), que extrai os
   imóveis descritos naquela página.
4. Tudo é combinado num único JSON e salvo num banco rápido (Vercel KV).
5. O endpoint `/api/catalogo` sempre devolve a versão mais recente desse
   JSON — essa é a URL que o n8n vai consultar.

## Passo a passo para publicar

### 1. Criar o projeto no GitHub
Suba essa pasta inteira para um repositório novo no GitHub (pode ser
privado).

### 2. Importar na Vercel
1. Acesse [vercel.com](https://vercel.com) e clique em **Add New → Project**.
2. Selecione o repositório que você acabou de criar.
3. Não precisa mudar nenhuma configuração de build — a Vercel detecta
   Next.js automaticamente.

### 3. Criar o banco de dados (Upstash Redis, via Marketplace)
O antigo "Vercel KV" foi descontinuado. O caminho atual é:

1. Dentro do projeto na Vercel, vá em **Storage** (ou **Integrations → Browse Marketplace**).
2. Procure por **Upstash** (ou **Redis**) e clique em **Add Integration** / **Install**.
3. Escolha criar um banco novo (deixe a Vercel gerenciar a conta Upstash pra você, é a opção mais simples).
4. Conecte esse banco ao projeto `imoveis`.
5. Isso preenche automaticamente as variáveis `KV_REST_API_URL` e
   `KV_REST_API_TOKEN` no seu projeto — você não precisa copiar nada manualmente.

### 3.1 Criar o armazenamento de arquivos (Vercel Blob)
O PDF do book é enviado direto para o Vercel Blob (não passa pela nossa
função serverless), para evitar o limite de 4.5MB por requisição da Vercel.

1. Ainda em **Storage**, clique em **Create Database** (ou **Blob**, dependendo
   de como aparecer) e escolha **Blob**.
2. Conecte ao projeto `imoveis`.
3. Isso preenche automaticamente a variável `BLOB_READ_WRITE_TOKEN` — também
   não precisa copiar nada na mão.

### 4. Configurar as variáveis de ambiente
Em **Settings → Environment Variables**, adicione:

| Nome | Valor |
|---|---|
| `OPENAI_API_KEY` | a mesma chave que você já usa no n8n |
| `SITE_PASSWORD` | uma senha de sua escolha, para proteger o upload |

### 5. Fazer o deploy
Clique em **Deploy**. Depois de pronto, você terá uma URL tipo:
```
https://catalogo-imoveis-seu-usuario.vercel.app
```

### 6. Testar
1. Acesse essa URL, digite a senha, envie um PDF de teste.
2. Aguarde o processamento (pode levar de segundos a alguns minutos,
   dependendo do tamanho do book).
3. Confirme que o JSON aparece na tela.

### 7. Ligar ao n8n
1. Copie a URL do catálogo, que aparece na própria página:
   ```
   https://catalogo-imoveis-seu-usuario.vercel.app/api/catalogo
   ```
2. No n8n, abra o node **"get Product Brochure"**.
3. Troque a URL atual por essa.
4. Rode o **"Test workflow"** (o gatilho manual que já configuramos) para
   repopular a base de conhecimento da IA com os novos dados.

## Rodando localmente antes de publicar (opcional, recomendado)

Se quiser testar no seu computador antes de subir para a Vercel:

```bash
npm install
cp .env.example .env.local
# edite o .env.local com sua chave da OpenAI
npm run dev
```

Abra `http://localhost:3000`. Repare que sem o Vercel KV configurado,
o catálogo salvo só fica em memória local — funciona para testar o
processamento, mas para o link fixo funcionar de verdade, o deploy na
Vercel com o KV conectado é necessário.

## Limitações e avisos

- Cada novo book processado **substitui** o catálogo anterior. Se quiser
  manter histórico de books antigos, copie o JSON exibido na tela antes
  de subir um novo.
- **Plano gratuito (Hobby) da Vercel: teto de 60 segundos por processamento.**
  Se o book tiver muitas páginas, o processamento pode não terminar a
  tempo e retornar erro, mesmo com o upload funcionando normalmente.
  Se isso acontecer com frequência, as opções são: dividir o book em
  arquivos menores antes de enviar, ou migrar para o plano Pro da Vercel
  (que permite até 800 segundos por execução).
- A extração é feita por IA e pode ocasionalmente errar ou deixar de
  identificar algum imóvel — vale conferir o JSON gerado antes de confiar
  cegamente nele.
