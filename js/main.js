// ==========================================================
// ARQUIVO: main.js (Versão Completa)
// ==========================================================

document.addEventListener('DOMContentLoaded', function() {

    // --- 1. SIMULAÇÃO DE BANCO DE DADOS (localStorage) ---
    // Esta função é executada primeiro para garantir que os dados existam.
    function setupDatabase() {
        if (!localStorage.getItem('chamados')) {
            const chamadosIniciais = [
                { 
                    id: 1234, 
                    titulo: "Computador não liga", 
                    descricao: "Meu computador da mesa 5 não está ligando, a tela fica preta.", 
                    categoria: "hardware", 
                    status: "Em Progresso", 
                    departamento: "TI",
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

        // Lista de departamentos disponíveis
        window.appData = {
            departamentos: ["Hardware - Pedro Afonso", "Software - Carlos Eduardo Marinho", "Rede - Sandro Pinto", "Outros - Atendente Geral"]
        };
    }

    // --- 2. LÓGICA DA PÁGINA DE LOGIN (index.html) ---
    function initLoginPage() {
        const loginForm = document.querySelector('.login-box form');
        if (loginForm) {
            loginForm.addEventListener('submit', function(event) {
                event.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;

                if (username === 'adm' && password === 'adm') {
                    console.log('Login de Administrador bem-sucedido!');
                    window.location.href = 'dashboard-admin.html';
                } else {
                    console.log('Login de Usuário Comum simulado com sucesso!');
                    window.location.href = 'dashboard.html';
                }
            });
        }
    }

    // --- 3. LÓGICA DO PAINEL DO ADMIN (dashboard-admin.html) ---
    function initAdminDashboard() {
        const adminTicketList = document.getElementById('admin-ticket-list');
        if (!adminTicketList) return;

        const chamados = JSON.parse(localStorage.getItem('chamados'));
        const departamentos = window.appData.departamentos;

        adminTicketList.innerHTML = ''; // Limpa a lista

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
        
        // Adiciona o listener para salvar a mudança de departamento
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

    // --- 4. LÓGICA DO PAINEL DO USUÁRIO (dashboard.html) ---
    function initUserDashboard() {
        const userTicketList = document.querySelector('.tickets-section');
        const summaryCount = document.querySelector('.summary-details span');
        
        if (!userTicketList) return;

        const chamados = JSON.parse(localStorage.getItem('chamados'));
        
        // Atualiza o resumo
        const chamadosAbertos = chamados.filter(c => c.status === 'Aberto').length;
        if(summaryCount) {
             summaryCount.textContent = chamadosAbertos;
        }

        userTicketList.innerHTML = '<h3>Chamados em Andamento</h3>'; // Recria o título

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

    // --- 5. LÓGICA DO FORMULÁRIO (abrir-chamado.html) ---
    function initAbrirChamadoForm() {
        const formAbrirChamado = document.querySelector('#form-abrir-chamado');
        if (formAbrirChamado) {
            formAbrirChamado.addEventListener('submit', function(event) {
                event.preventDefault();
                
                // 1. Coletar dados do formulário
                const titulo = document.getElementById('titulo').value;
                const descricao = document.getElementById('descricao').value;
                const categoria = document.getElementById('categoria').value;
                
                // 2. Carregar chamados existentes
                let chamados = JSON.parse(localStorage.getItem('chamados'));
                
                // 3. Criar novo chamado
                const novoId = new Date().getTime(); // Gera um ID único baseado no timestamp
                
                const novoChamado = {
                    id: novoId,
                    titulo: titulo,
                    descricao: descricao,
                    categoria: categoria,
                    status: "Aberto",
                    departamento: null,
                    prioridade: "Não definida", // O Admin deverá definir a prioridade
                    historico: [
                        { data: new Date().toLocaleDateString('pt-BR'), autor: "Sistema", acao: "Chamado aberto." }
                    ]
                };
                
                // 4. Adicionar novo chamado à lista e salvar no localStorage
                chamados.push(novoChamado);
                localStorage.setItem('chamados', JSON.stringify(chamados));
                
                // 5. Redirecionar para a página de confirmação
                console.log('Novo chamado salvo!', novoChamado);
                window.location.href = 'confirmacao.html';
            });
        }
    }

    // --- 6. LÓGICA DA PÁGINA DE DETALHES (detalhes-chamado.html) ---
    function initDetalhesPage() {
        const params = new URLSearchParams(window.location.search);
        const ticketId = params.get('id');
        
        if (!ticketId) return; // Sai se não houver ID na URL

        const chamados = JSON.parse(localStorage.getItem('chamados'));
        const chamado = chamados.find(c => c.id == ticketId);

        if (chamado) {
            // Preenche os detalhes básicos
            document.getElementById('detalhes-titulo').textContent = `Chamado #${chamado.id} - ${chamado.titulo}`;
            document.getElementById('detalhes-status').textContent = chamado.status;
            document.getElementById('detalhes-status').className = `status ${chamado.status.toLowerCase().replace(' ', '-')}`;
            document.getElementById('detalhes-departamento').textContent = chamado.departamento || 'Não designado';
            document.getElementById('detalhes-prioridade').textContent = chamado.prioridade || 'Não definida';
            document.getElementById('detalhes-descricao').textContent = chamado.descricao;

            // Preenche o histórico dinamicamente
            const historyList = document.getElementById('detalhes-historico');
            historyList.innerHTML = ''; // Limpa o histórico estático

            if (chamado.historico && chamado.historico.length > 0) {
                chamado.historico.forEach(item => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>[${item.data}]</strong> - Atualização realizada por ${item.autor}: ${item.acao}`;
                    historyList.appendChild(li);
                });
            } else {
                historyList.innerHTML = '<li>Nenhuma atualização registrada.</li>';
            }

            // LÓGICA DO BOTÃO "ADICIONAR COMENTÁRIO"
            const btnAdicionarComentario = document.querySelector('.page-actions .btn-accent');
            if (btnAdicionarComentario) {
                btnAdicionarComentario.addEventListener('click', function() {
                    const acao = prompt("Digite sua atualização ou comentário:");
                    
                    if (acao && acao.trim() !== "") {
                        const dataFormatada = new Date().toLocaleDateString('pt-BR');
                        
                        // 1. Cria o novo item de histórico
                        const novoItemHistorico = {
                            data: dataFormatada,
                            autor: "Usuário", // Simulado. Numa app real, seria o nome do usuário logado.
                            acao: acao
                        };
                        
                        // 2. Encontra o chamado correto e atualiza seu histórico
                        const chamadoIndex = chamados.findIndex(c => c.id == ticketId);
                        if (chamadoIndex > -1) {
                            chamados[chamadoIndex].historico.push(novoItemHistorico);
                            
                            // 3. Salva a lista inteira de chamados de volta no localStorage
                            localStorage.setItem('chamados', JSON.stringify(chamados));
                            
                            // 4. Atualiza a tela (recarregando a página para simplificar)
                            alert("Comentário adicionado! A página será atualizada.");
                            window.location.reload(); 
                        }
                    }
                });
            }
        }
    }


    // --- 7. LÓGICA DE NAVEGAÇÃO GLOBAL (Para todos os botões) ---
    // Usa "event delegation" para gerenciar todos os cliques em um só lugar.
    function bindGlobalNavigators() {
        document.body.addEventListener('click', function(event) {
            const target = event.target; // O elemento que foi clicado
            
            // Botão "Abrir Novo Chamado" (do dashboard.html)
            if (target.matches('.summary-card .btn-accent')) {
                window.location.href = 'abrir-chamado.html';
            }
            
            // Botão "Detalhes" (do dashboard.html)
            if (target.classList.contains('btn-ver-detalhes')) {
                const ticketId = target.dataset.id;
                window.location.href = `detalhes-chamado.html?id=${ticketId}`;
            }

            // Botão "Editar" (do dashboard.html)
            if (target.classList.contains('btn-editar-chamado')) {
                alert("Funcionalidade 'Editar' ainda não implementada.");
            }

            // Botão "Adicionar Anexos" (de abrir-chamado.html)
            if (target.matches('#form-abrir-chamado .btn-secondary')) {
                 alert("Funcionalidade 'Adicionar Anexos' ainda não implementada.");
            }

            // Botões de "Voltar" ou "Ir para o Painel"
            // (Funciona para confirmacao.html, detalhes-chamado.html, abrir-chamado.html)
            const id = target.id;
            if (id === 'btn-voltar-painel' || id === 'btn-ir-painel' || id === 'btn-retornar-painel' || id === 'btn-voltar-dashboard') {
                // Checa se viemos do painel admin (forma simples, não 100% garantida)
                if (document.referrer.includes('dashboard-admin.html')) {
                     window.location.href = 'dashboard-admin.html';
                } else {
                     window.location.href = 'dashboard.html';
                }
            }
        });
    }

    // --- ROTEADOR PRINCIPAL ---
    // Executa as funções corretas com base na página atual.
    
    setupDatabase(); // 1º - Garante que o "banco de dados" existe
    bindGlobalNavigators(); // 2º - Ativa todos os botões de navegação e placeholders

    const path = window.location.pathname;

    if (path.endsWith('index.html') || path === '/') {
        initLoginPage();
    } else if (path.endsWith('dashboard-admin.html')) {
        initAdminDashboard();
    } else if (path.endsWith('dashboard.html')) {
        initUserDashboard();
    } else if (path.endsWith('abrir-chamado.html')) {
        initAbrirChamadoForm();
    } else if (path.endsWith('detalhes-chamado.html')) {
        initDetalhesPage();
    }
    // A página confirmacao.html não precisa de JS específico, 
    // pois seu botão já é coberto pelo bindGlobalNavigators().
});