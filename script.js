
const canvas = new fabric.Canvas('canvas');
const stateHistory = [];
let currentStateIndex = -1;



function addText(text) {
    const textBox = new fabric.Textbox(text, {
        left: 50,
        top: 50,
        fill: document.getElementById('colorPicker1').value // Corrected to 'colorPicker1'
    });
    canvas.add(textBox);
    saveState();
}

// Event listener for "Save Changes" button in the modal
document.getElementById('saveTextBtn').addEventListener('click', function () {
    const textInput = document.getElementById('textInput').value;
    if (textInput) {
        addText(textInput);
        document.getElementById('textInput').value = ''; // Clear input field after adding text
        $('#textModal').modal('hide'); // Hide the modal
    } else {
        alert('Please enter some text.');
    }
});



function loadImage(url, left, top, scaleX, scaleY, id) {
    fabric.Image.fromURL(url, function (img) {
        img.set({
            left: left || 0,
            top: top || 0,
            scaleX: scaleX || 1,
            scaleY: scaleY || 1,
            selectable: true
        });

        if (id) {
            img.set('id', id);
        }

        canvas.add(img);
        canvas.renderAll();
    });
}

const params = new URLSearchParams(window.location.search);
const backgroundSrc = decodeURIComponent(params.get('background'));
const logoSrc = decodeURIComponent(params.get('logo'));
const text = decodeURIComponent(params.get('text'));

loadImage(backgroundSrc, 100, 100, 0.5, 0.5);

// Load the logo from local storage if it exists
const storedLogoSrc = localStorage.getItem('logoSrc');
if (storedLogoSrc) {
    loadImage(storedLogoSrc, 100, 100, 0.3, 0.3, 'logoImg');
} else {
    loadImage(logoSrc, 100, 100, 0.3, 0.3, 'logoImg');
}

if (text) {
    const textBox = new fabric.Textbox(text, {
        left: 50,
        top: 150, 
        fontSize: 24, 
        fill: '#FFFFFF', 
        fontWeight: 'bold', 
        selectable: true, 
        class: 'canvas-text' 
    });

    // Set the rendering order to ensure text is always on top
    textBox.set('renderOrder', fabric.Object.prototype.renderOrder + 1);

    canvas.add(textBox);
}


document.getElementById('saveBtn').addEventListener('click', saveCanvas);
document.getElementById('exportBtn').addEventListener('click', exportCanvas);



document.querySelector('.upper-canvas').addEventListener('click', function (event) {
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === 'image' && activeObject.get('id') === 'logoImg') {
        document.getElementById('logoInputContainer').style.display = 'block';
    }
});
canvas.on('mouse:down', function (event) {
    if (!event.target || !event.target.id || event.target.id !== 'logoImg') {
        document.getElementById('logoInputContainer').style.display = 'none';
    }
});

function handleLogoUpload(event) {
    const fileInput = event.target;
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (event) {
        const logoUrl = event.target.result;
        const existingLogos = canvas.getObjects().filter(obj => obj.type === 'image' && obj.get('id') === 'logoImg');

        existingLogos.forEach(existingLogo => {
            canvas.remove(existingLogo);
        });

        loadImage(logoUrl, 50, 50, 0.2, 0.2, 'logoImg');
        saveState();

        // Save the logo URL to local storage to persist after refreshing
        localStorage.setItem('logoSrc', logoUrl);

        // Hide the logo input container
        document.getElementById('logoInputContainer').style.display = "none"

    };

    if (file.type && file.type.indexOf('image') !== -1) {
        reader.readAsDataURL(file);
    } else {
        fetch(file)
            .then(response => response.blob())
            .then(blob => {
                reader.readAsDataURL(blob);
            })
            .catch(error => {
                console.error('Error fetching logo:', error);
            });
    }
}

document.getElementById('logoImageInput').addEventListener('change', handleLogoUpload);



function saveState() {
    const state = JSON.stringify(canvas.toJSON()); // Use canvas.toJSON() instead of canvas.toDatalessJSON()
    if (currentStateIndex < stateHistory.length - 1) {
        stateHistory.splice(currentStateIndex + 1);
    }
    stateHistory.push(state);
    currentStateIndex++;
}



function saveCanvas() {
    // Serialize entire canvas state
    const canvasState = JSON.stringify(canvas.toJSON());

    // Save canvas state to local storage
    localStorage.setItem('thumbnail_canvas', canvasState);

    // Clear local storage for frame, photo, and text data
    localStorage.removeItem('frame');
    localStorage.removeItem('photo');
    localStorage.removeItem('text');

    alert('Canvas state saved.');
}
// Function to export the canvas as an image
function exportCanvas() {
    canvas.discardActiveObject();
    canvas.requestRenderAll();

    // Serialize canvas data
    const canvasData = JSON.stringify(canvas.toDatalessJSON());
    localStorage.clear();

    // Navigate to index.html
    window.location.href = 'index.html';

}

const frameGallery = document.getElementById('frameGallery');
const frameImages = [
    'frame.png',
    'frame1.png',
    'frame2.png',
    'frame3.png',
    'frame4.png'
];

frameImages.forEach(frame => {
    const frameImg = document.createElement('img');
    frameImg.src = frame;
    frameImg.classList.add('frameImage', 'col-4');
    frameImg.addEventListener('click', function () {
        addFrame(frame);
    });
    frameGallery.appendChild(frameImg);
});

// Function to add a frame to the canvas
function addFrame(frameUrl) {
    fabric.Image.fromURL(frameUrl, function (frame) {
        frame.set({
            left: 0,
            top: 0,
            scaleX: canvas.width / frame.width,
            scaleY: canvas.height / frame.height,
            selectable: false
        });
        canvas.add(frame);
        canvas.sendToBack(frame); // Send frame to the back so it's behind the background picture
        canvas.renderAll();
    });
}
// Function to handle adding a new background photo
let photo = null;

document.getElementById('addphoto').addEventListener('click', async function () {
    const { value: file } = await Swal.fire({
        title: "Select image",
        input: "file",
        inputAttributes: {
            "accept": "image/*",
            "aria-label": "Upload your photo"
        }
    });

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            addPhoto(e.target.result);
            // Show the remove button
            document.getElementById('removePhotoBtn').style.display = 'inline-block';
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('removePhotoBtn').addEventListener('click', function () {
    // Remove the photo
    removePhoto();
    // Hide the remove button
    document.getElementById('removePhotoBtn').style.display = 'none';
});
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('colorPickerButton').addEventListener('click', function () {
        // Trigger click event on the color input
        document.getElementById('colorPicker1').click();
    });
});
function addPhoto(url) {
    fabric.Image.fromURL(url, function (img) {
        img.set({
            left: 100, // Adjust the position as needed
            top: 100, // Adjust the position as needed
            selectable: true
        });

        // Add the new photo
        canvas.add(img);
        photo = img;

        // Show the remove photo button
        document.getElementById('removePhotoBtn').style.display = 'inline-block';
        saveState(); // Save state after adding photo
    });
}

document.getElementById('removePhotoBtn').addEventListener('click', function () {
    // Remove the selected object
    if (canvas.getActiveObject()) {
        canvas.remove(canvas.getActiveObject());
    }
    // Hide the remove photo button
    document.getElementById('removePhotoBtn').style.display = 'none';
});


function removePhoto() {
    if (photo) {
        canvas.remove(photo);
        photo = null;
    }
}
function loadCanvas() {
    const canvasState = localStorage.getItem('thumbnail_canvas');
    if (canvasState) {
        const newCanvas = new fabric.Canvas('canvas');
        newCanvas.loadFromJSON(canvasState, function () {
            newCanvas.renderAll();
        });
    }
}
document.getElementById('saveBtn').addEventListener('click', saveCanvas);

// Load the canvas state when the page is loaded
window.addEventListener('load', loadCanvas);
