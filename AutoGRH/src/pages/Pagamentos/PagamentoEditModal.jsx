import { useEffect, useMemo, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { makePagamentosApi } from '../../services/pagamentosApi';
import { makeFaltasApi } from '../../services/faltasApi';

export default function PagamentoEditModal({ open, onClose, pagamento, onSaved, folha, faltasInicial = 0 }) {
  const { request } = useApi();
  const payApi = useMemo(() => makePagamentosApi(request), [request]);
  const faltasApi = useMemo(() => makeFaltasApi(request), [request]);

  const id = pagamento?.id ?? pagamento?.ID;
  const funcionarioId = pagamento?.funcionarioId ?? pagamento?.FuncionarioID ?? pagamento?.funcionarioID;
  const salarioBase = Number(pagamento?.salarioBase ?? pagamento?.SalarioBase ?? 0);

  const mesFolha = Number(folha?.mes);
  const anoFolha = Number(folha?.ano);
  const folhaPaga = !!(folha?.pago ?? folha?.Pago ?? false);
  const competenciaOK =
    Number.isInteger(mesFolha) && mesFolha >= 1 && mesFolha <= 12 &&
    Number.isInteger(anoFolha) && anoFolha >= 1900;

  const [adicional, setAdicional] = useState(0);
  const [desc, setDesc] = useState(0); 
  const [salFamilia, setSalFamilia] = useState(0);
  const [descVales, setDescVales] = useState(0); 

  const [faltasQtd, setFaltasQtd] = useState(0);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!open || !pagamento) return;

    setAdicional(Number(pagamento?.adicional ?? pagamento?.Adicional ?? 0));
    setDesc(Number(pagamento?.desconto ?? pagamento?.Desconto ?? pagamento?.descontoINSS ?? pagamento?.DescontoINSS ?? 0));
    setSalFamilia(Number(pagamento?.salarioFamilia ?? pagamento?.SalarioFamilia ?? 0));
    setDescVales(Number(pagamento?.descontoVales ?? pagamento?.DescontoVales ?? 0));
    setErr(null);
    setBusy(false);

    setFaltasQtd(Number(faltasInicial || 0));
  }, [open, pagamento, faltasInicial]);

  const descFaltas = (salarioBase / 30) * (faltasQtd || 0);
  const valorFinalPrev =
    (salarioBase || 0) + (adicional || 0) + (salFamilia || 0) - (desc || 0) - (descVales || 0) - (descFaltas || 0);

  async function onSubmit(e) {
    e?.preventDefault?.();
    if (!id) return;
    if (folhaPaga) {
      setErr('Esta folha está fechada. Não é possível editar.');
      return;
    }

    setBusy(true);
    setErr(null);
    try {
      await payApi.update(id, {
        adicional,
        inss: desc,
        familia: salFamilia,
      });

      if (funcionarioId && competenciaOK && Number.isFinite(faltasQtd)) {
        await faltasApi.upsertMensal(funcionarioId, {
          mes: mesFolha,
          ano: anoFolha,
          quantidade: Math.max(0, Math.floor(faltasQtd)),
        });
      }

      onSaved?.();
      onClose?.();
    } catch (e2) {
      setErr(e2?.message || 'Falha ao salvar');
    } finally {
      setBusy(false);
    }
  }

  if (!open || !pagamento) return null;

  return (
    <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,.45)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
        <div className="modal-content">
          <form onSubmit={onSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">Editar pagamento #{id}</h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>

            <div className="modal-body">
              {err && <div className="alert alert-danger mb-3">{err}</div>}

              <div className="row g-3">
                <div className="col-12 col-md-3">
                  <label className="form-label">Salário base</label>
                  <input className="form-control" type="number" step="0.01" value={salarioBase} disabled />
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label">Adicional</label>
                  <input className="form-control" type="number" step="0.01"
                         value={adicional} onChange={(e)=>setAdicional(Number(e.target.value||0))} disabled={folhaPaga}/>
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label">Desconto</label>
                  <input className="form-control" type="number" step="0.01"
                         value={desc} onChange={(e)=>setDesc(Number(e.target.value||0))} disabled={folhaPaga}/>
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label">Salário família</label>
                  <input className="form-control" type="number" step="0.01"
                         value={salFamilia} onChange={(e)=>setSalFamilia(Number(e.target.value||0))} disabled={folhaPaga}/>
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label">Desconto de vales</label>
                  <input className="form-control" type="number" step="0.01"
                         value={descVales} onChange={(e)=>setDescVales(Number(e.target.value||0))} disabled />
                  <div className="form-text">Este campo é calculado/atualizado pela folha.</div>
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label">Faltas (mês)</label>
                  <input className="form-control" type="number" step="1" min="0"
                         value={faltasQtd} onChange={(e)=>setFaltasQtd(Number(e.target.value||0))} disabled={folhaPaga}/>
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label">Desc. faltas (prévia)</label>
                  <input className="form-control" type="number" step="0.01"
                         value={Number.isFinite(descFaltas) ? descFaltas.toFixed(2) : ''} disabled />
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label">Valor final (prévia)</label>
                  <input className="form-control" type="number" step="0.01"
                         value={Number.isFinite(valorFinalPrev) ? valorFinalPrev.toFixed(2) : ''} disabled />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={busy}>
                Fechar
              </button>
              {!folhaPaga && (
                <button type="submit" className="btn btn-primary" disabled={busy || !competenciaOK}>
                  {busy ? 'Salvando…' : 'Salvar alterações'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
