AFRAME.registerComponent('video-canvas-texture', {
  schema: {
    frameRate: { type: 'number', default: 30 }  // Frames por segundo
  },

  init: function () {
    // Obtener el elemento de video
    this.videoElement = document.getElementById('local-video');
    console.log("Elemento de video obtenido:", this.videoElement);

    // Crear un canvas para dibujar el contenido del video
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
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
      this.videoElement.muted = false;  // Asegurarse de que no esté silenciado
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

      // Marcar la textura para actualizarla
      this.texture.needsUpdate = true;
    }

    // Continuar actualizando el canvas en el siguiente frame
    requestAnimationFrame(this.updateCanvas.bind(this));
  }
});
