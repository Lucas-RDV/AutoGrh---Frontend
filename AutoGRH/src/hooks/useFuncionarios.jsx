// src/hooks/useFuncionarios.jsx
import { useEffect, useMemo, useState } from "react";
import { useApi } from "../hooks/useApi";
import { makeFuncionariosApi } from "../services/funcionariosApi";
import { makePessoasApi } from "../services/pessoasApi";

function normalizeText(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * useFuncionarios
 * - onlyActive: se true, filtra apenas funcionários sem data de demissão
 */
export function useFuncionarios({ onlyActive = false } = {}) {
  const { request } = useApi();
  const funcApi = useMemo(() => makeFuncionariosApi(request), [request]);
  const pesApi  = useMemo(() => makePessoasApi(request), [request]);

  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // string de busca (sempre string p/ evitar “controlled → uncontrolled”)
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const base = await funcApi.list(); // [{ id, pessoa_id, cargo, demissao, ... }]
        const arr = Array.isArray(base) ? base : [];

        // Enriquecer com dados da Pessoa
        const enriched = await Promise.all(
          arr.map(async (f) => {
            const pessoaId = f?.pessoa_id ?? f?.pessoaId ?? null;

            let nome = null;
            let cpf  = null;

            // Tenta pegar junto via getById (caso o back já “embuta” Pessoa)
            try {
              if (f?.id != null) {
                const fd = await funcApi.getById(f.id);
                nome = fd?.pessoa?.nome ?? nome;
                cpf  = fd?.pessoa?.cpf  ?? cpf;
              }
            } catch {
              /* se falhar, segue para lookup por pessoaId */
            }

            // Fallback: busca Pessoa diretamente
            try {
              if ((!nome || !cpf) && pessoaId) {
                const p = await pesApi.getById(pessoaId);
                nome = nome ?? p?.nome ?? null;
                cpf  = cpf  ?? p?.cpf  ?? null;
              }
            } catch {
              /* mantém null se falhar */
            }

            return {
              ...f,
              nome: nome ?? "-",        // <-- garantimos nome aqui
              cpf:  cpf  ?? null,
              isAtivo: f?.demissao ? false : true,
            };
          })
        );

        if (!cancelled) setAll(enriched);
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Falha ao carregar funcionários");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [funcApi, pesApi]);

  // Filtro por nome e ativo
  const filtered = useMemo(() => {
    const nq = normalizeText(q);
    return all.filter((f) => {
      const okAtivo = onlyActive ? f?.isAtivo : true;
      const okNome  = !nq || normalizeText(f?.nome).includes(nq);
      return okAtivo && okNome;
    });
  }, [all, q, onlyActive]);

  return {
    all,
    filtered,
    loading,
    err,
    q,              // sempre string (''), evita warning nos inputs
    setQ,
  };
}
