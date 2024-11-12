AFRAME.registerComponent('video-canvas-texture', {
  schema: {
    frameRate: { type: 'number', default: 30 }  // Frames por segundo
  },

  init: function () {
    // Obtener el elemento de video
    this.videoElement = document.getElementById('local-video');

    // Verificar si el video se obtuvo correctamente
    if (!this.videoElement) {
      console.error('No se encontró el elemento de video con el ID especificado.');
      return;
    }

    // Crear un canvas para dibujar el contenido del video
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');

    // Crear una textura a partir del canvas y asignarla al material de la caja
    this.texture = new THREE.Texture(this.canvas);
    const mesh = this.el.getObject3D('mesh');
    if (mesh) {
      mesh.material.map = this.texture;
    } else {
      console.error('No se encontró el mesh del elemento al cual aplicar la textura.');
      return;
    }

    // Obtener acceso a la cámara del ordenador (si es necesario) o cargar el video
    this.videoElement.addEventListener('loadeddata', () => {
      if (this.videoElement.readyState >= this.videoElement.HAVE_CURRENT_DATA) {
        // Configurar el tamaño del canvas basado en el tamaño del video
        this.canvas.width = this.videoElement.videoWidth;
        this.canvas.height = this.videoElement.videoHeight;

        // Comenzar a actualizar el canvas continuamente para mostrar el video
        this.updateCanvas();
      } else {
        console.error('El video no está listo para ser procesado.');
      }
    });

    // Agregar un listener para manejar errores de carga de video
    this.videoElement.addEventListener('error', (e) => {
      console.error('Error al cargar el video:', e);
    });
  },

  updateCanvas: function () {
    // Verificar si el video tiene suficientes datos para ser dibujado
    if (this.videoElement.readyState >= this.videoElement.HAVE_ENOUGH_DATA) {
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
    }

    // Continuar actualizando el canvas en el siguiente frame
    requestAnimationFrame(this.updateCanvas.bind(this));
  }
});
