document.addEventListener('DOMContentLoaded', function() {

    const loginForm = document.querySelector('.login-box form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            console.log('Login simulado com sucesso!');
            window.location.href = 'dashboard.html';
        });
    }

    const btnAbrirChamado = document.querySelector('.summary-card .btn-accent');
    if (btnAbrirChamado) {
        btnAbrirChamado.addEventListener('click', function() {
            console.log('Navegando para a página de abrir chamado.');
            window.location.href = 'abrir-chamado.html';
        });
    }

    const formAbrirChamado = document.querySelector('#form-abrir-chamado');
    if (formAbrirChamado) {
        formAbrirChamado.addEventListener('submit', function(event) {
            event.preventDefault();
            console.log('Formulário de chamado enviado. Redirecionando para confirmação.');
            
            window.location.href = 'confirmacao.html'; 
        });
    }

    const btnVoltarPainel = document.querySelector('#btn-voltar-painel');
    if (btnVoltarPainel) {
        btnVoltarPainel.addEventListener('click', function() {
            console.log('Voltando para o dashboard.');
            window.location.href = 'dashboard.html';
        });
    }

});