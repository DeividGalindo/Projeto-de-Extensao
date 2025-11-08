# 🚀 ServiceDesk - Projeto de Extensão

# 🚀 ServiceDesk App - Documentação do Projeto

## 1. Introdução e Visão Geral

O ServiceDesk App é um sistema de help desk (service desk) desenvolvido como um *single-page application* (SPA) moderno. O projeto foi construído utilizando HTML, CSS e JavaScript puros no frontend, e utiliza o Google Firebase como plataforma de backend (BaaS) para autenticação, banco de dados em tempo real e regras de segurança.

O sistema é projetado para dois tipos principais de usuários:
* **Solicitantes (Usuários):** Podem se cadastrar, fazer login, abrir novos chamados (tickets), acompanhar o status, editar seus chamados e interagir com o histórico.
* **Administradores:** Têm uma visão completa de *todos* os chamados do sistema, podem alocar, editar, excluir e gerenciar o ciclo de vida de qualquer chamado.

## 2. Arquitetura e Tecnologias

O projeto utiliza uma arquitetura *serverless* baseada no Firebase.

* **Frontend:**
    * **HTML5:** Estrutura semântica para todas as 9 telas (Login, Registro, Dashboards, Formulários, etc.).
    * **CSS3:** Estilização completa em *dark mode*, utilizando Flexbox e Grid para um layout de painel moderno e responsivo.
    * **JavaScript (ES6+):** Utilizado como o "cérebro" da aplicação, responsável por toda a lógica de negócios, manipulação do DOM e comunicação com o Firebase.

* **Backend (Firebase BaaS):**
    * **Firebase Authentication:** Gerencia o cadastro, login (email/senha) e recuperação de senha.
    * **Cloud Firestore:** Banco de dados NoSQL em tempo real usado para armazenar as coleções de `users` e `chamados`.
* **Armazenamento Local:**
    * **LocalStorage:** Utilizado para salvar temporariamente os anexos de imagem (codificados em Base64) antes do envio.

## 3. Estrutura do Projeto

O projeto é composto pelos seguintes arquivos principais:

* `index.html`: Tela de login (com ID `form-login`).
* `registrar.html`: Formulário de registro de novo usuário.
* `esqueci-senha.html`: Formulário para recuperação de senha.
* `dashboard.html`: Painel principal do Solicitante.
* `dashboard-admin.html`: Painel principal do Administrador.
* `abrir-chamado.html`: Formulário para criar um novo chamado.
* `editar-chamado.html`: Formulário para editar um chamado existente.
* `detalhes-chamado.html`: Tela de visualização detalhada de um chamado, seu histórico e anexos.
* `confirmacao.html`: Página de sucesso exibida após a abertura de um chamado.
* `css/style.css`: Arquivo único de estilos, contendo o *dark mode*, layout da aplicação, modais, tabela e regras de responsividade (`@media`).
* `js/main.js`: O arquivo JavaScript central que controla toda a aplicação.

## 4. Configuração do Ambiente

Para executar este projeto, são necessárias as seguintes etapas:

1.  **Clonar o Repositório:** `git clone ...`
2.  **Criar Projeto Firebase:**
    * Acesse o [Console do Firebase](https://console.firebase.google.com/) e crie um novo projeto.
    * Adicione um novo "App da Web" ao projeto.
    * Copie o objeto de configuração `firebaseConfig` fornecido.
3.  **Adicionar Configuração ao HTML:**
    * Cole o objeto `firebaseConfig` no bloco `<script>` na parte inferior de **todos** os arquivos HTML (ex: `index.html`, `dashboard.html`, etc.).
4.  **Ativar Serviços do Firebase:**
    * No menu "Build", vá para **Authentication** -> **Sign-in method** e ative o provedor "E-mail/senha".
    * No menu "Build", vá para **Firestore Database** e crie um novo banco de dados no modo de produção.
5.  **Configurar Regras de Segurança (Firestore):**
    * Vá para **Firestore Database** -> **Regras** e cole as seguintes regras para garantir que usuários só possam ver/editar seus próprios chamados e que admins possam gerenciar tudo:
    ```
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
      
        // Usuários podem criar seu próprio documento
        match /users/{uid} {
          allow create: if request.auth.uid == uid;
          allow read, write: if request.auth.uid == uid || getUserRole(request.auth.uid) == 'admin';
        }
        
        match /chamados/{chamadoId} {
          // Usuários logados podem criar chamados (e devem ser donos dele)
          allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
          
          // Admins podem ler/atualizar/deletar tudo.
          // Usuários só podem ler/atualizar os seus próprios.
          allow read, update: if getUserRole(request.auth.uid) == 'admin' || resource.data.userId == request.auth.uid;
          allow delete: if getUserRole(request.auth.uid) == 'admin';
        }

        // Função helper para ler o 'role' do usuário
        function getUserRole(uid) {
          return get(/databases/$(database)/documents/users/$(uid)).data.role;
        }
      }
    }
    ```
6.  **Autorizar Domínio (para Deploy):**
    * Se estiver publicando no GitHub Pages, vá para **Authentication** -> **Settings** -> **Authorized domains**.
    * Clique em "Add domain" e adicione seu domínio (ex: `seunome.github.io`).
7.  **Criar Usuário Admin:**
    * Registre uma conta no seu aplicativo com o email: `adm@admin.com`.
    * Faça login com esta conta. O `js/main.js` está programado para reconhecer este email e redirecioná-lo para o `dashboard-admin.html`.

## 5. Estrutura do Banco de Dados (Firestore)

O sistema utiliza duas coleções principais no Firestore:

#### Coleção: `users`
* **ID do Documento:** `uid` (O UID do Firebase Authentication)
* **Campos:**
    * `uid`: (String) O UID do Firebase Auth.
    * `nomeCompleto`: (String) Nome do usuário (ex: "Deivid Galindo").
    * `email`: (String) Email de login.
    * `username`: (String) Nome de usuário (ex: "deivid.galindo").
    * `role`: (String) Nível de permissão (ex: "solicitante" ou "admin").

#### Coleção: `chamados`
* **ID do Documento:** (Gerado automaticamente pelo Firestore)
* **Campos:**
    * `titulo`: (String) Título do chamado.
    * `descricao`: (String) Descrição completa do problema.
    * `categoria`: (String) "hardware", "software", "rede", "outros".
    * `status`: (String) "Aberto", "Em Progresso", "Fechado".
    * `prioridade`: (String) "Não definida" (ou "Baixa", "Média", "Alta").
    * `departamento`: (String/Null) Departamento atribuído (ex: "Hardware - Pedro Afonso").
    * `dataAbertura`: (Timestamp) Data/hora de criação do chamado.
    * `numeroChamado`: (String) ID curto para exibição (ex: "458257").
    * `userId`: (String) O `uid` do usuário que criou o chamado.
    * `autorNome`: (String) O `displayName` do usuário que criou o chamado.
    * `historico`: (Array) Uma lista de objetos, cada um contendo:
        * `data`: (String) Timestamp formatado (ex: "08/11/2025, 14:30").
        * `dataReal`: (Timestamp) Timestamp real para ordenação.
        * `autor`: (String) Quem fez a ação (ex: "Sistema", "Deivid Galindo", "adm@admin.com").
        * `acao`: (String) A descrição da mudança (ex: "Chamado aberto.", "Status alterado para Em Progresso.").

## 6. Detalhamento das Funcionalidades (Roteiro de Navegação)

O `js/main.js` utiliza a função `auth.onAuthStateChanged` como um roteador central.

1.  **Usuário Não Logado:**
    * Se tentar acessar qualquer página do `.app-layout` (dashboards, etc.), é redirecionado para `index.html`.
    * Se estiver no `index.html`, o `initLoginPage()` é executado.
    * Se estiver no `registrar.html`, o `initRegistrarPage()` é executado.

2.  **Usuário Logado:**
    * Se tentar acessar `index.html` ou `registrar.html`, é redirecionado para o dashboard correto (`dashboard.html` ou `dashboard-admin.html` se o email for `adm@admin.com`).
    * O `injetaNavbar()` é chamado para exibir o ícone de usuário e o menu dropdown (Logout).
    * O `iniciarRelogio()` é chamado para o painel de admin.
    * O script detecta em qual página (`.app-layout`) o usuário está e executa a função `init...` correspondente (ex: `initAdminDashboard()`).

### Funcionalidades do Administrador

* **Listagem (Render):** `renderAdminList()` é chamado pelo `initAdminDashboard()`. Ele busca *todos* os chamados do cache (`chamadosDoAdminCache`), aplica os filtros de status e busca, e então gera o HTML da tabela, incluindo os botões "Alocar", "Detalhes" e "Excluir".
* **Alocação Rápida (Modal):**
    1.  O Admin clica no botão `.btn-alocar-chamado` em uma linha da tabela.
    2.  O `bindGlobalNavigators()` captura o clique e chama `showAlocarModal(ticketId)`.
    3.  `showAlocarModal()` busca os dados atuais do chamado no Firestore.
    4.  Ele preenche os `<select>` do modal `#alocar-modal-overlay` com os dados atuais.
    5.  O modal é exibido.
    6.  O Admin altera os dados e clica em "Salvar".
    7.  O `bindGlobalNavigators()` captura o `submit` do `#form-alocar-chamado`.
    8.  Ele chama a função `salvarAlteracao()` três vezes (para categoria, status e departamento).
    9.  `salvarAlteracao()` atualiza o documento no Firestore e adiciona um novo item ao array `historico`.
    10. O modal é fechado e um toast de sucesso aparece.
* **Alocação (Página de Detalhes):** A lógica é idêntica à do modal, mas os `<select>` estão no card `#admin-ticket-controls` e são ativados pelo `initDetalhesPage()`.

### Funcionalidades do Solicitante

* **Listagem (Render):** `renderUserList()` é chamado pelo `initUserDashboard()`. Ele busca apenas os chamados onde `userId == user.uid`. Ele gera a tabela com os botões "Detalhes" e "Editar" (sem "Alocar" ou "Excluir").
* **Abertura de Chamado:**
    1.  O `initAbrirChamadoForm()` prepara o formulário.
    2.  O usuário preenche os dados. Se selecionar um anexo, a imagem é lida como Base64 e armazenada na variável `anexoPendente`.
    3.  Ao enviar, um novo documento é criado na coleção `chamados`.
    4.  Se `anexoPendente` existir, seu conteúdo Base64 é salvo no `localStorage` do navegador com a chave `anexo_` + o novo ID do documento.
    5.  O usuário é redirecionado para `confirmacao.html`.
* **Visualização de Anexo:** Na `initDetalhesPage()`, o script tenta ler a chave `anexo_` + ID do chamado no `localStorage`. Se encontrar, exibe a imagem.

## 7. Gestão de Projeto (Scrum)

Conforme definido pela equipe:

### 👥 Organização dos Papéis no Grupo
A equipe foi estruturada conforme as responsabilidades técnicas e de design, alinhadas às boas práticas do Scrum:

| Membro | Papel no Scrum | Função no Projeto |
|--------|----------------|------------------|
| *Deivid* | Scrum Master / Desenvolvedor Backend | Responsável técnico pelo projeto, coordenação dos sprints, desenvolvimento backend e protocolos de segurança. |
| *Gabriel* | Desenvolvedor Backend | Apoio na implementação dos fluxos principais e segurança. |
| *Guilherme* | Product Owner / Analista de Dados | Definição de requisitos, priorização de funcionalidades, criação de relatórios e dashboards. |
| *Rennan* | Designer / Desenvolvedor Frontend | Design da interface, usabilidade, responsividade e testes da versão mobile. |

### 🗂 Divisão de Responsabilidades
| Módulo Principal | Responsáveis | Descrição |
|------------------|---------------|------------|
| *Gestão de Usuários e Chamados* | Deivid, Gabriel | Desenvolvimento backend e fluxos principais do sistema. |
| *Relatórios e Métricas* | Rennan | Análises de desempenho e dashboards administrativos. |
| *UI, Usabilidade e Responsividade* | Guilherme | Design e testes da interface mobile. |
| *Segurança e Auditoria* | Deivid, Gabriel | Implementação de protocolos de segurança e auditoria. |

### 🗓 Cronograma de Sprints
| Sprint | Período | Entregas Principais |
|---------|----------|--------------------|
| *Sprint 1* | 01/10 – 15/10 | Levantamento de requisitos e protótipos iniciais. |
| *Sprint 2* | 16/10 – 31/10 | Desenvolvimento dos módulos de usuários e chamados. |
| *Sprint 3* | 01/11 – 15/11 | Relatórios, dashboards e aprimoramento da interface. |
| *Sprint 4* | 16/11 – 30/11 | Implementação de segurança, auditoria e testes finais. |

### ⚙ Ferramentas de Apoio
- *Repositório:* GitHub
- *Gestão de tarefas:* Trello
- *Comunicação:* WhatsApp e Google Meet
- *Documentação:* Google Docs / Notion

---

## 🧩 8. Planejamento do Desenvolvimento

### 📘 Metodologia de Desenvolvimento
O grupo adotou a metodologia ágil *Scrum* para o desenvolvimento do sistema de Service Desk.  
Essa abordagem foi escolhida por permitir entregas iterativas e incrementais, com revisões frequentes e maior colaboração entre os membros da equipe.  
Cada sprint terá duração de *duas semanas*, com reuniões rápidas de acompanhamento e revisões ao final de cada ciclo.

---

### 👥 Organização dos Papéis no Grupo
A equipe foi estruturada conforme as responsabilidades técnicas e de design, alinhadas às boas práticas do Scrum:

| Membro | Papel no Scrum | Função no Projeto |
|--------|----------------|------------------|
| *Deivid* | Scrum Master / Desenvolvedor Backend | Responsável técnico pelo projeto, coordenação dos sprints, desenvolvimento backend e protocolos de segurança. |
| *Gabriel* | Desenvolvedor Backend | Apoio na implementação dos fluxos principais e segurança. |
| *Guilherme* | Product Owner / Analista de Dados | Definição de requisitos, priorização de funcionalidades, criação de relatórios e dashboards. |
| *Rennan* | Designer / Desenvolvedor Frontend | Design da interface, usabilidade, responsividade e testes da versão mobile. |

---

### 🗂 Divisão de Responsabilidades
Para assegurar um desenvolvimento ágil e colaborativo, o *Product Backlog* foi dividido de acordo com as competências específicas de cada membro:

| Módulo Principal | Responsáveis | Descrição |
|------------------|---------------|------------|
| *Gestão de Usuários e Chamados* | Deivid, Gabriel | Desenvolvimento backend e fluxos principais do sistema. |
| *Relatórios e Métricas* | Rennan | Análises de desempenho e dashboards administrativos. |
| *UI, Usabilidade e Responsividade* | Guilherme | Design e testes da interface mobile. |
| *Segurança e Auditoria* | Deivid, Gabriel | Implementação de protocolos de segurança e auditoria. |

---

### 🗓 Cronograma de Sprints
O projeto foi dividido em quatro sprints principais, com entregas progressivas:

| Sprint | Período | Entregas Principais |
|---------|----------|--------------------|
| *Sprint 1* | 01/10 – 15/10 | Levantamento de requisitos e protótipos iniciais. |
| *Sprint 2* | 16/10 – 31/10 | Desenvolvimento dos módulos de usuários e chamados. |
| *Sprint 3* | 01/11 – 15/11 | Relatórios, dashboards e aprimoramento da interface. |
| *Sprint 4* | 16/11 – 30/11 | Implementação de segurança, auditoria e testes finais. |

---

### ⚙ Ferramentas de Apoio
- *Repositório:* GitHub  
- *Gestão de tarefas:* Trello (quadro Scrum com colunas: Backlog, Em andamento, Em revisão, Concluído)  
- *Comunicação:* WhatsApp e Google Meet  
- *Documentação:* Google Docs / Notion