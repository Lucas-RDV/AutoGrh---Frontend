import { useEffect, useMemo, useState } from 'react';
import { useApi } from './useApi';
import { makeFuncionariosApi } from '../services/funcionariosApi';

// Remove acentos e padroniza caixa
function norm(str = '') {
  return str
    .normalize?.('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function useFuncionarios({ state = 'ativos' } = {}) {
  // state: 'ativos' | 'todos' | 'inativos'
  const { request } = useApi();
  const api = makeFuncionariosApi(request);

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await api.listWithNamesByState(state);
        if (alive) setList(data);
      } catch (e) {
        if (alive) {
          setErr(e?.message || 'Falha ao carregar funcionários');
          setList([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [state]); // recarrega ao trocar o filtro

  const filtered = useMemo(() => {
    const t = norm(q.trim());
    if (!t) return list;
    return list.filter(f => {
      const nome = norm(f.nome || '');
      const cpf  = (f.cpf || '').replace(/\D/g, '');
      return (
        nome.includes(t) ||
        String(f.id).includes(t) ||
        String(f.pessoaId).includes(t) ||
        cpf.includes(t.replace(/\D/g,'')) // permite buscar por números do CPF
      );
    });
  }, [list, q]);

  return { list, filtered, loading, err, q, setQ };
}
