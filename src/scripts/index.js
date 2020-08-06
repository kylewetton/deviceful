import {
  PCFSoftShadowMap,
  RepeatWrapping,
  LoopOnce,
  sRGBEncoding,
  Math as ThreeMath,
  Vector3,
} from "three";
import { Tweenable, Scene as TweenScene, tween } from "shifty";
import {
  clock,
  scene,
  renderer,
  camera,
  loader,
  textureLoader,
  screenMaterial,
  animMixer,
} from "./runtime";
import Theme from "./Theme";
import materials from "./materials";
import tweens from "./tweenAnims";

const defaultTheme = {
  lights: [
    {
      id: "hemi",
      sky: 0x333333,
      ground: 0x333333,
      intensity: 0.5,
      position: { x: 0, y: 50, z: 0 },
    },
    {
      id: "directional",
      color: 0xffffff,
      intensity: 0.5,
      position: { x: -8, y: 12, z: 8 },
      shadows: true,
      mapSize: 1024,
    },
  ],
};

export default class Deviceful {
  constructor(settings) {
    const defaultSettings = {
      parent: "#deviceful",
      device: "laptop",
      style: "flat",
      rotation: 0,
      enableFloor: false,
      cameraDistance: null,
      cameraHeight: null,
      devicePosition: 0,
      onLoadAnimation: null,
      toggleSpeed: 1,
      toggleOnLoad: true,
      autoHeight: false,
      screenshotHeight: 900,
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
    this.tweenMixer = new TweenScene();
    this.animations = {};
  }

  mount() {
    console.log(tween);
    this.deviceHeight = this.settings.device === "phone" ? 1062 : 900;
    const { width, height } = this.getSize();
    this.camera = camera(
      this.settings.camera[this.settings.style].focalLength,
      width / height,
      0.1,
      100
    );

    this.buildScene(width, height);
    this.addModel();
    // Event listeners
    window.addEventListener("resize", () => this.resizeWindow());
  }

  /**
   * Happens after loading model promise, called inside addModel
   */
  init() {
    this.loop();

    let loadingAnim = this.settings.onLoadAnimation;
    if (typeof loadingAnim === "string") {
      loadingAnim = tweens[loadingAnim] || null;
    }

    if (loadingAnim.length) {
      this.animate(loadingAnim);
    }

    if (this.settings.toggleOnLoad) {
      this.toggle();
    }
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

            if (o.name === "lip_strip") {
              o.visible = false;
            }

            o.frustumCulled = false;
            o.material =
              materials[this.settings.device][o.name.split("0")[0]] ||
              o.material;
            if (o.name === "screen") {
              const texture = textureLoader.load(this.settings.screenshot);
              texture.encoding = sRGBEncoding;
              texture.flipY = false;
              texture.wrapT = RepeatWrapping;
              texture.repeat.x = 1;
              texture.repeat.y =
                this.deviceHeight / this.settings.screenshotHeight;
              this.texture = texture;

              const screenshot = screenMaterial(texture);

              o.material = screenshot;
            }
          }
        });

        this.scene.add(model);
        this.model = model;

        this.mixer = animMixer(model);

        this.mixer.addEventListener("finished", () => this.swapTimeScale());

        if (animations.length) {
          animations.forEach((anim) => {
            const name = anim.name.toLowerCase();
            this.animations[name] = anim;
          });
          const anim = this.animations.open;
          const action = this.mixer.clipAction(anim);
          action.loop = LoopOnce;
          action.clampWhenFinished = true;
          action.timeScale = this.settings.toggleSpeed;
          this.action = action;
        }
        this.init();
      },
      function (xhr) {
        // console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      }
    );
  }

  buildScene(width, height) {
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
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

    if (this.settings.cameraHeight) {
      this.camera.position.y = this.settings.cameraHeight;
    }
  }

  swapTimeScale() {
    this.currentlyAnimating = false;
    this.action.timeScale *= -1;
  }

  toggle() {
    this.currentlyAnimating = true;
    this.action.play();
    this.action.paused = false;
  }

  // swivel(action) {
  //   const animAction = {
  //     deg: 30,
  //     duration: 1000,
  //     toggle: false,
  //     easing: "easeOutQuad",
  //     ...action,
  //   };

  //   const { deg, duration, toggle, easing } = animAction;

  //   const start = this.model.rotation.y;
  //   let finish = ThreeMath.degToRad(deg);

  //   if (toggle && start === finish) {
  //     finish = start - finish;
  //   }

  //   this.tweenable.tween({
  //     from: { deg: start },
  //     to: { deg: finish },
  //     duration,
  //     easing,
  //     step: (state) => {
  //       this.model.rotation.y = state.deg;
  //     },
  //   });
  // }

  // scroll(speed, direction = "forwards") {
  //   const aspect = this.deviceHeight / this.settings.screenshotHeight;
  //   const fromY = direction === "forwards" ? 0 : 1 - aspect;
  //   const toY = direction === "forwards" ? 1 - aspect : 0;

  //   this.tweenable.tween({
  //     from: { y: fromY },
  //     to: { y: toY },
  //     duration: speed,
  //     easing: "easeOutQuad",
  //     step: (state) => (this.texture.offset.y = state.y),
  //   });
  // }

  // pan(distance = 0, duration = 0, easing = "easeOutQuad") {
  //   const start = this.camera.position.y;
  //   const finish = this.camera.position.y + distance;
  //   this.tweenable.tween({
  //     from: { y: start },
  //     to: { y: finish },
  //     duration,
  //     easing,
  //     step: (state) => {
  //       this.camera.position.y = state.y;
  //     },
  //   });
  // }

  animate(anims) {
    anims.forEach((anim) => {
      const animAction = {
        object: "camera",
        move: "position",
        axis: "y",
        from: null,
        to: null,
        duration: 1000,
        delay: 0,
        easing: "easeOutQuad",
        compound: true,
        ...anim,
      };
      const { object, move, axis, duration, easing, delay } = animAction;
      const currentValue = this[object][move][axis];

      let from = animAction.from || currentValue;
      from =
        move === "rotation" && animAction.from === null
          ? ThreeMath.radToDeg(from)
          : from;

      let to = animAction.to || currentValue;
      to =
        move === "rotation" && animAction.to === null
          ? ThreeMath.radToDeg(to)
          : to;

      let forward;

      if (animAction.from === null && animAction.to) {
        forward = true;
      } else if (animAction.to === null && animAction.from) {
        forward = false;
      }

      const track = new Tweenable(
        { v: forward ? from : from + to },
        {
          to: { v: forward ? from + to : to },
          duration,
          easing,
          step: (state) => {
            this[object][move][axis] =
              move === "rotation" ? ThreeMath.degToRad(state.v) : state.v;
          },
        }
      );

      this.tweenMixer.add(track);
      this.tweenMixer.play();
    });
  }

  play() {
    console.log(this.tweenMixer.tweenables.length);
  }

  loop() {
    requestAnimationFrame(this.loop);
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);
    if (this.mixer) {
      this.mixer.update(clock.getDelta());
    }
    if (this.tweenMixer.tweenables.length && !this.tweenMixer.isPlaying()) {
      this.tweenMixer.empty();
    }
  }
}
