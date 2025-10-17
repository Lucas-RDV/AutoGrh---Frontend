import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useApi } from '../../../hooks/useApi';
import { makeFuncionariosApi } from '../../../services/funcionariosApi';
import { makePessoasApi } from '../../../services/pessoasApi';

const digits = (s) => String(s ?? '').replace(/\D/g, '');
const clamp9 = (s) => digits(s).slice(0, 9);
const maskPhone = (d) => {
  const s = digits(d);
  if (!s) return '';
  if (s.length <= 5) return s;
  return `${s.slice(0,5)}-${s.slice(5)}`;
};
const toISO = (v) => (v ? String(v).slice(0, 10) : '');
const fmtBRL = (v) =>
  typeof v === 'number' && Number.isFinite(v)
    ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : 'R$ 0,00';
function cpfMask(v = '') {
  const d = String(v || '').replace(/\D/g, '').slice(0, 11);
  if (d.length !== 11) return v || '';
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}

const DadosTab = forwardRef(function DadosTab({ func, pessoa, editing }, ref) {
  const { request } = useApi();
  const funcApi = makeFuncionariosApi(request);
  const pesApi  = makePessoasApi(request);

  // pessoa
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [endereco, setEndereco] = useState('');
  const [contato, setContato] = useState('');
  const [contatoEmergencia, setContatoEmergencia] = useState('');
  const [nascimento, setNascimento] = useState('');

  // funcionario
  const [cargo, setCargo] = useState('');
  const [pis, setPis] = useState('');
  const [ctpf, setCtpf] = useState('');
  const [admissao, setAdmissao] = useState('');
  const [demissao] = useState('');
  const [salarioAtual, setSalarioAtual] = useState(null);
  const [salarioReal, setSalarioReal]   = useState(null);

  const ativo = !demissao;

  const baselineRef = useRef(null);

  useEffect(() => {
    const p = pessoa || {};
    const f = func || {};

    // pessoa
    setNome(p.nome ?? '');
    setCpf(p.cpf ?? '');
    setRg(p.rg ?? '');
    setEndereco(p.endereco ?? '');
    setContato(digits(p.contato ?? ''));
    setContatoEmergencia(digits((p.contato_emergencia ?? p.contatoEmergencia) ?? ''));

    // funcionario
    setCargo(f.cargo ?? '');
    setPis(f.pis ?? '');
    setCtpf(f.ctpf ?? '');
    setAdmissao(toISO(f.admissao));
    setNascimento(toISO(f.nascimento));

    baselineRef.current = {
      pessoa: {
        nome: p.nome ?? '',
        cpf: p.cpf ?? '',
        rg: p.rg ?? '',
        endereco: p.endereco ?? '',
        contato: digits(p.contato ?? ''),
        contatoEmergencia: digits((p.contato_emergencia ?? p.contatoEmergencia) ?? ''),
        nascimento: toISO(f.nascimento),
      },
      funcionario: {
        cargo: f.cargo ?? '',
        pis: f.pis ?? '',
        ctpf: f.ctpf ?? '',
        admissao: toISO(f.admissao),
      }
    };

    // salários atuais
    (async () => {
      try {
        if (f.id != null) {
          const r = await request(`/funcionarios/${f.id}/salarios`, { method: 'GET' });
          if (r.ok) {
            const lista = await r.json();
            if (Array.isArray(lista) && lista.length) {
              const vigente = lista.find(s => !s.fim) ||
                lista.slice().sort((a,b) => new Date(a.inicio || 0) - new Date(b.inicio || 0)).pop();
              const valor = vigente?.valor ?? null;
              setSalarioAtual(Number(valor) || null);
            } else setSalarioAtual(null);
          } else setSalarioAtual(null);

          const r2 = await request(`/funcionarios/${f.id}/salario-real-atual`, { method: 'GET' });
          if (r2.ok) {
            const sr = await r2.json();
            const valor = sr?.valor ?? null;
            setSalarioReal(Number(valor) || null);
          } else setSalarioReal(null);
        }
      } catch {
        setSalarioAtual(null);
        setSalarioReal(null);
      }})()}, [pessoa?.id, func?.id]);

 const feriasDisponiveisCalc = useMemo(() => {
    if (!Array.isArray(func?.ferias)) return 0;
    return func.ferias.reduce((acc, f) => {
      const saldo = (typeof f.dias_restantes === 'number')
        ? f.dias_restantes
        : (typeof f.diasRestantes === 'number' ? f.diasRestantes : (f.dias ?? 0));
      return acc + (!f.pago ? Number(saldo || 0) : 0);
    }, 0);
  }, [func]);

  useImperativeHandle(ref, () => ({
    async save() {
      if (!nome || !nome.trim() || !cpf || !rg || !rg.trim()) {
        alert('Preencha Nome, CPF e RG.');
        throw new Error('Preencha Nome, CPF e RG.');
      }

      // update pessoa
      if (pessoa?.id != null) {
        await pesApi.update(pessoa.id, {
          nome,
          cpf, 
          rg,
          endereco,
          contato: digits(contato),
          contato_emergencia: digits(contatoEmergencia),
        });
      }

      // update funcionario
      if (func?.id != null) {
        await funcApi.update(func.id, {
          pessoaId: func.pessoaId,
          cargo, pis, ctpf,
          admissao: admissao || null,
          nascimento: nascimento || null,
        });
      }

      baselineRef.current = {
        pessoa: {
          nome, cpf, rg, endereco,
          contato: digits(contato),
          contatoEmergencia: digits(contatoEmergencia),
          nascimento,
        },
        funcionario: {
          cargo, pis, ctpf, admissao,
        }
      };
    },
    reset() {
      const b = baselineRef.current;
      if (!b) return;

      setNome(b.pessoa.nome);
      setCpf(b.pessoa.cpf);
      setRg(b.pessoa.rg);
      setEndereco(b.pessoa.endereco);
      setContato(b.pessoa.contato);
      setContatoEmergencia(b.pessoa.contatoEmergencia);
      setNascimento(b.pessoa.nascimento);

      setCargo(b.funcionario.cargo);
      setPis(b.funcionario.pis);
      setCtpf(b.funcionario.ctpf);
      setAdmissao(b.funcionario.admissao);
    }
  }));

  return (
    <div className="row g-3">
      <div className="col-12 col-lg-6">
        <div className="card">
          <div className="card-header">Dados Pessoais</div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">Nome</label>
              <input className="form-control" value={nome} onChange={e=>setNome(e.target.value)} disabled={!editing} />
            </div>

            <div className="mb-3">
              <label className="form-label">CPF</label>
              <input className="form-control" value={cpfMask(cpf)} disabled />
            </div>

            <div className="mb-3">
              <label className="form-label">RG</label>
              <input className="form-control" value={rg} onChange={e=>setRg(e.target.value)} disabled={!editing} />
            </div>

            <div className="mb-3">
              <label className="form-label">Endereço</label>
              <input className="form-control" value={endereco} onChange={e=>setEndereco(e.target.value)} disabled={!editing} />
            </div>

            <div className="mb-3">
              <label className="form-label">Contato</label>
              <input
                className="form-control"
                inputMode="numeric"
                pattern="[0-9]*"
                value={maskPhone(contato)}
                onChange={(e)=> setContato(clamp9(e.target.value))}
                disabled={!editing}
                placeholder="xxxxx-xxxx"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Contato de emergência</label>
              <input
                className="form-control"
                inputMode="numeric"
                pattern="[0-9]*"
                value={maskPhone(contatoEmergencia)}
                onChange={(e)=> setContatoEmergencia(clamp9(e.target.value))}
                disabled={!editing}
                placeholder="xxxxx-xxxx"
              />
            </div>

            <div className="mb-1">
              <label className="form-label">Data de nascimento</label>
              <input type="date" className="form-control" value={nascimento || ''} onChange={e=>setNascimento(e.target.value)} disabled={!editing} />
            </div>
          </div>
        </div>
      </div>

      <div className="col-12 col-lg-6">
        <div className="card">
          <div className="card-header">Dados Trabalhistas</div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">Cargo</label>
              <input className="form-control" value={cargo} onChange={e=>setCargo(e.target.value)} disabled={!editing} />
            </div>

            <div className="row g-2 mb-3">
              <div className="col-md-6">
                <label className="form-label">PIS</label>
                <input className="form-control" value={pis} onChange={e=>setPis(e.target.value)} disabled={!editing} />
              </div>
              <div className="col-md-6">
                <label className="form-label">CTPF</label>
                <input className="form-control" value={ctpf} onChange={e=>setCtpf(e.target.value)} disabled={!editing} />
              </div>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-md-6">
                <label className="form-label">Admissão</label>
                <input type="date" className="form-control" value={admissao || ''} onChange={e=>setAdmissao(e.target.value)} disabled={!editing} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Férias disponíveis (dias)</label>
                <input className="form-control" value={feriasDisponiveisCalc} disabled />
              </div>
            </div>

            <div className="row g-2 mb-1">
              <div className="col-md-6">
                <label className="form-label">Salário (registrado) atual</label>
                <input className="form-control" value={fmtBRL(func?.salarioRegistradoAtual?.valor ?? salarioAtual ?? 0)} disabled />
              </div>
              <div className="col-md-6">
                <label className="form-label">Salário real atual</label>
                <input className="form-control" value={fmtBRL(func?.salarioRealAtual?.valor ?? salarioReal ?? 0)} disabled />
              </div>
            </div>

            <div>
              {ativo ? <span className="badge bg-success">Ativo</span> : <span className="badge bg-secondary">Inativo</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default DadosTab;
