AFRAME.registerComponent('camera-canvas-texture', {
  schema: {
    frameRate: { type: 'number', default: 30 }  // Frames por segundo
  },

  init: function () {
    // Crear dinámicamente el elemento de video para la cámara
    this.videoElement = document.createElement('video');
    this.videoElement.autoplay = true;
    this.videoElement.playsInline = true;  // Reproducción en línea (necesario para dispositivos móviles)
    this.videoElement.muted = true;  // Silenciar el video para evitar problemas de reproducción automática
    this.videoElement.loop = true;  // Repetir el video

    console.log("Elemento de video creado dinámicamente para la cámara:", this.videoElement);

    // Crear un canvas para dibujar el contenido del video con la opción `willReadFrequently`
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

    // Obtener el stream de la cámara del dispositivo
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then((stream) => {
        this.videoElement.srcObject = stream;

        this.videoElement.addEventListener('loadeddata', () => {
          if (this.videoElement.readyState >= this.videoElement.HAVE_CURRENT_DATA) {
            console.log("Stream de cámara listo. Configurando el canvas.");
            this.canvas.width = this.videoElement.videoWidth;
            this.canvas.height = this.videoElement.videoHeight;

            this.videoElement.play().then(() => {
              console.log("Video de la cámara reproduciéndose automáticamente.");
            }).catch((error) => {
              console.error("Error al intentar reproducir el video:", error);
            });
          }
        });
      })
      .catch((error) => {
        console.error('Error al acceder a la cámara:', error);
      });
  },

  tick: function () {
    // Actualizar el canvas solo si el video de la cámara está listo y reproduciendo
    if (this.videoElement.readyState >= this.videoElement.HAVE_ENOUGH_DATA) {
      console.log("Dibujando el video de la cámara en el canvas.");

      // Dibujar el frame del video en el canvas
      this.context.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);

      // Obtener los datos de la imagen para procesar los píxeles "pixel a pixel"
      const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const data = imageData.data;

      // Procesar cada píxel: En este caso, simplemente dejamos los píxeles sin modificar
      // Si deseas modificar los colores, puedes agregar la lógica aquí
      for (let i = 0; i < data.length; i += 4) {
        // R, G, B, A ya tienen los valores originales del video
        // En este ejemplo, no se hace ningún cambio, manteniendo el color original
      }

      // Devolver la imagen procesada al canvas sin modificaciones
      this.context.putImageData(imageData, 0, 0);

      // Marcar la textura para actualizarla
      this.texture.needsUpdate = true;
      console.log("Textura actualizada con los datos del canvas.");
    } else {
      console.warn("El video aún no tiene suficientes datos para ser dibujado.");
    }
  }
});
