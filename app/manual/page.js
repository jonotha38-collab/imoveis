'use client';

import { useState, useEffect } from 'react';

const CAMPOS_VAZIOS = {
  titulo: '',
  tipo: 'apartamento',
  localizacao: '',
  area_m2: '',
  quartos: '',
  banheiros: '',
  vagas_garagem: '',
  preco: '',
  diferenciais: '',
  descricao: ''
};

export default function CadastroManual() {
  const [password, setPassword] = useState('');
  const [form, setForm] = useState(CAMPOS_VAZIOS);
  const [imoveis, setImoveis] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | saving | error | ok
  const [message, setMessage] = useState('');
  const [carregando, setCarregando] = useState(true);

  async function carregarLista() {
    try {
      const res = await fetch('/api/catalogo');
      const data = await res.json();
      setImoveis((data.imoveis || []).filter((i) => i.origem === 'manual'));
    } catch {
      // silencioso - lista so' e' informativa
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarLista();
  }, []);

  function atualizarCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function salvar() {
    if (!form.titulo.trim()) {
      setStatus('error');
      setMessage('Preencha ao menos o título do imóvel.');
      return;
    }

    setStatus('saving');
    setMessage('Salvando…');

    try {
      const res = await fetch('/api/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, imovel: form })
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Não foi possível salvar.');
        return;
      }

      setStatus('ok');
      setMessage('Imóvel cadastrado e publicado!');
      setForm(CAMPOS_VAZIOS);
      carregarLista();
    } catch {
      setStatus('error');
      setMessage('Erro de conexão. Tente novamente.');
    }
  }

  async function excluir(id) {
    setStatus('saving');
    setMessage('Excluindo…');
    try {
      const res = await fetch('/api/manual', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, id })
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Não foi possível excluir.');
        return;
      }

      setStatus('ok');
      setMessage('Imóvel removido.');
      carregarLista();
    } catch {
      setStatus('error');
      setMessage('Erro de conexão. Tente novamente.');
    }
  }

  const campoStyle = {
    width: '100%',
    background: 'var(--ink-3)',
    border: '1px solid var(--line)',
    color: 'var(--text)',
    padding: '11px 13px',
    borderRadius: 2,
    fontFamily: 'IBM Plex Sans, sans-serif',
    fontSize: 14
  };

  const labelStyle = {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    display: 'block',
    marginBottom: 6
  };

  return (
    <main className="wrap">
      <div className="eyebrow">Cadastro manual</div>
      <h1>Adicione um imóvel diretamente, sem precisar de PDF</h1>
      <p className="lede">
        Preencha os campos abaixo. Ao salvar, o imóvel entra automaticamente no catálogo que a
        IA do WhatsApp já consulta — junto com o que vier de books em PDF.
      </p>

      <div className="sheet">
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Senha de acesso</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={campoStyle}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Título *</label>
            <input
              style={campoStyle}
              value={form.titulo}
              onChange={(e) => atualizarCampo('titulo', e.target.value)}
              placeholder="Ex: Apartamento 2 quartos - Bairro Jardim"
            />
          </div>
          <div>
            <label style={labelStyle}>Tipo</label>
            <select
              style={campoStyle}
              value={form.tipo}
              onChange={(e) => atualizarCampo('tipo', e.target.value)}
            >
              <option value="apartamento">Apartamento</option>
              <option value="casa">Casa</option>
              <option value="terreno">Terreno</option>
              <option value="comercial">Comercial</option>
              <option value="outro">Outro</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Localização</label>
          <input
            style={campoStyle}
            value={form.localizacao}
            onChange={(e) => atualizarCampo('localizacao', e.target.value)}
            placeholder="Bairro, cidade"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Área (m²)</label>
            <input
              type="number"
              style={campoStyle}
              value={form.area_m2}
              onChange={(e) => atualizarCampo('area_m2', e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Quartos</label>
            <input
              type="number"
              style={campoStyle}
              value={form.quartos}
              onChange={(e) => atualizarCampo('quartos', e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Banheiros</label>
            <input
              type="number"
              style={campoStyle}
              value={form.banheiros}
              onChange={(e) => atualizarCampo('banheiros', e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Vagas</label>
            <input
              type="number"
              style={campoStyle}
              value={form.vagas_garagem}
              onChange={(e) => atualizarCampo('vagas_garagem', e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Preço</label>
          <input
            style={campoStyle}
            value={form.preco}
            onChange={(e) => atualizarCampo('preco', e.target.value)}
            placeholder="Ex: R$ 350.000"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Diferenciais (separados por vírgula)</label>
          <input
            style={campoStyle}
            value={form.diferenciais}
            onChange={(e) => atualizarCampo('diferenciais', e.target.value)}
            placeholder="Piscina, academia, portaria 24h"
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Descrição</label>
          <textarea
            style={{ ...campoStyle, minHeight: 90, resize: 'vertical' }}
            value={form.descricao}
            onChange={(e) => atualizarCampo('descricao', e.target.value)}
          />
        </div>

        <div className="actions">
          <button className="btn" onClick={salvar} disabled={status === 'saving'}>
            {status === 'saving' ? 'Salvando…' : 'Salvar imóvel'}
          </button>
          {message && (
            <span className={`status ${status === 'error' ? 'err' : status === 'ok' ? 'ok' : ''}`}>
              {message}
            </span>
          )}
        </div>
      </div>

      <div style={{ marginTop: 40 }}>
        <div className="manifest-label" style={{ marginBottom: 14 }}>
          Imóveis cadastrados manualmente ({imoveis.length})
        </div>

        {carregando && <p className="footnote">Carregando…</p>}

        {!carregando && imoveis.length === 0 && (
          <p className="footnote">Nenhum imóvel cadastrado manualmente ainda.</p>
        )}

        {imoveis.map((imovel) => (
          <div
            key={imovel.id}
            className="sheet"
            style={{ padding: 20, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}
          >
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{imovel.titulo}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {[imovel.tipo, imovel.localizacao, imovel.preco].filter(Boolean).join(' · ')}
              </div>
            </div>
            <button className="copy-btn" onClick={() => excluir(imovel.id)}>
              Excluir
            </button>
          </div>
        ))}
      </div>

      <p className="footnote">
        Imóveis cadastrados aqui <strong>não são apagados</strong> quando você processa um novo
        book em PDF — os dois tipos de cadastro convivem juntos no mesmo catálogo.
      </p>
    </main>
  );
}
