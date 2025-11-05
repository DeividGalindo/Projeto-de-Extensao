document.addEventListener('DOMContentLoaded', function() {

    function injetaNavbar() {
        const header = document.querySelector('.page-header');
        if (!header) {
            return;
        }
        const nomeUsuario = localStorage.getItem('usuarioLogado') || 'Visitante';
        const navbarHTML = `
            <div class="navbar-container">
                <div class="user-menu">
                    <img src="img/fundo.jpg" alt="Ícone do Usuário" class="user-icon">
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
        if (!localStorage.getItem('chamados')) {
            const chamadosIniciais = [
                 { 
                    id: 1234, 
                    titulo: "Computador não liga", 
                    descricao: "Meu computador da mesa 5 não está ligando, a tela fica preta.", 
                    categoria: "hardware", 
                    status: "Em Progresso", 
                    departamento: "Hardware - Pedro Afonso",
                    prioridade: "Alta",
                    historico: [
                        { data: "10/10/2025", autor: "Maria", acao: "Verificação inicial concluída." },
                        { data: "11/10/2025", autor: "João (TI)", acao: "Em andamento." }
                    ]
                },
                { 
                    id: 1235, 
                    titulo: "Erro ao acessar sistema de Vendas", 
                    descricao: "O sistema de vendas XYZ está mostrando um erro '503' ao tentar logar.", 
                    categoria: "software", 
                    status: "Aberto", 
                    departamento: null,
                    prioridade: "Média",
                    historico: [
                        { data: "12/10/2025", autor: "Sistema", acao: "Chamado aberto." }
                    ]
                }, 
                { 
                    id: 1236, 
                    titulo: "Impressora não funciona", 
                    descricao: "A impressora do segundo andar não está imprimindo os relatórios.", 
                    categoria: "hardware", 
                    status: "Aberto", 
                    departamento: null,
                    prioridade: "Baixa",
                    historico: [
                         { data: "13/10/2025", autor: "Sistema", acao: "Chamado aberto." }
                    ]
                }
            ];
            localStorage.setItem('chamados', JSON.stringify(chamadosIniciais));
        }

        if (!localStorage.getItem('users')) {
            const adminUser = {
                username: "adm",
                nomeCompleto: "Administrador", 
                email: "adm@admin.com",
                password: "adm"
            };
            localStorage.setItem('users', JSON.stringify([adminUser]));
        }

        window.appData = {
            departamentos: ["Hardware - Pedro Afonso", "Software - Carlos Eduardo Marinho", "Rede - Sandro Pinto", "Outros - Atendente Geral"]
        };
    }

    function initLoginPage() {
        const loginForm = document.querySelector('.login-box form');
        if (loginForm) {
            loginForm.addEventListener('submit', function(event) {
                event.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;

                const users = JSON.parse(localStorage.getItem('users'));
                const user = users.find(u => u.username === username && u.password === password);

                if (user) {
                    localStorage.setItem('usuarioLogado', user.nomeCompleto); 
                    
                    if (user.username === 'adm') {
                        console.log('Login de Administrador bem-sucedido!');
                        window.location.href = 'dashboard-admin.html';
                    } else {
                        console.log('Login de Usuário Comum bem-sucedido!');
                        window.location.href = 'dashboard.html';
                    }
                } else {
                    alert("Usuário ou senha incorretos. Tente novamente ou registre-se.");
                }
            });
        }
    }
    function initAdminDashboard() {
        const adminTicketList = document.getElementById('admin-ticket-list');
        if (!adminTicketList) return;

        const chamados = JSON.parse(localStorage.getItem('chamados'));
        const departamentos = window.appData.departamentos;

        adminTicketList.innerHTML = ''; 

        chamados.forEach(chamado => {
            const ticketCard = document.createElement('div');
            ticketCard.className = 'ticket-card card';
            ticketCard.dataset.id = chamado.id;

            let optionsHTML = '<option value="null">Nenhum</option>';
            departamentos.forEach(depto => {
                const isSelected = chamado.departamento === depto ? 'selected' : '';
                optionsHTML += `<option value="${depto}" ${isSelected}>${depto}</option>`;
            });

            ticketCard.innerHTML = `
                <div class="ticket-info">
                    <h4>Chamado #${chamado.id} - ${chamado.titulo}</h4>
                    <p>Status: <span class="status ${chamado.status.toLowerCase().replace(' ', '-')}">${chamado.status}</span></p>
                </div>
                <div class="assignment-controls">
                    <label for="depto-${chamado.id}">Designar para:</label>
                    <select id="depto-${chamado.id}" class="departamento-select">
                        ${optionsHTML}
                    </select>
                </div>
            `;
            adminTicketList.appendChild(ticketCard);
        });
        
        document.querySelectorAll('.departamento-select').forEach(select => {
            select.addEventListener('change', function(event) {
                const selectedDepartment = event.target.value;
                const ticketId = event.target.closest('.ticket-card').dataset.id;
                
                const chamadosAtualizados = JSON.parse(localStorage.getItem('chamados')).map(chamado => {
                    if (chamado.id == ticketId) {
                        chamado.departamento = selectedDepartment === 'null' ? null : selectedDepartment;
                    }
                    return chamado;
                });

                localStorage.setItem('chamados', JSON.stringify(chamadosAtualizados));
                console.log(`Chamado #${ticketId} designado para ${selectedDepartment}`);
            });
        });
    }

    function initUserDashboard() {
        const userTicketList = document.querySelector('.tickets-section');
        const summaryCount = document.querySelector('.summary-details span');
        
        if (!userTicketList) return;

        const chamados = JSON.parse(localStorage.getItem('chamados'));
        
        const chamadosAbertos = chamados.filter(c => c.status === 'Aberto').length;
        if(summaryCount) {
             summaryCount.textContent = chamadosAbertos;
        }

        userTicketList.innerHTML = '<h3>Chamados em Andamento</h3>'; 

        chamados.forEach(chamado => {
            const ticketCard = document.createElement('div');
            ticketCard.className = 'ticket-card card';
            ticketCard.innerHTML = `
                <div class="ticket-info">
                    <h4>Chamado #${chamado.id} - ${chamado.titulo}</h4>
                    <p>Status: <span class="status ${chamado.status.toLowerCase().replace(' ', '-')}">${chamado.status}</span></p>
                </div>
                <div class="ticket-actions">
                    <button class="btn btn-primary btn-ver-detalhes" data-id="${chamado.id}">Detalhes</button>
                    <button class="btn btn-accent btn-editar-chamado" data-id="${chamado.id}">Editar</button>
                </div>
            `;
            userTicketList.appendChild(ticketCard);
        });
    }

    function initAbrirChamadoForm() {
        const formAbrirChamado = document.querySelector('#form-abrir-chamado');
        if (formAbrirChamado) {
            formAbrirChamado.addEventListener('submit', function(event) {
                event.preventDefault();
                
                const titulo = document.getElementById('titulo').value;
                const descricao = document.getElementById('descricao').value;
                const categoria = document.getElementById('categoria').value;
                
                let chamados = JSON.parse(localStorage.getItem('chamados'));
                
                const novoId = new Date().getTime(); 
                
                const novoChamado = {
                    id: novoId,
                    titulo: titulo,
                    descricao: descricao,
                    categoria: categoria,
                    status: "Aberto",
                    departamento: null,
                    prioridade: "Não definida", 
                    historico: [
                        { data: new Date().toLocaleDateString('pt-BR'), autor: "Sistema", acao: "Chamado aberto." }
                    ]
                };
                
                chamados.push(novoChamado);
                localStorage.setItem('chamados', JSON.stringify(chamados));
                
                console.log('Novo chamado salvo!', novoChamado);
                window.location.href = 'confirmacao.html';
            });
        }
    }

    function initDetalhesPage() {
        const params = new URLSearchParams(window.location.search);
        const ticketId = params.get('id');
        
        if (!ticketId) return; 

        const chamados = JSON.parse(localStorage.getItem('chamados'));
        const chamado = chamados.find(c => c.id == ticketId);

        if (chamado) {
            document.getElementById('detalhes-titulo').textContent = `Chamado #${chamado.id} - ${chamado.titulo}`;
            document.getElementById('detalhes-status').textContent = chamado.status;
            document.getElementById('detalhes-status').className = `status ${chamado.status.toLowerCase().replace(' ', '-')}`;
            document.getElementById('detalhes-departamento').textContent = chamado.departamento || 'Não designado';
            document.getElementById('detalhes-prioridade').textContent = chamado.prioridade || 'Não definida';
            document.getElementById('detalhes-descricao').textContent = chamado.descricao;

            const historyList = document.getElementById('detalhes-historico');
            historyList.innerHTML = ''; 

            if (chamado.historico && chamado.historico.length > 0) {
                chamado.historico.forEach(item => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>[${item.data}]</strong> - Atualização realizada por ${item.autor}: ${item.acao}`;
                    historyList.appendChild(li);
                });
            } else {
                historyList.innerHTML = '<li>Nenhuma atualização registrada.</li>';
            }

            const btnAdicionarComentario = document.querySelector('.page-actions .btn-accent');
            if (btnAdicionarComentario) {
                btnAdicionarComentario.addEventListener('click', function() {
                    const acao = prompt("Digite sua atualização ou comentário:");
                    
                    if (acao && acao.trim() !== "") {
                        const dataFormatada = new Date().toLocaleDateString('pt-BR');
                        
                        const novoItemHistorico = {
                            data: dataFormatada,
                            autor: localStorage.getItem('usuarioLogado') || "Usuário", 
                            acao: acao
                        };
                        
                        const chamadoIndex = chamados.findIndex(c => c.id == ticketId);
                        if (chamadoIndex > -1) {
                            chamados[chamadoIndex].historico.push(novoItemHistorico);
                            localStorage.setItem('chamados', JSON.stringify(chamados));
                            alert("Comentário adicionado! A página será atualizada.");
                            window.location.reload(); 
                        }
                    }
                });
            }
        }
    }

    function initRegistrarPage() {
        const registrarForm = document.querySelector('#form-registrar');
        if (registrarForm) {
            registrarForm.addEventListener('submit', function(event) {
                event.preventDefault();

                const username = document.getElementById('username').value;
                const nomeCompleto = document.getElementById('nomeCompleto').value;
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const politica = document.getElementById('politica').checked;

                if (!politica) {
                    alert("Você precisa aceitar a Política de Usuário para se registrar.");
                    return; 
                }

                const users = JSON.parse(localStorage.getItem('users'));
                const usuarioExistente = users.find(u => u.username === username || u.email === email);

                if (usuarioExistente) {
                    alert("Este Login (Nome de usuário) ou Email já está em uso.");
                    return;
                }

                const novoUsuario = {
                    username: username,
                    nomeCompleto: nomeCompleto,
                    email: email,
                    password: password 
                };

                users.push(novoUsuario);
                localStorage.setItem('users', JSON.stringify(users));

                alert("Conta criada com sucesso! Você será redirecionado para a página de login.");
                window.location.href = 'index.html';
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
                localStorage.removeItem('usuarioLogado'); 
                console.log('Usuário deslogado.');
                window.location.href = 'index.html'; 
            }
            
            if (target.matches('.summary-card .btn-accent')) {
                window.location.href = 'abrir-chamado.html';
            }
            
            if (target.classList.contains('btn-ver-detalhes')) {
                const ticketId = target.dataset.id;
                window.location.href = `detalhes-chamado.html?id=${ticketId}`;
            }

            if (target.classList.contains('btn-editar-chamado')) {
                alert("Funcionalidade 'Editar' ainda não implementada.");
            }

            if (target.matches('#form-abrir-chamado .btn-secondary')) {
                 alert("Funcionalidade 'Adicionar Anexos' ainda não implementada.");
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
    
    setupDatabase();
    injetaNavbar(); 
    bindGlobalNavigators();

    const path = window.location.pathname;

    if (path.endsWith('index.html') || path === '/') {
        initLoginPage();
    } else if (path.endsWith('registrar.html')) { 
        initRegistrarPage();
    } else if (path.endsWith('dashboard-admin.html')) {
        initAdminDashboard();
    } else if (path.endsWith('dashboard.html')) {
        initUserDashboard();
    } else if (path.endsWith('abrir-chamado.html')) {
        initAbrirChamadoForm();
    } else if (path.endsWith('detalhes-chamado.html')) {
        initDetalhesPage();
    }
    
});