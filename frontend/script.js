const fileInput = document.getElementById('imageUpload');
const compressBtn = document.getElementById('compressBtn');
const originalImage = document.getElementById('originalImage');
const compressedImage = document.getElementById('compressedImage');
const downloadLink = document.getElementById('downloadLink');

compressBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) {
        alert('Please upload an image first.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    // Show original image
    originalImage.src = URL.createObjectURL(file);
    originalImage.style.display = 'block';
    // Send image to backend for compression
    const response = await fetch('http://localhost:3031/compress', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        alert('Compression failed. Please try again.');
        return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    console.log("Sss", url);
    // Show compressed image
    compressedImage.src = url;
    compressedImage.style.display = 'block';

    // Enable download link
    downloadLink.href = url;
    downloadLink.download = `compressed_${file.name}`;
    downloadLink.style.display = 'block';
});
