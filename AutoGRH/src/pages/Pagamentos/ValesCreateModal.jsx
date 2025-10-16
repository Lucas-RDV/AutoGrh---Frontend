import { useEffect, useMemo, useRef, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { makeValesApi } from '../../services/valesApi';
import { useFuncionarios } from '../../hooks/useFuncionarios';

export default function ValesCreateModal({ open, onClose, onCreated }) {
  const { request } = useApi();
  const api = useMemo(() => makeValesApi(request), [request]);

  const { filtered: funcs, loading, err, q, setQ } = useFuncionarios({ onlyActive: true });
  const [selected, setSelected] = useState(null); // { id, nome }
  const [valor, setValor] = useState('');
  const [data, setData] = useState('');
  const [busy, setBusy] = useState(false);

  const [openList, setOpenList] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setSelected(null);
      setValor('');
      // data padrão = hoje (YYYY-MM-DD)
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      setData(`${yyyy}-${mm}-${dd}`);

      setQ('');
      setOpenList(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, setQ]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selected?.id || !valor || !data) return;
    setBusy(true);
    try {
      await api.create({ funcionarioID: Number(selected.id), valor: Number(valor), data });
      onCreated?.();
      onClose?.();
    } catch (e) {
      alert(e?.message || 'Falha ao criar vale');
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">Criar vale</h5>
              <button type="button" className="btn-close" onClick={() => !busy && onClose?.()}></button>
            </div>

            <div className="modal-body">
              {/* Funcionário buscável por nome/ID (dropdown controlado) */}
              <div className="mb-3">
                <label className="form-label">Funcionário</label>
                <div className="dropdown w-100">
                  <input
                    ref={inputRef}
                    type="text"
                    className="form-control"
                    placeholder={selected ? `${selected.nome} (ID ${selected.id})` : 'Digite nome ou ID'}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onFocus={() => setOpenList(true)}
                    onClick={() => setOpenList(true)}
                    onBlur={() => setTimeout(() => setOpenList(false), 150)}
                  />
                  <ul className={`dropdown-menu w-100 ${openList ? 'show' : ''}`} style={{ maxHeight: 260, overflowY: 'auto' }}>
                    {loading ? (
                      <li className="px-3 py-2 text-muted">Carregando…</li>
                    ) : err ? (
                      <li className="px-3 py-2 text-danger">Erro: {err}</li>
                    ) : funcs.length === 0 ? (
                      <li className="px-3 py-2 text-muted">Nenhum resultado</li>
                    ) : (
                      funcs.slice(0, 50).map(f => (
                        <li key={f.id}>
                          <button
                            type="button"
                            className="dropdown-item d-flex justify-content-between align-items-center"
                            onMouseDown={() => {
                              setSelected(f);
                              setQ(f.nome);
                              setOpenList(false); // fecha ao selecionar
                            }}
                          >
                            <span>{f.nome}</span>
                            <small className="text-muted">ID {f.id}</small>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                {selected && (
                  <div className="form-text">
                    Selecionado: <strong>{selected.nome}</strong> (ID {selected.id})
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Valor</label>
                <input
                  className="form-control"
                  type="number"
                  step="0.01"
                  min={0}
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Data</label>
                <input
                  className="form-control"
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  required
                />
                <div className="form-text">Formato: YYYY-MM-DD</div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => onClose?.()}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={busy || !selected?.id}>
                {busy ? 'Salvando…' : 'Criar vale'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
