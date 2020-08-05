import "../styles/index.scss";
import * as THREE from "three";
import { Math as ThreeMath } from "three";
import { tween } from "shifty";
import { clock, scene, renderer, camera, loader } from "./runtime";
import Theme from "./Theme";
import materials from "./materials";

const defaultTheme = {
  background: 0x151617,
  lights: [
    {
      id: "hemi",
      sky: 0xffffff,
      ground: 0xffffff,
      intensity: 0.5,
      position: { x: 0, y: 50, z: 0 },
    },
    {
      id: "directional",
      color: 0xffffff,
      intensity: 0.5,
      position: { x: -8, y: 12, z: 8 },
      shadows: true,
      mapSize: 2048,
    },
    {
      id: "directional",
      color: 0xffffff,
      intensity: 0.3,
      position: { x: 8, y: 12, z: -8 },
      shadows: false,
      mapSize: 2048,
    },
  ],
};

export default class Deviceful {
  constructor(settings) {
    const defaultSettings = {
      parent: "#deviceful",
      device: "laptop",
      style: "standard",
      rotation: 0,
      enableFloor: false,
      cameraDistance: null,
      devicePosition: 0,
      animateOnLoad: null,
      toggleSpeed: 1,
      autoHeight: false,
      screenshotHeight: 900,
      onLoad: () => {},
      camera: {
        flat: {
          position: { x: 0, y: -2, z: 25 },
          focalLength: 10,
          objectOffset: -3.75,
        },
        standard: {
          position: { x: 0, y: 1.6, z: 11 },
          focalLength: 25,
          objectOffset: 0,
        },
      },
      floor: {
        color: "#CBD5E0",
        depth: 20,
        shadowOnly: false,
        shininess: 0,
        shadowOpacity: 0.1,
      },
    };

    this.settings = Object.assign(defaultSettings, settings);
    this.el = document.querySelector(this.settings.parent);

    this.deviceHeight = 900;

    this.deviceScale = {
      laptop: 1,
      phone: 0.43,
    };

    this.scene = scene;
    this.camera = null;
    this.renderer = renderer;
    this.loop = this.loop.bind(this);
    this.theme = new Theme(defaultTheme, this.settings.floor);
    this.mixer = null;
    this.animations = {};
    this.currentlyAnimating = false;
    this.chainAnim = () => {};
  }

  mount() {
    this.deviceHeight = this.settings.device === "phone" ? 1062 : 900;
    const { width, height } = this.getSize();
    this.camera = new THREE.PerspectiveCamera(
      this.settings.camera[this.settings.style].focalLength,
      width / height,
      0.1,
      1000
    );
    this.buildScene(width, height);
    this.addModel();
    this.loop();

    // Event listeners
    window.addEventListener("resize", () => this.resizeWindow());
  }

  resizeWindow() {
    const { width, height } = this.getSize();
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
  }

  getSize() {
    const dimensions = this.el.getBoundingClientRect();
    const { width } = dimensions;
    const height = this.settings.autoHeight ? width * 0.6 : dimensions.height;

    return { width, height };
  }

  addModel() {
    loader.load(
      `node_modules/deviceful/public/${this.settings.device}.glb`,
      (gltf) => {
        const model = gltf.scene;
        const { animations } = gltf;
        const { device } = this.settings;
        model.scale.set(
          this.deviceScale[device],
          this.deviceScale[device],
          this.deviceScale[device]
        );
        model.position.y = this.settings.camera[
          this.settings.style
        ].objectOffset;
        model.position.x = this.settings.devicePosition;
        model.rotation.y = ThreeMath.degToRad(this.settings.rotation);

        model.traverse((o) => {
          if (o.isMesh) {
            if (!o.name.includes("glass")) {
              o.castShadow = true;
              o.receiveShadow = true;
            }

            o.frustumCulled = false;
            o.material =
              materials[this.settings.device][o.name.split("0")[0]] ||
              o.material;
            if (o.name === "screen") {
              const texture = new THREE.TextureLoader().load(
                this.settings.screenshot
              );

              texture.flipY = false;
              texture.wrapT = THREE.RepeatWrapping;
              texture.repeat.x = 1;
              texture.repeat.y =
                this.deviceHeight / this.settings.screenshotHeight;
              this.texture = texture;

              const screenshot = new THREE.MeshBasicMaterial({
                map: texture,
              });

              o.material = screenshot;
            }
          }
        });

        this.scene.add(model);
        this.model = model;

        this.mixer = new THREE.AnimationMixer(model);

        this.mixer.addEventListener("finished", () => this.swapTimeScale());

        if (animations.length) {
          animations.forEach((anim) => {
            const name = anim.name.toLowerCase();
            this.animations[name] = anim;
          });
          const anim = this.animations.open;
          const action = this.mixer.clipAction(anim);
          action.loop = THREE.LoopOnce;
          action.clampWhenFinished = true;
          action.timeScale = this.settings.toggleSpeed;
          this.action = action;
        }

        this.settings.onLoad();
      },
      function (xhr) {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      }
    );
  }

  buildScene(width, height) {
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.el.appendChild(this.renderer.domElement);
    const { lights, floor } = this.theme;

    lights.forEach((light) => this.scene.add(light));
    floor.position.y = this.settings.camera[this.settings.style].objectOffset;
    if (this.settings.enableFloor) {
      this.scene.add(floor);
    }

    this.camera.position.x = this.settings.camera[
      this.settings.style
    ].position.x;
    this.camera.position.y = this.settings.camera[
      this.settings.style
    ].position.y;
    this.camera.position.z = this.settings.cameraDistance
      ? this.settings.cameraDistance
      : this.settings.camera[this.settings.style].position.z;
  }

  swapTimeScale() {
    this.currentlyAnimating = false;
    this.action.timeScale *= -1;
    this.chainAnim();
    this.chainAnim = () => {};
  }

  toggle() {
    if (this.currentlyAnimating) {
      this.chainAnim = () => this.toggle();
    }
    this.currentlyAnimating = true;
    this.action.play();
    this.action.paused = false;
  }

  swivel(
    deg = 30,
    duration = 1000,
    easing = "easeOutQuad",
    callback = () => {}
  ) {
    const start = this.model.rotation.y;
    const finish = ThreeMath.degToRad(deg);

    tween({
      from: { deg: start },
      to: { deg: finish },
      duration,
      easing,
      step: (state) => (this.model.rotation.y = state.deg),
    }).then(() => callback());
  }

  scroll(speed, direction = "forwards") {
    const aspect = this.deviceHeight / this.settings.screenshotHeight;
    const fromY = direction === "forwards" ? 0 : 1 - aspect;
    const toY = direction === "forwards" ? 1 - aspect : 0;

    tween({
      from: { y: fromY },
      to: { y: toY },
      duration: speed,
      easing: "easeOutQuad",
      step: (state) => (this.texture.offset.y = state.y),
    });
  }

  loop() {
    requestAnimationFrame(this.loop);
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);
    if (this.mixer) {
      this.mixer.update(clock.getDelta());
    }
  }
}
