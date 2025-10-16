export function makeFuncionariosApi(request, opts = {}) {
  const { base = "/funcionarios" } = opts;

  const mapSalario = (s) =>
    !s
      ? null
      : {
          id: s.id ?? null,
          funcionarioId: s.funcionario_id ?? s.funcionarioId ?? null,
          inicio: s.inicio ?? null,
          fim: s.fim ?? null,
          valor: s.valor ?? null,
        };

  const mapFerias = (f) =>
    !f
      ? null
      : {
          id: f.id ?? null,
          funcionarioId: f.funcionario_id ?? f.funcionarioId ?? null,
          dias: f.dias ?? 0,
          inicio: f.inicio ?? null,
          vencimento: f.vencimento ?? null,
          vencido: !!f.vencido,
          valor: f.valor ?? 0,
          pago: !!f.pago,
          terco: f.terco ?? 0,
          tercoPago: !!(f.tercoPago ?? f.terco_pago),
        };

  const mapFalta = (x) =>
    !x
      ? null
      : {
          id: x.id ?? null,
          funcionarioId: x.funcionario_id ?? x.funcionarioId ?? null,
          quantidade: x.quantidade ?? 0,
          mes: x.mes ?? null,
        };

  const mapVale = (v) =>
    !v
      ? null
      : {
          id: v.id ?? null,
          funcionarioId: v.funcionario_id ?? v.funcionarioId ?? null,
          valor: v.valor ?? 0,
          data: v.data ?? null,
          aprovado: !!v.aprovado,
          pago: !!v.pago,
          ativo: !!v.ativo,
        };

  const mapPagamento = (p) =>
    !p
      ? null
      : {
          id: p.id ?? null,
          funcionarioId: p.funcionarioId ?? null,
          folhaId: p.folhaId ?? null,
          salarioBase: p.salarioBase ?? 0,
          adicional: p.adicional ?? 0,
          descontoINSS: p.descontoINSS ?? 0,
          salarioFamilia: p.salarioFamilia ?? 0,
          descontoVales: p.descontoVales ?? 0,
          valorFinal: p.valorFinal ?? 0,
          pago: !!p.pago,
        };

  function normalizeFuncionario(f) {
    if (!f || typeof f !== "object") {
      return {
        id: null,
        pessoaId: null,
        pis: "",
        ctpf: "",
        nascimento: null,
        admissao: null,
        cargo: "",
        salarioInicial: 0,
        feriasDisponiveis: 0,
        ativo: false,
        salarioRegistradoAtual: null,
        salarioRealAtual: null,
        salariosRegistrados: [],
        salariosReais: [],
        ferias: [],
        faltas: [],
        pagamentos: [],
        vales: [],
        _raw: f,
      };
    }
    return {
      id: f.id ?? null,
      pessoaId: f.pessoa_id ?? null,
      pis: f.pis ?? "",
      ctpf: f.ctpf ?? "",
      nascimento: f.nascimento ?? null,
      admissao: f.admissao ?? null,
      cargo: f.cargo ?? "",
      salarioInicial: f.salario_inicial ?? f.salarioInicial ?? 0,
      feriasDisponiveis: f.ferias_disponiveis ?? f.feriasDisponiveis ?? 0,
      ativo: !!f.ativo,
      salarioRegistradoAtual: mapSalario(f.salario_registrado_atual),
      salarioRealAtual: mapSalario(f.salario_real_atual),
      salariosRegistrados: Array.isArray(f.salarios_registrados) ? f.salarios_registrados.map(mapSalario) : [],
      salariosReais: Array.isArray(f.salarios_reais) ? f.salarios_reais.map(mapSalario) : [],
      ferias: Array.isArray(f.ferias) ? f.ferias.map(mapFerias) : [],
      faltas: Array.isArray(f.faltas) ? f.faltas.map(mapFalta) : [],
      pagamentos: Array.isArray(f.pagamentos) ? f.pagamentos.map(mapPagamento) : [],
      vales: Array.isArray(f.vales) ? f.vales.map(mapVale) : [],
      _raw: f,
    };
  }

  async function getById(id) {
    const r = await request(`${base}/${id}`, { method: "GET" });
    if (!r.ok) throw new Error(await r.text());
    return normalizeFuncionario(await r.json());
  }

  async function list(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    });
    const url = qs.toString() ? `${base}?${qs}` : `${base}`;
    const r = await request(url, { method: "GET" });
    if (!r.ok) throw new Error(await r.text());
    const arr = await r.json();
    return Array.isArray(arr) ? arr.map(normalizeFuncionario) : [];
  }

  async function create(payload) {
    // Controller espera camelCase exatos + datas "YYYY-MM-DD"
    const r = await request(`${base}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pessoaID: payload.pessoaID ?? payload.pessoaId ?? null,
        pis: payload.pis ?? "",
        ctpf: payload.ctpf ?? "",
        nascimento: payload.nascimento ?? "",
        admissao: payload.admissao ?? "",
        cargo: payload.cargo ?? "",
        salarioInicial: payload.salarioInicial ?? 0,
        feriasDisponiveis: payload.feriasDisponiveis ?? 0,
      }),
    });
    if (!r.ok) throw new Error(await r.text());
    return normalizeFuncionario(await r.json());
  }

  async function update(id, payload) {
    const r = await request(`${base}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pessoaID: payload.pessoaId ?? payload.pessoaID ?? null,
        cargo: payload.cargo ?? "",
        pis: payload.pis ?? "",
        ctpf: payload.ctpf ?? "",
        admissao: payload.admissao ?? "",
        nascimento: payload.nascimento ?? "",
        feriasDisponiveis: payload.feriasDisponiveis ?? 0,
        salarioInicial: payload.salarioInicial ?? 0,
      }),
    });
    if (!r.ok) throw new Error(await r.text());
    return normalizeFuncionario(await r.json());
  }

  return { getById, list, create, update };
}
