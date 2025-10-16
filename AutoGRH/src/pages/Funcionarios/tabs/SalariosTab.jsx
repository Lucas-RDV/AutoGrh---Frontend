import { useEffect, useState } from 'react';
import { useApi } from '../../../hooks/useApi';
import { makeSalariosApi } from '../../../services/salariosApi';

const toBRL = (n) => `R$ ${Number(n||0).toFixed(2)}`;
const toISO = (d) => (d ? String(d).slice(0,10) : '');

export default function SalariosTab({ funcId }) {
  const { request } = useApi();
  const api = makeSalariosApi(request);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [registrados, setRegistrados] = useState([]);
  const [reais, setReais] = useState([]);
  const [realAtual, setRealAtual] = useState(null);

  const [novoReg, setNovoReg] = useState('');
  const [novoReal, setNovoReal] = useState('');

  async function load() {
    setLoading(true); setErr(null);
    try {
      const [regs, reaisList, atual] = await Promise.all([
        api.listRegistrados(funcId),
        api.listReais(funcId),
        api.getRealAtual(funcId).catch(()=>null),
      ]);
      setRegistrados(Array.isArray(regs)? regs: []);
      setReais(Array.isArray(reaisList)? reaisList: []);
      setRealAtual(atual || null);
    } catch (e) {
      setErr(e?.message || 'Erro ao carregar salários');
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{ load();}, [funcId]);

  async function addReg() {
    try {
      await api.createRegistrado(funcId, Number(novoReg));
      setNovoReg('');
      load();
    } catch (e) { alert(e?.message || 'Falha ao criar salário registrado'); }
  }
  async function addReal() {
    try {
      await api.createReal(funcId, Number(novoReal));
      setNovoReal('');
      load();
    } catch (e) { alert(e?.message || 'Falha ao criar salário real'); }
  }
  async function delReg(id) {
    if (!window.confirm('Excluir salário registrado?')) return;
    try { await api.deleteRegistrado(id); load(); } catch (e) { alert(e?.message || 'Falha ao excluir'); }
  }
  async function delReal(id) {
    if (!window.confirm('Excluir salário real?')) return;
    try { await api.deleteReal(id); load(); } catch (e) { alert(e?.message || 'Falha ao excluir'); }
  }

  return (
    <div className="row g-3">
      {err && <div className="alert alert-danger">{err}</div>}
      {loading ? (
        <div className="text-muted"><div className="spinner-border me-2" role="status" />Carregando…</div>
      ) : (
        <>
          <div className="col-12 col-lg-6">
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <span>Salários <strong>Registrados</strong></span>
                <div className="input-group input-group-sm" style={{width:200}}>
                  <input className="form-control" placeholder="0.00" value={novoReg} onChange={e=>setNovoReg(e.target.value)} />
                  <button className="btn btn-primary" onClick={addReg}>Adicionar</button>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-sm align-middle">
                    <thead><tr><th>ID</th><th>Início</th><th>Fim</th><th>Valor</th><th></th></tr></thead>
                    <tbody>
                      {registrados.length===0 ? (
                        <tr><td colSpan={5} className="text-muted">Nenhum registro.</td></tr>
                      ) : registrados.map(s=>(
                        <tr key={s.id}>
                          <td>{s.id}</td>
                          <td>{toISO(s.inicio)}</td>
                          <td>{s.fim ? toISO(s.fim) : '-'}</td>
                          <td>{toBRL(s.valor)}</td>
                          <td className="text-end">
                            <button className="btn btn-sm btn-outline-danger" onClick={()=>delReg(s.id)}>Excluir</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <span>Salários <strong>Reais</strong> {realAtual ? <small className="text-muted ms-2">Atual: {toBRL(realAtual?.valor)}</small> : null}</span>
                <div className="input-group input-group-sm" style={{width:200}}>
                  <input className="form-control" placeholder="0.00" value={novoReal} onChange={e=>setNovoReal(e.target.value)} />
                  <button className="btn btn-primary" onClick={addReal}>Adicionar</button>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-sm align-middle">
                    <thead><tr><th>ID</th><th>Início</th><th>Fim</th><th>Valor</th><th></th></tr></thead>
                    <tbody>
                      {reais.length===0 ? (
                        <tr><td colSpan={5} className="text-muted">Nenhum registro.</td></tr>
                      ) : reais.map(s=>(
                        <tr key={s.id}>
                          <td>{s.id}</td>
                          <td>{toISO(s.inicio)}</td>
                          <td>{s.fim ? toISO(s.fim) : '-'}</td>
                          <td>{toBRL(s.valor)}</td>
                          <td className="text-end">
                            <button className="btn btn-sm btn-outline-danger" onClick={()=>delReal(s.id)}>Excluir</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
