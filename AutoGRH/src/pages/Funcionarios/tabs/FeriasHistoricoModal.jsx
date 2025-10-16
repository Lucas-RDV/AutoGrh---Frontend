import { useEffect, useMemo, useState } from 'react';
import { useApi } from '../../../hooks/useApi';
import { makeFeriasApi } from '../../../services/feriasApi';
import { makeDescansosApi } from '../../../services/descansosApi';
import { useAuth } from '../../../context/AuthContext';

function fmtDate(d) {
  try {
    const x = typeof d === 'string' ? new Date(d) : d;
    if (Number.isNaN(x?.getTime())) return '-';
    return x.toLocaleDateString('pt-BR');
  } catch { return '-'; }
}
function diasEntre(inicio, fim) {
  try {
    const a = new Date(inicio), b = new Date(fim);
    const ms = (b - a);
    return Math.floor(ms / (24*3600*1000)) + 1;
  } catch { return '-'; }
}

export default function FeriasHistoricoModal({ funcId, onClose }) {
  const { request } = useApi();
  const feriasApi = useMemo(() => makeFeriasApi(request), [request]);
  const descansosApi = useMemo(() => makeDescansosApi(request), [request]);
  const { user } = useAuth();
  const isAdmin = (user?.perfil || user?.role) === 'admin' || user?.isAdmin === true;

  const [tab, setTab] = useState('periodos'); // 'periodos' | 'solicitacoes'
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [periodos, setPeriodos] = useState([]);
  const [selected, setSelected] = useState(null);

  const [descansos, setDescansos] = useState([]);
  const [filtro, setFiltro] = useState('pago'); // 'pago' | 'aprovado' | 'pendente' | 'todos'

  const descansosFiltrados = useMemo(() => {
    if (!Array.isArray(descansos)) return [];
    switch (filtro) {
      case 'pago':      return descansos.filter(d => !!d.pago);
      case 'aprovado':  return descansos.filter(d => !!d.aprovado && !d.pago);
      case 'pendente':  return descansos.filter(d => !d.aprovado);
      default:          return descansos;
    }
  }, [descansos, filtro]);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const list = await feriasApi.listByFuncionario(funcId);
      setPeriodos(Array.isArray(list) ? list : []);
      setSelected(null);
      // Carrega TODOS os descansos do funcionário (não por período)
      const all = await descansosApi.listByFuncionario(funcId);
      setDescansos(Array.isArray(all) ? all : []);
    } catch (e) {
      setErr(e?.message || 'Falha ao carregar férias/descansos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [funcId]);

  function calcTotalLinha(p) {
    const valor = Number(p?.valor || 0);
    const terco = Number(p?.terco || 0);
    return p?.tercoPago ? valor : (valor + terco);
  }

  function onSelectPeriodo(p) {
    setSelected(p);
    setTab('solicitacoes');
  }

  async function onMarcarPago(pId) {
    if (!window.confirm('Confirmar: marcar este período como PAGO? (Também marcará o TERÇO como pago, se ainda não estiver)')) return;
    try { await feriasApi.marcarPago(pId); await load(); }
    catch (e) { alert(e?.message || 'Falha ao marcar como pago'); }
  }
  async function onMarcarTercoPago(pId) {
    try { await feriasApi.marcarTercoPago(pId); await load(); }
    catch (e) { alert(e?.message || 'Falha ao marcar terço'); }
  }
  async function onDesmarcarTerco(pId) {
    if (!window.confirm('Reverter: desmarcar TERÇO pago?')) return;
    try { await feriasApi.desmarcarTercoPago(pId); await load(); }
    catch (e) { alert(e?.message || 'Falha ao reverter terço'); }
  }
  async function onDesmarcarPago(pId) {
    if (!window.confirm('Reverter: desmarcar PAGO?')) return;
    try { await feriasApi.desmarcarPago(pId); await load(); }
    catch (e) { alert(e?.message || 'Falha ao reverter pago'); }
  }

  // AÇÕES de DESCANSO — somente admin
  async function onAprovar(id) {
    try { await descansosApi.aprovar(id); await load(); }
    catch (e) { alert(e?.message || 'Falha ao aprovar'); }
  }
  async function onReprovar(id) {
    if (!window.confirm('Reprovar esta solicitação? Isso irá removê-la.')) return;
    try { await descansosApi.remove(id); await load(); }
    catch (e) { alert(e?.message || 'Falha ao reprovar'); }
  }
  async function onPagar(id) {
    try { await descansosApi.pagar(id); await load(); }
    catch (e) { alert(e?.message || 'Falha ao marcar pago'); }
  }
  async function onDesmarcarPagoDesc(id) {
    if (!window.confirm('Reverter: desmarcar pago desta solicitação?')) return;
    try { await descansosApi.desmarcarPago(id); await load(); }
    catch (e) { alert(e?.message || 'Falha ao desmarcar pago'); }
  }

  return (
    <div className="modal d-block show" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="modal-dialog modal-xl" onClick={(e)=>e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Férias — Histórico</h5>
            <button type="button" className="btn-close" onClick={onClose}/>
          </div>

          <div className="modal-body">
            <ul className="nav nav-tabs">
              <li className="nav-item">
                <button className={`nav-link ${tab==='periodos'?'active':''}`} onClick={()=>setTab('periodos')}>
                  Períodos
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link ${tab==='solicitacoes'?'active':''}`} onClick={()=>setTab('solicitacoes')}>
                  Solicitações (descansos)
                </button>
              </li>
            </ul>

            {err && <div className="alert alert-danger mt-3">{err}</div>}
            {loading ? (
              <div className="mt-3 text-muted"><span className="spinner-border spinner-border-sm me-2" />Carregando…</div>
            ) : (
              <>
                {tab === 'periodos' && (
                  <div className="table-responsive mt-3">
                    <table className="table table-sm align-middle">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Início</th>
                          <th>Vencimento</th>
                          <th>Dias</th>
                          <th>Valor dos dias</th>
                          <th>Terço</th>
                          <th>Total</th>
                          <th>Badges</th>
                          <th className="text-end">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(periodos?.length ? periodos : []).map(p => {
                          const valor = Number(p?.valor || 0);
                          const terco = Number(p?.terco || 0);
                          const total = calcTotalLinha(p);
                          return (
                            <tr key={p.id} className={selected?.id === p.id ? 'table-primary' : ''} style={{ cursor:'pointer' }} onClick={()=>onSelectPeriodo(p)}>
                              <td>{p.id}</td>
                              <td>{fmtDate(p.inicio)}</td>
                              <td>{fmtDate(p.vencimento)}</td>
                              <td>{p.dias ?? '-'}</td>
                              <td>R$ {valor.toFixed(2)}</td>
                              <td>R$ {terco.toFixed(2)}</td>
                              <td><strong>R$ {total.toFixed(2)}</strong></td>
                              <td>
                                {p.pago && <span className="badge bg-success me-1">Pago</span>}
                                {!p.pago && p.vencido && <span className="badge bg-danger me-1">Vencido</span>}
                                {p.tercoPago && <span className="badge bg-info text-dark">Terço pago</span>}
                              </td>
                              <td className="text-end">
                                <div className="btn-group btn-group-sm">
                                  {!p.tercoPago && <button className="btn btn-outline-secondary" onClick={(e)=>{e.stopPropagation(); onMarcarTercoPago(p.id);}}>Terço pago</button>}
                                  {!p.pago && <button className="btn btn-outline-success" onClick={(e)=>{e.stopPropagation(); onMarcarPago(p.id);}}>Marcar como pago</button>}
                                  {isAdmin && p.tercoPago && <button className="btn btn-outline-warning" onClick={(e)=>{e.stopPropagation(); onDesmarcarTerco(p.id);}}>Desmarcar terço</button>}
                                  {isAdmin && p.pago && <button className="btn btn-outline-warning" onClick={(e)=>{e.stopPropagation(); onDesmarcarPago(p.id);}}>Desmarcar pago</button>}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {(!periodos || periodos.length===0) && (
                          <tr><td colSpan={9} className="text-muted">Nenhum período de férias.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {tab === 'solicitacoes' && (
                  <div className="mt-3">
                    <div className="d-flex align-items-center mb-2">
                      <strong className="me-2">Filtro:</strong>
                      <select className="form-select form-select-sm" style={{maxWidth:220}} value={filtro} onChange={e=>setFiltro(e.target.value)}>
                        <option value="pago">Pago</option>
                        <option value="aprovado">Aprovado (não pago)</option>
                        <option value="pendente">Pendente</option>
                        <option value="todos">Todos</option>
                      </select>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-sm align-middle">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Início</th>
                            <th>Fim</th>
                            <th>Dias</th>
                            <th>Valor</th>
                            <th>Status</th>
                            <th className="text-end">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(descansosFiltrados?.length ? descansosFiltrados : []).map(d=>(
                            <tr key={d.id}>
                              <td>{d.id}</td>
                              <td>{fmtDate(d.inicio)}</td>
                              <td>{fmtDate(d.fim)}</td>
                              <td>{diasEntre(d.inicio, d.fim)}</td>
                              <td>R$ {Number(d.valor||0).toFixed(2)}</td>
                              <td>
                                {d.pago ? <span className="badge bg-success me-1">Pago</span>
                                  : d.aprovado ? <span className="badge bg-primary me-1">Aprovado</span>
                                  : <span className="badge bg-secondary me-1">Pendente</span>}
                              </td>
                              <td className="text-end">
                                <div className="btn-group btn-group-sm">
                                  {isAdmin && !d.aprovado && <button className="btn btn-outline-primary" onClick={()=>onAprovar(d.id)}>Aprovar</button>}
                                  {isAdmin && !d.pago && <button className="btn btn-outline-success" onClick={()=>onPagar(d.id)}>Marcar pago</button>}
                                  {isAdmin && d.pago && <button className="btn btn-outline-warning" onClick={()=>onDesmarcarPagoDesc(d.id)}>Desmarcar pago</button>}
                                  {isAdmin && !d.pago && <button className="btn btn-outline-danger" onClick={()=>onReprovar(d.id)}>Reprovar</button>}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {(!descansosFiltrados || descansosFiltrados.length===0) && (
                            <tr><td colSpan={7} className="text-muted">Nenhuma solicitação encontrada.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
