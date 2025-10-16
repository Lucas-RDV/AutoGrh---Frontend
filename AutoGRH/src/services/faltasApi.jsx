export function makeFaltasApi(request) {
  const listByFuncionario = async (funcionarioId) => {
    const res = await request(`/funcionarios/${funcionarioId}/faltas`, { method: 'GET' });
    if (!res.ok) throw new Error((await res.text()) || 'Falha ao listar faltas');
    return res.json();
  };

  const create = async (funcionarioId, body) => {
    const res = await request(`/funcionarios/${funcionarioId}/faltas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.text()) || 'Falha ao criar falta');
    return res.json();
  };

  const update = async (faltaId, body) => {
    const res = await request(`/faltas/${faltaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.text()) || 'Falha ao atualizar falta');
    return res.json();
  };

  const upsertMensal = async (funcionarioId, { mes, ano, quantidade }) => {
    const m = Number(mes), a = Number(ano);
    if (!Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(a) || a < 1900) {
      throw new Error('Competência da folha inválida para salvar faltas (mês/ano ausente)');
    }

    const res = await request(`/funcionarios/${funcionarioId}/faltas/mensal`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mes: m, ano: a, quantidade }),
    });
    if (res.ok) return true;

    if (res.status !== 404) {
      throw new Error((await res.text()) || 'Falha ao atualizar faltas do mês');
    }

    const faltas = await listByFuncionario(funcionarioId);
    const alvo = Array.isArray(faltas)
      ? faltas.find(f => {
          const data = String(f?.data ?? f?.Data ?? '');
          const dt = new Date(data.replace(' ', 'T'));
          return (dt.getMonth() + 1) === m && dt.getFullYear() === a;
        })
      : null;

    const dataPrimeiroDia = `${String(a).padStart(4, '0')}-${String(m).padStart(2, '0')}-01`;
    const qtd = Math.max(0, Math.floor(quantidade));

    if (alvo) {
      await update(alvo.id ?? alvo.ID, { quantidade: qtd, data: dataPrimeiroDia });
    } else if (qtd > 0) {
      await create(funcionarioId, { quantidade: qtd, data: dataPrimeiroDia });
    }
    return true;
  };

  return { listByFuncionario, upsertMensal, create, update };
}
