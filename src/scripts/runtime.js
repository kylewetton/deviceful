import {
  Clock,
  Scene,
  WebGLRenderer,
  PerspectiveCamera,
  TextureLoader,
  MeshBasicMaterial,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";

export const clock = new Clock();

export const scene = new Scene();

export const renderer = new WebGLRenderer({
  alpha: true,
  antialias: true,
});

export const camera = new PerspectiveCamera();

export const textureLoader = new TextureLoader();

export const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();

export const screenMaterial = (texture) =>
  new MeshBasicMaterial({ map: texture });

dracoLoader.setDecoderPath("node_modules/deviceful/public/draco/gltf/");
loader.setDRACOLoader(dracoLoader);

// const camera = new PerspectiveCamera(
//   this.settings.camera[this.settings.style].focalLength,
//   width / height,
//   0.1,
//   1000
// );
