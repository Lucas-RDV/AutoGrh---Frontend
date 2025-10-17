import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../../hooks/useApi";
import { makeFuncionariosApi } from "../../services/funcionariosApi";
import { makePessoasApi } from "../../services/pessoasApi";

const nz = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v);
  return s.trim() === "" ? null : s;
};
function normalizeText(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
function cpfMask(v = "") {
  const d = String(v || "").replace(/\D/g, "").slice(0, 11);
  if (d.length !== 11) return v || "";
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}

export default function Funcionarios() {
  const { request } = useApi();
  const funcApi = useMemo(() => makeFuncionariosApi(request), [request]);
  const pesApi  = useMemo(() => makePessoasApi(request), [request]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [search, setSearch] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const list = await funcApi.list();
        const base = Array.isArray(list) ? list : [];

        const enriched = await Promise.all(
          base.map(async (f) => {
            const id = f?.id;
            const pessoaId = f?.pessoa_id ?? f?.pessoaId ?? null;

            let cargo = nz(f?.cargo);
            let nome  = null;
            let cpf   = null;

            try {
              if (id != null) {
                const fd = await funcApi.getById(id);
                cargo = nz(cargo) ?? nz(fd?.cargo);
                nome = nome ?? nz(fd?.pessoa?.nome);
                cpf  = cpf  ?? nz(fd?.pessoa?.cpf);
              }
            } catch {}

            try {
              if ((!nome || !cpf) && pessoaId) {
                const p = await pesApi.getById(pessoaId);
                nome = nome ?? nz(p?.nome);
                cpf  = cpf  ?? nz(p?.cpf);
              }
            } catch {}

            return {
              ...f,
              displayNome: nome ?? "-",
              displayCpf:  cpf  ?? "-",
              displayCargo: cargo ?? "-",
              isAtivo: f?.demissao ? false : true, 
            };
          })
        );

        if (!cancelled) setRows(enriched);
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Erro ao carregar funcionários");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [funcApi, pesApi]);

  const filtered = useMemo(() => {
    const q = normalizeText(search);
    return rows.filter((f) => {
      const nome = normalizeText(f?.displayNome || "");
      const okNome = !q || nome.includes(q);
      const okAtivo = showOnlyActive ? f?.isAtivo : true;
      return okNome && okAtivo;
    });
  }, [rows, search, showOnlyActive]);

  return (
    <div className="container py-3">
      <div className="d-flex align-items-center mb-3">
        <h3 className="mb-0">Funcionários</h3>
        <div className="ms-auto d-flex gap-2">
          <input
            className="form-control"
            style={{ width: 280 }}
            placeholder="Buscar por nome…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="form-check form-switch d-flex align-items-center">
            <input
              className="form-check-input"
              type="checkbox"
              id="onlyActive"
              checked={showOnlyActive}
              onChange={(e) => setShowOnlyActive(e.target.checked)}
            />
            <label className="form-check-label ms-2" htmlFor="onlyActive">
              Mostrar apenas ativos
            </label>
          </div>
          <Link to="/funcionarios/novo" className="btn btn-primary">
            Registrar funcionário
          </Link>
        </div>
      </div>

      {loading && <div className="alert alert-secondary">Carregando…</div>}
      {err && <div className="alert alert-danger">{err}</div>}

      {!loading && !err && (
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Cargo</th>
                <th>Status</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id}>
                  <td>{f.displayNome}</td>
                  <td>{f.displayCpf === "-" ? "-" : cpfMask(f.displayCpf)}</td>
                  <td>{f.displayCargo}</td>
                  <td>
                    {f.isAtivo ? (
                      <span className="badge bg-success">Ativo</span>
                    ) : (
                      <span className="badge bg-secondary">Inativo</span>
                    )}
                  </td>
                  <td className="text-end">
                    <Link to={`/funcionarios/${f.id}`} className="btn btn-sm btn-outline-primary">
                      Ver detalhes
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    Nenhum funcionário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
