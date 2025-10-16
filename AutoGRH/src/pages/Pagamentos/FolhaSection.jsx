import { useEffect, useMemo, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { makeFolhasApi } from '../../services/folhasApi';
import { makeFaltasApi } from '../../services/faltasApi';
import { useFuncionarios } from '../../hooks/useFuncionarios';
import PagamentoEditModal from './PagamentoEditModal';

function tipoBadge(tipo) {
  if (!tipo) return null;
  const t = String(tipo).toUpperCase();
  if (t === 'SALARIO') return <span className="badge bg-primary">SALÁRIO</span>;
  if (t === 'VALE')    return <span className="badge bg-info text-dark">VALE</span>;
  return <span className="badge bg-secondary">{t}</span>;
}
function statusBadge(pago) {
  return pago ? <span className="badge bg-success">fechada</span>
              : <span className="badge bg-warning text-dark">em aberto</span>;
}
function formatDateOnly(input) {
  if (!input) return '';
  const s = String(input);
  let d = new Date(s);
  if (isNaN(d)) d = new Date(s.replace(' ', 'T'));
  if (isNaN(d)) {
    const base = s.split('T')[0].split(' ')[0];
    const [y, m, day] = base.split('-');
    if (y && m && day) return `${day.padStart(2,'0')}/${m.padStart(2,'0')}/${y}`;
    return s;
  }
  const day = String(d.getDate()).padStart(2, '0');
  const mon  = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${mon}/${year}`;
}

// CSV com BOM UTF-8
function downloadCsvUTF8(filename, csvString) {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function FolhaSection() {
  const { request } = useApi();
  const folhasApi = useMemo(() => makeFolhasApi(request), [request]);
  const faltasApi = useMemo(() => makeFaltasApi(request), [request]);
  const { user } = useAuth();

  const now = new Date();

  // Filtros da listagem
  const [mesFiltro, setMesFiltro] = useState(''); // '' = todos; 1..12 = mês específico
  const [ano, setAno] = useState(now.getFullYear());
  const [tipo, setTipo] = useState('');

  const [creating, setCreating] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [rows, setRows] = useState([]);

  const [selected, setSelected] = useState(null);
  const [loadingPays, setLoadingPays] = useState(false);
  const [errPays, setErrPays] = useState(null);
  const [pagamentos, setPagamentos] = useState([]);

  const [faltasByFunc, setFaltasByFunc] = useState(new Map());

  const [editItem, setEditItem] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  const [busca, setBusca] = useState('');

  const { list: funcs } = useFuncionarios({ onlyActive: false });
  const nomeByFuncionario = useMemo(() => {
    const m = new Map();
    for (const f of funcs) m.set(f.id, f.nome);
    return m;
  }, [funcs]);

  const isAdmin = useMemo(() => {
    const p = (user?.perfil ?? user?.role ?? '').toString().toLowerCase();
    return p === 'admin';
  }, [user]);

  async function loadFolhas() {
    setLoading(true);
    setErr(null);
    try {
      const data = await folhasApi.list({ ano: String(ano), tipo: tipo || undefined });
      setRows(Array.isArray(data) ? data : []);
      if (selected && !data.some(f => (f.id ?? f.ID) === (selected.id ?? selected.ID))) {
        setSelected(null);
        setPagamentos([]);
        setFaltasByFunc(new Map());
      }
    } catch (e) {
      setErr(e?.message || 'Erro ao listar folhas');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredRows = useMemo(() => {
    return (rows || []).filter(f => {
      const a = Number(f?.ano ?? f?.Ano);
      const m = Number(f?.mes ?? f?.Mes);
      const t = (f?.tipo ?? f?.Tipo ?? '').toString().toUpperCase();

      const yearOk  = !ano || a === Number(ano);
      const typeOk  = !tipo || t === tipo.toUpperCase();
      const monthOk = !mesFiltro || m === Number(mesFiltro);

      return yearOk && typeOk && monthOk;
    });
  }, [rows, ano, tipo, mesFiltro]);

  async function openFolha(folha) {
    const id = folha?.id ?? folha?.ID;
    if (!id) return;
    setSelected(folha);
    setLoadingPays(true);
    setErrPays(null);
    try {
      const pays = await folhasApi.listPagamentos(id);
      setPagamentos(Array.isArray(pays) ? pays : []);

      const mes = Number(folha?.mes ?? folha?.Mes ?? 0);
      const anoX = Number(folha?.ano ?? folha?.Ano ?? 0);
      const uniqFuncs = [...new Set((Array.isArray(pays) ? pays : []).map(p => p?.funcionarioId ?? p?.FuncionarioID ?? p?.funcionarioID).filter(Boolean))];

      const map = new Map();
      await Promise.all(uniqFuncs.map(async (fid) => {
        try {
          const faltas = await faltasApi.listByFuncionario(fid);
          const qtd = Array.isArray(faltas) ? faltas.reduce((acc, f) => {
            const data = String(f?.mes ?? f?.Mes ?? f?.data ?? f?.Data ?? '');
            const dt = new Date(data.replace(' ', 'T'));
            const m = dt.getMonth() + 1;
            const a = dt.getFullYear();
            const q = Number(f?.quantidade ?? f?.Quantidade ?? 1);
            return (m === mes && a === anoX) ? acc + (Number.isFinite(q) ? q : 1) : acc;
          }, 0) : 0;
          map.set(fid, qtd);
        } catch {
          map.set(fid, 0);
        }
      }));
      setFaltasByFunc(map);
    } catch (e) {
      setErrPays(e?.message || 'Erro ao carregar pagamentos da folha');
      setPagamentos([]);
      setFaltasByFunc(new Map());
    } finally {
      setLoadingPays(false);
    }
  }

  async function onRecalcular() {
    if (!selected) return;
    const id = selected.id ?? selected.ID;
    if (!window.confirm('Recalcular esta folha?')) return;
    setLoadingPays(true);
    try {
      await folhasApi.recalcular(id);
      await loadFolhas();
      await openFolha(selected);
    } catch (e) {
      alert(e?.message || 'Falha ao recalcular a folha');
    } finally {
      setLoadingPays(false);
    }
  }

  // fechar diretamente pela LISTA
  async function fecharFolhaDaLista(f) {
    if (!f) return;
    const id = f.id ?? f.ID;
    if (!window.confirm('Marcar esta folha como paga/fechada? Essa ação bloqueia novas edições.')) return;
    setLoadingPays(true);
    try {
      await folhasApi.fechar(id);
      await loadFolhas();
      if (selected && (selected.id ?? selected.ID) === id) {
        const novaSel = (rows || []).find(x => (x.id ?? x.ID) === id) || f;
        await openFolha(novaSel);
      }
    } catch (e) {
      alert(e?.message || 'Falha ao fechar a folha');
    } finally {
      setLoadingPays(false);
    }
  }

  // criar folha de VALE (apenas admin) — usa mês/ano atuais
  async function onCriarFolhaVale() {
    const cm = now.getMonth() + 1;
    const ca = now.getFullYear();
    if (!window.confirm(`Criar folha de VALE de ${String(cm).padStart(2,'0')}/${ca}?`)) return;
    setCreating(true);
    try {
      const nova = await folhasApi.criarVale({ mes: cm, ano: ca });
      await loadFolhas();
      if (nova?.id || nova?.ID) await openFolha(nova);
      alert('Folha de VALE criada com sucesso.');
    } catch (e) {
      alert(e?.message || 'Falha ao criar folha de VALE');
    } finally {
      setCreating(false);
    }
  }

  // Busca por nome no detalhe
  const pagamentosFiltrados = useMemo(() => {
    const termo = (busca || '').toLowerCase().trim();
    const arr = Array.isArray(pagamentos) ? [...pagamentos] : [];
    arr.sort((a,b) => {
      const af = a?.funcionarioId ?? a?.FuncionarioID ?? a?.funcionarioID;
      const bf = b?.funcionarioId ?? b?.FuncionarioID ?? b?.funcionarioID;
      const an = (nomeByFuncionario.get(af) || '').toLowerCase();
      const bn = (nomeByFuncionario.get(bf) || '').toLowerCase();
      return an.localeCompare(bn);
    });
    if (!termo) return arr;
    return arr.filter(p => {
      const fid = p?.funcionarioId ?? p?.FuncionarioID ?? p?.funcionarioID;
      const nome = (nomeByFuncionario.get(fid) || '').toLowerCase();
      return nome.includes(termo);
    });
  }, [pagamentos, nomeByFuncionario, busca]);

  // Agregados (apenas usados na folha de SALÁRIO)
  const totaisSalario = useMemo(() => {
    let base=0, adic=0, desc=0, fam=0, descFaltas=0, descVales=0, final=0;
    for (const p of pagamentosFiltrados) {
      const fid = p?.funcionarioId ?? p?.FuncionarioID ?? p?.funcionarioID;
      const faltasQtd = Number(faltasByFunc.get(fid) || 0);

      const b  = Number(p?.salarioBase ?? p?.SalarioBase ?? 0);
      const a  = Number(p?.adicional ?? p?.Adicional ?? 0);
      const d  = Number(p?.desconto ?? p?.Desconto ?? p?.descontoINSS ?? p?.DescontoINSS ?? 0);
      const sf = Number(p?.salarioFamilia ?? p?.SalarioFamilia ?? 0);
      const dv = Number(p?.descontoVales ?? p?.DescontoVales ?? 0);
      const df = (b / 30) * faltasQtd;
      const vf = Number(p?.valorFinal ?? p?.ValorFinal ?? 0);

      base += b; adic += a; desc += d; fam += sf; descVales += dv; descFaltas += df; final += vf;
    }
    return { base, adic, desc, fam, descFaltas, descVales, final };
  }, [pagamentosFiltrados, faltasByFunc]);

  // Total para folha VALE
  const totalVales = useMemo(() => {
    return pagamentosFiltrados.reduce((acc, r) => {
      const valor = Number(r?.valor ?? r?.Valor ?? r?.valorFinal ?? r?.ValorFinal ?? 0);
      return acc + (Number.isFinite(valor) ? valor : 0);
    }, 0);
  }, [pagamentosFiltrados]);

  function onExportarCsv() {
    if (!selected) return;
    const mes = String(selected.mes ?? selected.Mes).padStart(2,'0');
    const anoSel = selected.ano ?? selected.Ano;
    const tipoSel = (selected.tipo ?? selected.Tipo ?? '').toString().toUpperCase() || '-';
    const isVale = tipoSel === 'VALE';

    const file = `folha-${tipoSel.toLowerCase()}-${mes}-${anoSel}.csv`;

    if (isVale) {
      const header = ['ID','Funcionário','Valor do vale','Data','Pago'].join(';');
      const linhas = pagamentosFiltrados.map(r => {
        const fid = r?.funcionarioId ?? r?.FuncionarioID ?? r?.funcionarioID;
        const nome = (nomeByFuncionario.get(fid) || `ID ${fid}`).replace(/;/g, ',');
        const valor = Number(r?.valor ?? r?.Valor ?? r?.valorFinal ?? r?.ValorFinal ?? 0).toFixed(2);
        const data = r?.data ?? r?.Data ?? '';
        const pago = (r?.pago ?? r?.Pago) ? 'sim' : 'não';
        return [(r?.id ?? r?.ID), nome, valor, formatDateOnly(data), pago].join(';');
      });
      const titulo = `Folha VALE ${mes}/${anoSel}`;
      const totalLinha = `Total dos vales;${totalVales.toFixed(2)}`;
      const csv = [titulo, totalLinha, '', header, ...linhas].join('\n');
      downloadCsvUTF8(file, csv);
      return;
    }

    // CSV de SALÁRIO (mantém campos)
    const header = [
      'ID','Funcionário','Salário base','Adicional','Desconto','Salário família',
      'Desc. faltas','Desc. vales','Valor final','Pago'
    ].join(';');

    const linhas = pagamentosFiltrados.map(r => {
      const fid = r?.funcionarioId ?? r?.FuncionarioID ?? r?.funcionarioID;
      const nome = (nomeByFuncionario.get(fid) || `ID ${fid}`).replace(/;/g, ',');
      const base = Number(r?.salarioBase ?? r?.SalarioBase ?? 0).toFixed(2);
      const adic = Number(r?.adicional ?? r?.Adicional ?? 0).toFixed(2);
      const desc = Number(r?.desconto ?? r?.Desconto ?? r?.descontoINSS ?? r?.DescontoINSS ?? 0).toFixed(2);
      const fam  = Number(r?.salarioFamilia ?? r?.SalarioFamilia ?? 0).toFixed(2);
      const descVales = Number(r?.descontoVales ?? r?.DescontoVales ?? 0).toFixed(2);
      const faltasQtd = Number(faltasByFunc.get(fid) || 0);
      const descFaltas = ((Number(r?.salarioBase ?? r?.SalarioBase ?? 0)/30) * faltasQtd).toFixed(2);
      const finalV = Number(r?.valorFinal ?? r?.ValorFinal ?? 0).toFixed(2);
      const pago = (r?.pago ?? r?.Pago) ? 'sim' : 'não';

      return [
        (r?.id ?? r?.ID),
        nome, base, adic, desc, fam, descFaltas, descVales, finalV, pago
      ].join(';');
    });

    const titulo = `Folha SALÁRIO ${mes}/${anoSel}`;
    const totalLinha = `Total da folha;${totaisSalario.final.toFixed(2)}`;
    const csv = [titulo, totalLinha, '', header, ...linhas].join('\n');
    downloadCsvUTF8(file, csv);
  }

  useEffect(() => { loadFolhas(); }, [ano, tipo]);

  const folhaPaga = !!(selected?.pago ?? selected?.Pago);
  const selectedTipo = (selected?.tipo ?? selected?.Tipo ?? '').toString().toUpperCase();
  const isFolhaVale = selectedTipo === 'VALE';

  return (
    <div className="card shadow-sm mt-3">
      <div className="card-body">
        {/* HEADER: filtros + ação (criar VALE) */}
        <div className="mb-3">
          <div className="row g-2 align-items-end">
            {/* Filtro: Mês */}
            <div className="col-6 col-md-2">
              <div className="input-group input-group-sm">
                <span className="input-group-text">Mês</span>
                <input
                  className="form-control"
                  type="number"
                  min="1"
                  max="12"
                  placeholder="(todos)"
                  value={mesFiltro}
                  onChange={(e)=>{
                    const raw = e.target.value;
                    if (raw === '') { setMesFiltro(''); return; }
                    const v = Math.max(1, Math.min(12, Number(raw || 1)));
                    setMesFiltro(String(v));
                  }}
                />
              </div>
            </div>
            {/* Filtro: Ano */}
            <div className="col-6 col-md-2">
              <div className="input-group input-group-sm">
                <span className="input-group-text">Ano</span>
                <input
                  className="form-control"
                  type="number"
                  value={ano}
                  onChange={(e)=>setAno(Number(e.target.value || now.getFullYear()))}
                />
              </div>
            </div>
            {/* Filtro: Tipo */}
            <div className="col-12 col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text">Tipo</span>
                <select className="form-select" value={tipo} onChange={(e)=>setTipo(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="SALARIO">SALÁRIO</option>
                  <option value="VALE">VALE</option>
                </select>
              </div>
            </div>
            {/* Ação: Criar folha de VALE (admin) */}
            <div className="col-12 col-md-3 ms-md-auto">
              {isAdmin && (
                <button
                  className="btn btn-primary btn-sm w-100"
                  disabled={creating}
                  onClick={onCriarFolhaVale}
                >
                  {creating ? 'Criando…' : 'Gerar folha de VALE (mês/ano atuais)'}
                </button>
              )}
            </div>
          </div>
        </div>

        {err && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center">
            <div>{err}</div>
            <button className="btn btn-sm btn-outline-light" onClick={loadFolhas}>Tentar novamente</button>
          </div>
        )}

        {/* LISTA DE FOLHAS */}
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle">
            <thead>
              <tr>
                <th style={{width:90}}>ID</th>
                <th style={{width:140}}>Competência</th>
                <th style={{width:130}}>Tipo</th>
                <th style={{width:160}}>Data geração</th>
                <th style={{width:140}}>Total</th>
                <th style={{width:120}}>Status</th>
                <th style={{width:240}}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="py-4 text-center">
                  <div className="spinner-border" role="status" aria-hidden="true"/><span className="ms-2 text-muted">Carregando…</span>
                </td></tr>
              ) : filteredRows.length === 0 ? (
                <tr><td colSpan="7" className="text-muted">Nenhuma folha encontrada para o filtro atual.</td></tr>
              ) : (
                filteredRows.map(f => {
                  const id = f?.id ?? f?.ID;
                  const m  = f?.mes ?? f?.Mes;
                  const a  = f?.ano ?? f?.Ano;
                  const t  = f?.tipo ?? f?.Tipo;
                  const total = f?.valorTotal ?? f?.ValorTotal;
                  const ger   = f?.dataGeracao ?? f?.DataGeracao;
                  const pago  = !!(f?.pago ?? f?.Pago);

                  return (
                    <tr key={id}>
                      <td>{id}</td>
                      <td>{String(m).padStart(2,'0')}/{a}</td>
                      <td>{tipoBadge(t)}</td>
                      <td>{formatDateOnly(ger)}</td>
                      <td>R$ {Number(total || 0).toFixed(2)}</td>
                      <td>{statusBadge(pago)}</td>
                      <td className="align-middle">
                        <div className="d-flex flex-wrap gap-2">
                          <button className="btn btn-sm btn-outline-primary" onClick={()=>openFolha(f)}>
                            Abrir folha
                          </button>

                          {!pago && (
                            isAdmin ? (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => fecharFolhaDaLista(f)}
                                disabled={loadingPays}
                              >
                                Marcar como paga
                              </button>
                            ) : (
                              <button className="btn btn-sm btn-success" disabled title="Somente admins podem fechar">
                                Marcar como paga
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* DETALHE DA FOLHA */}
        {selected && (
          <div className="mt-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-2">
              <h6 className="mb-0">
                Pagamentos da folha #{selected.id ?? selected.ID} — {String(selected.mes ?? selected.Mes).padStart(2,'0')}/{selected.ano ?? selected.Ano} ({(selected.tipo ?? selected.Tipo) || '-'})
              </h6>
              <div className="d-flex flex-wrap gap-2">
                {!folhaPaga && (
                  <button className="btn btn-sm btn-outline-secondary" onClick={onRecalcular} disabled={loadingPays}>
                    Recalcular
                  </button>
                )}
                <div className="input-group input-group-sm" style={{width: '240px'}}>
                  <span className="input-group-text">Buscar</span>
                  <input className="form-control" placeholder="Nome do funcionário…" value={busca} onChange={e=>setBusca(e.target.value)} />
                </div>
                <button className="btn btn-sm btn-outline-primary" onClick={onExportarCsv} disabled={loadingPays || pagamentosFiltrados.length===0}>
                  Exportar CSV
                </button>
                <button className="btn btn-sm btn-outline-secondary" onClick={()=>{ setSelected(null); setPagamentos([]); setFaltasByFunc(new Map()); }}>
                  Fechar detalhe
                </button>
              </div>
            </div>

            {/* Resumo — muda conforme o tipo */}
            {isFolhaVale ? (
              <>
                <div className="mb-1 text-muted small">Total dos vales</div>
                <div className="row g-2 mb-2">
                  <div className="col-auto">
                    <span className="badge bg-light text-dark">
                      Total: <strong>R$ {totalVales.toFixed(2)}</strong>
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="mb-1 text-muted small">Totais dos pagamentos filtrados</div>
                <div className="row g-2 mb-2">
                  <div className="col-auto"><span className="badge bg-light text-dark">Salário base: <strong>R$ {totaisSalario.base.toFixed(2)}</strong></span></div>
                  <div className="col-auto"><span className="badge bg-light text-dark">Adicional: <strong>R$ {totaisSalario.adic.toFixed(2)}</strong></span></div>
                  <div className="col-auto"><span className="badge bg-light text-dark">Desconto: <strong>R$ {totaisSalario.desc.toFixed(2)}</strong></span></div>
                  <div className="col-auto"><span className="badge bg-light text-dark">Sal. família: <strong>R$ {totaisSalario.fam.toFixed(2)}</strong></span></div>
                  <div className="col-auto"><span className="badge bg-light text-dark">Desc. faltas: <strong>R$ {totaisSalario.descFaltas.toFixed(2)}</strong></span></div>
                  <div className="col-auto"><span className="badge bg-light text-dark">Desc. vales: <strong>R$ {totaisSalario.descVales.toFixed(2)}</strong></span></div>
                  <div className="col-auto"><span className="badge bg-light text-dark">Valor final: <strong>R$ {totaisSalario.final.toFixed(2)}</strong></span></div>
                </div>
              </>
            )}

            {errPays && (
              <div className="alert alert-danger d-flex justify-content-between align-items-center">
                <div>{errPays}</div>
                <button className="btn btn-sm btn-outline-light" onClick={()=>openFolha(selected)}>Tentar novamente</button>
              </div>
            )}

            <div className="table-responsive">
              {/* Tabela muda conforme o tipo */}
              {!isFolhaVale ? (
                <table className="table table-sm table-striped table-hover align-middle">
                  <thead>
                    <tr>
                      <th style={{width:90}}>ID</th>
                      <th>Funcionário</th>
                      <th style={{width:140}}>Salário base</th>
                      <th style={{width:120}}>Adicional</th>
                      <th style={{width:120}}>Desconto</th>
                      <th style={{width:140}}>Salário família</th>
                      <th style={{width:140}}>Desc. faltas</th>
                      <th style={{width:140}}>Desc. vales</th>
                      <th style={{width:140}}>Valor final</th>
                      <th style={{width:100}}>Pago</th>
                      <th style={{width:160}}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingPays ? (
                      <tr><td colSpan="11" className="py-4 text-center">
                        <div className="spinner-border" role="status" aria-hidden="true"/><span className="ms-2 text-muted">Carregando…</span>
                      </td></tr>
                    ) : pagamentosFiltrados.length === 0 ? (
                      <tr><td colSpan="11" className="text-muted">Nenhum pagamento nesta folha.</td></tr>
                    ) : (
                      pagamentosFiltrados.map(p => {
                        const id = p?.id ?? p?.ID;
                        const funcId = p?.funcionarioId ?? p?.FuncionarioID ?? p?.funcionarioID;
                        const nome = nomeByFuncionario.get(funcId) || `ID ${funcId}`;

                        const base = p?.salarioBase ?? p?.SalarioBase;
                        const adicional = p?.adicional ?? p?.Adicional;
                        const desconto = p?.desconto ?? p?.Desconto ?? p?.descontoINSS ?? p?.DescontoINSS;
                        const fam = p?.salarioFamilia ?? p?.SalarioFamilia;
                        const descVales = p?.descontoVales ?? p?.DescontoVales;
                        const finalV = p?.valorFinal ?? p?.ValorFinal;
                        const pago = !!(p?.pago ?? p?.Pago);

                        const faltasQtd = Number(faltasByFunc.get(funcId) || 0);
                        const descF = (Number(base || 0) / 30) * faltasQtd;

                        return (
                          <tr key={id}>
                            <td>{id}</td>
                            <td>{nome}</td>
                            <td>R$ {Number(base || 0).toFixed(2)}</td>
                            <td>R$ {Number(adicional || 0).toFixed(2)}</td>
                            <td>R$ {Number(desconto || 0).toFixed(2)}</td>
                            <td>R$ {Number(fam || 0).toFixed(2)}</td>
                            <td>R$ {Number(descF || 0).toFixed(2)}</td>
                            <td>R$ {Number(descVales || 0).toFixed(2)}</td>
                            <td><strong>R$ {Number(finalV || 0).toFixed(2)}</strong></td>
                            <td>{pago ? <span className="badge bg-success">pago</span> : <span className="badge bg-warning text-dark">em aberto</span>}</td>
                            <td className="align-middle">
                              <div className="d-flex flex-wrap gap-2">
                                {!folhaPaga && (
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => { setEditItem(p); setEditOpen(true); }}
                                  >
                                    Editar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              ) : (
                // Tabela específica de VALE
                <table className="table table-sm table-striped table-hover align-middle">
                  <thead>
                    <tr>
                      <th style={{width:90}}>ID</th>
                      <th>Funcionário</th>
                      <th style={{width:140}}>Valor do vale</th>
                      <th style={{width:140}}>Data</th>
                      <th style={{width:100}}>Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingPays ? (
                      <tr><td colSpan="5" className="py-4 text-center">
                        <div className="spinner-border" role="status" aria-hidden="true"/><span className="ms-2 text-muted">Carregando…</span>
                      </td></tr>
                    ) : pagamentosFiltrados.length === 0 ? (
                      <tr><td colSpan="5" className="text-muted">Nenhum vale nesta folha.</td></tr>
                    ) : (
                      pagamentosFiltrados.map(p => {
                        const id = p?.id ?? p?.ID;
                        const funcId = p?.funcionarioId ?? p?.FuncionarioID ?? p?.funcionarioID;
                        const nome = nomeByFuncionario.get(funcId) || `ID ${funcId}`;
                        const valor = p?.valor ?? p?.Valor ?? p?.valorFinal ?? p?.ValorFinal;
                        const pago = !!(p?.pago ?? p?.Pago);
                        const data = p?.data ?? p?.Data ?? '';

                        return (
                          <tr key={id}>
                            <td>{id}</td>
                            <td>{nome}</td>
                            <td>R$ {Number(valor || 0).toFixed(2)}</td>
                            <td>{formatDateOnly(data)}</td>
                            <td>{pago ? <span className="badge bg-success">pago</span> : <span className="badge bg-warning text-dark">em aberto</span>}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <PagamentoEditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        pagamento={editItem}
        folha={selected ? { mes: (selected.mes ?? selected.Mes), ano: (selected.ano ?? selected.Ano), pago: folhaPaga } : null}
        faltasInicial={
          editItem
            ? Number(
                faltasByFunc.get(
                  editItem.funcionarioId ?? editItem.FuncionarioID ?? editItem.funcionarioID
                ) || 0
              )
            : 0
        }
        onSaved={() => { if (selected) openFolha(selected); }}
      />
    </div>
  );
}
