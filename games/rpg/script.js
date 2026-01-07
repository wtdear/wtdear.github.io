// === DARK FANTASY FOG EFFECT ===

const fogLayer = document.createElement("div");
fogLayer.id = "fog-layer";
document.body.appendChild(fogLayer);

fogLayer.style.position = "fixed";
fogLayer.style.top = "0";
fogLayer.style.left = "0";
fogLayer.style.width = "100%";
fogLayer.style.height = "100%";
fogLayer.style.pointerEvents = "none";
fogLayer.style.zIndex = "1";
fogLayer.style.opacity = "0.12";

fogLayer.style.backgroundImage =
    "url('https://raw.githubusercontent.com/emmelleppi/fog-texture/main/fog.png')";
fogLayer.style.backgroundRepeat = "repeat";
fogLayer.style.backgroundSize = "600px 600px";

let fogX = 0;
let fogY = 0;

function animateFog() {
    fogX += 0.02;
    fogY += 0.01;
    fogLayer.style.backgroundPosition = `${fogX}px ${fogY}px`;
    requestAnimationFrame(animateFog);
}

animateFog();
