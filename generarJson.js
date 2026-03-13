const fs = require('fs');
const path = require('path');

const carpetaImagenes = './img'; // Ajusta la ruta a tu carpeta de fotos
const archivoSalida = './productos.json';

// 1. Leer los archivos de la carpeta
fs.readdir(carpetaImagenes, (err, archivos) => {
    if (err) return console.error("No se pudo leer la carpeta:", err);

    // 2. Filtrar solo imágenes y crear la estructura
    const productos = archivos
        .filter(archivo => /\.(png|jpg|jpeg|webp)$/i.test(archivo))
        .map((archivo, indice) => {
            return {
                id: indice + 1,
                nombre: `Producto ${archivo.split('.')[0]}`, // Nombre temporal basado en el archivo
                imagenes: [`img/${archivo}`],
                etiquetas: ["repostería", "nuevo"],
                descripcion: "Descripción pendiente de editar."
            };
        });

    // 3. Guardar el archivo JSON
    fs.writeFileSync(archivoSalida, JSON.stringify(productos, null, 2));
    console.log(`¡Listo! Se ha generado ${archivoSalida} con ${productos.length} productos.`);
});