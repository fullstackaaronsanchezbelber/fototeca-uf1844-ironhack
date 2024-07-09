// Importar módulos necesarios
const express = require('express');
const morgan = require('morgan');
// const imgColor = require('img-color');

// Crear una instancia del servidor Express
const app = express();

// Middleware para procesar peticiones de tipo POST
app.use(express.urlencoded({ extended: true }));

// Middleware para servir archivos estáticos desde la carpeta 'public'
app.use(express.static('public'));

// Base de datos de imágenes
const images = [];

// Especificar a Express que queremos usar EJS como motor de plantillas
app.set('view engine', 'ejs');

// Middleware morgan para loguear las peticiones del cliente
app.use(morgan('tiny'));

// Ruta para manejar peticiones GET a la raíz ('/')
app.get('/', (req, res) => {
    // Renderizar la plantilla home.ejs y pasarle la variable 'images'
    res.render('home', {
        images
    });
});

// Ruta para manejar peticiones GET a '/add-image-form'
app.get('/add-image-form', (req, res) => {
    // Renderizar la plantilla form.ejs y pasarle la variable 'isImagePosted' como undefined
    res.render('form', {
        isImagePosted: undefined
    });
});

// Ruta para manejar peticiones POST a '/add-image-form'
app.post('/add-image-form', (req, res) => {
    // Los datos del formulario se encuentran en req.body
    console.log(req.body);

    // Desestructurar los campos 'title', 'url' y 'date' de req.body
    const { title, url, date } = req.body;

    // Validación del lado servidor para comprobar que se ha enviado un título
    if (!title || title.length > 30) {
        return res.status(400).send('Algo ha salido mal...');
    }

    // Añadir la nueva imagen al array 'images'
    images.push({
        title,
        url,
        date: new Date(date) // Convertir la fecha a un objeto Date
    });

    console.log('Array de imágenes actualizado: ', images);

    // Renderizar la plantilla form.ejs y pasarle la variable 'isImagePosted' como true
    res.render('form', {
        isImagePosted: true
    });
});

// Ruta para manejar peticiones GET a '/show-images'
app.get('/show-images', async (req, res) => {
    // Ordenar las imágenes por fecha de forma descendente (de más reciente a más antigua)
    const sortedImages = images.sort((a, b) => b.date - a.date);

    // // Para cada imagen, obtener el color predominante y agregarlo al objeto de la imagen
    // for (const image of sortedImages) {
    //     try {
    //         const colors = await imgColor.fromURL(image.url);
    //         // Obtener el color predominante y su representación en hexadecimal
    //         const predominantColor = colors[0].hex;
    //         image.predominantColor = predominantColor;
    //     } catch (error) {
    //         console.error(`Error al obtener el color predominante para ${image.url}:`, error);
    //     }
    // }

    // Renderizar la plantilla gallery.ejs y pasarle las imágenes ordenadas
    res.render('home', {
        images: sortedImages
    });
});

// Endpoint adicional para futuras implementaciones
// app.get('/edit-image-form')

// Iniciar el servidor en el puerto 3000
app.listen(3000, (req, res) => {
    console.log("Servidor escuchando correctamente en el puerto 3000.");
});
