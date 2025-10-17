export function makePagamentosApi(request) {
  const base = '/pagamentos';

  const getById = async (id) => {
    const res = await request(`${base}/${id}`, { method: 'GET' });
    if (!res.ok) throw new Error(await res.text() || 'Falha ao obter pagamento');
    return res.json();
  };

  const update = async (id, patch) => {
    const res = await request(`${base}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(await res.text() || 'Falha ao atualizar pagamento');
    return res.json();
  };

  const marcarPago = async (id) => {
    const res = await request(`${base}/${id}/pagar`, { method: 'PUT' });
    if (!res.ok) throw new Error(await res.text() || 'Falha ao marcar como pago');
    return res.json?.() ?? null;
  };

  return { getById, update, marcarPago };
}
