function facereco(vid, click){
    async function face() {
        //video streaming live
        let video = document.getElementById(vid);
        let click_button = document.getElementById(click);
        let canvasforimg = document.querySelector("#canvas");
        let stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        video.srcObject = stream;

    // Click image for detectface
    click_button.addEventListener('click', async ()=> {
        canvasforimg.getContext('2d').drawImage(video, 0, 0, canvasforimg.width, canvasforimg.height);
        let image_data_url = canvasforimg.toDataURL('image/jpeg');

        // load model
        const MODEL_URL = '/models'
        await faceapi.loadSsdMobilenetv1Model(MODEL_URL)
        await faceapi.loadFaceLandmarkModel(MODEL_URL)
        await faceapi.loadFaceRecognitionModel(MODEL_URL)
        await faceapi.loadFaceExpressionModel(MODEL_URL)

        // set image on canvas -ps
        const img= document.getElementById('originalImg');
        const newImage = new Image();
        newImage.onload = function() {
            img.src = newImage.src;
        }
        newImage.src = image_data_url;

        // get image description using detectface, landmarks facedescription and faceexpressions
        let faceDescriptions = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors().withFaceExpressions()
        const canvas = $('#reflay').get(0)
        faceapi.matchDimensions(canvas, img)

        // match with existing images
        const labels = ['PraveenSankhla', 'komalsuthar', 'tarunvaya', 'Teenusharma']
        const labeledFaceDescriptors = await Promise.all(
        labels.map(async label => {
                
            const imgUrl = `/Img/${label}.jpg`
            const img = await faceapi.fetchImage(imgUrl)
            const faceDescription = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
            if (!faceDescription) {
            throw new Error(`no faces detected for ${label}`)
            }
                
            const faceDescriptors = [faceDescription.descriptor]
            return new faceapi.LabeledFaceDescriptors(label, faceDescriptors)
        })
        );

    const threshold = 0.9
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, threshold)

        const results = await faceDescriptions.map(fd => faceMatcher.findBestMatch(fd.descriptor))
        console.log(results)
        if (results.length == 0) {
            console.log("No face found")
            document.getElementById('name').innerHTML = `No face found`
        }
        else {
            console.log(results[0]._label)
            document.getElementById('name').innerHTML = `Hello ${results[0]._label}`
        }
    results.forEach((bestMatch, i) => {
        const box = faceDescriptions[i].detection.box
        const text = bestMatch.toString()
        console.log(text)
        const drawBox = new faceapi.draw.DrawBox(box, { label: text })
        drawBox.draw(canvas)
    })
    });
}
    
    face()
}