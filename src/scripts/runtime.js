import {
  PerspectiveCamera,
  TextureLoader,
  MeshBasicMaterial,
  AnimationMixer,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";

export const camera = (focal, aspect, near, far) =>
  new PerspectiveCamera(focal, aspect, near, far);

export const textureLoader = new TextureLoader();

export const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();

dracoLoader.setDecoderPath("node_modules/deviceful/public/draco/gltf/");
loader.setDRACOLoader(dracoLoader);

export const screenMaterial = (texture) =>
  new MeshBasicMaterial({ map: texture });

export const animMixer = (model) => new AnimationMixer(model);
