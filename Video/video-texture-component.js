AFRAME.registerComponent('video-canvas-texture', {
  schema: {
    frameRate: { type: 'number', default: 30 }  // Frames por segundo
  },

  init: function () {
    // Crear el elemento de video
    this.videoElement = document.createElement('video');
    this.videoElement.src = "video.mp4";  // Establecer la ruta del video directamente aquí
    this.videoElement.crossOrigin = 'anonymous';  // Permitir CORS para videos alojados en otras fuentes
    this.videoElement.playsInline = true;  // Reproducción en línea
    this.videoElement.muted = false;  // Se requiere interacción para reproducir si está en sonido
    this.videoElement.loop = true;  // Repetir el video continuamente

    console.log("Elemento de video creado dinámicamente:", this.videoElement);

    // Crear un canvas para dibujar el contenido del video
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d', { willReadFrequently: true });
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

    // Añadir la función para iniciar la reproducción del video después de la interacción del usuario
    this.startVideo = () => {
      this.videoElement.play().then(() => {
        console.log("Video reproduciéndose automáticamente.");
        this.canvas.width = this.videoElement.videoWidth;
        this.canvas.height = this.videoElement.videoHeight;
      }).catch((error) => {
        console.error("Error al intentar reproducir el video automáticamente:", error);
      });
    };

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

      // Procesar cada pixel: mantener los valores sin modificar
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];     // Rojo
        const g = data[i + 1]; // Verde
        const b = data[i + 2]; // Azul
        const a = data[i + 3]; // Alfa

        // Mantener los valores originales
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = a;
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
