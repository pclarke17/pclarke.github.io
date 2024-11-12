AFRAME.registerComponent('video-canvas-texture', {
  schema: {
    frameRate: { type: 'number', default: 30 }  // Frames por segundo
  },

  init: function () {
    // Obtener el elemento de video
    this.videoElement = document.getElementById('local-video');

    // Crear un canvas para dibujar el contenido del video
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');

    // Crear una textura a partir del canvas
    this.texture = new THREE.Texture(this.canvas);
    this.el.getObject3D('mesh').material.map = this.texture;

    // Configurar el canvas cuando el video se haya cargado
    this.videoElement.addEventListener('loadeddata', () => {
      // Configurar el tamaño del canvas basado en el tamaño del video
      this.canvas.width = this.videoElement.videoWidth;
      this.canvas.height = this.videoElement.videoHeight;

      // Comenzar a actualizar el canvas continuamente para mostrar el video
      this.updateCanvas();  
    });
  },

  updateCanvas: function () {
    // Dibujar el video en el canvas y acceder pixel a pixel
    if (this.videoElement.readyState === this.videoElement.HAVE_ENOUGH_DATA) {
      // Dibujar el frame del video en el canvas
      this.context.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);

      // Obtener los datos de la imagen
      const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const data = imageData.data;

      // Procesar los píxeles "pixel a pixel" sin modificar el color
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];     // Rojo
        const g = data[i + 1]; // Verde
        const b = data[i + 2]; // Azul
        const a = data[i + 3]; // Alfa

        // Aquí podrías realizar cualquier operación sobre r, g, b, a si fuera necesario.
        // Pero en este caso, mantenemos los valores sin alterarlos.
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
