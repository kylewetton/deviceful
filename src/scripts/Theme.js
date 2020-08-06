import * as THREE from "three";

export default class Theme {
  constructor(theme, floor) {
    this.settings = theme;
    this.floorSettings = floor;
    this.lights = [];
    this.build();
  }

  build() {
    this.background = this.settings.background;
    this.buildLights();
    this.buildFloor();
  }

  buildLights() {
    const { lights } = this.settings;
    const hemi = lights.filter((light) => light.id === "hemi");
    const directional = lights.filter((light) => light.id === "directional");

    hemi.forEach((light) => {
      const { x, y, z } = light.position;

      const hemiLight = new THREE.HemisphereLight(
        light.sky,
        light.ground,
        light.intensity
      );
      hemiLight.position.set(x, y, z);
      this.lights.push(hemiLight);
    });

    directional.forEach((light) => {
      const { x, y, z } = light.position;
      const d = 8.25;
      const directionalLight = new THREE.DirectionalLight(
        light.color,
        light.intensity
      );
      directionalLight.position.set(x, y, z);
      directionalLight.castShadow = light.shadows;
      directionalLight.shadow.mapSize = new THREE.Vector2(1024, 1024);

      directionalLight.shadow.camera.near = 0.1;
      directionalLight.shadow.camera.far = 100;
      directionalLight.shadow.camera.left = d * -1;
      directionalLight.shadow.camera.right = d;
      directionalLight.shadow.camera.top = d;
      directionalLight.shadow.camera.bottom = d * -1;

      this.lights.push(directionalLight);
    });
  }

  buildFloor() {
    const floorGeometry = new THREE.PlaneGeometry(
      1500,
      this.floorSettings.depth,
      50,
      50
    );

    let floorMaterial;
    if (this.floorSettings.shadowOnly) {
      floorMaterial = new THREE.ShadowMaterial();
    } else {
      floorMaterial = new THREE.MeshPhongMaterial({
        color: this.floorSettings.color,
      });
    }

    floorMaterial.opacity = this.floorSettings.shadowOpacity;

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);

    floor.rotation.x = -0.5 * Math.PI;
    floor.receiveShadow = true;

    this.floor = floor;
  }
}
