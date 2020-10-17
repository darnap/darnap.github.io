function loadAssets(images, shaders) {
    
    let imgPromises=images.map(el=>{
        return new Promise((res,rej)=>{
            let img=new Image();
            img.onload=evt=>res(img);
            img.onerror=evt=>rej(evt);
            img.src=el;
        });        
    });

    let shaderPromises=shaders.map(element => {
        return new Promise((res, err)=>{
            let req = new XMLHttpRequest();
            req.onload=evt=>res(req.responseText);
            req.onerror=evt=>rej(evt);
            req.open("GET", element);
            req.send();
        });
    });

    return Promise.all(imgPromises.concat(shaderPromises));

}

export {loadAssets};