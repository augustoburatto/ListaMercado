/* ============================================================
   Carrinho — lógica do app
   Dois backends com a mesma interface: Supabase (compartilhado)
   ou localStorage (só neste navegador).
   ============================================================ */
(function () {
  "use strict";

  var CFG = window.CONFIG || {};
  var URL_BASE = (CFG.SUPABASE_URL || "").replace(/\/+$/, "");
  var CHAVE = CFG.SUPABASE_ANON_KEY || "";
  var COMPARTILHADO = !!(URL_BASE && CHAVE);
  var INTERVALO = (Number(CFG.INTERVALO_SYNC) || 4) * 1000;

  /* ---------- atalhos ---------- */
  var $ = function (s) { return document.querySelector(s); };
  var el = {
    lista: $("#lista"),
    vazio: $("#vazio"),
    titulo: $("#titulo"),
    nTotal: $("#n-total"),
    nComprados: $("#n-comprados"),
    vComprado: $("#v-comprado"),
    vTotal: $("#v-total"),
    barra: $("#progresso-barra"),
    progresso: $(".progresso"),
    form: $("#form-add"),
    inNome: $("#in-nome"),
    inQtd: $("#in-qtd"),
    inPreco: $("#in-preco"),
    inCat: $("#in-cat"),
    inBusca: $("#in-busca"),
    btnLimparBusca: $("#btn-limpar-busca"),
    inOrdenar: $("#in-ordenar"),
    modoMercado: $("#modo-mercado"),
    btnLimpar: $("#btn-limpar"),
    btnCompartilhar: $("#btn-compartilhar"),
    sync: $("#status-sync"),
    avisoDemo: $("#aviso-demo"),
    avisoErro: $("#aviso-erro"),
    toast: $("#aviso"),
    vazioBusca: $("#vazio-busca"),
    rodapeModo: $("#rodape-modo")
  };

  var CATEGORIAS = ["Mercearia", "Higiene", "Congelados"];
  var CAT_PADRAO = "Mercearia";
  function catValida(c) { return CATEGORIAS.indexOf(c) > -1 ? c : CAT_PADRAO; }

  var dinheiro = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  var numero = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

  function num(v) {
    if (v === null || v === undefined) return 0;
    var s = String(v).trim().replace(/\s/g, "");
    if (s === "") return 0;
    if (s.indexOf(",") > -1) s = s.replace(/\./g, "").replace(",", ".");
    var n = parseFloat(s);
    return isFinite(n) && n > 0 ? n : 0;
  }

  function escapar(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // minúsculas e sem acento, para a busca casar "acucar" com "açúcar"
  function normal(t) {
    return String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  /* ============================================================
     BACKENDS
     ============================================================ */

  /* --- Supabase via REST --- */
  function req(caminho, opcoes) {
    opcoes = opcoes || {};
    var cab = {
      apikey: CHAVE,
      Authorization: "Bearer " + CHAVE,
      "Content-Type": "application/json"
    };
    if (opcoes.prefer) cab.Prefer = opcoes.prefer;

    return fetch(URL_BASE + "/rest/v1/" + caminho, {
      method: opcoes.method || "GET",
      headers: cab,
      body: opcoes.body ? JSON.stringify(opcoes.body) : undefined
    }).then(function (r) {
      return r.text().then(function (txt) {
        if (!r.ok) throw new Error(txt || ("HTTP " + r.status));
        return txt ? JSON.parse(txt) : null;
      });
    });
  }

  var remoto = {
    listar: function () {
      return req("itens?select=*&order=criado_em.asc,id.asc");
    },
    criar: function (item) {
      return req("itens", { method: "POST", body: [item], prefer: "return=representation" })
        .then(function (r) { return r && r[0]; });
    },
    atualizar: function (id, campos) {
      return req("itens?id=eq." + encodeURIComponent(id), { method: "PATCH", body: campos });
    },
    remover: function (id) {
      return req("itens?id=eq." + encodeURIComponent(id), { method: "DELETE" });
    },
    limparComprados: function () {
      return req("itens?comprado=eq.true", { method: "DELETE" });
    },
    lerTitulo: function () {
      return req("config?select=valor&chave=eq.titulo").then(function (r) {
        return r && r[0] ? r[0].valor : null;
      }).catch(function () { return null; });
    },
    salvarTitulo: function (valor) {
      return req("config", {
        method: "POST",
        body: [{ chave: "titulo", valor: valor }],
        prefer: "resolution=merge-duplicates"
      }).catch(function () { /* tabela config é opcional */ });
    }
  };

  /* --- localStorage --- */
  var CHAVE_LOCAL = "carrinho:itens";
  var CHAVE_TITULO = "carrinho:titulo";

  function lerLocal() {
    try { return JSON.parse(localStorage.getItem(CHAVE_LOCAL) || "[]"); }
    catch (e) { return []; }
  }
  function gravarLocal(itens) {
    localStorage.setItem(CHAVE_LOCAL, JSON.stringify(itens));
  }
  function novoId() {
    return (crypto.randomUUID ? crypto.randomUUID()
      : "id-" + Date.now() + "-" + Math.random().toString(16).slice(2));
  }

  var local = {
    listar: function () { return Promise.resolve(lerLocal()); },
    criar: function (item) {
      var itens = lerLocal();
      item.id = novoId();
      item.criado_em = new Date().toISOString();
      itens.push(item);
      gravarLocal(itens);
      return Promise.resolve(item);
    },
    atualizar: function (id, campos) {
      var itens = lerLocal().map(function (i) {
        return i.id === id ? Object.assign({}, i, campos) : i;
      });
      gravarLocal(itens);
      return Promise.resolve();
    },
    remover: function (id) {
      gravarLocal(lerLocal().filter(function (i) { return i.id !== id; }));
      return Promise.resolve();
    },
    limparComprados: function () {
      gravarLocal(lerLocal().filter(function (i) { return !i.comprado; }));
      return Promise.resolve();
    },
    lerTitulo: function () {
      return Promise.resolve(localStorage.getItem(CHAVE_TITULO));
    },
    salvarTitulo: function (v) {
      localStorage.setItem(CHAVE_TITULO, v);
      return Promise.resolve();
    }
  };

  var db = COMPARTILHADO ? remoto : local;

  /* ============================================================
     ESTADO
     ============================================================ */
  var itens = [];
  var editandoId = null;
  var ocupado = 0;
  var busca = "";
  var ordem = "adicionado"; // adicionado | categoria | nome

  /* ---------- indicador de sincronização ---------- */
  function sync(estado, texto) {
    el.sync.className = "sync" + (estado ? " is-" + estado : "");
    el.sync.querySelector(".sync__txt").textContent = texto;
    el.sync.title = texto;
  }
  function comecou() { ocupado++; sync("ocupado", "salvando"); }
  function terminou(erro) {
    ocupado = Math.max(0, ocupado - 1);
    if (erro) { sync("offline", "sem conexão"); mostrarErro(erro); }
    else if (!ocupado) { sync("", COMPARTILHADO ? "sincronizado" : "salvo aqui"); esconderErro(); }
  }

  function mostrarErro(e) {
    el.avisoErro.hidden = false;
    el.avisoErro.textContent = "Não deu para falar com o servidor. Verifique as chaves em config.js e as permissões da tabela. (" +
      String(e && e.message || e).slice(0, 160) + ")";
  }
  function esconderErro() { el.avisoErro.hidden = true; }

  var timerToast;
  function toast(msg) {
    el.toast.hidden = false;
    el.toast.textContent = msg;
    requestAnimationFrame(function () { el.toast.classList.add("is-visivel"); });
    clearTimeout(timerToast);
    timerToast = setTimeout(function () {
      el.toast.classList.remove("is-visivel");
      setTimeout(function () { el.toast.hidden = true; }, 220);
    }, 2600);
  }

  /* ============================================================
     RENDERIZAÇÃO
     ============================================================ */
  function totalItem(i) { return num(i.quantidade) * num(i.preco); }

  var ORDEM_CAT = { Mercearia: 0, Higiene: 1, Congelados: 2 };

  // aplica busca e devolve a lista já ordenada conforme a escolha
  function preparar(lista) {
    var mercado = document.body.classList.contains("mercado");
    var alvo = normal(busca);

    var visiveis = lista.filter(function (i) {
      return !alvo || normal(i.nome).indexOf(alvo) > -1;
    });

    // guarda a posição original para servir de desempate estável
    var pos = {};
    lista.forEach(function (i, idx) { pos[i.id] = idx; });

    function porNome(a, b) {
      return normal(a.nome).localeCompare(normal(b.nome), "pt");
    }
    function porEntrada(a, b) { return pos[a.id] - pos[b.id]; }

    if (ordem === "nome") {
      visiveis.sort(porNome);
    } else if (ordem === "categoria") {
      visiveis.sort(function (a, b) {
        var d = ORDEM_CAT[catValida(a.categoria)] - ORDEM_CAT[catValida(b.categoria)];
        return d || porNome(a, b);
      });
    } else {
      visiveis.sort(porEntrada);
    }

    // no modo mercado, o que já foi comprado desce para o fim
    if (mercado) {
      visiveis.sort(function (a, b) { return (a.comprado ? 1 : 0) - (b.comprado ? 1 : 0); });
    }

    return visiveis;
  }

  function render() {
    if (editandoId) return; // não mexe na tela enquanto alguém edita

    var visiveis = preparar(itens);
    var mercado = document.body.classList.contains("mercado");
    var agrupar = ordem === "categoria" && !mercado;

    if (agrupar) {
      var html = "";
      var atual = null;
      visiveis.forEach(function (i) {
        var cat = catValida(i.categoria);
        if (cat !== atual) {
          atual = cat;
          var quantos = visiveis.filter(function (x) { return catValida(x.categoria) === cat; }).length;
          html += '<li class="grupo-cab" role="presentation">' + escapar(cat) +
                  ' <span class="n">' + quantos + '</span></li>';
        }
        html += linha(i, false);
      });
      el.lista.innerHTML = html;
    } else {
      el.lista.innerHTML = visiveis.map(function (i) { return linha(i, true); }).join("");
    }

    var buscando = !!busca;
    el.vazio.hidden = itens.length > 0;
    el.vazioBusca.hidden = !(buscando && visiveis.length === 0 && itens.length > 0);

    var comprados = itens.filter(function (i) { return i.comprado; });
    var total = itens.reduce(function (s, i) { return s + totalItem(i); }, 0);
    var gasto = comprados.reduce(function (s, i) { return s + totalItem(i); }, 0);
    var pct = itens.length ? Math.round(comprados.length / itens.length * 100) : 0;

    el.nTotal.textContent = itens.length;
    el.nComprados.textContent = comprados.length + " de " + itens.length;
    el.vComprado.textContent = dinheiro.format(gasto);
    el.vTotal.textContent = dinheiro.format(total);
    el.barra.style.width = pct + "%";
    el.progresso.setAttribute("aria-valuenow", pct);
    el.btnLimpar.disabled = comprados.length === 0;
  }

  // mostraSelo: exibe a etiqueta de categoria (não faz sentido sob um cabeçalho de grupo)
  function linha(i, mostraSelo) {
    var qtd = num(i.quantidade) || 1;
    var preco = num(i.preco);
    var cat = catValida(i.categoria);
    var meta = numero.format(qtd) + (preco ? " × " + dinheiro.format(preco) : " un.");
    var selo = mostraSelo
      ? '<span class="selo selo--' + cat + '">' + escapar(cat) + '</span>'
      : "";

    return '<li class="item' + (i.comprado ? " is-comprado" : "") + '" data-id="' + escapar(i.id) + '">' +
      '<button class="marca" type="button" data-acao="marcar" aria-pressed="' + (i.comprado ? "true" : "false") +
        '" aria-label="' + (i.comprado ? "Desmarcar" : "Marcar como comprado") + ': ' + escapar(i.nome) + '">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5 9.5 18 20 6.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '</button>' +
      '<span class="item__corpo">' +
        '<span class="item__nome">' + escapar(i.nome) + '</span>' +
        '<span class="item__meta">' + selo + meta + '</span>' +
      '</span>' +
      (preco ? '<span class="item__sub">' + dinheiro.format(qtd * preco) + '</span>' : "") +
      '<span class="item__botoes">' +
        '<button class="mini" type="button" data-acao="editar" aria-label="Editar ' + escapar(i.nome) + '">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>' +
        '</button>' +
        '<button class="mini mini--remover" type="button" data-acao="remover" aria-label="Remover ' + escapar(i.nome) + '">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10.5 11v5.5M13.5 11v5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>' +
      '</span>' +
    '</li>';
  }

  function abrirEdicao(li, item) {
    editandoId = item.id;
    li.classList.add("item--editando");
    var opcoes = CATEGORIAS.map(function (c) {
      return '<option value="' + c + '"' + (catValida(item.categoria) === c ? " selected" : "") + '>' + c + '</option>';
    }).join("");
    li.innerHTML =
      '<div class="edicao">' +
        '<input class="ed-nome" type="text" value="' + escapar(item.nome) + '" maxlength="80" aria-label="Nome">' +
        '<div class="edicao__numeros">' +
          '<input class="ed-qtd" type="text" inputmode="decimal" value="' + (num(item.quantidade) || 1) + '" aria-label="Quantidade">' +
          '<input class="ed-preco" type="text" inputmode="decimal" value="' + (num(item.preco) || "") + '" placeholder="Preço un." aria-label="Preço unitário">' +
        '</div>' +
        '<select class="ed-cat" aria-label="Categoria">' + opcoes + '</select>' +
        '<div class="edicao__acoes">' +
          '<button class="btn btn--fantasma" type="button" data-acao="cancelar">Cancelar</button>' +
          '<button class="btn btn--principal" type="button" data-acao="salvar">Salvar</button>' +
        '</div>' +
      '</div>';
    li.querySelector(".ed-nome").focus();
  }

  /* ============================================================
     AÇÕES
     ============================================================ */
  function acao(promessa) {
    comecou();
    return promessa.then(function (r) { terminou(); return r; },
                         function (e) { terminou(e); throw e; });
  }

  function adicionar(nome, qtd, preco, categoria) {
    var item = {
      nome: nome,
      quantidade: qtd || 1,
      preco: preco || 0,
      categoria: catValida(categoria),
      comprado: false
    };
    // otimista
    var provisorio = Object.assign({ id: "tmp-" + novoId(), criado_em: new Date().toISOString() }, item);
    itens.push(provisorio);
    render();

    return acao(db.criar(item)).then(function (salvo) {
      var idx = itens.indexOf(provisorio);
      if (idx > -1 && salvo) itens[idx] = salvo;
      render();
    }).catch(function () {
      itens = itens.filter(function (i) { return i !== provisorio; });
      render();
    });
  }

  function marcar(item) {
    item.comprado = !item.comprado;
    render();
    acao(db.atualizar(item.id, { comprado: item.comprado })).catch(function () {
      item.comprado = !item.comprado;
      render();
    });
  }

  function remover(item) {
    var antes = itens.slice();
    itens = itens.filter(function (i) { return i.id !== item.id; });
    render();
    acao(db.remover(item.id)).catch(function () { itens = antes; render(); });
  }

  function salvarEdicao(item, nome, qtd, preco, categoria) {
    var campos = { nome: nome, quantidade: qtd || 1, preco: preco || 0, categoria: catValida(categoria) };
    Object.assign(item, campos);
    editandoId = null;
    render();
    acao(db.atualizar(item.id, campos));
  }

  /* ============================================================
     EVENTOS
     ============================================================ */
  el.form.addEventListener("submit", function (e) {
    e.preventDefault();
    var nome = el.inNome.value.trim();
    if (!nome) return;
    var cat = el.inCat.value;
    adicionar(nome, num(el.inQtd.value), num(el.inPreco.value), cat);
    el.form.reset();
    el.inQtd.value = "1";
    el.inCat.value = cat; // mantém a categoria para o próximo item
    el.inNome.focus();
  });

  el.lista.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-acao]");
    if (!btn) return;
    var li = btn.closest(".item");
    if (!li) return;
    var id = li.dataset.id;
    var item = itens.filter(function (i) { return i.id === id; })[0];
    if (!item) return;

    var acaoNome = btn.dataset.acao;

    if (acaoNome === "marcar") marcar(item);

    else if (acaoNome === "editar") {
      // no modo mercado a edição não cabe; desliga o modo e abre a edição
      if (document.body.classList.contains("mercado")) {
        el.modoMercado.checked = false;
        document.body.classList.remove("mercado");
        try { localStorage.setItem("carrinho:mercado", ""); } catch (e) {}
        render();
        // após o render a <li> antiga foi recriada; localiza a nova pelo id
        var novaLi = el.lista.querySelector('.item[data-id="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]');
        if (novaLi) { abrirEdicao(novaLi, item); novaLi.scrollIntoView({ block: "center", behavior: "smooth" }); }
      } else {
        abrirEdicao(li, item);
      }
    }

    else if (acaoNome === "remover") remover(item);

    else if (acaoNome === "cancelar") { editandoId = null; render(); }

    else if (acaoNome === "salvar") {
      var nome = li.querySelector(".ed-nome").value.trim();
      if (!nome) { li.querySelector(".ed-nome").focus(); return; }
      salvarEdicao(
        item, nome,
        num(li.querySelector(".ed-qtd").value),
        num(li.querySelector(".ed-preco").value),
        li.querySelector(".ed-cat").value
      );
    }
  });

  el.lista.addEventListener("keydown", function (e) {
    if (!editandoId) return;
    if (e.key === "Enter") {
      e.preventDefault();
      var salvar = e.target.closest(".item").querySelector('[data-acao="salvar"]');
      if (salvar) salvar.click();
    } else if (e.key === "Escape") {
      editandoId = null; render();
    }
  });

  el.btnLimpar.addEventListener("click", function () {
    var comprados = itens.filter(function (i) { return i.comprado; }).length;
    if (!comprados) return;
    if (!confirm("Tirar " + comprados + (comprados > 1 ? " itens comprados" : " item comprado") + " da lista?")) return;
    var antes = itens.slice();
    itens = itens.filter(function (i) { return !i.comprado; });
    render();
    acao(db.limparComprados()).catch(function () { itens = antes; render(); });
  });

  el.modoMercado.addEventListener("change", function () {
    document.body.classList.toggle("mercado", el.modoMercado.checked);
    try { localStorage.setItem("carrinho:mercado", el.modoMercado.checked ? "1" : ""); } catch (e) {}
    render();
  });

  el.inBusca.addEventListener("input", function () {
    busca = el.inBusca.value.trim();
    el.btnLimparBusca.hidden = !busca;
    render();
  });
  el.btnLimparBusca.addEventListener("click", function () {
    busca = "";
    el.inBusca.value = "";
    el.btnLimparBusca.hidden = true;
    el.inBusca.focus();
    render();
  });

  el.inOrdenar.addEventListener("change", function () {
    ordem = el.inOrdenar.value;
    try { localStorage.setItem("carrinho:ordem", ordem); } catch (e) {}
    render();
  });

  el.btnCompartilhar.addEventListener("click", function () {
    var link = location.href.split("#")[0];
    var dados = { title: document.title, text: "Nossa lista de compras", url: link };
    if (navigator.share) {
      navigator.share(dados).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(function () { toast("Link copiado"); },
                                               function () { prompt("Copie o link:", link); });
    } else {
      prompt("Copie o link:", link);
    }
  });

  var timerTitulo;
  el.titulo.addEventListener("input", function () {
    clearTimeout(timerTitulo);
    var v = el.titulo.value.trim() || "Lista da casa";
    timerTitulo = setTimeout(function () { acao(db.salvarTitulo(v)); }, 700);
  });

  /* ============================================================
     SINCRONIZAÇÃO
     ============================================================ */
  function puxar() {
    if (editandoId || ocupado) return Promise.resolve(); // não atropela edição em andamento
    return db.listar().then(function (novos) {
      if (!novos) return;
      if (JSON.stringify(novos) !== JSON.stringify(itens)) {
        itens = novos;
        render();
      }
      esconderErro();
      if (!ocupado) sync("", COMPARTILHADO ? "sincronizado" : "salvo aqui");
    }).catch(function (e) {
      sync("offline", "sem conexão");
      mostrarErro(e);
    });
  }

  function puxarTitulo() {
    return db.lerTitulo().then(function (t) {
      if (t && document.activeElement !== el.titulo) el.titulo.value = t;
    }).catch(function () {});
  }

  // sincroniza entre abas no modo local
  window.addEventListener("storage", function (e) {
    if (!COMPARTILHADO && e.key === CHAVE_LOCAL) puxar();
  });

  // volta a sincronizar assim que a aba fica visível
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) { puxar(); puxarTitulo(); }
  });

  /* ============================================================
     PARTIDA
     ============================================================ */
  el.avisoDemo.hidden = COMPARTILHADO;
  el.rodapeModo.textContent = COMPARTILHADO
    ? "lista compartilhada · atualiza a cada " + (INTERVALO / 1000) + "s"
    : "modo local · salvo neste navegador";
  sync("", COMPARTILHADO ? "sincronizado" : "salvo aqui");

  try {
    if (localStorage.getItem("carrinho:mercado")) {
      el.modoMercado.checked = true;
      document.body.classList.add("mercado");
    }
    var ordemSalva = localStorage.getItem("carrinho:ordem");
    if (ordemSalva) { ordem = ordemSalva; el.inOrdenar.value = ordemSalva; }
  } catch (e) {}

  puxarTitulo();
  puxar();
  setInterval(function () { if (!document.hidden) puxar(); }, INTERVALO);
  setInterval(function () { if (!document.hidden) puxarTitulo(); }, INTERVALO * 5);

})();
