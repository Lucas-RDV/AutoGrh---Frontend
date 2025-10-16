// src/services/feriasApi.jsx
export function makeFeriasApi(request) {
  async function listByFuncionario(funcionarioId) {
    const r = await request(`/funcionarios/${funcionarioId}/ferias`, { method: "GET" });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  async function get(id) {
    const r = await request(`/ferias/${id}`, { method: "GET" });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  async function marcarPago(id) {
    const r = await request(`/ferias/${id}/pagar`, { method: "PUT" });
    if (!r.ok) throw new Error(await r.text());
    return true;
  }

  async function marcarTercoPago(id) {
    const r = await request(`/ferias/${id}/terco-pago`, { method: "PUT" });
    if (!r.ok) throw new Error(await r.text());
    return true;
  }

  // Admin-only (desfazer)
  async function desmarcarTercoPago(id) {
    const r = await request(`/ferias/${id}/terco-desmarcar`, { method: "PUT" });
    if (!r.ok) throw new Error(await r.text());
    return true;
  }
  async function desmarcarPago(id) {
    const r = await request(`/ferias/${id}/pago-desmarcar`, { method: "PUT" });
    if (!r.ok) throw new Error(await r.text());
    return true;
  }

  async function saldo(id) {
    const r = await request(`/ferias/${id}/saldo`, { method: "GET" });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  async function garantir(funcionarioId) {
    const r = await request(`/funcionarios/${funcionarioId}/ferias/garantir`, { method: "POST" });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  return {
    listByFuncionario,
    get,
    marcarPago,
    marcarTercoPago,
    desmarcarTercoPago,
    desmarcarPago,
    saldo,
    garantir,
  };
}
