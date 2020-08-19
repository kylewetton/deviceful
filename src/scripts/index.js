import {
  PCFSoftShadowMap,
  RepeatWrapping,
  LoopOnce,
  sRGBEncoding,
  Scene,
  WebGLRenderer,
  Clock,
  Math as ThreeMath,
} from "three";
import { Tweenable, Scene as TweenScene } from "shifty";
import {
  camera,
  loader,
  textureLoader,
  screenMaterial,
  animMixer,
  setDecoders,
} from "./runtime";
import Theme from "./Theme";
import getMaterials from "./materials";
import tweens from "./tweenAnims";

const defaultTheme = {
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
      initialDeviceRotation: 0,
      initialDevicePosition: 0,
      enableFloor: true,
      cameraDistance: null,
      cameraHeight: null,
      onLoadAnimation: null,
      toggleSpeed: 1,
      openOnLoad: true,
      scrollOnLoad: null,
      autoHeight: false,
      screenshotHeight: 900,
      path: "./public",
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
        color: "#333333",
        depth: 20,
        shadowOnly: true,
        shininess: 1,
        shadowOpacity: 0.1,
      },
    };

    this.settings = Object.assign(defaultSettings, settings);
    this.el =
      typeof this.settings.parent === "string"
        ? document.querySelector(this.settings.parent)
        : this.settings.parent;

    this.deviceHeight = 900;

    this.deviceScale = {
      laptop: 1,
      phone: 1.2,
    };

    this.scene = new Scene();
    this.clock = new Clock();
    this.camera = null;
    this.renderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
    });

    this.renderer.gammaFactor = 2.2;
    this.renderer.outputEncoding = sRGBEncoding;
    this.renderer.powerPreference = "high-performance";
    this.loop = this.loop.bind(this);
    this.theme = new Theme(defaultTheme, this.settings.floor);
    this.mixer = null;
    this.tweenMixer = new TweenScene();
    this.animations = {};
    this.loadingPercentage = 0;
    this.isOpen = false;
    this.shouldBeOpen = false;
    this.relevant = true;
  }

  mount(lateParent) {
    if (lateParent) {
      this.el =
        typeof lateParent === "string"
          ? document.querySelector(lateParent)
          : lateParent;
    }
    if (!this.el) {
      console.warn(
        `Deviceful couldn't find the parent element and will not proceed.`
      );
      return false;
    }

    setDecoders(this.settings.path);
    this.materials = getMaterials(this.settings.path);

    this.deviceHeight = this.settings.device === "phone" ? 790 : 900;
    const { width, height } = this.getSize();
    this.camera = camera(
      this.settings.camera[this.settings.style].focalLength,
      width / height,
      0.1,
      250
    );

    this.buildScene(width, height);
    this.addModel();
    this.monitorRelevance();

    // Event listeners
    window.addEventListener("resize", () => this.resizeWindow());
    window.addEventListener("scroll", () => this.monitorRelevance());
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

    if (loadingAnim && loadingAnim.length) {
      this.animate(loadingAnim);
    }

    if (this.settings.openOnLoad) {
      this.open();
    }

    if (this.settings.scrollOnLoad) {
      this.scroll(this.settings.scrollOnLoad);
    }

    if (this.cachedAnims) {
      this.animate(this.cachedAnims);
    }

    if (this.cachedScroll) {
      this.scroll(this.cachedScroll);
    }
  }

  resizeWindow() {
    const { width, height } = this.getSize();
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  monitorRelevance() {
    /**
     * Check if the element has scrolled in our out of view,
     * Stop the loop if the element is no longer relevant
     */
    const dimensions = this.el.getBoundingClientRect();
    const { top, height: elHeight } = dimensions;
    const { innerHeight } = window;
    const relevance = top <= innerHeight + 100 && top + elHeight >= 0;
    if (this.relevant !== relevance) {
      this.relevant = relevance;
    }
  }

  getSize() {
    const dimensions = this.el.getBoundingClientRect();
    const { width } = dimensions;
    const height = this.settings.autoHeight ? width * 0.6 : dimensions.height;

    return { width, height };
  }

  getLoadingPercentage() {
    return this.loadingPercentage;
  }

  addModel() {
    loader.load(
      `${this.settings.path}/${this.settings.device}.glb`,
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
        model.position.x = this.settings.initialDevicePosition;
        model.rotation.y = ThreeMath.degToRad(
          this.settings.initialDeviceRotation
        );

        model.traverse((o) => {
          if (o.isMesh) {
            if (!o.name.includes("glass")) {
              o.castShadow = true;
              o.receiveShadow = true;
            }

            if (o.name === "lip_strip") {
              o.visible = false;
            }
            o.material =
              this.materials[this.settings.device][o.name.split("0")[0]] ||
              o.material;
            if (o.name === "screen") {
              const texture = textureLoader.load(this.settings.screenshot);
              texture.encoding = sRGBEncoding;
              texture.flipY = false;
              texture.wrapT = RepeatWrapping;
              texture.repeat.x = 1;
              texture.repeat.y =
                this.deviceHeight / this.settings.screenshotHeight;
              this.screen = texture;

              const screenshot = screenMaterial(texture);

              o.material = screenshot;
            }
          }
        });

        model.matrixAutoUpdate = false;

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
        this.loadingPercentage = (xhr.loaded / xhr.total) * 100;
      }
    );
  }

  buildScene(width, height) {
    const pixelRatio =
      window.devicePixelRatio > 2 ? 2 : window.devicePixelRatio;
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.setPixelRatio(pixelRatio);

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
    this.camera.position.z =
      this.settings.cameraDistance !== null
        ? this.settings.cameraDistance
        : this.settings.camera[this.settings.style].position.z;

    if (this.settings.cameraHeight !== null) {
      this.camera.position.y = this.settings.cameraHeight;
    }
  }

  swapTimeScale() {
    this.currentlyAnimating = false;
    this.action.timeScale *= -1;
    this.isOpen = !this.isOpen;
  }

  toggle() {
    this.currentlyAnimating = true;
    if (this.action) {
      this.action.play();
      this.action.paused = false;
    }
  }

  open() {
    this.shouldBeOpen = true;
  }

  close() {
    this.shouldBeOpen = false;
  }

  swivel(action) {
    const animAction = {
      object: "model",
      move: "rotation",
      axis: "y",
      to: -30,
      duration: 1000,
      easing: "swingTo",
      ...action,
    };

    this.animate([animAction]);
  }

  scroll(action) {
    if (!this.model) {
      /**
       * Model hasn't been loaded yet, temporarily store it and try again soon
       */
      this.cachedScroll = action;
      return false;
    }
    const aspect = this.deviceHeight / this.settings.screenshotHeight;

    const animAction = {
      direction: "down",
      object: "screen",
      move: "offset",
      axis: "y",
      duration: 2000,
      easing: "easeInOutQuad",
      ...action,
    };

    const toY = animAction.direction === "down" ? 1 - aspect : 0;

    const { duration, move, axis, easing, object } = animAction;

    const track = new Tweenable(
      { v: this[object][move][axis] },
      {
        to: { v: toY },
        duration,
        easing,
        step: (state) => {
          this[object][move][axis] = state.v;
        },
      }
    );
    const id = `${object + move + axis}`;
    track.id = id;
    if (this.tweenMixer.tweenables.length) {
      this.tweenMixer.tweenables.forEach((t) => {
        if (t.id === id) {
          t.stop(false);
        }
      });
    }
    track.tween();
    this.tweenMixer.add(track);
  }

  animate(anims) {
    if (!this.model) {
      /**
       * Model hasn't been loaded yet, temporarily store it and try again soon
       */
      this.cachedAnims = anims;
      return false;
    }
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
        compound: false,
        ...anim,
      };
      const {
        object,
        move,
        axis,
        duration,
        easing,
        delay,
        compound,
      } = animAction;
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

      if (animAction.from === null && animAction.to !== null) {
        forward = true;
      } else if (animAction.to === null && animAction.from !== null) {
        forward = false;
      }

      const track = new Tweenable(
        { v: forward ? from : from + to },
        {
          to: { v: forward ? (!compound ? to : from + to) : to },
          duration,
          easing,
          delay,
          step: (state) => {
            this[object][move][axis] =
              move === "rotation" ? ThreeMath.degToRad(state.v) : state.v;
          },
        }
      );

      const id = `${object + move + axis}`;
      let foundSameAxis = false;
      track.id = id;

      if (this.tweenMixer.tweenables.length) {
        this.tweenMixer.tweenables.forEach((t) => {
          /**
           * Remove an animation track that is currently using the same axis/rotation/object combination
           */

          if (t.id === id) {
            foundSameAxis = true;
            if (forward) {
              t.stop(false);
            }
          }
        });
      }

      // When its non-forward and there's another axis, don't tween

      if (!forward && foundSameAxis) {
        // console.log(
        //   "HALT! Another non-forward animation track is currently using this axis combination"
        // );
      } else {
        track.tween();
      }

      this.tweenMixer.add(track);
    });
  }

  getCurrentPositions() {
    console.table({
      object: "Camera",
      position: {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z,
      },
      rotation: {
        x: `${ThreeMath.radToDeg(this.camera.rotation._x)}º`,
        y: `${ThreeMath.radToDeg(this.camera.rotation._y)}º`,
        z: `${ThreeMath.radToDeg(this.camera.rotation._z)}º`,
      },
    });
    console.table({
      object: "Model",
      position: {
        x: this.model.position.x,
        y: this.model.position.y,
        z: this.model.position.z,
      },
      rotation: {
        x: `${ThreeMath.radToDeg(this.model.rotation._x)}º`,
        y: `${ThreeMath.radToDeg(this.model.rotation._y)}º`,
        z: `${ThreeMath.radToDeg(this.model.rotation._z)}º`,
      },
    });
  }

  loop() {
    requestAnimationFrame(this.loop);

    if (this.relevant) {
      this.model.updateMatrix();
      this.renderer.render(this.scene, this.camera);
      /**
       * The mixer to run the GLTFs open and close animation
       */
      if (this.mixer) {
        this.mixer.update(this.clock.getDelta());
      }
      /**
       * Empty out the tweening mixer if it's got redundant tweens
       */
      if (this.tweenMixer.tweenables.length && !this.tweenMixer.isPlaying()) {
        this.tweenMixer.empty();
      }
      /**
       * Match conditions of open/close state
       */
      if (this.shouldBeOpen !== this.isOpen) {
        this.toggle();
      }
    }
  }
}
