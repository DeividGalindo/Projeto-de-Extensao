# 🚀 ServiceDesk - Projeto de Extensão

Um sistema de Service Desk (Help Desk) completo, desenvolvido com HTML, CSS e JavaScript puros, utilizando o Firebase como backend para autenticação e banco de dados em tempo real.

O projeto apresenta uma interface de usuário moderna, responsiva, em *dark mode*, e divide as funcionalidades entre um painel para o **Solicitante (usuário)** e um painel para o **Administrador**.

---

## ✨ Funcionalidades Principais

O sistema é dividido em três áreas principais: Autenticação, Painel do Solicitante e Painel do Administrador.

### 🔑 1. Autenticação e Usuários
* **Login Seguro:** Autenticação de usuários e administradores via Firebase Auth.
* **Registro de Conta:** Formulário para criação de novas contas de solicitante.
* **Recuperação de Senha:** Fluxo de "Esqueci minha senha" com envio de email.

---

### 👤 2. Painel do Solicitante (Usuário)
* **Dashboard Pessoal:** Visualização de estatísticas (Abertos, Em Andamento, Finalizados) dos *seus* chamados.
* **Criação de Chamados:** Formulário para abrir novos tickets, incluindo Título, Descrição, Categoria e Anexo de imagem (com limite de 2MB).
* **Listagem de Chamados:** Tabela com todos os chamados abertos pelo usuário, com colunas para ID, Título, Categoria, Autor, Data de Abertura e Status.
* **Filtros e Busca:** Ferramentas para filtrar chamados por status ou buscar por ID/Título.
* **Edição de Chamados:** Capacidade de editar o Título, Descrição e Categoria de chamados abertos.
* **Página de Detalhes:** Visualização completa do histórico do chamado, comentários e anexo.
* **Interação:** Usuários podem adicionar comentários ao histórico de seus chamados.

---

### 👑 3. Painel do Administrador
* **Dashboard Geral:** Visualização de estatísticas *globais* de todos os chamados no sistema (Total de Abertos, Em Andamento, Finalizados).
* **Relógio em Tempo Real:** Um card exibe a data e hora atuais.
* **Listagem Completa:** Tabela com *todos* os chamados de *todos* os usuários.
* **Filtros e Busca:** Ferramentas para gerenciar e encontrar chamados específicos.
* **Popup de Alocação Rápida:** Um botão "Alocar" em cada linha da tabela que abre um popup para:
    * Mudar o **Status** (Aberto, Em Progresso, Fechado).
    * Mudar a **Categoria** (Hardware, Software, etc.).
    * **Atribuir** o chamado a um departamento (Ex: "Hardware - Pedro Afonso").
* **Página de Detalhes (Controle Total):**
    * Acesso a todos os detalhes.
    * Capacidade de adicionar comentários ao histórico.
    * Controles de admin para alterar Categoria, Status, Prioridade e Departamento.
* **Exclusão de Chamados:** Administradores podem excluir chamados (com um popup de confirmação).

---

### 🛠️ Tecnologias Utilizadas
* **Frontend:** HTML5, CSS3 (Flexbox/Grid), JavaScript (ES6+)
* **Backend (BaaS):** Firebase
    * **Firebase Authentication:** Para login, registro e recuperação de senha.
    * **Cloud Firestore:** Para armazenamento de dados (chamados, usuários) em tempo real.
    * **Firebase Storage:** (Configurado) Para futuro armazenamento de anexos de forma escalável. *Nota: Atualmente os anexos são salvos via LocalStorage.*
* **Design:**
    * Interface responsiva (Mobile-First) com layout Dark Mode.
    * Modais (Popups) e Toasts (Notificações) customizados.

---

## 🧩 4. Planejamento do Desenvolvimento

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