import { useMemo, useState } from 'react';
import { useApi } from '../../../hooks/useApi';
import { makeFeriasApi } from '../../../services/feriasApi';
import { makeDescansosApi } from '../../../services/descansosApi';

export default function DescansoCreateModal({ funcId, onClose }) {
  const { request } = useApi();
  const feriasApi = useMemo(() => makeFeriasApi(request), [request]);
  const descansosApi = useMemo(() => makeDescansosApi(request), [request]);

  const [inicio, setInicio] = useState('');
  const [fim, setFim]       = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  function diasBetween(a, b) {
    try {
      const da = new Date(a); const db = new Date(b);
      const ms = db - da;
      if (!Number.isFinite(ms)) return 0;
      return Math.floor(ms / 86400000) + 1; 
    } catch { return 0; }
  }
  const dias = useMemo(() => (inicio && fim) ? diasBetween(inicio, fim) : 0, [inicio, fim]);

  async function onSubmit(e) {
    e?.preventDefault?.();
    setErr(null);
    if (!inicio || !fim || dias <= 0) {
      setErr('Informe um intervalo válido.');
      return;
    }
    try {
      setLoading(true);
      await descansosApi.createAuto(funcId, { inicio, fim });
      try { await feriasApi.garantir(funcId); } catch {}
      onClose?.();
      window.alert('Solicitação registrada com sucesso. Aguarde aprovação.');
    } catch (e2) {
      setErr(e2?.message || 'Falha ao registrar descanso.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal d-block show" tabIndex="-1" style={{ background:'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="modal-dialog" onClick={(ev)=>ev.stopPropagation()}>
        <form className="modal-content" onSubmit={onSubmit}>
          <div className="modal-header">
            <h5 className="modal-title">Requisitar férias (descanso)</h5>
            <button type="button" className="btn-close" onClick={onClose}/>
          </div>
          <div className="modal-body">
            {err && <div className="alert alert-danger">{err}</div>}
            <div className="mb-3">
              <label className="form-label">Início</label>
              <input type="date" className="form-control" value={inicio} onChange={e=>setInicio(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Fim</label>
              <input type="date" className="form-control" value={fim} onChange={e=>setFim(e.target.value)} required />
            </div>
            {dias > 0 && <div className="text-muted">Duração: {dias} dia(s)</div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !inicio || !fim}>Enviar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
