AFRAME.registerComponent('canvas-video-texture', {
  schema: {
    src: { type: 'string' } // Propiedad para la URL del video
  },

  init: function () {
    this.video = document.createElement('video');
    this.video.src = this.data.src; // Establecer la fuente del video
    this.video.crossOrigin = 'anonymous'; // Permitir CORS
    this.video.muted = true; // Para que se reproduzca automáticamente en algunos navegadores
    this.video.loop = true; // Repetir el video

    // Crear un canvas para la textura
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');

    // Inicializa la textura de la caja
    const material = new THREE.MeshBasicMaterial({ map: new THREE.Texture(this.canvas) });
    this.el.getObject3D('mesh').material = material;

    this.video.addEventListener('loadeddata', () => {
      this.updateTexture(); // Asegúrate de que se actualice la textura al cargar los datos del video
    });

    this.video.addEventListener('play', () => {
      this.updateTexture();
    });
  },

  updateTexture: function () {
    if (this.video.paused || this.video.ended) return;
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;

    this.context.drawImage(this.video, 0, 0);
    this.el.getObject3D('mesh').material.map.needsUpdate = true;

    requestAnimationFrame(this.updateTexture.bind(this));
  },

  play: function () {
    this.video.play(); // Reproduce el video cuando se inicia el componente
  },

  pause: function () {
    this.video.pause(); // Pausa el video si se pausa el componente
  }
});
