// Seleccionar el elemento con el id 'message'
const message = document.querySelector('#message');

// Verificar si el elemento 'message' existe
if (message) {
    // Agregar un evento de clic al elemento 'message'
    message.addEventListener('click', (event) => {
        // Cambiar el estilo de display del elemento clickeado para ocultarlo
        event.target.style.display = 'none';
    });
}
