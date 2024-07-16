// Importar módulos necesarios
const express = require('express');
const morgan = require('morgan');
const fetch = require('node-fetch');
const { getColorFromURL } = require('color-thief-node');

// Crear una instancia del servidor Express
const app = express();

// Middleware para procesar peticiones de tipo POST
app.use(express.urlencoded({ extended: true }));

// Middleware para servir archivos estáticos desde la carpeta 'public'
app.use(express.static('public'));

// Configuración del puerto
const PORT = process.env.PORT || 3030;

// Base de datos de imágenes
const images = [];

// Especificar a Express que queremos usar EJS como motor de plantillas
app.set('view engine', 'ejs');

// Middleware morgan para loguear las peticiones del cliente
app.use(morgan('tiny'));

// Ruta para manejar peticiones GET a la raíz ('/')
app.get('/', (req, res) => {
    // Renderizar la plantilla home.ejs y pasarle la variable 'images'
    res.render('home', { images });
});

// Endpoint para manejar la búsqueda
app.get('/search', (req, res) => {
    const keyword = req.query.keyword.toLowerCase();
    const filteredImages = images.filter(image => image.keywords.includes(keyword));
    res.render('home', { images: filteredImages });
});

// Ruta para manejar peticiones GET a '/add-image-form'
app.get('/add-image-form', (req, res) => {
    res.render('form', {
        isImagePosted: undefined,
        isImageRepeat: undefined,
    });
});

// Función para obtener el color dominante
async function getDominantColor(url) {
    const [r, g, b] = await getColorFromURL(url);
    return `rgb(${r}, ${g}, ${b})`;
}

// Ruta para manejar peticiones POST a '/add-image-form'
app.post('/add-image-form', async (req, res) => {
    const { title, url, date, keywords } = req.body;

    // Validación del lado servidor
    if (!title || title.length > 30) {
        return res.status(400).send('Algo ha salido mal...');
    }

    const isUrlInArray = images.some(image => image.url === url);

    if (isUrlInArray) {
        return res.render('form', {
            isImageRepeat: true,
            isImagePosted: false
        });
    }

    try {
        // Verificar que la URL de la imagen es accesible
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Unable to fetch image');
        }

        // const dominantColor = await getDominantColor(url);
        // images.push({
        //     title,
        //     url,
        //     date: new Date(date),
        //     dominantColor,
        //     keywords: keywords.toLowerCase().split(',').map(k => k.trim())
        // });

        // Ordenar las fotos de más nueva a más vieja
        images.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.render('form', {
            isImagePosted: true,
            isImageRepeat: false
        });
    } catch (error) {
        console.error('Error al obtener el color dominante:', error);
        res.status(500).send('Error al procesar la imagen.');
    }

    console.log('Array de imágenes actualizado: ', images);
});

// Ruta para manejar peticiones GET a '/show-images'
app.get('/show-images', (req, res) => {
    const sortedImages = [...images].sort((a, b) => b.date - a.date);
    res.render('home', { images: sortedImages });
});

// Iniciar el servidor en el puerto configurado
app.listen(PORT, () => {
    console.log(`Servidor escuchando correctamente en el puerto ${PORT}.`);
});
