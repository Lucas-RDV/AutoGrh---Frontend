import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApi } from "../../hooks/useApi";
import { makePessoasApi } from "../../services/pessoasApi";
import { makeFuncionariosApi } from "../../services/funcionariosApi";
import { makeSalariosApi } from "../../services/salariosApi";

const onlyDigits = (s) => String(s || "").replace(/\D/g, "");
const isBlank = (v) => v === null || v === undefined || String(v).trim() === "";
const fmtDateYYYYMMDD = (v) => (v ? v : "");

function maskContato9(v) {
  const d = onlyDigits(v).slice(0, 9);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}
function maskCPF(v) {
  const d = onlyDigits(v).slice(0, 11);
  const p1 = d.slice(0, 3);
  const p2 = d.slice(3, 6);
  const p3 = d.slice(6, 9);
  const p4 = d.slice(9, 11);
  let out = "";
  if (p1) out = p1;
  if (p2) out += (out ? "." : "") + p2;
  if (p3) out += (out ? "." : "") + p3;
  if (p4) out += (out ? "-" : "") + p4;
  return out;
}
function maskPIS(v) {
  const d = onlyDigits(v).slice(0, 11);
  const p1 = d.slice(0, 3);
  const p2 = d.slice(3, 8);
  const p3 = d.slice(8, 10);
  const p4 = d.slice(10, 11);
  let out = "";
  if (p1) out = p1;
  if (p2) out += (out ? "." : "") + p2;
  if (p3) out += (out ? "." : "") + p3;
  if (p4) out += (out ? "-" : "") + p4;
  return out;
}

export default function FuncionarioCreate() {
  const navigate = useNavigate();
  const { request } = useApi();
  const pessoasApi = useMemo(() => makePessoasApi(request), [request]);
  const funcionariosApi = useMemo(() => makeFuncionariosApi(request), [request]);
  const salariosApi = useMemo(() => makeSalariosApi(request), [request]);

  const [cpfBusca, setCpfBusca] = useState("");
  const [step, setStep] = useState("search"); 
  const [err, setErr] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [pessoaId, setPessoaId] = useState(null);
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [endereco, setEndereco] = useState("");
  const [contato, setContato] = useState("");
  const [contatoEmergencia, setContatoEmergencia] = useState("");

  const [cargo, setCargo] = useState("");
  const [pis, setPis] = useState("");
  const [ctps, setCtps] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [admissao, setAdmissao] = useState("");

  const [salario, setSalario] = useState("");     
  const [salarioReal, setSalarioReal] = useState("");

  const [funcionarioAtivoId, setFuncionarioAtivoId] = useState(null);

  async function checarBloqueioPorPessoa(pessoa) {
    const lista = await funcionariosApi.list();
    const doMesmo = lista.filter(
      (f) => (f?.pessoaId ?? f?.pessoa_id) === pessoa.id
    );
    for (const f of doMesmo) {
      try {
        const det = await funcionariosApi.getById(f.id);
        const demissao = det?._raw?.demissao || det?.demissao || null;
        const ativo = demissao ? false : true;
        if (ativo) {
          return { bloqueado: true, funcionarioId: det.id };
        }
      } catch { }
    }
    return { bloqueado: false, funcionarioId: null, possiveis: doMesmo };
  }

  async function buscarNascimentoDeAlgumFuncionario(doMesmo) {
    const detalhes = [];
    for (const f of doMesmo) {
      try {
        const det = await funcionariosApi.getById(f.id);
        detalhes.push(det);
      } catch { }
    }
    if (detalhes.length === 0) return "";
    detalhes.sort((a, b) => {
      const adA = a?.admissao ? new Date(a.admissao).getTime() : 0;
      const adB = b?.admissao ? new Date(b.admissao).getTime() : 0;
      return adB - adA;
    });
    const candidato = detalhes[0];
    const nasc = candidato?.nascimento || candidato?._raw?.nascimento || "";
    if (!nasc) return "";
    try {
      const d = new Date(nasc);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      }
    } catch { }
    return "";
  }

  async function handleSearchCPF(e) {
    e.preventDefault();
    setErr(null);

    const digits = onlyDigits(cpfBusca);
    if (digits.length !== 11) {
      setErr("Informe um CPF válido (11 dígitos).");
      return;
    }

    setSubmitting(true);
    try {
      const pessoa = await pessoasApi.findByCpf(digits);

      if (!pessoa) {
        setPessoaId(null);
        setNome("");
        setCpf(digits);
        setRg("");
        setEndereco("");
        setContato("");
        setContatoEmergencia("");
        setCargo("");
        setPis("");
        setCtps("");
        setNascimento("");
        setAdmissao("");
        setSalario("");
        setSalarioReal("");
        setStep("form");
        return;
      }

      const { bloqueado, funcionarioId, possiveis } =
        await checarBloqueioPorPessoa(pessoa);

      if (bloqueado) {
        setFuncionarioAtivoId(funcionarioId);
        setStep("blocked");
        return;
      }

      setPessoaId(pessoa.id);
      setNome(pessoa.nome || "");
      setCpf(onlyDigits(pessoa.cpf));
      setRg(pessoa.rg || "");
      setEndereco(pessoa.endereco || "");
      setContato(onlyDigits(pessoa.contato));
      setContatoEmergencia(onlyDigits(pessoa.contatoEmergencia));

      const nasc = await buscarNascimentoDeAlgumFuncionario(possiveis);
      setNascimento(nasc || "");

      setCargo("");
      setPis("");
      setCtps("");
      setAdmissao("");
      setSalario("");
      setSalarioReal("");

      setStep("form");
    } catch (e) {
      setErr(e?.message || "Erro ao buscar CPF");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(null);

    const cpfDigits = onlyDigits(cpf);
    if (cpfDigits.length !== 11) {
      setErr("Informe um CPF válido (11 dígitos).");
      return;
    }
    if (isBlank(nome)) {
      setErr("Informe o nome.");
      return;
    }
    if (isBlank(cargo)) {
      setErr("Informe o cargo.");
      return;
    }
    if (isBlank(nascimento) || isBlank(admissao)) {
      setErr("Informe nascimento e admissão.");
      return;
    }

    const salIni = isBlank(salario) ? 0 : Number(String(salario).replace(",", "."));
    const salRealNum = isBlank(salarioReal) ? null : Number(String(salarioReal).replace(",", "."));

    setSubmitting(true);
    try {
      let pessoaCriadaOuExistenteId = pessoaId;

      if (!pessoaCriadaOuExistenteId) {
        const nova = await pessoasApi.create({
          nome: nome.trim(),
          cpf: cpfDigits,
          rg: onlyDigits(rg),
          endereco: endereco.trim(),
          contato: onlyDigits(contato),
          contatoEmergencia: onlyDigits(contatoEmergencia),
        });
        pessoaCriadaOuExistenteId = nova.id;
      } else {
        await pessoasApi.update(pessoaCriadaOuExistenteId, {
          nome: nome.trim(),
          cpf: cpfDigits,
          rg: onlyDigits(rg),
          endereco: endereco.trim(),
          contato: onlyDigits(contato),
          contatoEmergencia: onlyDigits(contatoEmergencia),
        });
      }

      const novo = await funcionariosApi.create({
        pessoaID: pessoaCriadaOuExistenteId,
        cargo: cargo.trim(),
        pis: onlyDigits(pis),
        ctpf: onlyDigits(ctps),
        nascimento: fmtDateYYYYMMDD(nascimento),
        admissao: fmtDateYYYYMMDD(admissao),
        salarioInicial: salIni || 0,
        feriasDisponiveis: 0,
      });

      try {
        if (!Number.isNaN(salIni) && salIni > 0) {
          await salariosApi.createRegistrado(novo.id, salIni);
        }
        if (salRealNum && !Number.isNaN(salRealNum) && salRealNum > 0) {
          await salariosApi.createReal(novo.id, salRealNum);
        }
      } catch (e) {
        console.warn("Falha ao criar salários iniciais:", e);
      }

      navigate(`/funcionarios/${novo.id}`);
    } catch (e) {
      setErr(e?.message || "Erro ao criar funcionário");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container py-3">
      <div className="d-flex align-items-center mb-3">
        <h3 className="mb-0">Dados do funcionário</h3>
      </div>

      {err && <div className="alert alert-danger">{err}</div>}

      {step === "search" && (
        <form onSubmit={handleSearchCPF} className="row g-2 mb-3">
          <div className="col-md-4">
            <label className="form-label">Buscar por CPF cadastrado</label>
            <input
              className="form-control"
              value={maskCPF(cpfBusca)}
              onChange={(e) => setCpfBusca(onlyDigits(e.target.value))}
              placeholder="xxx.xxx.xxx-xx"
              maxLength={14}
            />
          </div>
          <div className="col-md-3 d-flex align-items-end">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Verificando…" : "Continuar"}
            </button>
          </div>
        </form>
      )}

      {step === "blocked" && (
        <div className="alert alert-warning">
          Já existe um <strong>Funcionário ativo</strong> vinculado a esse CPF.
          {!isBlank(funcionarioAtivoId) && (
            <> Você pode <Link to={`/funcionarios/${funcionarioAtivoId}`}>abrir os detalhes</Link>.</>
          )}
        </div>
      )}

      {step === "form" && (
        <form onSubmit={handleSubmit} className="vstack gap-3">
          <div className="card">
            <div className="card-body row g-3">
              <div className="col-md-6">
                <label className="form-label">Nome*</label>
                <input className="form-control" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div className="col-md-3">
                <label className="form-label">CPF*</label>
                <input
                  className="form-control"
                  value={maskCPF(cpf)}
                  onChange={(e) => setCpf(onlyDigits(e.target.value))}
                  placeholder="xxx.xxx.xxx-xx"
                  maxLength={14}
                  disabled
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">RG</label>
                <input
                  className="form-control"
                  value={onlyDigits(rg)}
                  onChange={(e) => setRg(onlyDigits(e.target.value).slice(0, 12))}
                  placeholder="somente números"
                  maxLength={12}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Endereço</label>
                <input className="form-control" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Contato</label>
                <input
                  className="form-control"
                  value={maskContato9(contato)}
                  onChange={(e) => setContato(onlyDigits(e.target.value).slice(0, 9))}
                  placeholder="xxxxx-xxxx"
                  maxLength={10}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Contato emergência</label>
                <input
                  className="form-control"
                  value={maskContato9(contatoEmergencia)}
                  onChange={(e) => setContatoEmergencia(onlyDigits(e.target.value).slice(0, 9))}
                  placeholder="xxxxx-xxxx"
                  maxLength={10}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Cargo*</label>
                <input className="form-control" value={cargo} onChange={(e) => setCargo(e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label">PIS</label>
                <input
                  className="form-control"
                  value={maskPIS(pis)}
                  onChange={(e) => setPis(onlyDigits(e.target.value).slice(0, 11))}
                  placeholder="xxx.xxxxx.xx-x"
                  maxLength={14}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">CTPF</label>
                <input
                  className="form-control"
                  value={onlyDigits(ctps)}
                  onChange={(e) => setCtps(onlyDigits(e.target.value).slice(0, 12))}
                  placeholder="somente números"
                  maxLength={12}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Nascimento*</label>
                <input type="date" className="form-control" value={nascimento} onChange={(e) => setNascimento(e.target.value)} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Admissão*</label>
                <input type="date" className="form-control" value={admissao} onChange={(e) => setAdmissao(e.target.value)} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Salário</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={salario}
                  onChange={(e) => setSalario(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Salário real</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={salarioReal}
                  onChange={(e) => setSalarioReal(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Salvando..." : "Salvar"}
            </button>
            <Link to="/funcionarios" className="btn btn-outline-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
