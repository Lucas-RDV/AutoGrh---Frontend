import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { makeFuncionariosApi } from '../../services/funcionariosApi';
import { makePessoasApi } from '../../services/pessoasApi';
import DadosTab from './tabs/DadosTab';
import SalariosTab from './tabs/SalariosTab';
import DocumentosTab from './tabs/DocumentosTab';
import FeriasHistoricoModal from './tabs/FeriasHistoricoModal';
import DescansoCreateModal from './tabs/DescansoCreateModal';

function extractInlinePessoa(f) {
  return (
    f?.pessoa || f?.Pessoa || f?.pessoaDTO || f?.PessoaDTO || f?.dadosPessoa || f?.DadosPessoa || null
  );
}

export default function FuncionarioDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { request } = useApi();

  const funcApi = makeFuncionariosApi(request);
  const pesApi  = makePessoasApi(request);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [func, setFunc] = useState(null);
  const [pessoa, setPessoa] = useState(null);
  const [tab, setTab] = useState('dados');

  const [editingDados, setEditingDados] = useState(false);
  const dadosRef = useRef(null);

  const [showFerias, setShowFerias] = useState(false);
  const [showCriarDescanso, setShowCriarDescanso] = useState(false);

  async function resolvePessoaFromLists(funcId) {
    const endpoints = ['/funcionarios', '/funcionarios/ativos', '/funcionarios/inativos'];
    for (const ep of endpoints) {
      try {
        const list = await funcApi.listAllRaw?.(ep);
        const match = (Array.isArray(list) ? list : []).find(
          it => (it?.id ?? it?.ID) === Number(funcId)
        );
        if (match) {
          const inline = extractInlinePessoa(match);
          const pessoaId =
            match?.pessoaId ?? match?.pessoaID ?? match?.PessoaID ?? match?.pessoa_id ??
            (inline ? (inline.id ?? inline.ID ?? inline.PessoaID ?? null) : null);

          if (pessoaId != null) {
            const p = await pesApi.getById(pessoaId);
            return p;
          }
        }
      } catch {}
    }
    return null;
  }

  async function load() {
    setLoading(true); setErr(null);
    try {
      const f = await funcApi.getById(id);
      setFunc(f);

      const inline = extractInlinePessoa(f);
      const pessoaIdFromFunc = f?.pessoaId ?? f?.pessoaID ?? f?.PessoaID ?? f?.pessoa_id ?? null;
      const pessoaIdInline   = inline ? (inline.id ?? inline.ID ?? inline.PessoaID ?? null) : null;

      if (pessoaIdFromFunc != null) {
        const p = await pesApi.getById(pessoaIdFromFunc);
        setPessoa(p);
      } else if (pessoaIdInline != null) {
        const p = await pesApi.getById(pessoaIdInline);
        setPessoa(p);
      } else {
        const p = await resolvePessoaFromLists(id);
        setPessoa(p);
      }
    } catch (e) {
      setErr(e?.message || 'Erro ao carregar funcionário');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  const tituloNome = useMemo(() => pessoa?.nome || 'Funcionário', [pessoa]);

  async function onSalvarDados() {
    if (!dadosRef.current) return;
    try {
      await dadosRef.current.save();
      setEditingDados(false);
      await load();
    } catch (e) {
      console.error(e);
    }
  }

  function onCancelarDados() {
    if (dadosRef.current?.reset) dadosRef.current.reset();
    setEditingDados(false);
  }

  return (
    <div className="container mt-3">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h4 className="mb-0">Funcionário #{id} — {tituloNome}</h4>

        {tab === 'dados' && (
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setShowFerias(true)}
            >
              Histórico de férias
            </button>
            <button
              className="btn btn-outline-success btn-sm"
              onClick={() => setShowCriarDescanso(true)}
            >
              Requisitar férias
            </button>

            {!editingDados ? (
              <button className="btn btn-outline-primary btn-sm" onClick={() => setEditingDados(true)}>
                Editar
              </button>
            ) : (
              <>
                <button className="btn btn-secondary btn-sm" onClick={onCancelarDados}>
                  Cancelar
                </button>
                <button className="btn btn-primary btn-sm" onClick={onSalvarDados}>
                  Salvar
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${tab==='dados' ? 'active' : ''}`} onClick={()=>setTab('dados')}>Dados</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab==='salarios' ? 'active' : ''}`} onClick={()=>setTab('salarios')}>Salários</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab==='documentos' ? 'active' : ''}`} onClick={()=>setTab('documentos')}>Documentos</button>
        </li>
      </ul>

      {err && <div className="alert alert-danger">{err}</div>}

      {loading ? (
        <div className="text-muted">
          <div className="spinner-border me-2" role="status" />Carregando…
        </div>
      ) : (
        <>
          {tab === 'dados' && (
            <DadosTab
              ref={dadosRef}
              editing={editingDados}
              func={func}
              pessoa={pessoa}
            />
          )}

          {tab === 'salarios' && (
            <SalariosTab funcId={Number(id)} />
          )}

          {tab === 'documentos' && (
            <DocumentosTab funcId={Number(id)} />
          )}
        </>
      )}

      <div className="mt-3">
        <button className="btn btn-outline-secondary btn-sm" onClick={()=>navigate('/funcionarios')}>
          Voltar
        </button>
      </div>

      {showFerias && (
        <FeriasHistoricoModal
          funcId={Number(id)}
          onClose={() => setShowFerias(false)}
        />
      )}

      {showCriarDescanso && (
        <DescansoCreateModal
          funcId={Number(id)}
          onClose={() => setShowCriarDescanso(false)}
        />
      )}
    </div>
  );
}
