let localStream = null;

window.startCall = async (type) => {
  const modal = document.getElementById('callModal');
  try {
    // Request Camera & Audio Permission
    localStream = await navigator.mediaDevices.getUserMedia({
      video: type === 'video',
      audio: true
    });
    
    document.getElementById('localVideo').srcObject = localStream;
    modal.classList.remove('hidden');
  } catch (err) {
    alert("Camera/Microphone permission denied or not found!");
  }
};

document.getElementById('endCallBtn').addEventListener('click', () => {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
  document.getElementById('callModal').classList.add('hidden');
});