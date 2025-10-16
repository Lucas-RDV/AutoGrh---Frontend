export function makeValesApi(request) {
  const base = '/vales';

  const listAll = async () => {
    const res = await request(`${base}`, { method: 'GET' });
    if (!res.ok) throw new Error(await res.text() || 'Falha ao listar vales');
    return res.json();
  };

  const listPendentes = async () => {
    const res = await request(`${base}/pendentes`, { method: 'GET' });
    if (!res.ok) throw new Error(await res.text() || 'Falha ao listar pendentes');
    return res.json();
  };

  const listAprovadosNaoPagos = async () => {
    const res = await request(`${base}/aprovados-nao-pagos`, { method: 'GET' });
    if (!res.ok) throw new Error(await res.text() || 'Falha ao listar aprovados não pagos');
    return res.json();
  };

  const getById = async (id) => {
    const res = await request(`${base}/${id}`, { method: 'GET' });
    if (!res.ok) throw new Error(await res.text() || 'Falha ao obter vale');
    return res.json();
  };

  // { funcionarioID, valor, data: "YYYY-MM-DD" }
  const create = async (payload) => {
    const res = await request(`${base}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text() || 'Falha ao criar vale');
    return res.json();
  };

  const update = async (id, patch) => {
    const res = await request(`${base}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(await res.text() || 'Falha ao atualizar vale');
    return res.json?.() ?? null;
  };

  const approve = async (id) => {
    const res = await request(`${base}/${id}/aprovar`, { method: 'PUT' });
    if (!res.ok) throw new Error(await res.text() || 'Falha ao aprovar vale');
    return res.json?.() ?? null;
  };

  const pagar = async (id) => {
    const res = await request(`${base}/${id}/pagar`, { method: 'PUT' });
    if (!res.ok) throw new Error(await res.text() || 'Falha ao marcar pagamento');
    return res.json?.() ?? null;
  };

  const remove = async (id) => {
    const res = await request(`${base}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text() || 'Falha ao excluir vale');
    return res.json?.() ?? null;
  };

  return { listAll, listPendentes, listAprovadosNaoPagos, getById, create, update, approve, pagar, remove };
}
