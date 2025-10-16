export function makeSalariosApi(request) {
  async function listRegistrados(funcionarioId) {
    const r = await request(`/funcionarios/${funcionarioId}/salarios`, { method: 'GET' });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }
  async function createRegistrado(funcionarioId, valor) {
    const r = await request(`/funcionarios/${funcionarioId}/salarios`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ valor: Number(valor) }),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }
  async function updateRegistrado(id, valor) {
    const r = await request(`/salarios/${id}`, {
      method: 'PUT',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ id, valor: Number(valor) }),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }
  async function deleteRegistrado(id) {
    const r = await request(`/salarios/${id}`, { method: 'DELETE' });
    if (!r.ok) throw new Error(await r.text());
    return true;
  }

  async function listReais(funcionarioId) {
    const r = await request(`/funcionarios/${funcionarioId}/salarios-reais`, { method: 'GET' });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }
  async function createReal(funcionarioId, valor) {
    const r = await request(`/funcionarios/${funcionarioId}/salarios-reais`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ valor: Number(valor) }),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }
  async function deleteReal(id) {
    const r = await request(`/salarios-reais/${id}`, { method: 'DELETE' });
    if (!r.ok) throw new Error(await r.text());
    return true;
  }

  async function getRealAtual(funcionarioId) {
    const r = await request(`/funcionarios/${funcionarioId}/salario-real-atual`, { method: 'GET' });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  return {
    listRegistrados, createRegistrado, updateRegistrado, deleteRegistrado,
    listReais, createReal, deleteReal, getRealAtual
  };
}
