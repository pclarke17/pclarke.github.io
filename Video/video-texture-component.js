AFRAME.registerComponent('video-canvas-texture', {
  schema: {
    frameRate: { type: 'number', default: 30 }  // Frames por segundo
  },

  init: function () {
    // Crear el elemento de video
    this.videoElement = document.createElement('video');
    this.videoElement.src = "video.mp4";  // Establecer la ruta del video directamente aquí
    this.videoElement.crossOrigin = 'anonymous';  // Permitir CORS para videos alojados en otras fuentes
    this.videoElement.autoplay = true;  // Intentar reproducir automáticamente
    this.videoElement.playsInline = true;  // Reproducción en línea
    this.videoElement.muted = false;  
    this.videoElement.loop = true;  // Repetir el video continuamente

    console.log("Elemento de video creado dinámicamente:", this.videoElement);

    // Crear un canvas para dibujar el contenido del video
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d', { willReadFrequently: true }); //willReadFrequently: optimización de operación repetitiva de lectura del canvas
    console.log("Canvas creado con contexto 2D:", this.canvas, this.context);

    // Crear una textura a partir del canvas y asignarla al material del objeto 3D
    this.texture = new THREE.Texture(this.canvas);
    const mesh = this.el.getObject3D('mesh');
    if (mesh) {
      mesh.material.map = this.texture;
      console.log("Textura creada y asignada al material del objeto 3D.");
    } else {
      console.error('No se encontró el mesh del elemento al cual aplicar la textura.');
      return;
    }

    // Esperar a que el video esté listo para reproducir
    this.videoElement.addEventListener('loadeddata', () => {
      if (this.videoElement.readyState >= this.videoElement.HAVE_CURRENT_DATA) {
        console.log("Datos del video cargados. Configurando el canvas.");
        this.canvas.width = this.videoElement.videoWidth;
        this.canvas.height = this.videoElement.videoHeight;

        this.videoElement.play().then(() => {
          console.log("Video reproduciéndose automáticamente.");
        }).catch((error) => {
          console.error("Error al intentar reproducir el video automáticamente:", error);
        });
      }
    });

    // Agregar un listener para manejar errores en la carga del video
    this.videoElement.addEventListener('error', (e) => {
      console.error('Error al cargar el video:', e);
    });
  },

  tick: function () {
    // Actualizar el canvas solo si el video está listo y reproduciendo
    if (this.videoElement.readyState >= this.videoElement.HAVE_ENOUGH_DATA) {
      console.log("Dibujando el video en el canvas.");

      // Dibujar el frame del video en el canvas
      this.context.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);

      // Obtener los datos de la imagen y procesar los píxeles "pixel a pixel"
      const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const data = imageData.data;

      // Procesar cada pixel: Aquí puedes modificar los valores RGBA
      for (let i = 0; i < data.length; i += 4) {
        // Accede a cada canal (R, G, B, A)
        const r = data[i];     // Rojo
        const g = data[i + 1]; // Verde
        const b = data[i + 2]; // Azul
        const a = data[i + 3]; // Alfa

         // No hacemos ningún cambio para mantener los colores originales
         data[i] = r;     // Rojo (sin cambios)
         data[i + 1] = g; // Verde (sin cambios)
         data[i + 2] = b; // Azul (sin cambios)
         data[i + 3] = a; // Alfa (sin cambios)
       }
      // Devolver la imagen procesada al canvas
      this.context.putImageData(imageData, 0, 0);

      // Marcar la textura para actualizarla
      this.texture.needsUpdate = true;
      console.log("Textura actualizada con los datos del canvas.");
    } else {
      console.warn("El video aún no tiene suficientes datos para ser dibujado.");
    }
  }
});
