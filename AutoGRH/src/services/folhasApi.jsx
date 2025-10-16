export function makeFolhasApi(request) {
  const base = '/folhas';

  const list = async ({ ano, tipo } = {}) => {
    const qs = new URLSearchParams();
    if (ano) qs.set('ano', String(ano));
    if (tipo) qs.set('tipo', String(tipo)); // "SALARIO" | "VALE"
    const url = qs.toString() ? `${base}?${qs}` : `${base}`;
    const res = await request(url, { method: 'GET' });
    if (!res.ok) throw new Error((await res.text()) || 'Falha ao listar folhas');
    return res.json();
  };

  const getById = async (id) => {
    const res = await request(`${base}/${id}`, { method: 'GET' });
    if (!res.ok) throw new Error((await res.text()) || 'Falha ao obter folha');
    return res.json();
  };

  const listPagamentos = async (folhaId) => {
    const res = await request(`${base}/${folhaId}/pagamentos`, { method: 'GET' });
    if (!res.ok) throw new Error((await res.text()) || 'Falha ao listar pagamentos da folha');
    return res.json();
  };

  const fechar = async (id) => {
    const res = await request(`${base}/${id}/fechar`, { method: 'PUT' });
    if (!res.ok) throw new Error((await res.text()) || 'Falha ao fechar folha');
    return true;
  };

  const recalcular = async (id) => {
    const res = await request(`${base}/${id}/recalcular`, { method: 'PUT' });
    if (!res.ok) throw new Error((await res.text()) || 'Falha ao recalcular folha');
    return true;
  };

  const criarVale = async ({ mes, ano }) => {
    const res = await request(`${base}/vale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mes, ano }),
    });
    if (!res.ok) throw new Error((await res.text()) || 'Falha ao criar folha de vale');
    return res.json();
  };

  return { list, getById, listPagamentos, fechar, recalcular, criarVale };
}
