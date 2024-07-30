// importar módulos de terceros
const express = require('express');
const morgan = require('morgan');
const { getColorFromURL } = require('color-thief-node');
const fs = require('node:fs');



// creamos una instancia del servidor Express
const app = express();

// Tenemos que usar un nuevo middleware para indicar a Express que queremos procesar peticiones de tipo POST
app.use(express.urlencoded({ extended: true }));

// Añadimos el middleware necesario para que el client puedo hacer peticiones GET a los recursos públicos de la carpeta 'public'
app.use(express.static('public'));

// Forma más simple. Variable global para saber cual es el siguiente Id que nos tocan
let id = 5;

// Varible para indicar en que puerto tiene que escuchar nuestra app
// process.env.PORT en render.com
// 3000 lo quiero usar para desarrollo local 
console.log("valor del PORT: ", process.env.PORT)
const PORT = process.env.PORT || 4000;



// Base de datos de imágenes
let images = [];
// Especificar a Express que quiero usar EJS como motor de plantillas
app.set('view engine', 'ejs');

// Usamos el middleware morgan para loguear las peticiones del cliente
app.use(morgan('tiny'));

// Cuando nos hagan una petición GET a '/' renderizamos la home.ejs
app.get('/', (req, res) => {
    // 2. Usar en el home.ejs el forEach para iterar por todas las imágenes de la variable 'images'. Mostrar de momento solo el título 
    res.render('home', {
        images
    });
});

/**
 * 
 * @param {string} s1 String principal. Cadena de texto donde vamos a realizar la búsqueda 
 * @param {string} s2 String secundario.  
 * @returns string Retorna true si s2 está contenido en s1. En caso contrario retorna false
 */
function isSubstring(s1, s2) {
    const regexp = new RegExp(s2, "i");

    // Busco en el string s1 si contiene el string s2
    const result = regexp.test(s1);
}

// Creamos un nuevo endpoint para gestionar la búsqueda 
app.get('/search', (req, res) => {
    // Vamos a recibir algo con esta estructura http://localhost:3000/search?keyword=cat

    // 1. Coger el  valor del parámetro keyword de la query string (cat)
    const keyword = req.query.keyword;

    // 2. Usar el método filter para filtrar el array de images por el valor de (cat)
    const filteredImages = images.filter((i) => isSubstring(i.title, keyword)); // TODO

    // Tema mayúsuclas-minúsuclas: dos opciones
    // 1. Pasarlo todo a mínusculas con toLowerCase
    // 2. Usar una expresión regular

    // 3. Usar res.render para renderizar la vista home.ejs y pasarle el array de imágenes filtrado
    res.render('home', {
        images: filteredImages
    })

});

// Cuando nos hagan una petición GET a '/add-image-form' renderizamos 
app.get('/add-image-form', (req, res) => {
    res.render('form', {
        isImagePosted: undefined,
        imageRepeated: undefined

    });
});



// Cuando nos hagan una petición POST a '/add-image-form' tenemos que recibir los datos del formulario y actualizar nuestra "base de datos"
app.post('/add-image-form', async (req, res, next) => {
    // todos los datos vienen en req.body
    let dominantColor;
    let isRepeated;
    const { title, url } = req.body;

    try {

        console.log(req.body);

        // 1. Actualizar el array 'images' con la información de req.body

        // Validación del lado servidor de que realmente nos han enviado un títilo
        // Expresión para validar el formato del title de la imagen
        const regexp = /^[0-9A-Z\s_]+$/i;

        /** Programación defensiva: no dar por supuesto nada de lo que te envia un cliente o de cómo usan tus funcionalidades */
        if (title.length > 30 || !regexp.test(title)) {
            return res.status(400).send('Algo ha salido mal...');
        }

        /** Comprobar si la URL está repetida */
        isRepeated = images.some(i => i.url.toLocaleLowerCase() == url.toLocaleLowerCase());
        console.log("🚀 ~ file: app.js:123 ~ app.post ~ isRepeated:", isRepeated)

        // Extraer el color predominante
        dominantColor = await getColorFromURL(url);
    } catch (err) {
        console.log('Ha ocurrido un error: ', err);
        // Si ha fallado la app porque la biblioteca de terceros no ha podido extraer el color predominante informar de manera específica al usuario
        if (err.message.includes('Unsupported image type')) {
            return res.send(`No hemos podido obtener el color predominante de la imagen . Por favor, prueba otra URL diferente`);
        }
        // Redirigimos la respuesta que le damos al cliente a nuestro manejador de errores
        return next(err);
    }


    // opción 1: totalmente válida
    //images.push(req.body); // [{title: 'Gato'}]

    // Calcular color predominante


    console.log('array de imagenes actualizado: ', images);

    // 3. Añadir los otros campos del formulario y sus validaciones

    // 4julio: Tras insertar una imagen 'dejaremos' el formulario visible 
    //res.send('Datos recibidos');
    // Redirect es un método del objecto Response que permite 'redirigir' al cliente a un nuevo endpoint o 

    // TODO: SORT : Usar el sort de manera adecuada para ordenar las fotografías por fecha antes de responder al cliente


    if (isRepeated) {

        res.render('form', {
            isImagePosted: false,
            imageRepeated: url
        });

    } else {
        // otra opción, 'sacar' los campos
        images.push({
            id: id++,
            title,
            url,
            dominantColor
        });

        // Escribir nuestro fichero JSON para hacer persistentes los datos
        try {
            fs.writeFileSync('images.json', JSON.stringify(images));
            // file written successfully
        } catch (err) {
            console.error('Error al escribir en el fichero');
            return res.status(500).send('No hemos podido guardar la imagen. Prueba más tarde');
        }


        res.render('form', {
            isImagePosted: true,
            imageRepeated: undefined
        });

    }



});

// endpoint para borrar la imagen
app.post('/images/:id/delete', (req, res) => {
    // 1. ¿Cómo vamos a obtener la url de la imagen que quiere borrar el cliente? req.params.id
    console.log('req params: ', req.params);

    // 2. images? Usar el método filter para eliminar la imagen que me pasan por req.params.id

    // Opción 1: 3. Sobreescribir el array images con el resultado del método filter
    images = images.filter(() => true); //TODO 

    // Opctión 2: Usar el método de array splice para eliminar el elemento del array images. Antes teneis que identificar el índice donde se encuentra la imagen que queremos borrar

    // 3. Volvemos a hacer un render
    res.redirect('/')

});

// en el futuro es normal que tengamos endpoints como
app.get('/edit-image-form')

/** Uso de middleware para gestionar cualquier error imprevisto de nuestra aplicaicón y fallar de forma grácil */
app.use((err, req, res, next) => {
    // err.message -> simplemente el mensaje
    // err.stack -> la pila de llamadas
    console.error(err)
    // Enviar un correo electronico o cualquier otro medio a los desarrolladores para que se den cuenta de que algo ha 'petao'
    res.status(500).send('<p>Ups! La operación ha fallado. Hemos informado a los desarrolladores. Vuelve a probarlo más tarde.Vuelve a la <a href="/">home page</a></p> ');
})



app.listen(PORT, (req, res) => {
    console.log("Servidor escuchando correctamente en el puerto " + PORT);
});

// Cuando se ha levantado el servidor cargamos la 'base de datos'

try {
    // actualizar la variable global con las imagenes del ficherp
    imagen=fs.readFileSync('./images.json', 'utf-8')

} catch (err) {
    console.error('No hemos podido cargar la base de datos')

}