document.addEventListener('DOMContentLoaded', () => {
    const role = prompt("Selecciona tu rol: 'transmitter' (transmisor) o 'receiver' (receptor)");
  
    if (role === 'transmitter' || role === 'receiver') {
      const cameraBox = document.querySelector('#camera-box');
  
      // Si es transmisor, aplica ambos componentes (cámara y peer-connection)
      if (role === 'transmitter') {
        cameraBox.setAttribute('camera-component', '');
        cameraBox.setAttribute('peer-connection', 'role: transmitter');
      } else {
        // Si es receptor, solo aplica el componente de conexión y pide el Peer ID
        const peerID = prompt("Introduce el ID del transmisor para conectarte:");
        cameraBox.setAttribute('peer-connection', `role: receiver; peerId: ${peerID}`);
      }
    } else {
      console.warn("Rol no válido, no se aplicará ningún componente.");
    }
  });
  