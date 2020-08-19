import {
  Color,
  MeshPhongMaterial,
  MeshPhysicalMaterial,
  CubeTextureLoader,
  sRGBEncoding,
  DoubleSide,
} from "three";

const getMaterials = (path) => {
  const r = `${path}/env/studio-a/`;
  const urls = [
    `${r}px.png`,
    `${r}nx.png`,
    `${r}py.png`,
    `${r}ny.png`,
    `${r}pz.png`,
    `${r}nz.png`,
  ];
  const textureCube = new CubeTextureLoader().load(urls);
  textureCube.encoding = sRGBEncoding;

  /**
   * Colors
   */

  const spaceGrayColor = new Color(0xa9afb0);
  spaceGrayColor.convertSRGBToLinear();

  const spaceBlackColor = new Color(0x333333);
  spaceBlackColor.convertSRGBToLinear();

  const backWhiteColor = new Color(0xf5f4eb);
  backWhiteColor.convertSRGBToLinear();

  const whiteColor = new Color(0xffffff);
  whiteColor.convertSRGBToLinear();

  const chromeColor = new Color(0xaaaaaa);
  chromeColor.convertSRGBToLinear();

  const blackGlossColor = new Color(0x111111);
  blackGlossColor.convertSRGBToLinear();

  /**
   * Materials
   */

  const spaceGray = new MeshPhysicalMaterial({
    color: spaceGrayColor,
    envMap: textureCube,
    metalness: 1,
    roughness: 0.35,
    envMapIntensity: 5,
  });

  spaceGray.side = DoubleSide;

  const backWhite = new MeshPhysicalMaterial({
    color: backWhiteColor,
    envMap: textureCube,
    metalness: 1,
    roughness: 0,
    reflectivity: 2,
    envMapIntensity: 2.5,
  });

  const chrome = new MeshPhysicalMaterial({
    color: chromeColor,
    envMap: textureCube,
    metalness: 1,
    roughness: 0,
    reflectivity: 3,
    envMapIntensity: 1.5,
  });

  chrome.side = DoubleSide;

  const spaceBlack = new MeshPhysicalMaterial({
    color: spaceBlackColor,
    envMap: textureCube,
    metalness: 1,
    roughness: 0,
    reflectivity: 2,
    envMapIntensity: 3,
  });

  const glass = new MeshPhysicalMaterial({
    color: whiteColor,
    envMap: textureCube,
    metalness: 1,
    roughness: 0,
    reflectivity: 2,
    opacity: 0.1,
    transparent: true,
    envMapIntensity: 2.5,
    premultipliedAlpha: true,
  });

  const blackGloss = new MeshPhongMaterial({
    color: blackGlossColor,
    envMap: textureCube,
    refractionRatio: 1,
    shininess: 100,
  });

  /**
   * Mapping
   */

  const materials = {
    laptop: {
      body: spaceGray,
      lid: spaceGray,
      hinge: spaceGray,
      glass,
      camera: blackGloss,
      screen_frame: blackGloss,
      lip_strip: blackGloss,
      keyboard: new MeshPhongMaterial({ color: spaceBlackColor }),
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
  return materials;
};

export default getMaterials;
