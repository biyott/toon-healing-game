import * as THREE from 'three';

export class Player {
  group: THREE.Group;
  position = new THREE.Vector3(0, 0, 0);
  target: THREE.Vector3 | null = null;
  velocity = new THREE.Vector3();
  speed = 5;
  isMoving = false;
  walkTime = 0;
  cleaningRange = 1.6;
  cleanSpeed = 18;
  coinMultiplier = 1;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.buildMesh();
    scene.add(this.group);
  }

  private buildMesh() {
    const skin = new THREE.MeshStandardMaterial({ color: 0xffd1a9, roughness: 0.6 });
    const shirt = new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.7 });
    const pants = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.7 });

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.5, 4, 8), shirt);
    body.position.y = 0.7;
    body.castShadow = true;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), skin);
    head.position.y = 1.35;
    head.castShadow = true;

    const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1f2937 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.1, 1.4, 0.27);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.1, 1.4, 0.27);

    const cheekGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const cheekMat = new THREE.MeshStandardMaterial({ color: 0xffa7a7 });
    const cheekL = new THREE.Mesh(cheekGeo, cheekMat);
    cheekL.position.set(-0.18, 1.32, 0.24);
    const cheekR = new THREE.Mesh(cheekGeo, cheekMat);
    cheekR.position.set(0.18, 1.32, 0.24);

    const armGeo = new THREE.CapsuleGeometry(0.08, 0.35, 4, 8);
    const armL = new THREE.Mesh(armGeo, skin);
    armL.position.set(-0.42, 0.85, 0);
    armL.rotation.z = 0.3;
    const armR = new THREE.Mesh(armGeo, skin);
    armR.position.set(0.42, 0.85, 0);
    armR.rotation.z = -0.3;

    const legGeo = new THREE.CapsuleGeometry(0.1, 0.4, 4, 8);
    const legL = new THREE.Mesh(legGeo, pants);
    legL.position.set(-0.15, 0.25, 0);
    const legR = new THREE.Mesh(legGeo, pants);
    legR.position.set(0.15, 0.25, 0);

    this.group.add(body, head, eyeL, eyeR, cheekL, cheekR, armL, armR, legL, legR);
  }

  setTarget(point: THREE.Vector3) {
    this.target = point.clone();
    this.target.y = 0;
    this.isMoving = true;
  }

  update(dt: number, bounds: { minX: number; maxX: number; minZ: number; maxZ: number }) {
    if (this.target) {
      const dir = new THREE.Vector3().subVectors(this.target, this.position);
      dir.y = 0;
      const dist = dir.length();
      if (dist < 0.15) {
        this.target = null;
        this.isMoving = false;
        this.velocity.set(0, 0, 0);
        this.group.position.y = 0;
      } else {
        dir.normalize();
        this.velocity.copy(dir).multiplyScalar(this.speed);
        this.position.addScaledVector(this.velocity, dt);
        this.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, this.position.x));
        this.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, this.position.z));

        // Face movement direction
        const angle = Math.atan2(dir.x, dir.z);
        this.group.rotation.y = angle;
      }
    }

    // Bobbing
    if (this.isMoving) {
      this.walkTime += dt * 12;
      this.group.position.y = Math.sin(this.walkTime) * 0.08;
    } else {
      this.walkTime = 0;
      this.group.position.y = 0;
    }

    this.group.position.x = this.position.x;
    this.group.position.z = this.position.z;
  }
}
