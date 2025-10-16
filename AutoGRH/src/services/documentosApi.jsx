export function makeDocumentosApi(request) {
  async function listByFuncionario(funcionarioId) {
    const r = await request(`/funcionarios/${funcionarioId}/documentos`, { method: "GET" });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  async function upload(funcionarioId, file) {
    const form = new FormData();
    form.append("file", file);
    const r = await request(`/funcionarios/${funcionarioId}/documentos`, {
      method: "POST",
      body: form,
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  // Faz download/autovisualização via fetch COM Authorization e retorna {blob, filename}
  async function fetchBlob(id) {
    const r = await request(`/documentos/${id}/download`, { method: "GET" });
    if (!r.ok) throw new Error(await r.text());
    const blob = await r.blob();

    // tenta extrair o filename a partir do header (nem sempre vem)
    let filename = "documento";
    const disp = r.headers.get("Content-Disposition");
    if (disp && /filename="?([^"]+)"?/i.test(disp)) {
      filename = decodeURIComponent(RegExp.$1);
    }
    return { blob, filename };
  }

  async function remove(id) {
    const r = await request(`/documentos/${id}`, { method: "DELETE" });
    if (!r.ok) throw new Error(await r.text());
    return true;
  }

  return { listByFuncionario, upload, fetchBlob, remove };
}
