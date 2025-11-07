document.addEventListener('DOMContentLoaded', function() {

    const auth = firebase.auth();
    const db = firebase.firestore();
    
    let anexoPendente = null;

    let chamadosDoUsuarioCache = [];
    let chamadosDoAdminCache = [];

    function getTimestampAtual() {
        return firebase.firestore.FieldValue.serverTimestamp();
    }
    
    function formatarTimestamp(timestamp) {
        let data;
        if (!timestamp) {
            return "Data pendente";
        }
        if (timestamp.toDate) {
            data = timestamp.toDate();
        } else if (timestamp instanceof Date) {
            data = timestamp;
        } else {
            return "Data inválida";
        }
        return data.toLocaleString('pt-BR');
    }

    function injectNotificationContainers() {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);

        const modalHTML = `
            <div id="modal-overlay">
                <div class="modal-box">
                    <h3 id="modal-title">Confirmação</h3>
                    <p id="modal-message">Você tem certeza?</p>
                    <div class="modal-actions">
                        <button class="btn btn-primary" id="modal-btn-cancel">Cancelar</button>
                        <button class="btn btn-danger" id="modal-btn-confirm">Confirmar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentElement) {
                    container.removeChild(toast);
                }
            }, 500);
        }, 3000);
    }

    function showConfirmModal(message, onConfirm) {
        const overlay = document.getElementById('modal-overlay');
        const messageEl = document.getElementById('modal-message');
        const btnConfirm = document.getElementById('modal-btn-confirm');
        const btnCancel = document.getElementById('modal-btn-cancel');

        if (!overlay || !messageEl || !btnConfirm || !btnCancel) return;

        messageEl.textContent = message;
        overlay.classList.add('show');

        btnConfirm.replaceWith(btnConfirm.cloneNode(true));
        btnCancel.replaceWith(btnCancel.cloneNode(true));

        const newBtnConfirm = document.getElementById('modal-btn-confirm');
        const newBtnCancel = document.getElementById('modal-btn-cancel');

        newBtnConfirm.addEventListener('click', () => {
            onConfirm();
            overlay.classList.remove('show');
        });

        newBtnCancel.addEventListener('click', () => {
            overlay.classList.remove('show');
        });
    }

    function injetaNavbar() {
        const header = document.querySelector('.page-header');
        if (!header) {
            return;
        }
        
        const user = auth.currentUser;
        const nomeUsuario = user ? (user.displayName || user.email) : 'Visitante';
        
        if (user) {
            localStorage.setItem('usuarioLogado', nomeUsuario);
        }
        
        const navbarHTML = `
            <div class="navbar-container">
                <div class="user-menu">
                    <img src="img/icone_usuario.png" alt="Ícone do Usuário" class="user-icon">
                    <div class="dropdown-menu">
                        <span class="user-name">${nomeUsuario}</span>
                        <a href="#" class="logout-link">Logout</a>
                    </div>
                </div>
            </div>
        `;
        header.insertAdjacentHTML('beforeend', navbarHTML);
    }

    document.addEventListener('click', function(event) {
        const dropdownMenu = document.querySelector('.dropdown-menu');
        if (!dropdownMenu || !dropdownMenu.classList.contains('active')) {
            return;
        }
        const isClickOnIcon = event.target.matches('.user-icon');
        const isClickInsideMenu = dropdownMenu.contains(event.target);
        if (!isClickOnIcon && !isClickInsideMenu) {
            dropdownMenu.classList.remove('active');
        }
    });

    function setupDatabase() {
        window.appData = {
            departamentos: ["Hardware - Pedro Afonso", "Software - Carlos Eduardo Marinho", "Rede - Sandro Pinto", "Outros - Atendente Geral"]
        };
    }

    function initLoginPage() {
        const loginForm = document.querySelector('.login-box form');
        const btnRecuperar = document.getElementById('btn-recuperar-senha');
        
        if (loginForm) {
            loginForm.addEventListener('submit', function(event) {
                event.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;

                auth.signInWithEmailAndPassword(email, password)
                    .then((userCredential) => {
                        const user = userCredential.user;
                        localStorage.setItem('usuarioLogado', user.displayName || user.email); 
                        
                    })
                    .catch((error) => {
                        console.error("Erro de login:", error.code);
                        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                            showToast("Email ou senha incorretos.", "error");
                        } else {
                            showToast("Erro ao fazer login. Tente novamente.", "error");
                        }
                    });
            });
        }
        
        if (btnRecuperar) {
            btnRecuperar.addEventListener('click', function(event) {
                event.preventDefault();
                const emailInput = document.getElementById('email');
                const email = emailInput.value;

                if (email === "") {
                    showToast("Por favor, digite seu email no campo 'Email'.", "error");
                    return;
                }

                auth.sendPasswordResetEmail(email)
                    .then(() => {
                        showToast("Email de redefinição enviado! Verifique sua caixa de entrada.", "success");
                    })
                    .catch((error) => {
                        console.error("Erro ao enviar email de redefinição:", error.code);
                        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-value') {
                            showToast("Nenhuma conta encontrada com este email.", "error");
                        } else {
                            showToast("Erro ao enviar email. Tente novamente.", "error");
                        }
                    });
            });
        }
    }
    
    function initEsqueciSenhaPage() {
        const formEsqueciSenha = document.getElementById('form-esqueci-senha');
        if (formEsqueciSenha) {
            formEsqueciSenha.addEventListener('submit', function(event) {
                event.preventDefault();
                const email = document.getElementById('email').value;

                if (email === "") {
                    showToast("Por favor, digite seu email.", "error");
                    return;
                }

                auth.sendPasswordResetEmail(email)
                    .then(() => {
                        showToast("Email de redefinição enviado! Verifique sua caixa de entrada.", "success");
                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 3000);
                    })
                    .catch((error) => {
                        console.error("Erro ao enviar email de redefinição:", error.code);
                        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-value') {
                            showToast("Nenhuma conta encontrada com este email.", "error");
                        } else {
                            showToast("Erro ao enviar email. Tente novamente.", "error");
                        }
                    });
            });
        }
    }

    function renderAdminList() {
        const adminTicketList = document.getElementById('admin-ticket-list');
        const searchInput = document.getElementById('campo-busca-admin');
        if (!adminTicketList) return;

        const departamentos = window.appData.departamentos;
        const statusList = ["Aberto", "Em Progresso", "Fechado"];
        const prioridadeList = ["Baixa", "Média", "Alta", "Não definida"];
        
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

        const chamadosFiltrados = chamadosDoAdminCache.filter(chamado => {
            const titulo = chamado.titulo.toLowerCase();
            const id = chamado.numeroChamado ? chamado.numeroChamado.toString() : '';
            return titulo.includes(searchTerm) || id.includes(searchTerm);
        });

        adminTicketList.innerHTML = ''; 

        if (chamadosFiltrados.length === 0) {
            adminTicketList.innerHTML = '<p>Nenhum chamado encontrado.</p>';
        }

        chamadosFiltrados.forEach(chamado => {
            const ticketCard = document.createElement('div');
            ticketCard.className = 'ticket-card card';
            ticketCard.dataset.id = chamado.id;

            let deptoOptionsHTML = '<option value="null">Nenhum</option>';
            departamentos.forEach(depto => {
                const isSelected = chamado.departamento === depto ? 'selected' : '';
                deptoOptionsHTML += `<option value="${depto}" ${isSelected}>${depto}</option>`;
            });

            let statusOptionsHTML = '';
            statusList.forEach(status => {
                const isSelected = chamado.status === status ? 'selected' : '';
                statusOptionsHTML += `<option value="${status}" ${isSelected}>${status}</option>`;
            });

            let prioridadeOptionsHTML = '';
            prioridadeList.forEach(prioridade => {
                const isSelected = chamado.prioridade === prioridade ? 'selected' : '';
                prioridadeOptionsHTML += `<option value="${prioridade}" ${isSelected}>${prioridade}</option>`;
            });

            ticketCard.innerHTML = `
                <div class="ticket-info">
                    <h4>Chamado #${chamado.numeroChamado || chamado.id.substring(0,6)} - ${chamado.titulo}</h4>
                    <p>Status: <span class="status ${chamado.status.toLowerCase().replace(' ', '-')}">${chamado.status}</span></p>
                </div>
                <div class="ticket-actions ticket-actions-admin">
                    <button class="btn btn-primary btn-ver-detalhes" data-id="${chamado.id}">Detalhes</button>
                    <button class="btn btn-accent btn-editar-chamado" data-id="${chamado.id}">Editar</button>
                    <button class="btn btn-danger btn-excluir-chamado" data-id="${chamado.id}">Excluir</button>
                </div>
                <div class="assignment-controls">
                    <div>
                        <label for="depto-${chamado.id}">Designar para:</label>
                        <select id="depto-${chamado.id}" class="departamento-select admin-select" data-id="${chamado.id}">
                            ${deptoOptionsHTML}
                        </select>
                    </div>
                    <div>
                        <label for="status-${chamado.id}">Mudar Status:</label>
                        <select id="status-${chamado.id}" class="status-select admin-select" data-id="${chamado.id}">
                            ${statusOptionsHTML}
                        </select>
                    </div>
                    <div>
                        <label for="prioridade-${chamado.id}">Mudar Prioridade:</label>
                        <select id="prioridade-${chamado.id}" class="prioridade-select admin-select" data-id="${chamado.id}">
                            ${prioridadeOptionsHTML}
                        </select>
                    </div>
                </div>
            `;
            adminTicketList.appendChild(ticketCard);
        });

        attachAdminListeners();
    }
        
    function salvarAlteracao(ticketId, campo, valor, nomeCampo) {
        const adminUser = localStorage.getItem('usuarioLogado') || "Admin"; 
        
        const dataAtual = new Date();
        const novoItemHistorico = {
            data: formatarTimestamp(dataAtual),
            dataReal: dataAtual,
            autor: adminUser,
            acao: `${nomeCampo} alterado para "${valor || 'Nenhum'}".`
        };
        
        db.collection("chamados").doc(ticketId).update({
            [campo]: valor === 'null' ? null : valor,
            historico: firebase.firestore.FieldValue.arrayUnion(novoItemHistorico)
        })
        .then(() => {
            showToast(`${nomeCampo} do chamado atualizado!`, "success");
        })
        .catch((error) => {
            console.error("Erro ao salvar alteração: ", error);
            showToast("Erro ao salvar. Tente novamente.", "error");
        });
    }

    function attachAdminListeners() {
        document.querySelectorAll('.departamento-select').forEach(select => {
            select.addEventListener('change', function(event) {
                const ticketId = event.target.dataset.id;
                const valor = event.target.value;
                salvarAlteracao(ticketId, 'departamento', valor, 'Departamento');
            });
        });
        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', function(event) {
                const ticketId = event.target.dataset.id;
                const valor = event.target.value;
                salvarAlteracao(ticketId, 'status', valor, 'Status');
            });
        });
        document.querySelectorAll('.prioridade-select').forEach(select => {
            select.addEventListener('change', function(event) {
                const ticketId = event.target.dataset.id;
                const valor = event.target.value;
                salvarAlteracao(ticketId, 'prioridade', valor, 'Prioridade');
            });
        });
    }
    
    function initAdminDashboard() {
        const searchInput = document.getElementById('campo-busca-admin');
        if (!searchInput) return;

        db.collection("chamados")
          .orderBy("dataAbertura", "desc")
          .onSnapshot((querySnapshot) => {
            chamadosDoAdminCache = [];
            querySnapshot.forEach((doc) => {
                chamadosDoAdminCache.push({ id: doc.id, ...doc.data() });
            });
            renderAdminList();
          }, (error) => {
            console.error("Erro ao buscar chamados: ", error);
            showToast("Erro ao carregar chamados.", "error");
          });
        
        if (searchInput) {
            searchInput.addEventListener('keyup', renderAdminList);
        }
    }

    function renderUserList() {
        const userTicketList = document.getElementById('user-ticket-list');
        const summaryCount = document.querySelector('.summary-details span');
        const summaryDate = document.getElementById('summary-date');
        const searchInput = document.getElementById('campo-busca-user');
        
        if (!userTicketList) return;

        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        
        const chamadosFiltrados = chamadosDoUsuarioCache.filter(chamado => {
            const titulo = chamado.titulo.toLowerCase();
            const id = chamado.numeroChamado ? chamado.numeroChamado.toString() : '';
            return titulo.includes(searchTerm) || id.includes(searchTerm);
        });

        const chamadosAbertos = chamadosDoUsuarioCache.filter(c => c.status === 'Aberto').length;
        if(summaryCount) {
             summaryCount.textContent = chamadosAbertos;
        }
        
        if(summaryDate) {
            summaryDate.textContent = new Date().toLocaleDateString('pt-BR');
        }

        userTicketList.innerHTML = '<h3>Chamados em Andamento</h3>'; 

        if (chamadosFiltrados.length === 0) {
            userTicketList.innerHTML += '<p>Nenhum chamado encontrado.</p>';
        }

        chamadosFiltrados.forEach(chamado => {
            const ticketCard = document.createElement('div');
            ticketCard.className = 'ticket-card card';
            ticketCard.innerHTML = `
                <div class="ticket-info">
                    <h4>Chamado #${chamado.numeroChamado || chamado.id.substring(0,6)} - ${chamado.titulo}</h4>
                    <p>Status: <span class="status ${chamado.status.toLowerCase().replace(' ', '-')}">${chamado.status}</span></p>
                </div>
                <div class="ticket-actions">
                    <button class="btn btn-primary btn-ver-detalhes" data-id="${chamado.id}">Detalhes</button>
                    <button class="btn btn-accent btn-editar-chamado" data-id="${chamado.id}">Editar</button>
                    <button class="btn btn-danger btn-excluir-chamado" data-id="${chamado.id}">Excluir</button>
                </div>
            `;
            userTicketList.appendChild(ticketCard);
        });
    }

    function initUserDashboard() {
        const searchInput = document.getElementById('campo-busca-user');
        if (!searchInput) return;
        
        const user = auth.currentUser;
        if (!user) return;

        db.collection("chamados")
          .where("userId", "==", user.uid)
          .orderBy("dataAbertura", "desc")
          .onSnapshot((querySnapshot) => {
            chamadosDoUsuarioCache = [];
            querySnapshot.forEach((doc) => {
                chamadosDoUsuarioCache.push({ id: doc.id, ...doc.data() });
            });
            renderUserList();
          }, (error) => {
            console.error("Erro ao buscar chamados do usuário: ", error);
            showToast("Erro ao carregar seus chamados.", "error");
          });
        
        if (searchInput) {
            searchInput.addEventListener('keyup', renderUserList);
        }
    }

    function initAbrirChamadoForm() {
        const formAbrirChamado = document.querySelector('#form-abrir-chamado');
        const anexoInput = document.getElementById('anexo');
        const fileNameDisplay = document.getElementById('file-name-display');
        
        if (formAbrirChamado) {
            
            anexoPendente = null;

            const user = auth.currentUser;
            if (!user) {
                showToast("Você precisa estar logado para abrir um chamado.", "error");
                window.location.href = 'index.html';
                return;
            }

            if (anexoInput) {
                anexoInput.addEventListener('change', function(event) {
                    const file = event.target.files[0];
                    if (!file) {
                        anexoPendente = null;
                        fileNameDisplay.textContent = "Nenhum arquivo selecionado";
                        return;
                    }

                    if (file.size > 2 * 1024 * 1024) { 
                        showToast("Arquivo muito grande. O limite é de 2MB.", "error");
                        anexoInput.value = ""; 
                        anexoPendente = null;
                        fileNameDisplay.textContent = "Arquivo muito grande!";
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = function(e) {
                        anexoPendente = e.target.result; 
                        fileNameDisplay.textContent = file.name; 
                        showToast("Anexo pronto para envio.", "success");
                    };
                    reader.onerror = function() {
                        showToast("Erro ao ler o arquivo.", "error");
                        anexoPendente = null;
                        fileNameDisplay.textContent = "Erro ao ler arquivo.";
                    };
                    reader.readAsDataURL(file); 
                });
            }
            
            formAbrirChamado.addEventListener('submit', function(event) {
                event.preventDefault();
                
                const titulo = document.getElementById('titulo').value;
                const descricao = document.getElementById('descricao').value;
                const categoria = document.getElementById('categoria').value;
                
                const dataAtual = new Date();
                
                const novoChamado = {
                    titulo: titulo,
                    descricao: descricao,
                    categoria: categoria,
                    status: "Aberto",
                    departamento: null,
                    prioridade: "Não definida",
                    dataAbertura: getTimestampAtual(),
                    numeroChamado: dataAtual.getTime().toString().slice(-6),
                    userId: user.uid,
                    autorNome: user.displayName || user.email,
                    historico: [
                        { 
                            data: formatarTimestamp(dataAtual),
                            dataReal: dataAtual,
                            autor: "Sistema", 
                            acao: "Chamado aberto." 
                        }
                    ]
                };
                
                db.collection("chamados").add(novoChamado)
                    .then((docRef) => {
                        console.log("Novo chamado salvo com ID: ", docRef.id);
                        
                        if (anexoPendente) {
                            try {
                                localStorage.setItem('anexo_' + docRef.id, anexoPendente);
                                console.log("Anexo salvo no localStorage com a chave: anexo_" + docRef.id);
                            } catch (e) {
                                console.error("Erro ao salvar anexo no localStorage: ", e);
                                showToast("Chamado criado, mas o anexo era muito grande para salvar localmente.", "error");
                            }
                            anexoPendente = null;
                        }
                        
                        window.location.href = 'confirmacao.html'; 
                    })
                    .catch((error) => {
                        console.error("Erro ao salvar novo chamado: ", error);
                        showToast("Erro ao salvar chamado: " + error.message, "error");
                    });
            });
        }
    }

    function initEditarChamadoPage() {
        const params = new URLSearchParams(window.location.search);
        const ticketId = params.get('id');
        const formEditarChamado = document.querySelector('#form-editar-chamado');

        if (!ticketId || !formEditarChamado) {
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        
        const docRef = db.collection("chamados").doc(ticketId);

        docRef.get()
            .then((doc) => {
                if (!doc.exists) {
                    showToast("Chamado não encontrado!", "error");
                    window.location.href = 'dashboard.html';
                    return;
                }
                
                const chamadoParaEditar = doc.data();
                
                if (chamadoParaEditar.userId !== user.uid && user.email !== 'adm@admin.com') {
                    showToast("Você não tem permissão para editar este chamado.", "error");
                    window.location.href = 'dashboard.html';
                    return;
                }

                document.getElementById('titulo').value = chamadoParaEditar.titulo;
                document.getElementById('descricao').value = chamadoParaEditar.descricao;
                document.getElementById('categoria').value = chamadoParaEditar.categoria;

                formEditarChamado.addEventListener('submit', function(event) {
                    event.preventDefault();

                    const tituloAtualizado = document.getElementById('titulo').value;
                    const descricaoAtualizada = document.getElementById('descricao').value;
                    const categoriaAtualizada = document.getElementById('categoria').value;

                    const dataAtual = new Date();
                    const novoItemHistorico = {
                        data: formatarTimestamp(dataAtual),
                        dataReal: dataAtual,
                        autor: localStorage.getItem('usuarioLogado') || "Usuário",
                        acao: "Dados do chamado foram editados."
                    };

                    docRef.update({
                        titulo: tituloAtualizado,
                        descricao: descricaoAtualizada,
                        categoria: categoriaAtualizada,
                        historico: firebase.firestore.FieldValue.arrayUnion(novoItemHistorico)
                    })
                    .then(() => {
                        alert("Chamado atualizado com sucesso!");
                        window.location.href = 'dashboard.html';
                    })
                    .catch((error) => {
                        console.error("Erro ao atualizar: ", error);
                        showToast("Erro ao salvar. Tente novamente.", "error");
                    });
                });
            })
            .catch((error) => {
                console.error("Erro ao buscar chamado para editar: ", error);
                showToast("Erro ao carregar dados.", "error");
            });
    }

    function initDetalhesPage() {
        const params = new URLSearchParams(window.location.search);
        const ticketId = params.get('id');
        if (!ticketId) return; 

        const docRef = db.collection("chamados").doc(ticketId);
        const historyList = document.getElementById('detalhes-historico');
        
        function renderizarHistorico(historico) {
            historyList.innerHTML = ''; 
            if (historico && historico.length > 0) {
                
                const historicoOrdenado = historico.map(item => {
                    if (item.dataReal && item.dataReal.toDate) {
                        item.dataRealJS = item.dataReal.toDate();
                    } else if (item.dataReal instanceof Date) {
                        item.dataRealJS = item.dataReal;
                    } else {
                        item.dataRealJS = new Date(0); 
                    }
                    return item;
                });

                historicoOrdenado.sort((a, b) => a.dataRealJS - b.dataRealJS);
                
                historicoOrdenado.forEach(item => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>[${item.data}]</strong> - Atualização realizada por ${item.autor}: ${item.acao}`;
                    historyList.appendChild(li);
                });
            } else {
                historyList.innerHTML = '<li>Nenhuma atualização registrada.</li>';
            }
        }

        docRef.onSnapshot((doc) => {
            if (!doc.exists) {
                showToast("Chamado não encontrado.", "error");
                window.location.href = "dashboard.html";
                return;
            }
            
            const chamado = doc.data();

            document.getElementById('detalhes-titulo').textContent = `Chamado #${chamado.numeroChamado || doc.id.substring(0,6)} - ${chamado.titulo}`;
            document.getElementById('detalhes-status').textContent = chamado.status;
            document.getElementById('detalhes-status').className = `status ${chamado.status.toLowerCase().replace(' ', '-')}`;
            document.getElementById('detalhes-departamento').textContent = chamado.departamento || 'Não designado';
            document.getElementById('detalhes-prioridade').textContent = chamado.prioridade || 'Não definida';
            document.getElementById('detalhes-descricao').textContent = chamado.descricao;
            
            renderizarHistorico(chamado.historico);
            
            const anexoContainer = document.getElementById('detalhes-anexo-container');
            const anexoData = localStorage.getItem('anexo_' + ticketId);
            
            if (anexoContainer) {
                const imgAntiga = anexoContainer.querySelector('img');
                if(imgAntiga) imgAntiga.remove();

                if (anexoData) {
                    anexoContainer.classList.add('com-anexo');
                    const img = document.createElement('img');
                    img.src = anexoData;
                    img.alt = "Anexo do chamado";
                    anexoContainer.appendChild(img);
                } else {
                    anexoContainer.classList.remove('com-anexo');
                }
            }
        }, (error) => {
            console.error("Erro ao buscar detalhes: ", error);
            showToast("Erro ao carregar detalhes.", "error");
        });


        const commentForm = document.getElementById('form-add-comment');
        if (commentForm) {
            commentForm.addEventListener('submit', function(event) {
                event.preventDefault(); 
                
                const commentTextarea = document.getElementById('novo-comentario');
                const acao = commentTextarea.value;
                
                if (acao && acao.trim() !== "") {
                    
                    const dataAtual = new Date();
                    const novoItemHistorico = {
                        data: formatarTimestamp(dataAtual),
                        dataReal: dataAtual,
                        autor: localStorage.getItem('usuarioLogado') || "Usuário", 
                        acao: acao
                    };
                    
                    docRef.update({
                        historico: firebase.firestore.FieldValue.arrayUnion(novoItemHistorico)
                    })
                    .then(() => {
                        commentTextarea.value = '';
                        showToast("Comentário adicionado!", "success");
                    })
                    .catch((error) => {
                        console.error("Erro ao adicionar comentário: ", error);
                        showToast("Erro ao salvar comentário.", "error");
                    });
                }
            });
        }
    }

    function initRegistrarPage() {
        const registrarForm = document.querySelector('#form-registrar');
        if (registrarForm) {
            registrarForm.addEventListener('submit', function(event) {
                event.preventDefault();

                const nomeCompleto = document.getElementById('nomeCompleto').value;
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const politica = document.getElementById('politica').checked;

                if (!politica) {
                    showToast("Você precisa aceitar a Política de Usuário.", "error");
                    return; 
                }

                auth.createUserWithEmailAndPassword(email, password)
                    .then((userCredential) => {
                        const user = userCredential.user;
                        
                        return user.updateProfile({
                            displayName: nomeCompleto
                        });
                    })
                    .then(() => {
                        alert("Conta criada com sucesso! Você será redirecionado para a página de login.");
                        window.location.href = 'index.html';
                    })
                    .catch((error) => {
                        console.error("Erro de registro:", error.code);
                        if (error.code === 'auth/email-already-in-use') {
                            showToast("Este email já está em uso.", "error");
                        } else if (error.code === 'auth/weak-password') {
                            showToast("Sua senha é muito fraca. Use pelo menos 6 caracteres.", "error");
                        } else {
                            showToast("Erro ao criar conta. Tente novamente.", "error");
                        }
                    });
            });
        }
    }


    function bindGlobalNavigators() {
        document.body.addEventListener('click', function(event) {
            const target = event.target; 
            
            if (target.matches('.user-icon')) {
                event.stopPropagation();
                const dropdownMenu = target.nextElementSibling;
                if (dropdownMenu) {
                    dropdownMenu.classList.toggle('active');
                }
            }
            
            if (target.matches('.logout-link')) {
                event.preventDefault(); 
                
                auth.signOut().then(() => {
                    localStorage.removeItem('usuarioLogado'); 
                    showToast("Você foi desconectado.", "info");
                    
                    setTimeout(() => {
                        window.location.href = 'index.html'; 
                    }, 1500);
                }).catch((error) => {
                    console.error("Erro ao fazer logout:", error);
                    showToast("Erro ao desconectar.", "error");
                });
            }
            
            if (target.matches('.summary-card .btn-accent')) {
                window.location.href = 'abrir-chamado.html';
            }
            
            if (target.classList.contains('btn-ver-detalhes')) {
                const ticketId = target.dataset.id;
                window.location.href = `detalhes-chamado.html?id=${ticketId}`;
            }

            if (target.classList.contains('btn-editar-chamado')) {
                 const ticketId = target.dataset.id;
                 window.location.href = `editar-chamado.html?id=${ticketId}`;
            }

            if (target.classList.contains('btn-excluir-chamado')) {
                const ticketId = target.dataset.id;
                
                showConfirmModal("Tem certeza que deseja excluir este chamado? Esta ação não pode ser desfeita.", function() {
                    
                    db.collection("chamados").doc(ticketId).delete()
                        .then(() => {
                            localStorage.removeItem('anexo_' + ticketId);
                            showToast("Chamado excluído com sucesso.", "success");
                        })
                        .catch((error) => {
                            console.error("Erro ao excluir chamado: ", error);
                            showToast("Erro ao excluir. Tente novamente.", "error");
                        });
                });
            }

            if (target.matches('#form-abrir-chamado .btn-secondary')) {
                 showToast("Funcionalidade 'Adicionar Anexos' ainda não implementada.", "info");
            }

            const id = target.id;
            if (id === 'btn-voltar-painel' || id === 'btn-ir-painel' || id === 'btn-retornar-painel' || id === 'btn-voltar-dashboard') {
                if (document.referrer.includes('dashboard-admin.html')) {
                     window.location.href = 'dashboard-admin.html';
                } else {
                     window.location.href = 'dashboard.html';
                }
            }
        });
    }

    
    auth.onAuthStateChanged(function(user) {
        
        injectNotificationContainers(); 
        injetaNavbar(); 
        
        bindGlobalNavigators(); 

        setupDatabase();
        
        const path = window.location.pathname; 

        if (!user) {
            if (!path.endsWith('index.html') && !path.endsWith('registrar.html') && !path.endsWith('esqueci-senha.html')) {
                console.log("Usuário não logado, redirecionando para o login.");
                window.location.href = 'index.html';
            } else if (path.endsWith('index.html') || path === '/') {
                initLoginPage();
            } else if (path.endsWith('registrar.html')) { 
                initRegistrarPage();
            } else if (path.endsWith('esqueci-senha.html')) {
                initEsqueciSenhaPage();
            }
        } 
        else {
            if (path.endsWith('index.html') || path.endsWith('registrar.html') || path.endsWith('esqueci-senha.html') || path === '/') {
                console.log("Usuário já logado, redirecionando para o dashboard.");
                if (user.email === 'adm@admin.com') {
                    window.location.href = 'dashboard-admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
                return;
            }

            if (path.endsWith('dashboard-admin.html')) {
                initAdminDashboard();
            } else if (path.endsWith('dashboard.html')) {
                initUserDashboard();
            } else if (path.endsWith('abrir-chamado.html')) {
                initAbrirChamadoForm();
            } else if (path.endsWith('editar-chamado.html')) { 
                initEditarChamadoPage();
            } else if (path.endsWith('detalhes-chamado.html')) {
                initDetalhesPage();
            }
            
            const searchInputAdmin = document.getElementById('campo-busca-admin');
            if (searchInputAdmin) {
                searchInputAdmin.addEventListener('keyup', renderAdminList);
            }
            const searchInputUser = document.getElementById('campo-busca-user');
            if (searchInputUser) {
                searchInputUser.addEventListener('keyup', renderUserList);
            }
        }
    });
    
});