import * as THREE from "three";

const r = "node_modules/deviceful/public/env/studio-a/";
const urls = [
  `${r}px.png`,
  `${r}nx.png`,
  `${r}py.png`,
  `${r}ny.png`,
  `${r}pz.png`,
  `${r}nz.png`,
];
const textureCube = new THREE.CubeTextureLoader().load(urls);

const spaceGray = new THREE.MeshPhysicalMaterial({
  color: "#858a8b",
  envMap: textureCube,
  metalness: 1,
  roughness: 0.5,
  reflectivity: 2,
  opacity: 1,
  envMapIntensity: 3,
  premultipliedAlpha: true,
});

const backWhite = new THREE.MeshPhysicalMaterial({
  color: "#f5f4eb",
  envMap: textureCube,
  metalness: 1,
  roughness: 0,
  reflectivity: 2,
  opacity: 1,
  envMapIntensity: 2.5,
  premultipliedAlpha: true,
});

const chrome = new THREE.MeshPhysicalMaterial({
  color: "#ffffff",
  envMap: textureCube,
  metalness: 1,
  roughness: 0,
  reflectivity: 3,
  opacity: 1,
  envMapIntensity: 1.5,
  premultipliedAlpha: true,
});

const spaceBlack = new THREE.MeshPhysicalMaterial({
  color: "#333333",
  envMap: textureCube,
  metalness: 1,
  roughness: 0,
  reflectivity: 2,
  opacity: 1,
  envMapIntensity: 3,
  premultipliedAlpha: true,
});

const glass = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  envMap: textureCube,
  metalness: 1,
  roughness: 0,
  reflectivity: 2,
  opacity: 0.15,
  transparent: true,
  envMapIntensity: 2,
  premultipliedAlpha: true,
});

const blackGloss = new THREE.MeshPhongMaterial({
  color: 0x111111,
  envMap: textureCube,
  refractionRatio: 1,
  shininess: 100,
});

const materials = {
  laptop: {
    body: spaceGray,
    lid: spaceGray,
    hinge: spaceGray,
    glass,
    camera: blackGloss,
    screen_frame: blackGloss,
    lip_strip: blackGloss,
    keyboard: new THREE.MeshPhongMaterial({ color: 0x181c20 }),
  },
  phone: {
    body: chrome,
    switch: chrome,
    camera_ring: backWhite,
    back_camera: spaceBlack,
    glass,
    back: backWhite,
  },
};

export default materials;
