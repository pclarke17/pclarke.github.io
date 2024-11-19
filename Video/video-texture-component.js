AFRAME.registerComponent('video-canvas-texture', {
  schema: {
    frameRate: { type: 'number', default: 30 }  // Frames por segundo
  },

  init: function () {
    // Crear el elemento de video
    this.videoElement = document.createElement('video');
    this.videoElement.src = "video.mp4";  // Establecer la ruta del video directamente aquí
    this.videoElement.crossOrigin = 'anonymous';  // Permitir CORS para videos alojados en otras fuentes
    this.videoElement.playsInline = true;  // Reproducción en línea (necesario para dispositivos móviles)
    this.videoElement.muted = false;  // Puede requerir interacción para reproducir si está activado el sonido
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

        // Comenzar a actualizar el canvas en cada frame
        this.updateCanvas();
      }).catch((error) => {
        console.error("Error al intentar reproducir el video automáticamente:", error);
      });
    };

    // Agregar un listener para manejar errores en la carga del video
    this.videoElement.addEventListener('error', (e) => {
      console.error('Error al cargar el video:', e);
    });
  },

  updateCanvas: function () {
    // Usar `requestAnimationFrame` para actualizar el canvas constantemente
    if (this.videoElement.readyState >= this.videoElement.HAVE_ENOUGH_DATA) {
      // Dibujar el frame del video en el canvas
      this.context.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);
      
      // Marcar la textura para actualizarla
      this.texture.needsUpdate = true;
      console.log("Textura actualizada con los datos del canvas.");
    } else {
      console.warn("El video aún no tiene suficientes datos para ser dibujado.");
    }

    // Llamar de nuevo para actualizar el próximo frame
    requestAnimationFrame(this.updateCanvas.bind(this));
  }
});
