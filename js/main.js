document.addEventListener('DOMContentLoaded', function() {

    const auth = firebase.auth();
    const db = firebase.firestore();
    
    let anexoPendente = null;

    let chamadosDoUsuarioCache = [];
    let chamadosDoAdminCache = [];
    
    let filtroStatusUsuario = 'todos';
    let filtroStatusAdmin = 'todos';
    let filtroAreaAdmin = 'todos'; 
    let ticketIdParaAlocar = null;

    function getTimestampAtual() {
        return firebase.firestore.FieldValue.serverTimestamp();
    }
    
    function formatarTimestamp(timestamp, formato = 'longo') {
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

        if (formato === 'chat') {
            return data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        }
        
        return data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function iniciarRelogio() {
        const elementoData = document.getElementById('admin-data-atual');
        if (!elementoData) return;

        function atualizar() {
            const agora = new Date();
            const dataFormatada = agora.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            const horaFormatada = agora.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            elementoData.innerHTML = `
                ${dataFormatada}
                <span style="display: block; font-size: 0.8em; opacity: 0.7;">${horaFormatada}</span>
            `;
        }

        atualizar();
        setInterval(atualizar, 60000);
    }


    function injectNotificationContainers() {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);

        const modalConfirmHTML = `
            <div id="modal-overlay">
                <div class="modal-box">
                    <h3 id="modal-title">Confirmação</h3>
                    <p id="modal-message">Você tem certeza?</p>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" id="modal-btn-cancel">Cancelar</button>
                        <button class="btn btn-danger" id="modal-btn-confirm">Confirmar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalConfirmHTML);

        const modalAlocarHTML = `
            <div id="alocar-modal-overlay">
                <div class="modal-box">
                    <h3 id="alocar-modal-title">Alocar Chamado</h3>
                    <form id="form-alocar-chamado">
                        
                        <div class="input-group">
                            <label for="alocar-categoria">Categoria</label>
                            <select id="alocar-categoria">
                                <option value="hardware">Hardware</option>
                                <option value="software">Software</option>
                                <option value="rede">Rede</option>
                                <option value="outros">Outros</option>
                            </select>
                        </div>

                        <div class="input-group">
                            <label for="alocar-status">Status</label>
                            <select id="alocar-status">
                                <option value="Aberto">Aberto</option>
                                <option value="Em Progresso">Em Progresso</option>
                                <option value="Fechado">Fechado</option>
                            </select>
                        </div>

                        <div class="input-group">
                            <label for="alocar-departamento">Atribuir para (Departamento)</label>
                            <select id="alocar-departamento">
                            </select>
                        </div>

                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" id="alocar-btn-cancel">Cancelar</button>
                            <button type="submit" class="btn btn-accent">Salvar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalAlocarHTML);

        const chatPopupHTML = `
            <div class="chat-popup-window" id="chat-popup">
                <div class="chat-popup-header">
                    <h3>Chat Rápido</h3>
                    <button class="btn-close-chat" id="btn-close-chat">&times;</button>
                </div>
                <div class="chat-messages" id="popup-chat-messages">
                    <p style="text-align: center; opacity: 0.5;">Carregando...</p>
                </div>
                <form id="form-chat">
                    <input type="text" id="chat-input" placeholder="Digite sua mensagem..." required>
                    <button type="submit" class="btn btn-accent" id="btn-chat-enviar">Enviar</button>
                </form>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', chatPopupHTML);
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

    async function showAlocarModal(ticketId) {
        const overlay = document.getElementById('alocar-modal-overlay');
        if (!overlay) return;

        try {
            const docRef = db.collection("chamados").doc(ticketId);
            const doc = await docRef.get();
            if (!doc.exists) {
                showToast("Erro: Chamado não encontrado.", "error");
                return;
            }
            const chamado = doc.data();

            ticketIdParaAlocar = ticketId;
            
            document.getElementById('alocar-modal-title').textContent = `Alocar Chamado #${chamado.numeroChamado || ticketId.substring(0,6)}`;
            document.getElementById('alocar-categoria').value = chamado.categoria || 'outros';
            document.getElementById('alocar-status').value = chamado.status || 'Aberto';

            const deptoSelect = document.getElementById('alocar-departamento');
            deptoSelect.innerHTML = '<option value="null">Nenhum</option>';
            window.appData.departamentos.forEach(depto => {
                const isSelected = chamado.departamento === depto ? 'selected' : '';
                deptoSelect.innerHTML += `<option value="${depto}" ${isSelected}>${depto}</option>`;
            });

            overlay.classList.add('show');

        } catch (err) {
            console.error("Erro ao buscar dados para alocação: ", err);
            showToast("Erro ao carregar dados do chamado.", "error");
        }
    }

    function closeAlocarModal() {
        const overlay = document.getElementById('alocar-modal-overlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
        ticketIdParaAlocar = null;
    }


    function injetaNavbar() {
        const header = document.querySelector('.user-menu');
        if (!header) {
            return;
        }
        
        const user = auth.currentUser;
        const nomeUsuario = user ? (user.displayName || user.email) : 'Visitante';
        
        if (user) {
            localStorage.setItem('usuarioLogado', nomeUsuario);
        }
        
        const navbarHTML = `
            <img src="img/icone_usuario.png" alt="Ícone do Usuário" class="user-icon">
            <div class="dropdown-menu">
                <span class="user-name">${nomeUsuario}</span>
                <a href="#" class="logout-link">Logout</a>
            </div>
        `;
        header.innerHTML = navbarHTML;
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
        const loginForm = document.getElementById('form-login');
        if (loginForm) {
            loginForm.addEventListener('submit', async function(event) {
                event.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;

                try {
                    const userCredential = await auth.signInWithEmailAndPassword(email, password);
                    const user = userCredential.user;
                    localStorage.setItem('usuarioLogado', user.displayName || user.email); 

                    const userDocRef = db.collection('users').doc(user.uid);
                    const userDoc = await userDocRef.get();

                    if (!userDoc.exists) {
                        if (user.email === 'adm@admin.com') {
                            await userDocRef.set({
                                uid: user.uid,
                                nomeCompleto: "Admin Master",
                                email: user.email,
                                role: "admin",
                                area: null 
                            });
                            localStorage.setItem('usuarioRole', 'admin');
                            localStorage.setItem('usuarioArea', "null");
                            window.location.href = 'dashboard-admin.html';
                        } else {
                            showToast("Erro: Perfil de usuário não encontrado.", "error");
                            auth.signOut();
                        }
                    } else {
                        const userData = userDoc.data();
                        const userRole = userData.role || 'solicitante';
                        const userArea = userData.area || null;
                        
                        localStorage.setItem('usuarioRole', userRole);
                        localStorage.setItem('usuarioArea', userArea);

                        if (userRole === 'admin' || userRole === 'suporte') {
                            window.location.href = 'dashboard-admin.html';
                        } else {
                            window.location.href = 'dashboard.html';
                        }
                    }
                } catch (error) {
                    console.error("Erro de login:", error.code);
                    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                        showToast("Email ou senha incorretos.", "error");
                    } else {
                        showToast("Erro ao fazer login. Tente novamente.", "error");
                    }
                }
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

        const chamadosAbertos = chamadosDoAdminCache.filter(c => c.status === 'Aberto').length;
        const chamadosAndamento = chamadosDoAdminCache.filter(c => c.status === 'Em Progresso').length;
        const chamadosFechados = chamadosDoAdminCache.filter(c => c.status === 'Fechado').length;
        
        const statAbertos = document.getElementById('stat-abertos-admin');
        const statAndamento = document.getElementById('stat-andamento-admin');
        const statFinalizados = document.getElementById('stat-finalizados-admin');

        if(statAbertos) statAbertos.textContent = chamadosAbertos;
        if(statAndamento) statAndamento.textContent = chamadosAndamento;
        if(statFinalizados) statFinalizados.textContent = chamadosFechados;

        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

        const chamadosFiltradosPorStatus = chamadosDoAdminCache.filter(chamado => {
            if (filtroStatusAdmin === 'todos') return true;
            return chamado.status === filtroStatusAdmin;
        });

        const chamadosFiltradosPorArea = chamadosFiltradosPorStatus.filter(chamado => {
            if (filtroAreaAdmin === 'todos') return true;
            return chamado.categoria === filtroAreaAdmin;
        });

        const chamadosFiltrados = chamadosFiltradosPorArea.filter(chamado => {
            const titulo = chamado.titulo.toLowerCase();
            const id = chamado.numeroChamado ? chamado.numeroChamado.toString() : '';
            return titulo.includes(searchTerm) || id.includes(searchTerm);
        });

        adminTicketList.innerHTML = ''; 

        if (chamadosFiltrados.length === 0) {
            adminTicketList.innerHTML = '<p style="padding: 20px; text-align: center;">Nenhum chamado encontrado.</p>';
        }

        chamadosFiltrados.forEach(chamado => {
            const ticketRow = document.createElement('div');
            ticketRow.className = 'ticket-row';
            ticketRow.dataset.id = chamado.id;
            
            const dataFormatada = formatarTimestamp(chamado.dataAbertura);
            
            ticketRow.innerHTML = `
                <div class="ticket-cell id">#${chamado.numeroChamado || chamado.id.substring(0,6)}</div>
                <div class="ticket-cell titulo">${chamado.titulo}</div>
                <div class="ticket-cell categoria">${chamado.categoria || 'N/A'}</div>
                <div class="ticket-cell autor">${chamado.autorNome || 'N/A'}</div>
                <div class="ticket-cell data">${dataFormatada}</div>
                <div class="ticket-cell status">
                    <span class="status ${chamado.status.toLowerCase().replace(' ', '-')}">${chamado.status}</span>
                </div>
                <div class="ticket-cell acoes">
                    <button class="btn btn-accent btn-alocar-chamado" data-id="${chamado.id}">Alocar</button>
                    <button class="btn btn-primary btn-ver-detalhes" data-id="${chamado.id}">Detalhes</button>
                    <button class="btn btn-danger btn-excluir-chamado" data-id="${chamado.id}">Excluir</button>
                </div>
            `;
            adminTicketList.appendChild(ticketRow);
        });
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

    function initAdminDashboard() {
        const searchInput = document.getElementById('campo-busca-admin');
        const statusFilterContainer = document.getElementById('filter-container-admin');
        const areaFilterContainer = document.getElementById('filter-container-area-admin'); 
        if (!searchInput || !statusFilterContainer || !areaFilterContainer) return;

        const userRole = localStorage.getItem('usuarioRole');
        const userArea = localStorage.getItem('usuarioArea');

        let query = db.collection("chamados");

        if (userRole === 'suporte') {
            query = query.where("categoria", "==", userArea);
            const headerTitle = document.querySelector('.page-header h1');
            if(headerTitle) headerTitle.textContent = "Painel de Suporte";
        } else if (userRole === 'admin') {
            areaFilterContainer.style.display = 'flex';
        }

        query.orderBy("dataAbertura", "desc")
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
        
        searchInput.addEventListener('keyup', renderAdminList);
        
        statusFilterContainer.addEventListener('click', function(event) {
            if (event.target.classList.contains('btn-filter')) {
                statusFilterContainer.querySelector('.active').classList.remove('active');
                event.target.classList.add('active');
                filtroStatusAdmin = event.target.dataset.status;
                renderAdminList();
            }
        });

        areaFilterContainer.addEventListener('click', function(event) {
            if (event.target.classList.contains('btn-filter')) {
                areaFilterContainer.querySelector('.active').classList.remove('active');
                event.target.classList.add('active');
                filtroAreaAdmin = event.target.dataset.area;
                renderAdminList();
            }
        });
    }

    function renderUserList() {
        const userTicketList = document.getElementById('user-ticket-list');
        const searchInput = document.getElementById('campo-busca-user');
        
        if (!userTicketList) return;

        const chamadosAbertos = chamadosDoUsuarioCache.filter(c => c.status === 'Aberto').length;
        const chamadosAndamento = chamadosDoUsuarioCache.filter(c => c.status === 'Em Progresso').length;
        const chamadosFechados = chamadosDoUsuarioCache.filter(c => c.status === 'Fechado').length;

        const statAbertos = document.getElementById('stat-abertos');
        const statAndamento = document.getElementById('stat-andamento');
        const statFinalizados = document.getElementById('stat-finalizados');

        if(statAbertos) statAbertos.textContent = chamadosAbertos;
        if(statAndamento) statAndamento.textContent = chamadosAndamento;
        if(statFinalizados) statFinalizados.textContent = chamadosFechados;

        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        
        const chamadosFiltradosPorStatus = chamadosDoUsuarioCache.filter(chamado => {
            if (filtroStatusUsuario === 'todos') return true;
            return chamado.status === filtroStatusUsuario;
        });

        const chamadosFiltrados = chamadosFiltradosPorStatus.filter(chamado => {
            const titulo = chamado.titulo.toLowerCase();
            const id = chamado.numeroChamado ? chamado.numeroChamado.toString() : '';
            return titulo.includes(searchTerm) || id.includes(searchTerm);
        });

        userTicketList.innerHTML = ''; 

        if (chamadosFiltrados.length === 0) {
            userTicketList.innerHTML = '<p style="padding: 20px; text-align: center;">Nenhum chamado encontrado.</p>';
            return;
        }

        chamadosFiltrados.forEach(chamado => {
            const ticketRow = document.createElement('div');
            ticketRow.className = 'ticket-row';
            
            const dataFormatada = formatarTimestamp(chamado.dataAbertura);
            
            ticketRow.innerHTML = `
                <div class="ticket-cell id">#${chamado.numeroChamado || chamado.id.substring(0,6)}</div>
                <div class="ticket-cell titulo">${chamado.titulo}</div>
                <div class="ticket-cell categoria">${chamado.categoria || 'N/A'}</div>
                <div class="ticket-cell autor">${chamado.autorNome || 'N/A'}</div>
                <div class="ticket-cell data">${dataFormatada}</div>
                <div class="ticket-cell status">
                    <span class="status ${chamado.status.toLowerCase().replace(' ', '-')}">${chamado.status}</span>
                </div>
                <div class="ticket-cell acoes">
                    <button class="btn btn-primary btn-ver-detalhes" data-id="${chamado.id}">Detalhes</button>
                    <button class="btn btn-secondary btn-editar-chamado" data-id="${chamado.id}">Editar</button>
                </div>
            `;
            userTicketList.appendChild(ticketRow);
        });
    }

    function initUserDashboard() {
        const searchInput = document.getElementById('campo-busca-user');
        const filterContainer = document.getElementById('filter-container-user');
        if (!searchInput || !filterContainer) return;
        
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
        
        searchInput.addEventListener('keyup', renderUserList);
        
        filterContainer.addEventListener('click', function(event) {
            if (event.target.classList.contains('btn-filter')) {
                filterContainer.querySelector('.active').classList.remove('active');
                event.target.classList.add('active');
                filtroStatusUsuario = event.target.dataset.status;
                renderUserList();
            }
        });
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
                
                const userRole = localStorage.getItem('usuarioRole');
                if (chamadoParaEditar.userId !== user.uid && userRole !== 'admin' && userRole !== 'suporte') {
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
                        if (userRole === 'admin' || userRole === 'suporte') {
                            window.location.href = 'dashboard-admin.html';
                        } else {
                            window.location.href = 'dashboard.html';
                        }
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

    // --- LÓGICA DO CHAT MOVIDA PARA DENTRO DE initDetalhesPage ---
    let unsubChat = null; 
    
    function initDetalhesPage() {
        const params = new URLSearchParams(window.location.search);
        const ticketId = params.get('id');
        if (!ticketId) return; 

        // --- INÍCIO DA LÓGICA DO CHAT POPUP ---
        
        const chatMessagesContainer = document.getElementById('popup-chat-messages');
        const chatForm = document.getElementById('form-chat');
        const chatInput = document.getElementById('chat-input');
        const currentUser = auth.currentUser;

        if (chatMessagesContainer && chatForm && currentUser) {
            const chatRef = db.collection('chamados').doc(ticketId).collection('chat');

            if (unsubChat) {
                unsubChat();
            }

            unsubChat = chatRef.orderBy("timestamp", "asc")
                .onSnapshot((querySnapshot) => {
                    
                    chatMessagesContainer.innerHTML = ''; 
                    
                    if (querySnapshot.empty) {
                        chatMessagesContainer.innerHTML = '<p style="text-align: center; opacity: 0.5;">Nenhuma mensagem ainda.</p>';
                        return;
                    }

                    querySnapshot.forEach((doc) => {
                        const msg = doc.data();
                        
                        const msgDiv = document.createElement('div');
                        msgDiv.className = 'chat-message';
                        
                        if (msg.autorUid === currentUser.uid) {
                            msgDiv.classList.add('autor-eu');
                        } else {
                            msgDiv.classList.add('autor-outro');
                        }

                        msgDiv.innerHTML = `
                            <span class="autor">${msg.autorNome} (${formatarTimestamp(msg.timestamp, 'chat')})</span>
                            ${msg.texto}
                        `;
                        
                        chatMessagesContainer.appendChild(msgDiv);
                    });

                    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
                });

            const newChatForm = chatForm.cloneNode(true);
            chatForm.parentNode.replaceChild(newChatForm, chatForm);
            const newChatInput = document.getElementById('chat-input'); 

            newChatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const texto = newChatInput.value.trim();
                if (texto === "") return;

                const novaMensagem = {
                    texto: texto,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    autorUid: currentUser.uid,
                    autorNome: currentUser.displayName || currentUser.email
                };

                chatRef.add(novaMensagem)
                    .then(() => {
                        newChatInput.value = ''; 
                    })
                    .catch(err => {
                        console.error("Erro ao enviar mensagem: ", err);
                        showToast("Não foi possível enviar a mensagem.", "error");
                    });
            });
        }
        // --- FIM DA LÓGICA DO CHAT POPUP ---


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

            const commentFormCard = document.querySelector('.comment-form-card');
            const adminControls = document.getElementById('admin-ticket-controls');
            
            const userRole = localStorage.getItem('usuarioRole');
            if (userRole === 'admin' || userRole === 'suporte') {
                if (commentFormCard) commentFormCard.style.display = 'block';
                if (adminControls) adminControls.style.display = 'block';
                
                if (adminControls && !adminControls.hasChildNodes()) {
                    const departamentos = window.appData.departamentos;
                    const statusList = ["Aberto", "Em Progresso", "Fechado"];
                    const prioridadeList = ["Baixa", "Média", "Alta", "Não definida"];
                    const categoriaList = ["hardware", "software", "rede", "outros"]; 

                    let categoriaOptionsHTML = '';
                    categoriaList.forEach(cat => {
                        const isSelected = chamado.categoria === cat ? 'selected' : '';
                        categoriaOptionsHTML += `<option value="${cat}">${cat}</option>`;
                    });

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

                    adminControls.innerHTML = `
                        <h3>Controles do Administrador</h3>
                        <div class="assignment-controls">
                            <div>
                                <label for="categoria-admin">Mudar Categoria:</label>
                                <select id="categoria-admin" class="admin-select">${categoriaOptionsHTML}</select>
                            </div>
                            <div>
                                <label for="depto-admin">Designar para:</label>
                                <select id="depto-admin" class="admin-select">${deptoOptionsHTML}</select>
                            </div>
                            <div>
                                <label for="status-admin">Mudar Status:</label>
                                <select id="status-admin" class="admin-select">${statusOptionsHTML}</select>
                            </div>
                            <div>
                                <label for="prioridade-admin">Mudar Prioridade:</label>
                                <select id="prioridade-admin" class="admin-select">${prioridadeOptionsHTML}</select>
                            </div>
                        </div>
                    `;

                    document.getElementById('categoria-admin').addEventListener('change', (e) => salvarAlteracao(ticketId, 'categoria', e.target.value, 'Categoria'));
                    document.getElementById('depto-admin').addEventListener('change', (e) => salvarAlteracao(ticketId, 'departamento', e.target.value, 'Departamento'));
                    document.getElementById('status-admin').addEventListener('change', (e) => salvarAlteracao(ticketId, 'status', e.target.value, 'Status'));
                    document.getElementById('prioridade-admin').addEventListener('change', (e) => salvarAlteracao(ticketId, 'prioridade', e.target.value, 'Prioridade'));
                }

            } else {
                if (commentFormCard) commentFormCard.style.display = 'block';
                if (adminControls) adminControls.style.display = 'none';
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
                const username = document.getElementById('username').value;
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
                        }).then(() => {
                            db.collection("users").doc(user.uid).set({
                                uid: user.uid,
                                nomeCompleto: nomeCompleto,
                                email: email,
                                username: username,
                                role: "solicitante",
                                area: null 
                            }).then(() => {
                                alert("Conta criada com sucesso! Você será redirecionado para a página de login.");
                                auth.signOut();
                                window.location.href = 'index.html';
                            });
                        });
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

    function initGerenciarUsuarios() {
        const container = document.getElementById('user-list-container');
        if (!container) return;
    
        if (localStorage.getItem('usuarioRole') !== 'admin') {
            showToast("Acesso negado.", "error");
            window.location.href = 'dashboard-admin.html';
            return;
        }
    
        db.collection("users").get().then((querySnapshot) => {
            container.innerHTML = '';
            querySnapshot.forEach((doc) => {
                const user = doc.data();
    
                if (user.role === 'admin') return;
    
                const card = document.createElement('div');
                card.className = 'user-management-card';
                
                card.innerHTML = `
                    <div class="user-management-info">
                        <h4>${user.nomeCompleto}</h4>
                        <p>${user.email}</p>
                    </div>
                    <select class="user-role-select" data-uid="${user.uid}">
                        <option value="solicitante" ${user.role === 'solicitante' ? 'selected' : ''}>Usuario</option>
                        <option value="suporte" ${user.role === 'suporte' ? 'selected' : ''}>Suporte</option>
                    </select>
                    
                    <div class="area-select-container" id="area-container-${user.uid}" style="display: ${user.role === 'suporte' ? 'block' : 'none'};">
                        <label>Área de Suporte:</label>
                        <select class="area-select" data-uid="${user.uid}">
                            <option value="null" ${!user.area ? 'selected' : ''}>Nenhuma</option>
                            <option value="hardware" ${user.area === 'hardware' ? 'selected' : ''}>Hardware</option>
                            <option value="software" ${user.area === 'software' ? 'selected' : ''}>Software</option>
                            <option value="rede" ${user.area === 'rede' ? 'selected' : ''}>Rede</option>
                            <option value="outros" ${user.area === 'outros' ? 'selected' : ''}>Outros</option>
                        </select>
                    </div>
                `;
                container.appendChild(card);
            });
    
            document.querySelectorAll('.user-role-select').forEach(select => {
                select.addEventListener('change', (event) => {
                    const newRole = event.target.value;
                    const uid = event.target.dataset.uid;
                    const areaContainer = document.getElementById(`area-container-${uid}`);
                    
                    let updateData = { role: newRole };
    
                    if (newRole === 'suporte') {
                        areaContainer.style.display = 'block';
                    } else {
                        areaContainer.style.display = 'none';
                        updateData.area = null; 
                    }

                    db.collection('users').doc(uid).update(updateData)
                        .then(() => showToast("Permissão atualizada!", "success"))
                        .catch(err => showToast("Erro ao atualizar permissão.", "error"));
                });
            });

            document.querySelectorAll('.area-select').forEach(select => {
                select.addEventListener('change', (event) => {
                    const newArea = event.target.value === 'null' ? null : event.target.value;
                    const uid = event.target.dataset.uid;
                    
                    db.collection('users').doc(uid).update({ area: newArea })
                        .then(() => showToast("Área do suporte atualizada!", "success"))
                        .catch(err => showToast("Erro ao atualizar área.", "error"));
                });
            });
        });
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
            
            if (target.closest('#btn-menu-mobile')) {
                document.body.classList.toggle('sidebar-mobile-active');
            }

            const sidebar = document.querySelector('.app-sidebar');
            if (sidebar && document.body.classList.contains('sidebar-mobile-active') && !sidebar.contains(target) && !target.closest('#btn-menu-mobile')) {
                document.body.classList.remove('sidebar-mobile-active');
            }


            if (target.matches('.logout-link')) {
                event.preventDefault(); 
                
                // --- LIMPA O LISTENER DO CHAT AO SAIR ---
                if (unsubChat) {
                    unsubChat();
                    unsubChat = null;
                }
                
                auth.signOut().then(() => {
                    localStorage.removeItem('usuarioLogado'); 
                    localStorage.removeItem('usuarioRole');
                    localStorage.removeItem('usuarioUid');
                    localStorage.removeItem('usuarioArea');
                    showToast("Você foi desconectado.", "info");
                    
                    setTimeout(() => {
                        window.location.href = 'index.html'; 
                    }, 1500);
                }).catch((error) => {
                    console.error("Erro ao fazer logout:", error);
                    showToast("Erro ao desconectar.", "error");
                });
            }
            
            if (target.matches('#btn-abrir-chamado')) {
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

            if (target.classList.contains('btn-alocar-chamado')) {
                const ticketId = target.dataset.id;
                showAlocarModal(ticketId);
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

            const id = target.id;
            if (id === 'btn-voltar-painel' || id === 'btn-ir-painel' || id === 'btn-retornar-painel' || id === 'btn-voltar-dashboard') {
                
                // --- LIMPA O LISTENER DO CHAT AO VOLTAR ---
                if (unsubChat) {
                    unsubChat();
                    unsubChat = null;
                }
                
                const userRole = localStorage.getItem('usuarioRole');
                if (userRole === 'admin' || userRole === 'suporte') {
                     window.location.href = 'dashboard-admin.html';
                } else {
                     window.location.href = 'dashboard.html';
                }
            }

            if (id === 'alocar-btn-cancel') {
                closeAlocarModal();
            }

            // --- NOVOS EVENTOS PARA O POPUP DE CHAT ---
            if (target.closest('#btn-open-chat-popup')) {
                document.getElementById('chat-popup').classList.add('show');
            }
            if (target.closest('#btn-close-chat')) {
                document.getElementById('chat-popup').classList.remove('show');
            }
        });

        const formAlocar = document.getElementById('form-alocar-chamado');
        if (formAlocar) {
            formAlocar.addEventListener('submit', function(event) {
                event.preventDefault();
                if (!ticketIdParaAlocar) return;

                const novaCategoria = document.getElementById('alocar-categoria').value;
                const novoStatus = document.getElementById('alocar-status').value;
                const novoDepto = document.getElementById('alocar-departamento').value;

                salvarAlteracao(ticketIdParaAlocar, 'categoria', novaCategoria, 'Categoria');
                salvarAlteracao(ticketIdParaAlocar, 'status', novoStatus, 'Status');
                salvarAlteracao(ticketIdParaAlocar, 'departamento', novoDepto, 'Departamento');

                closeAlocarModal();
                showToast("Chamado alocado com sucesso!", "success");
            });
        }
    }

    
    auth.onAuthStateChanged(async function(user) {
        
        injectNotificationContainers();
        setupDatabase();
        iniciarRelogio();
        
        const onLoginPage = document.querySelector('.login-box');
        const onAppPage = document.querySelector('.app-layout');
        const onRegistroPage = document.getElementById('form-registrar');

        if (!user) {
            localStorage.removeItem('usuarioLogado');
            localStorage.removeItem('usuarioRole');
            localStorage.removeItem('usuarioUid');
            localStorage.removeItem('usuarioArea');
            
            if (onAppPage) {
                window.location.href = 'index.html';
                return;
            }

            if (onLoginPage) {
                if (document.getElementById('form-login')) { 
                    initLoginPage();
                } else if (onRegistroPage) {
                    initRegistrarPage();
                } else if (document.getElementById('form-esqueci-senha')) { 
                    initEsqueciSenhaPage();
                }
            }
            
        } 
        else { 
            if (onRegistroPage) {
                return;
            }

            localStorage.setItem('usuarioLogado', user.displayName || user.email);
            localStorage.setItem('usuarioUid', user.uid);
            
            let userRole = localStorage.getItem('usuarioRole');
            let userArea = localStorage.getItem('usuarioArea');
            
            if (!userRole) { 
                try {
                    const userDocRef = db.collection('users').doc(user.uid);
                    const userDoc = await userDocRef.get();
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        userRole = userData.role || 'solicitante';
                        userArea = userData.area || null;
                    } else if (user.email === 'adm@admin.com') {
                        await userDocRef.set({
                            uid: user.uid,
                            nomeCompleto: "Admin Master",
                            email: user.email,
                            role: "admin",
                            area: null
                        });
                        userRole = 'admin';
                        userArea = null;
                    } else {
                        await userDocRef.set({
                            uid: user.uid,
                            nomeCompleto: user.displayName || "Usuário sem nome",
                            email: user.email,
                            role: "solicitante",
                            area: null
                        });
                        userRole = 'solicitante'; 
                        userArea = null;
                    }
                    localStorage.setItem('usuarioRole', userRole);
                    localStorage.setItem('usuarioArea', userArea || "null");
                } catch (e) {
                    console.error("Erro ao buscar role:", e);
                    userRole = 'solicitante';
                    userArea = null;
                }
            }
            
            if (onLoginPage) {
                if (userRole === 'admin' || userRole === 'suporte') {
                    window.location.href = 'dashboard-admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
                return;
            }

            if (onAppPage) {
                injetaNavbar(); 
                bindGlobalNavigators(); 

                const linkGerenciar = document.getElementById('link-gerenciar-usuarios');
                if (linkGerenciar) {
                    if (userRole === 'admin') {
                        linkGerenciar.style.display = 'block';
                    } else {
                        linkGerenciar.style.display = 'none';
                    }
                }

                if (document.getElementById('admin-ticket-list')) {
                    initAdminDashboard();
                } else if (document.getElementById('user-ticket-list')) {
                    initUserDashboard();
                } else if (document.getElementById('form-abrir-chamado')) {
                    initAbrirChamadoForm();
                } else if (document.getElementById('form-editar-chamado')) { 
                    initEditarChamadoPage();
                } else if (document.getElementById('detalhes-titulo')) {
                    initDetalhesPage();
                } else if (document.getElementById('user-list-container')) {
                    initGerenciarUsuarios();
                }
            }
        }
    });
    
});