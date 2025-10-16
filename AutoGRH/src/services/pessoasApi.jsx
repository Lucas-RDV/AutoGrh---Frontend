export function makePessoasApi(request, opts = {}) {
  const { base = "/pessoas" } = opts;
  const digits = (s) => String(s ?? "").replace(/\D/g, "");

  const normalizePessoa = (p) => ({
    id: p?.id ?? null,
    nome: p?.nome ?? "",
    cpf: p?.cpf ?? "",
    rg: p?.rg ?? "",
    endereco: p?.endereco ?? "",
    contato: digits(p?.contato),
    contatoEmergencia: digits(p?.contato_emergencia ?? p?.contatoEmergencia),
    _raw: p,
  });

  async function getById(id) {
    const r = await request(`${base}/${id}`, { method: "GET" });
    if (!r.ok) throw new Error(await r.text());
    return normalizePessoa(await r.json());
  }

  async function list() {
    const r = await request(`${base}`, { method: "GET" });
    if (!r.ok) throw new Error(await r.text());
    const arr = await r.json();
    return Array.isArray(arr) ? arr.map(normalizePessoa) : [];
  }

  // sem endpoint dedicado de CPF → filtra localmente a lista
  async function findByCpf(cpfDigits) {
    const all = await list();
    const target = all.find((p) => digits(p.cpf) === digits(cpfDigits));
    return target || null;
  }

  async function create(payload) {
    const r = await request(`${base}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: payload.nome ?? "",
        cpf: payload.cpf ?? "",
        rg: payload.rg ?? "",
        endereco: payload.endereco ?? "",
        contato: digits(payload.contato),
        contatoEmergencia: digits(payload.contatoEmergencia),
      }),
    });
    if (!r.ok) throw new Error(await r.text());
    return normalizePessoa(await r.json());
  }

  async function update(id, payload) {
    const r = await request(`${base}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: payload.nome ?? "",
        cpf: payload.cpf ?? "",
        rg: payload.rg ?? "",
        endereco: payload.endereco ?? "",
        contato: digits(payload.contato),
        contatoEmergencia: digits(payload.contatoEmergencia),
      }),
    });
    if (!r.ok) throw new Error(await r.text());
    return normalizePessoa(await r.json());
  }

  async function remove(id) {
    const r = await request(`${base}/${id}`, { method: "DELETE" });
    if (!r.ok) throw new Error(await r.text());
    return true;
  }

  return { getById, list, findByCpf, create, update, remove };
}
