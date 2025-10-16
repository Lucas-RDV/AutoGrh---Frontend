// src/pages/Admin/Usuarios.jsx
import { useEffect, useMemo, useState } from 'react';
import { useApi } from '../../hooks/useApi';

// A listagem do backend retorna UserMinimal: [{ id, login, nome, perfil }]
function validateAndNormalize(list) {
  if (!Array.isArray(list)) {
    throw new Error('Resposta inválida: esperado um array');
  }
  return list.map((u, idx) => {
    const id = u?.id ?? u?.ID;
    const login = u?.login ?? u?.nome;
    const perfil = typeof u?.perfil === 'string' ? u.perfil.trim().toLowerCase() : '';
    if (typeof id !== 'number' || !login || !perfil) {
      throw new Error(`Item ${idx} inválido. Esperado { id:number, login/nome:string, perfil:string }`);
    }
    return { id, login, isAdmin: perfil === 'admin' };
  });
}

const Usuarios = () => {
  const { request } = useApi();

  // listagem
  const [users, setUsers] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [errList, setErrList] = useState(null);

  // filtro
  const [query, setQuery] = useState('');

  // modal de criação
  const [showCreate, setShowCreate] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAdminCreate, setIsAdminCreate] = useState(false);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [errCreate, setErrCreate] = useState(null);

  // desativar
  const [deactivatingId, setDeactivatingId] = useState(null);

  // modal de edição
  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState(''); // opcional; envia só se preencher
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [errEdit, setErrEdit] = useState(null);
  const [originalSnapshot, setOriginalSnapshot] = useState(null); // {login, isAdmin}

  async function fetchUsers() {
    setLoadingList(true);
    setErrList(null);
    try {
      const res = await request('/admin/usuarios', { method: 'GET' });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Falha ao listar usuários');
      }
      const data = await res.json();
      const norm = validateAndNormalize(data);
      setUsers(norm);
    } catch (e) {
      setErrList(e?.message || 'Erro ao carregar usuários');
      setUsers([]);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      String(u.login || '').toLowerCase().includes(q) ||
      String(u.id || '').includes(q)
    );
  }, [users, query]);

  // criar — abrir/fechar
  function openCreate() {
    setErrCreate(null);
    setUsername('');
    setPassword('');
    setIsAdminCreate(false);
    setShowCreate(true);
  }
  function closeCreate() {
    if (submittingCreate) return;
    setShowCreate(false);
  }

  // criar — submit
  async function handleCreate(e) {
    e?.preventDefault?.();
    setErrCreate(null);

    const uname = username.trim();
    const pass = password.trim();
    if (!uname || !pass) {
      setErrCreate('Preencha username e password.');
      return;
    }

    setSubmittingCreate(true);
    try {
      const res = await request('/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: uname,
          password: pass,
          isAdmin: !!isAdminCreate,
        }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Falha ao criar usuário');
      }
      await fetchUsers();
      setShowCreate(false);
      try { window.alert('Usuário criado com sucesso.'); } catch {}
    } catch (e) {
      setErrCreate(e?.message || 'Erro ao criar usuário');
    } finally {
      setSubmittingCreate(false);
    }
  }

  // desativar
  async function handleDeactivate(u) {
    if (!u?.id) return;
    const ok = window.confirm(`Desativar o usuário "${u.login}" (ID ${u.id})?`);
    if (!ok) return;

    setDeactivatingId(u.id);
    try {
      const res = await request(`/admin/usuarios/${u.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Falha ao desativar usuário');
      }
      setUsers(prev => prev.filter(x => x.id !== u.id));
      try { window.alert('Usuário desativado.'); } catch {}
    } catch (e) {
      try { window.alert(e?.message || 'Erro ao desativar usuário'); } catch {}
    } finally {
      setDeactivatingId(null);
    }
  }

  // editar — abrir/fechar
  function openEdit(u) {
    setErrEdit(null);
    setEditId(u.id);
    setEditUsername(u.login);
    setEditPassword('');
    setEditIsAdmin(!!u.isAdmin);
    setOriginalSnapshot({ login: u.login, isAdmin: !!u.isAdmin });
    setShowEdit(true);
  }
  function closeEdit() {
    if (submittingEdit) return;
    setShowEdit(false);
  }

  // editar — submit
  async function handleEdit(e) {
    e?.preventDefault?.();
    if (!editId) return;

    setErrEdit(null);

    const payload = {};
    const nextLogin = editUsername.trim();
    const nextPass = editPassword.trim();
    const nextIsAdmin = !!editIsAdmin;

    // inclui apenas campos alterados
    if (nextLogin && nextLogin !== originalSnapshot.login) {
      payload.username = nextLogin;
    }
    if (nextPass) {
      // no UPDATE, o backend espera 'senha' (pt-BR)
      payload.senha = nextPass;
    }
    if (nextIsAdmin !== originalSnapshot.isAdmin) {
      payload.isAdmin = nextIsAdmin;
    }

    if (Object.keys(payload).length === 0) {
      setErrEdit('Nenhuma alteração para salvar.');
      return;
    }

    setSubmittingEdit(true);
    try {
      const res = await request(`/admin/usuarios/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Falha ao atualizar usuário');
      }

      // Atualiza a linha localmente (sem refetch)
      setUsers(prev =>
        prev.map(u =>
          u.id === editId
            ? {
                ...u,
                login: payload.username ?? u.login,
                isAdmin: payload.hasOwnProperty('isAdmin') ? payload.isAdmin : u.isAdmin,
              }
            : u
        )
      );

      setShowEdit(false);
      try { window.alert('Usuário atualizado com sucesso.'); } catch {}
    } catch (e) {
      setErrEdit(e?.message || 'Erro ao atualizar usuário');
    } finally {
      setSubmittingEdit(false);
    }
  }

  return (
    <div className="card shadow-sm">
      <div className="card-body">

        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="card-title mb-0">Usuários</h5>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={fetchUsers} disabled={loadingList}>
              {loadingList ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Atualizando…
                </>
              ) : (
                'Atualizar'
              )}
            </button>
            <button className="btn btn-primary btn-sm" onClick={openCreate}>
              Adicionar usuário
            </button>
          </div>
        </div>

        <div className="row g-2 mb-3">
          <div className="col-12 col-md-6 col-lg-4">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por username (login) ou ID"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {errList && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
            <div>{errList}</div>
            <button className="btn btn-sm btn-outline-light" onClick={fetchUsers}>Tentar novamente</button>
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle mb-0">
            <thead>
              <tr>
                <th style={{ width: 80 }}>ID</th>
                <th>Username (login)</th>
                <th style={{ width: 120 }}>Admin</th>
                <th className="text-end" style={{ width: 200 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loadingList ? (
                <tr>
                  <td colSpan="4">
                    <div className="d-flex justify-content-center align-items-center py-4">
                      <div className="spinner-border" role="status" aria-hidden="true" />
                      <span className="ms-2 text-muted">Carregando…</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-muted">Nenhum usuário encontrado.</td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.login}</td>
                    <td>
                      {u.isAdmin ? (
                        <span className="badge bg-success">Sim</span>
                      ) : (
                        <span className="badge bg-secondary">Não</span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end">
                        <button
                          className="btn btn-outline-primary btn-sm me-2"
                          onClick={() => openEdit(u)}
                          disabled={deactivatingId === u.id}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDeactivate(u)}
                          disabled={deactivatingId === u.id}
                        >
                          {deactivatingId === u.id ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Desativando…
                            </>
                          ) : (
                            'Desativar'
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal de criação (sem JS do Bootstrap) */}
        {showCreate && (
          <>
            <div className="modal d-block" tabIndex="-1" role="dialog" aria-modal="true">
              <div className="modal-dialog">
                <div className="modal-content">
                  <form onSubmit={handleCreate}>
                    <div className="modal-header">
                      <h5 className="modal-title">Adicionar usuário</h5>
                      <button type="button" className="btn-close" onClick={closeCreate} disabled={submittingCreate} aria-label="Fechar"></button>
                    </div>
                    <div className="modal-body">
                      {errCreate && <div className="alert alert-danger">{errCreate}</div>}

                      <div className="mb-3">
                        <label className="form-label">Username</label>
                        <input
                          type="text"
                          className="form-control"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          disabled={submittingCreate}
                          autoFocus
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Password</label>
                        <input
                          type="password"
                          className="form-control"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={submittingCreate}
                          required
                        />
                        <div className="form-text">
                          A senha será enviada ao backend e **não** é mostrada depois.
                        </div>
                      </div>

                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="isAdminCreate"
                          checked={isAdminCreate}
                          onChange={(e) => setIsAdminCreate(e.target.checked)}
                          disabled={submittingCreate}
                        />
                        <label className="form-check-label" htmlFor="isAdminCreate">
                          É administrador
                        </label>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-outline-secondary" onClick={closeCreate} disabled={submittingCreate}>
                        Cancelar
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={submittingCreate}>
                        {submittingCreate ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Salvando…
                          </>
                        ) : (
                          'Salvar'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            {/* backdrop */}
            <div className="modal-backdrop fade show" onClick={closeCreate} />
          </>
        )}

        {/* Modal de Edição */}
        {showEdit && (
          <>
            <div className="modal d-block" tabIndex="-1" role="dialog" aria-modal="true">
              <div className="modal-dialog">
                <div className="modal-content">
                  <form onSubmit={handleEdit}>
                    <div className="modal-header">
                      <h5 className="modal-title">Editar usuário</h5>
                      <button type="button" className="btn-close" onClick={closeEdit} disabled={submittingEdit} aria-label="Fechar"></button>
                    </div>
                    <div className="modal-body">
                      {errEdit && <div className="alert alert-danger">{errEdit}</div>}

                      <div className="mb-3">
                        <label className="form-label">Username</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                          disabled={submittingEdit}
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Nova senha (opcional)</label>
                        <input
                          type="password"
                          className="form-control"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          disabled={submittingEdit}
                          placeholder="Deixe em branco para não alterar"
                        />
                        <div className="form-text">
                          Se preencher, enviaremos como <code>senha</code> (update).
                        </div>
                      </div>

                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="isAdminEdit"
                          checked={editIsAdmin}
                          onChange={(e) => setEditIsAdmin(e.target.checked)}
                          disabled={submittingEdit}
                        />
                        <label className="form-check-label" htmlFor="isAdminEdit">
                          É administrador
                        </label>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-outline-secondary" onClick={closeEdit} disabled={submittingEdit}>
                        Cancelar
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={submittingEdit}>
                        {submittingEdit ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Salvando…
                          </>
                        ) : (
                          'Salvar alterações'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            {/* backdrop */}
            <div className="modal-backdrop fade show" onClick={closeEdit} />
          </>
        )}

      </div>
    </div>
  );
};

export default Usuarios;
