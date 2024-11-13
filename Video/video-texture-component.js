AFRAME.registerComponent('video-canvas-texture', {
  schema: {
    frameRate: { type: 'number', default: 30 }  // Frames por segundo
  },

  init: function () {
    // Crear dinámicamente el elemento de video
    this.videoElement = document.createElement('video');
    this.videoElement.src = "video.mp4";  // Ruta del archivo de video
    this.videoElement.autoplay = false;  // No reproducir automáticamente al cargar la página
    this.videoElement.playsInline = true;  // Reproducción en línea
    this.videoElement.muted = true;  // Mutear inicialmente para permitir la reproducción automática
    this.videoElement.loop = true;  // Repetir el video continuamente

    console.log("Elemento de video creado dinámicamente:", this.videoElement);

    // Crear un canvas para dibujar el contenido del video con la opción `willReadFrequently`
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d', { willReadFrequently: true });
    console.log("Canvas creado con contexto 2D:", this.canvas, this.context);

    // Crear una textura a partir del canvas y asignarla al material de la caja
    this.texture = new THREE.Texture(this.canvas);
    const mesh = this.el.getObject3D('mesh');
    if (mesh) {
      mesh.material.map = this.texture;
      console.log("Textura creada y asignada al material del objeto 3D.");
    } else {
      console.error('No se encontró el mesh del elemento al cual aplicar la textura.');
      return;
    }

    // Agregar listener para el botón de inicio
    document.getElementById('play-button').addEventListener('click', () => {
      this.videoElement.muted = false;  // Desmutear el video para escuchar el audio
      this.videoElement.play().then(() => {
        console.log("Video reproduciéndose con audio.");
        // Configurar el tamaño del canvas basado en el tamaño del video
        this.canvas.width = this.videoElement.videoWidth;
        this.canvas.height = this.videoElement.videoHeight;

        // Comenzar a actualizar el canvas continuamente para mostrar el video
        this.updateCanvas();
      }).catch((error) => {
        console.error("Error al reproducir el video:", error);
      });
    });
  },

  updateCanvas: function () {
    // Verificar si el video tiene suficientes datos para ser dibujado
    if (this.videoElement.readyState >= this.videoElement.HAVE_ENOUGH_DATA) {
      console.log("Dibujando el video en el canvas.");

      // Dibujar el frame del video en el canvas
      this.context.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);

      // Obtener los datos de la imagen y procesar los píxeles sin alterar el color
      const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const data = imageData.data;

      // Procesar los píxeles "pixel a pixel" sin modificar el color
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];     // Rojo
        const g = data[i + 1]; // Verde
        const b = data[i + 2]; // Azul
        const a = data[i + 3]; // Alfa

        // Mantener los valores sin alterarlos
        data[i] = r;     // Rojo (sin cambios)
        data[i + 1] = g; // Verde (sin cambios)
        data[i + 2] = b; // Azul (sin cambios)
        data[i + 3] = a; // Alfa (sin cambios)
      }

      // Dibujar la imagen sin cambios en el canvas
      this.context.putImageData(imageData, 0, 0);

      // Marcar la textura para actualizarla
      this.texture.needsUpdate = true;
      console.log("Textura actualizada con los datos del canvas.");
    } else {
      console.warn("El video aún no tiene suficientes datos para ser dibujado.");
    }

    // Continuar actualizando el canvas en el siguiente frame
    requestAnimationFrame(this.updateCanvas.bind(this));
  }
});
