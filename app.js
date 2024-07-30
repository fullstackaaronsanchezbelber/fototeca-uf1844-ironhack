// importar módulos de terceros
const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const { getColorFromURL } = require('color-thief-node');

// creamos una instancia del servidor Express
const app = express();

// Middleware para procesar peticiones de tipo POST
app.use(express.urlencoded({ extended: true }));

// Middleware para servir recursos públicos de la carpeta 'public'
app.use(express.static('public'));

// Variable global para gestionar el siguiente ID de las imágenes
let id = 5;

// Puerto en el que escucha la aplicación
const PORT = process.env.PORT || 4000;

// Ruta del archivo de base de datos JSON
const dbFilePath = path.join(__dirname, 'db.json');

// Base de datos de imágenes inicializada como un array vacío
let images = [];

// Leer los datos del archivo JSON si existe
if (fs.existsSync(dbFilePath)) {
    const data = fs.readFileSync(dbFilePath, 'utf-8');
    images = JSON.parse(data);
}

// Especificar a Express que quiero usar EJS como motor de plantillas
app.set('view engine', 'ejs');

// Usamos el middleware morgan para loguear las peticiones del cliente
app.use(morgan('tiny'));

// Función para guardar los datos en el archivo JSON
function saveDataToFile() {
    fs.writeFileSync(dbFilePath, JSON.stringify(images, null, 2), (err) => {
        if (err) {
            console.error('Error al guardar los datos en el archivo:', err);
        }
    });
}

// Petición GET a '/' para renderizar la vista home.ejs
app.get('/', (req, res) => {
    res.render('home', {
        images
    });
});

// Función para comprobar si una cadena está contenida en otra (sin distinguir mayúsculas/minúsculas)
function isSubstring(s1, s2) {
    const regexp = new RegExp(s2, "i");
    return regexp.test(s1);
}

// Endpoint para gestionar la búsqueda
app.get('/search', (req, res) => {
    const keyword = req.query.keyword;
    const filteredImages = images.filter((i) => isSubstring(i.title, keyword));
    res.render('home', {
        images: filteredImages
    });
});

// Petición GET a '/add-image-form' para renderizar el formulario de adición de imágenes
app.get('/add-image-form', (req, res) => {
    res.render('form', {
        isImagePosted: undefined,
        imageRepeated: undefined
    });
});

// Petición POST a '/add-image-form' para añadir una nueva imagen
app.post('/add-image-form', async (req, res, next) => {
    let dominantColor;
    let isRepeated;
    const { title, url } = req.body;

    try {
        console.log(req.body);

        // Validación del título de la imagen
        const regexp = /^[0-9A-Z\s_]+$/i;
        if (title.length > 30 || !regexp.test(title)) {
            return res.status(400).send('Algo ha salido mal...');
        }

        // Comprobar si la URL está repetida
        isRepeated = images.some(i => i.url.toLocaleLowerCase() === url.toLocaleLowerCase());
        if (isRepeated) {
            return res.render('form', {
                isImagePosted: false,
                imageRepeated: url
            });
        }

        // Extraer el color predominante
        dominantColor = await getColorFromURL(url);
    } catch (err) {
        console.error('Ha ocurrido un error:', err);
        if (err.message.includes('Unsupported image type')) {
            return res.send('No hemos podido obtener el color predominante de la imagen. Por favor, prueba otra URL diferente.');
        }
        return next(err);
    }

    // Añadir la nueva imagen al array
    images.push({
        id: id++,
        title,
        url,
        dominantColor
    });

    // Guardar los datos en el archivo JSON
    saveDataToFile();

    // Redirigir al formulario con éxito
    res.render('form', {
        isImagePosted: true,
        imageRepeated: undefined
    });
});

// Endpoint para borrar una imagen
app.post('/images/:id/delete', (req, res) => {
    const { id } = req.params;
    images = images.filter(i => i.id !== parseInt(id));

    // Guardar los datos en el archivo JSON
    saveDataToFile();

    res.redirect('/');
});

// Middleware para gestionar errores imprevistos
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('<p>Ups! La operación ha fallado. Hemos informado a los desarrolladores. Vuelve a probarlo más tarde. Vuelve a la <a href="/">home page</a></p>');
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log("Servidor escuchando correctamente en el puerto " + PORT);
});
