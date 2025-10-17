import { useEffect, useMemo, useState } from 'react';
import { useApi } from '../../hooks/useApi';

function formatDate(isoOrSql) {
  const iso = typeof isoOrSql === 'string' && isoOrSql.includes(' ')
    ? isoOrSql.replace(' ', 'T')
    : isoOrSql;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR');
}

function tipoBadgeClass(tipo) {
  switch (tipo) {
    case 'FERIAS_VENCIDAS':   return 'badge text-bg-danger';
    case 'FERIAS_VENCENDO':   return 'badge text-bg-warning';
    case 'VALE_PENDENTE':     return 'badge text-bg-info';
    case 'DESCANSO_PENDENTE': return 'badge text-bg-secondary';
    default:                  return 'badge text-bg-light text-dark';
  }
}

export default function Home() {
  const { request } = useApi();
  const [avisos, setAvisos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await request('/avisos', { method: 'GET' });
        const data = await res.json();
        if (!alive) return;
        setAvisos(Array.isArray(data) ? data : []);
      } catch {
        if (!alive) return;
        setAvisos([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [request]);

  const count = avisos.length;
  const titulo = useMemo(() => `Avisos${count ? ` (${count})` : ''}`, [count]);

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10 col-xl-8">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 className="mb-0">{titulo}</h5>
          </div>

          <div className="card shadow-sm">
            <div className="card-body p-0">
              {loading ? (
                <div className="p-4 text-muted">Carregando avisos…</div>
              ) : count === 0 ? (
                <div className="p-4 text-muted">Nenhum aviso no momento.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <tbody>
                      {avisos.map((a) => (
                        <tr key={a.id}>
                          <td className="w-75">
                            <span className={`${tipoBadgeClass(a.tipo)} me-2`}>{a.tipo}</span>
                            <span>{a.mensagem}</span>
                          </td>
                          <td className="w-25 text-end text-muted pe-4">
                            {formatDate(a.criado_em || a.criadoEm)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
