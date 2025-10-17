export function makeDescansosApi(request) {
  async function listByFuncionario(funcId) {
    const r = await request(`/funcionarios/${funcId}/descansos`, { method: "GET" });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  async function listByFerias(feriasId) {
    const r = await request(`/ferias/${feriasId}/descansos`, { method: "GET" });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  async function createAuto(funcId, { inicio, fim }) {
    const r = await request(`/funcionarios/${funcId}/descansos/auto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inicio, fim }),
    });
    if (!r.ok) throw new Error(await r.text());
    return true;
  }

  async function create({ ferias_id, inicio, fim }) {
    const r = await request(`/descansos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ferias_id, inicio, fim }),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  async function aprovar(id) {
    const r = await request(`/descansos/${id}/aprovar`, { method: "PUT" });
    if (!r.ok) throw new Error(await r.text());
    return true;
  }

  async function pagar(id) {
    const r = await request(`/descansos/${id}/pagar`, { method: "PUT" });
    if (!r.ok) throw new Error(await r.text());
    return true;
  }

  async function desmarcarPago(id) {
    const r = await request(`/descansos/${id}/desmarcar-pago`, { method: "PUT" });
    if (!r.ok) throw new Error(await r.text());
    return true;
  }

  async function remove(id) {
    const r = await request(`/descansos/${id}`, { method: "DELETE" });
    if (!r.ok) throw new Error(await r.text());
    return true;
  }

  return {
    listByFuncionario,
    listByFerias,
    createAuto,
    create,
    aprovar,
    pagar,
    desmarcarPago,
    remove,
  };
}
