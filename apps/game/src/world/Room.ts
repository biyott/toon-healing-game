import * as THREE from 'three';

export class Room {
  scene: THREE.Scene;
  floor: THREE.Mesh;
  bounds = { minX: -9, maxX: 9, minZ: -7, maxZ: 7 };
  furniture: THREE.Group;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Floor
    const floorGeo = new THREE.PlaneGeometry(20, 16);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xeecfa1,
      roughness: 0.8,
      metalness: 0.0,
      side: THREE.FrontSide
    });
    this.floor = new THREE.Mesh(floorGeo, floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xfff8e7, roughness: 0.9 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(20, 8, 0.4), wallMat);
    backWall.position.set(0, 4, -8.2);
    backWall.receiveShadow = true;
    backWall.castShadow = true;
    this.scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 8, 16.4), wallMat);
    leftWall.position.set(-10.2, 4, 0);
    leftWall.receiveShadow = true;
    leftWall.castShadow = true;
    this.scene.add(leftWall);

    // Baseboards
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const backBase = new THREE.Mesh(new THREE.BoxGeometry(20, 0.6, 0.5), baseMat);
    backBase.position.set(0, 0.3, -8.0);
    this.scene.add(backBase);
    const leftBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 16.4), baseMat);
    leftBase.position.set(-10.0, 0.3, 0);
    this.scene.add(leftBase);

    this.furniture = new THREE.Group();
    this.scene.add(this.furniture);
    this.buildFurniture();
  }

  private buildFurniture() {
    // Rug
    const rugGeo = new THREE.CylinderGeometry(3, 3, 0.05, 32);
    const rugMat = new THREE.MeshStandardMaterial({ color: 0xffa7a7, roughness: 1 });
    const rug = new THREE.Mesh(rugGeo, rugMat);
    rug.position.set(2, 0.03, 1);
    rug.receiveShadow = true;
    this.furniture.add(rug);

    // Sofa
    const sofaGroup = new THREE.Group();
    const sofaMat = new THREE.MeshStandardMaterial({ color: 0x87ceeb, roughness: 0.7 });
    const cushionMat = new THREE.MeshStandardMaterial({ color: 0xadd8e6, roughness: 0.7 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(4, 0.8, 1.8), sofaMat);
    base.position.y = 0.4;
    base.castShadow = true;
    base.receiveShadow = true;
    const back = new THREE.Mesh(new THREE.BoxGeometry(4, 1.4, 0.5), sofaMat);
    back.position.set(0, 1.1, -0.65);
    back.castShadow = true;
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, 1.9), sofaMat);
    armL.position.set(-1.75, 0.55, 0);
    armL.castShadow = true;
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, 1.9), sofaMat);
    armR.position.set(1.75, 0.55, 0);
    armR.castShadow = true;
    const cushion = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.25, 1.4), cushionMat);
    cushion.position.set(0, 0.93, 0.05);
    cushion.receiveShadow = true;
    sofaGroup.add(base, back, armL, armR, cushion);
    sofaGroup.position.set(-5, 0, -4);
    this.furniture.add(sofaGroup);

    // Table
    const tableMat = new THREE.MeshStandardMaterial({ color: 0xd2691e, roughness: 0.5 });
    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.15, 32), tableMat);
    tableTop.position.y = 1.2;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    const legGeo = new THREE.CylinderGeometry(0.1, 0.08, 1.2, 12);
    for (let i = 0; i < 3; i++) {
      const leg = new THREE.Mesh(legGeo, tableMat);
      const a = (i / 3) * Math.PI * 2;
      leg.position.set(Math.cos(a) * 0.9, 0.6, Math.sin(a) * 0.9);
      leg.castShadow = true;
      tableTop.add(leg);
    }
    const table = new THREE.Group();
    table.add(tableTop);
    table.position.set(3, 0, -3);
    this.furniture.add(table);

    // Potted plant
    const potMat = new THREE.MeshStandardMaterial({ color: 0xff8c69 });
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.35, 0.8, 16), potMat);
    pot.position.y = 0.4;
    pot.castShadow = true;
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 16), new THREE.MeshStandardMaterial({ color: 0x5d4037 }));
    soil.position.y = 0.75;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.4, 12), new THREE.MeshStandardMaterial({ color: 0x228b22 }));
    stem.position.y = 1.4;
    stem.castShadow = true;
    const leaves: THREE.Mesh[] = [];
    const leafGeo = new THREE.SphereGeometry(0.45, 12, 12);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x32cd32 });
    for (let i = 0; i < 5; i++) {
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      const a = (i / 5) * Math.PI * 2;
      leaf.position.set(Math.cos(a) * 0.35, 1.9 + Math.sin(a) * 0.15, Math.sin(a) * 0.35);
      leaf.scale.set(1, 0.6, 1);
      leaf.castShadow = true;
      leaves.push(leaf);
    }
    const plant = new THREE.Group();
    plant.add(pot, soil, stem, ...leaves);
    plant.position.set(7, 0, 4);
    this.furniture.add(plant);
  }

  clampPosition(pos: THREE.Vector3) {
    pos.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, pos.x));
    pos.z = Math.max(this.bounds.minZ, Math.min(this.bounds.maxZ, pos.z));
  }
}
