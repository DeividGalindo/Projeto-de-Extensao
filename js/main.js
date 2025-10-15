document.addEventListener('DOMContentLoaded', function() {   
    

    const loginForm = document.querySelector('.login-box form');

    if (loginForm) {

        loginForm.addEventListener('submit', function(event) {
            
            event.preventDefault();

            console.log('Login simulado com sucesso!');

            window.location.href = 'dashboard.html';
            
        });
    }

});