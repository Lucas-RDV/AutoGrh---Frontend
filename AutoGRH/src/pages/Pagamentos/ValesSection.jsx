import { useEffect, useMemo, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { makeValesApi } from '../../services/valesApi';
import { useFuncionarios } from '../../hooks/useFuncionarios';
import ValesCreateModal from './ValesCreateModal';

function badge(v) {
  const aprovado = !!(v?.aprovado ?? v?.Aprovado);
  const pago = !!(v?.pago ?? v?.Pago);
  const ativo = !!(v?.ativo ?? v?.Ativo);
  if (!ativo) return <span className="badge bg-secondary">inativo</span>;
  if (pago)   return <span className="badge bg-success">pago</span>;
  if (aprovado) return <span className="badge bg-primary">aprovado</span>;
  return <span className="badge bg-warning text-dark">pendente</span>;
}

function formatDateOnly(input) {
  if (!input) return '';
  const s = String(input);
  let d = new Date(s);
  if (isNaN(d)) d = new Date(s.replace(' ', 'T'));
  if (isNaN(d)) {
    const base = s.split('T')[0].split(' ')[0];
    const [y, m, day] = base.split('-');
    if (y && m && day) return `${day.padStart(2,'0')}/${m.padStart(2,'0')}/${y}`;
    return s;
  }
  const day = String(d.getDate()).padStart(2, '0');
  const mon  = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${mon}/${year}`;
}

function stripAccents(str='') {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default function ValesSection() {
  const { request } = useApi();
  const { user } = useAuth();
  const isAdmin = (user?.perfil || user?.Perfil || '').toLowerCase() === 'admin';

  const api = makeValesApi(request);

  const [tab, setTab] = useState('todos');
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState(false);

  const { list: funcs } = useFuncionarios({ onlyActive: true });
  const nomeByFuncionario = useMemo(() => {
    const m = new Map();
    for (const f of funcs) m.set(f.id, f.nome);
    return m;
  }, [funcs]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      let data;
      if (tab === 'pendentes') data = await api.listPendentes();
      else if (tab === 'aprovados-nao-pagos') data = await api.listAprovadosNaoPagos();
      else data = await api.listAll();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.message || 'Erro ao carregar vales');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load();}, [tab]);

  const filtered = useMemo(() => {
    const t = q.trim();

    if (!t) return items;

    const mmAaaa = /^(\d{1,2})\s*\/\s*(\d{4})$/;
    const m = t.match(mmAaaa);
    if (m) {
      const mes = Math.max(1, Math.min(12, Number(m[1] || 1)));
      const ano = Number(m[2]);
      return items.filter(v => {
        const data = String(v?.data ?? v?.Data ?? '');
        const d = new Date(data.replace(' ', 'T'));
        const mItem = d.getMonth() + 1;
        const aItem = d.getFullYear();
        return mItem === mes && aItem === ano;
      });
    }

    const needle = stripAccents(t.toLowerCase());
    return items.filter(v => {
      const funcId = v?.funcionario_id ?? v?.funcionarioID ?? v?.FuncionarioID;
      const nome = stripAccents((nomeByFuncionario.get(funcId) || '').toLowerCase());
      return nome.includes(needle);
    });
  }, [items, q, nomeByFuncionario]);

  async function onApprove(id) {
    if (!isAdmin) return;
    if (!window.confirm('Aprovar este vale?')) return;
    setBusy(true);
    try { await api.approve(id); await load(); }
    catch (e) { alert(e?.message || 'Falha ao aprovar vale'); }
    finally { setBusy(false); }
  }

  async function onPagar(id) {
    if (!isAdmin) return;
    if (!window.confirm('Marcar este vale como pago?')) return;
    setBusy(true);
    try { await api.pagar(id); await load(); }
    catch (e) { alert(e?.message || 'Falha ao marcar pagamento'); }
    finally { setBusy(false); }
  }

  async function onDelete(id) {
    if (!isAdmin) return;
    if (!window.confirm('Excluir permanentemente este vale?')) return;
    setBusy(true);
    try { await api.remove(id); await load(); }
    catch (e) { alert(e?.message || 'Falha ao excluir vale'); }
    finally { setBusy(false); }
  }

  return (
    <div className="card shadow-sm mt-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="card-title mb-0">Vales</h5>
          <div className="btn-group" role="group" aria-label="abas de vales">
            <button className={`btn btn-outline-secondary ${tab==='todos'?'active':''}`}
                    onClick={() => setTab('todos')}>Todos</button>
            <button className={`btn btn-outline-secondary ${tab==='pendentes'?'active':''}`}
                    onClick={() => setTab('pendentes')}>Pendentes</button>
            <button className={`btn btn-outline-secondary ${tab==='aprovados-nao-pagos'?'active':''}`}
                    onClick={() => setTab('aprovados-nao-pagos')}>Aprovados não pagos</button>
          </div>
        </div>

        <div className="row g-2 mb-3">
          <div className="col-12 col-md-6">
            <input
              className="form-control"
              placeholder="Buscar por nome ou mm/aaaa (ex.: 10/2025)"
              value={q}
              onChange={(e)=>setQ(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-6 d-flex justify-content-end">
            <button className="btn btn-primary" onClick={()=>setShowCreate(true)}>Criar vale</button>
          </div>
        </div>

        {err && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center">
            <div>{err}</div>
            <button className="btn btn-sm btn-outline-light" onClick={load}>Tentar novamente</button>
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle">
            <thead>
              <tr>
                <th style={{width:90}}>ID</th>
                <th>Funcionário</th>
                <th style={{width:140}}>Valor</th>
                <th style={{width:160}}>Data</th>
                <th style={{width:120}}>Status</th>
                <th style={{width:220}}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="py-4 text-center">
                  <div className="spinner-border" role="status" aria-hidden="true"/>
                  <span className="ms-2 text-muted">Carregando…</span>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" className="text-muted">Nenhum vale encontrado.</td></tr>
              ) : (
                filtered.map(v => {
                  const id = v?.id ?? v?.ID;
                  const funcId = v?.funcionario_id ?? v?.funcionarioID ?? v?.FuncionarioID;
                  const nome = nomeByFuncionario.get(funcId) || `ID ${funcId}`;
                  const valor = v?.valor ?? v?.Valor;
                  const data = v?.data ?? v?.Data;

                  const aprovado = !!(v?.aprovado ?? v?.Aprovado);
                  const pago = !!(v?.pago ?? v?.Pago);
                  const ativo = !!(v?.ativo ?? v?.Ativo);

                  return (
                    <tr key={id}>
                      <td>{id}</td>
                      <td>{nome}</td>
                      <td>R$ {Number(valor).toFixed(2)}</td>
                      <td>{formatDateOnly(data)}</td>
                      <td>{badge(v)}</td>
                      <td className="align-middle">
                        <div className="d-flex flex-wrap gap-2 justify-content-start text-nowrap" style={{ minWidth: 220 }}>
                          {isAdmin && ativo && !aprovado && (
                            <button className="btn btn-sm btn-outline-primary" disabled={busy} onClick={()=>onApprove(id)}>
                              Aprovar
                            </button>
                          )}
                          {isAdmin && ativo && aprovado && !pago && (
                            <button className="btn btn-sm btn-outline-success" disabled={busy} onClick={()=>onPagar(id)}>
                              Marcar pago
                            </button>
                          )}
                          {isAdmin && (
                            <button className="btn btn-sm btn-outline-danger" disabled={busy} onClick={()=>onDelete(id)}>
                              Excluir
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ValesCreateModal open={showCreate} onClose={()=>setShowCreate(false)} onCreated={load} />
    </div>
  );
}
