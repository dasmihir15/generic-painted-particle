import './style.css';
import imgUrl from './assets/images/picture.jpg';

let canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particlesArray = [];

let mouse = {
  x: 2000,
  y: 2000,
  radius: 100
}

canvas.addEventListener('mousemove', (e) => {
  mouse.x = e.x;
  mouse.y = e.y;
});

class Particle {
  constructor(x, y, color) {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = 2;
    this.baseX = x;
    this.baseY = y;
    this.density = (Math.random() * 30) + 1;
    this.color = color;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }

  update() {
    let dx = mouse.x - this.x;
    let dy = mouse.y - this.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    let forceX = dx/dist;
    let forceY = dy/dist;
    let maxDist = mouse.radius;
    let force = (maxDist - dist) / maxDist;
    let posChangeX = forceX * force * this.density;
    let posChangeY = forceY * force * this.density;
    if (dist < maxDist) {
      this.x -= posChangeX;
      this.y -= posChangeY;
    } else {
      let zitterThreshold = 20;
      if(this.x != this.baseX) {
        let diffBaseX = this.x - this.baseX;
        if(diffBaseX > zitterThreshold) {
          this.x -= diffBaseX/zitterThreshold;
        } else {
          this.x -= diffBaseX;
        }
        
      }
      if(this.y != this.baseY) {
        let diffBaseY = this.y - this.baseY;
        if(diffBaseY > zitterThreshold) {
          this.y -= diffBaseY/zitterThreshold;
        } else {
          this.y -= diffBaseY;
        }
      }
    }
  }
}

const myImage = new Image();
myImage.src = imgUrl;

let baseImgWidth = 0;
let baseImgHeight = 0;

myImage.addEventListener('load', () => {
  console.log("my image height width ", myImage.naturalHeight, myImage.naturalWidth);
  let proportionChange = 4
  baseImgHeight = Math.floor(myImage.naturalHeight / proportionChange);
  baseImgWidth = Math.floor(myImage.naturalWidth / proportionChange);
  ctx.drawImage(myImage, 100, 100, baseImgWidth, baseImgHeight);

  let imgDataOb = ctx.getImageData(100, 100, baseImgWidth, baseImgHeight);
  ctx.clearRect(100, 100, baseImgWidth, baseImgHeight);
  let imgData = imgDataOb.data;

  console.log(imgData);

  bodyPix.load({
    architecture: 'MobileNetV1',
    outputStride: 16,
    multiplier: 0.75,
    quantBytes: 2
  }).then((net) => {


    net.segmentPerson(imgDataOb, { internalResolution: 'high' }).then((res) => {
      let map = res.data;
      console.log("neural map");
      console.log(map);
      const newImg = ctx.createImageData(baseImgWidth, baseImgHeight);
      const newImgData = newImg.data;

      for (let i = 0; i < map.length; i++) {
        if (map[i] == 0) {
          newImgData[i * 4] = 0;
          newImgData[i * 4 + 1] = 0;
          newImgData[i * 4 + 2] = 0;
          newImgData[i * 4 + 3] = 0;
        } else {
          newImgData[i * 4] = imgData[i * 4];
          newImgData[i * 4 + 1] = imgData[i * 4 + 1];
          newImgData[i * 4 + 2] = imgData[i * 4 + 2];
          newImgData[i * 4 + 3] = imgData[i * 4 + 3];

          if ((newImgData[i * 4] + newImgData[i * 4 + 1] + newImgData[i * 4 + 2]) / 3 > 128) {
            newImgData[i * 4] = 255;
            newImgData[i * 4 + 1] = 255;
            newImgData[i * 4 + 2] = 255;
            newImgData[i * 4 + 3] = 255;
          } else {
            newImgData[i * 4] = 0;
            newImgData[i * 4 + 1] = 0;
            newImgData[i * 4 + 2] = 0;
            newImgData[i * 4 + 3] = 0;
          }
        }
      }

      ctx.putImageData(newImg, 100, 100);

      function init() {
        ctx.clearRect(550, 0, canvas.width, canvas.height);
        particlesArray = [];
        for(let y = 0, y2 = newImg.height; y < y2; y++) {
          for(let x = 0, x2 = newImg.width; x < x2; x++) {
            if(newImgData[(y*4*newImg.width) + (x*4) + 3] > 128) {
              // particlesArray.push(new Particle(x*4 + 100, y*4 + 50, 'white'));
              particlesArray.push(new Particle(x*4, y*4 - 50, 'white'));
            }
          }
        }
        
      }
      init();

      function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let particle of particlesArray) {
          particle.draw();
          particle.update();
        }
        requestAnimationFrame(animate);
      }
      animate();
    })
  })
})

ctx.font = '30px Verdana';
ctx.fillStyle = 'white';
// ctx.fillText('Angel', 50, 50);

