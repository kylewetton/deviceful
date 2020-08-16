import {
  HemisphereLight,
  DirectionalLight,
  Vector2,
  PlaneBufferGeometry,
  ShadowMaterial,
  MeshLambertMaterial,
  Mesh,
} from "three";

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

      const hemiLight = new HemisphereLight(
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
      const directionalLight = new DirectionalLight(
        light.color,
        light.intensity
      );
      directionalLight.position.set(x, y, z);
      directionalLight.castShadow = light.shadows;
      directionalLight.shadow.mapSize = new Vector2(512, 512);

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
    const floorGeometry = new PlaneBufferGeometry(
      1500,
      this.floorSettings.depth,
      50,
      50
    );

    let floorMaterial;
    if (this.floorSettings.shadowOnly) {
      floorMaterial = new ShadowMaterial();
      floorMaterial.opacity = this.floorSettings.shadowOpacity;
    } else {
      floorMaterial = new MeshLambertMaterial({
        color: this.floorSettings.color,
      });
    }

    const floor = new Mesh(floorGeometry, floorMaterial);

    floor.rotation.x = -0.5 * Math.PI;
    floor.receiveShadow = true;

    this.floor = floor;
  }
}
