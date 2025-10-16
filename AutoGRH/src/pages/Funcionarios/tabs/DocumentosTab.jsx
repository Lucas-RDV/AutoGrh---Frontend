import { useEffect, useMemo, useState } from "react";
import { useApi } from "../../../hooks/useApi";
import { makeDocumentosApi } from "../../../services/documentosApi";

// util: extrai "nome" e "timestamp" do caminho salvo: documentos/{funcId}/1696623456_nome.ext
function fromPath(caminho) {
  if (!caminho) return { base: "arquivo", createdAt: null };
  const base = caminho.split(/[\\/]/).pop() || "arquivo";
  // tenta pegar TIMESTAMP_nome.ext
  const m = base.match(/^(\d+)_([\s\S]+)$/);
  if (!m) return { base, createdAt: null };
  const ts = parseInt(m[1], 10);
  const createdAt = Number.isFinite(ts) ? new Date(ts * 1000) : null;
  return { base: m[2], createdAt };
}

export default function DocumentosTab({ funcId }) {
  const { request } = useApi();
  const api = useMemo(() => makeDocumentosApi(request), [request]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [docs, setDocs] = useState([]);
  const [file, setFile] = useState(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const list = await api.listByFuncionario(funcId); // [{ id, funcionarioID, caminho }]
      const mapped = (Array.isArray(list) ? list : []).map((d) => {
        const { base, createdAt } = fromPath(d.caminho);
        return {
          id: d.id,
          funcionarioID: d.funcionarioID ?? d.funcionarioId,
          caminho: d.caminho,
          nome: base, // nome do arquivo sem timestamp
          criadoEm: createdAt,
        };
      });
      setDocs(mapped);
    } catch (e) {
      setErr(e?.message || "Erro ao carregar documentos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [funcId]);

  async function onUpload() {
    if (!file) return;
    try {
      await api.upload(funcId, file);
      setFile(null);
      await load();
    } catch (e) {
      alert(e?.message || "Falha ao enviar documento");
    }
  }

  async function onView(id) {
    try {
      const { blob, filename } = await api.fetchBlob(id);
      const url = URL.createObjectURL(blob);
      // abrir em nova aba para "visualizar"; se o tipo não for suportado, o navegador oferece download
      const w = window.open(url, "_blank", "noopener,noreferrer");
      // dica: em alguns navegadores, dar um nome pra nova guia:
      if (w && w.document) w.document.title = filename || "documento";
      // revoga quando a aba atual é fechada/navegada
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      alert(e?.message || "Falha ao abrir documento");
    }
  }

  async function onDelete(id) {
    if (!window.confirm("Excluir documento?")) return;
    try {
      await api.remove(id);
      await load();
    } catch (e) {
      alert(e?.message || "Falha ao excluir");
    }
  }

  return (
    <div>
      {err && <div className="alert alert-danger">{err}</div>}

      <div className="d-flex align-items-center gap-2 mb-3">
        <input
          type="file"
          className="form-control"
          style={{ maxWidth: 360 }}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button className="btn btn-primary" onClick={onUpload} disabled={!file}>
          Enviar
        </button>
      </div>

      {loading ? (
        <div className="text-muted">
          <div className="spinner-border me-2" role="status" />
          Carregando…
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                <th style={{ width: 80 }}>ID</th>
                <th>Arquivo</th>
                <th style={{ width: 180 }}>Criado em</th>
                <th style={{ width: 180 }} className="text-end">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {docs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted">
                    Nenhum documento.
                  </td>
                </tr>
              ) : (
                docs.map((d) => (
                  <tr key={d.id}>
                    <td>{d.id}</td>
                    <td className="text-truncate" title={d.caminho}>
                      {d.nome}
                    </td>
                    <td>
                      {d.criadoEm
                        ? d.criadoEm.toLocaleString()
                        : "-"}
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => onView(d.id)}
                          title="Visualizar / baixar"
                        >
                          Visualizar
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => onDelete(d.id)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
