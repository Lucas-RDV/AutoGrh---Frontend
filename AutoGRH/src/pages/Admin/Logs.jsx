import { useEffect, useMemo, useState } from 'react';
import { useApi } from '../../hooks/useApi';

function normalizeLog(l) {
  return {
    id: l?.id ?? l?.ID ?? '',
    usuarioId: l?.usuario_id ?? l?.usuarioId ?? l?.UsuarioID ?? '',
    eventoId: l?.evento_id ?? l?.eventoId ?? l?.EventoID ?? '',
    evento: l?.evento ?? '',               
    message: l?.message ?? l?.Message ?? '',
    data: l?.data ?? l?.Data ?? '',        
    _raw: l,
  };
}

const Logs = () => {
  const { request } = useApi();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // filtros suportados no backend atual
  const [limit, setLimit] = useState(200); 
  const [usuarioId, setUsuarioId] = useState('');

  const [q, setQ] = useState('');

  async function fetchLogs() {
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams();
      if (limit) params.set('limit', String(limit));
      if (usuarioId) params.set('usuarioId', String(usuarioId));

      const res = await request(`/admin/logs?${params.toString()}`, { method: 'GET' });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Falha ao listar logs');
      }
      const data = await res.json();
      const norm = Array.isArray(data) ? data.map(normalizeLog) : [];
      setLogs(norm);
    } catch (e) {
      setErr(e?.message || 'Erro ao carregar logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [limit, usuarioId]);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    if (!text) return logs;
    return logs.filter(l =>
      String(l.message || '').toLowerCase().includes(text) ||
      String(l.id || '').includes(text) ||
      String(l.usuarioId || '').includes(text) ||
      String(l.evento || '').toLowerCase().includes(text) ||
      String(l.eventoId || '').includes(text)
    );
  }, [logs, q]);

  const APP_TZ = 'America/Campo_Grande';

function fmtDate(s) {
  if (!s) return '';
  const d = new Date(String(s)); 
  if (isNaN(d.getTime())) return String(s);
  return d.toLocaleString('pt-BR', { timeZone: APP_TZ });
}

  function handleLoadMore() {
    setLimit((prev) => prev + 200);
  }

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="card-title mb-0">Logs</h5>
          <span className="badge bg-info text-dark" title="Ordenado pelo backend por data decrescente">
            mais recentes primeiro
          </span>
        </div>

        <div className="row g-2 mb-3">
          <div className="col-6 col-md-3">
            <label className="form-label">Limite (itens)</label>
            <input
              type="number"
              min={50}
              step={50}
              className="form-control"
              value={limit}
              onChange={(e) => setLimit(Math.max(50, Number(e.target.value) || 200))}
            />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label">Usuário (ID)</label>
            <input
              type="number"
              min={0}
              className="form-control"
              placeholder="(vazio = todos)"
              value={usuarioId}
              onChange={(e) => setUsuarioId(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Buscar (mensagem / evento / IDs)</label>
            <input
              type="text"
              className="form-control"
              placeholder="Pesquisar nos resultados exibidos"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {err && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
            <div>{err}</div>
            <button className="btn btn-sm btn-outline-light" onClick={fetchLogs}>Tentar novamente</button>
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle mb-0">
            <thead>
              <tr>
                <th style={{width: 80}}>ID</th>
                <th style={{width: 120}}>Usuário</th>
                <th style={{width: 160}}>Evento</th>
                <th style={{width: 220}}>Data</th>
                <th>Mensagem</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5">
                    <div className="d-flex justify-content-center align-items-center py-4">
                      <div className="spinner-border" role="status" aria-hidden="true" />
                      <span className="ms-2 text-muted">Carregando…</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-muted">Nenhum log encontrado.</td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id}>
                    <td>{l.id}</td>
                    <td>{l.usuarioId}</td>
                    <td>{l.evento || l.eventoId}</td> {/* <-- usa o nome do evento */}
                    <td>{fmtDate(l.data)}</td>
                    <td className="text-break">{l.message}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-end mt-3">
          <button className="btn btn-outline-secondary" onClick={handleLoadMore} disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Carregando…
              </>
            ) : (
              <>Carregar mais ( +200)</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Logs;
