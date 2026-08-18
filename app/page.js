'use client';

import { useState, useRef } from 'react';
import { upload } from '@vercel/blob/client';

export default function Home() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | uploading | processing | done | error
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const catalogUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/api/catalogo` : '/api/catalogo';

  function handleFile(f) {
    if (!f) return;
    if (f.type !== 'application/pdf') {
      setStatus('error');
      setMessage('Esse arquivo não é um PDF. Envie o book em formato .pdf.');
      return;
    }
    setFile(f);
    setStatus('idle');
    setMessage('');
    setResult(null);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  async function handleSubmit() {
    if (!file) return;
    setResult(null);

    try {
      // 1) Envia o arquivo direto para o Vercel Blob (sem passar pelo limite
      // de 4.5MB da nossa funcao serverless)
      setStatus('uploading');
      setMessage('Enviando o arquivo…');

      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        clientPayload: JSON.stringify({ password })
      });

      // 2) Pede para o servidor processar o arquivo que ja esta no Blob
      setStatus('processing');
      setMessage('Lendo o book e extraindo as informações de cada página…');

      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: blob.url, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Não foi possível processar o arquivo.');
        return;
      }

      setResult(data.catalogo);
      setStatus('done');
      setMessage(`Pronto! ${data.catalogo?.imoveis?.length ?? 0} imóvel(is) identificado(s) e publicado(s).`);
    } catch (err) {
      setStatus('error');
      setMessage(err?.message || 'Erro de conexão ao enviar o arquivo. Tente novamente.');
    }
  }

  function copyUrl() {
    navigator.clipboard.writeText(catalogUrl);
  }

  return (
    <main className="wrap">
      <div className="eyebrow">Leitor de catálogo</div>
      <h1>Transforme o book de imóveis em dados que a IA entende</h1>
      <p className="lede">
        Envie o PDF com as fotos e informações dos imóveis. A IA lê cada página, organiza tudo em
        JSON, e publica numa URL fixa — a mesma que o seu workflow no n8n já consulta.
      </p>

      <div className="sheet">
        <label
          className={`drop ${dragActive ? 'active' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div className="drop-icon">[ .pdf ]</div>
          <div className="drop-title">
            {file ? 'Trocar arquivo' : 'Arraste o book aqui, ou clique para escolher'}
          </div>
          <div className="drop-sub">Somente arquivos PDF</div>
        </label>

        {file && <div className="filename">{file.name}</div>}

        <div style={{ marginTop: 20 }}>
          <input
            type="password"
            placeholder="Senha de acesso"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--ink-3)',
              border: '1px solid var(--line)',
              color: 'var(--text)',
              padding: '12px 14px',
              borderRadius: 2,
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 13
            }}
          />
        </div>

        <div className="actions">
          <button
            className="btn"
            onClick={handleSubmit}
            disabled={!file || status === 'uploading' || status === 'processing'}
          >
            {status === 'uploading'
              ? 'Enviando…'
              : status === 'processing'
              ? 'Processando…'
              : 'Processar book'}
          </button>
          {message && (
            <span className={`status ${status === 'error' ? 'err' : status === 'done' ? 'ok' : ''}`}>
              {message}
            </span>
          )}
        </div>

        {(status === 'uploading' || status === 'processing') && (
          <div className="scan-track">
            <div className="scan-bar" />
          </div>
        )}

        <div className="manifest">
          <div className="manifest-label">URL usada pelo n8n (node &quot;get Product Brochure&quot;)</div>
          <div className="url-row">
            <div className="url-box">{catalogUrl}</div>
            <button className="copy-btn" onClick={copyUrl}>
              Copiar
            </button>
          </div>
        </div>

        {result && (
          <div className="json-panel">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>

      <p className="footnote">
        Cada novo book processado <strong>substitui</strong> o catálogo anterior nessa URL. Se
        quiser manter o histórico de books antigos, salve o JSON exibido acima antes de subir um
        novo.
      </p>
    </main>
  );
}
