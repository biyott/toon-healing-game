import * as THREE from 'three';

export class Roach {
  group: THREE.Group;
  velocity = new THREE.Vector3();
  alive = true;
  age = 0;
  maxAge = 10;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  onCatch: (position: THREE.Vector3) => void;
  fleeRange = 3.5;
  speed = 3.5;
  wanderTimer = 0;

  constructor(
    scene: THREE.Scene,
    position: THREE.Vector3,
    bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
    onCatch: (position: THREE.Vector3) => void
  ) {
    this.bounds = bounds;
    this.onCatch = onCatch;
    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.buildMesh();
    scene.add(this.group);
  }

  private buildMesh() {
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.6 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.35, 4, 8), bodyMat);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.18;
    body.castShadow = true;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), bodyMat);
    head.position.set(0.28, 0.2, 0);

    const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(0.34, 0.26, 0.08);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.34, 0.26, -0.08);
    const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), pupilMat);
    pupilL.position.set(0.38, 0.27, 0.08);
    const pupilR = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), pupilMat);
    pupilR.position.set(0.38, 0.27, -0.08);

    const antennaGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.35, 5);
    const antL = new THREE.Mesh(antennaGeo, bodyMat);
    antL.position.set(0.35, 0.35, 0.08);
    antL.rotation.z = -0.5;
    antL.rotation.x = 0.3;
    const antR = new THREE.Mesh(antennaGeo, bodyMat);
    antR.position.set(0.35, 0.35, -0.08);
    antR.rotation.z = -0.5;
    antR.rotation.x = -0.3;

    this.group.add(body, head, eyeL, eyeR, pupilL, pupilR, antL, antR);
    this.group.userData = { roach: this };
  }

  update(dt: number, playerPos: THREE.Vector3) {
    if (!this.alive) return;
    this.age += dt;
    if (this.age >= this.maxAge) {
      this.dispose();
      return;
    }

    const dist = new THREE.Vector2(this.group.position.x, this.group.position.z).distanceTo(
      new THREE.Vector2(playerPos.x, playerPos.z)
    );

    if (dist < this.fleeRange) {
      const away = new THREE.Vector3()
        .subVectors(this.group.position, playerPos)
        .setY(0)
        .normalize();
      this.velocity.lerp(away.multiplyScalar(this.speed), 0.15);
    } else {
      this.wanderTimer -= dt;
      if (this.wanderTimer <= 0) {
        this.wanderTimer = 1 + Math.random() * 2;
        const angle = Math.random() * Math.PI * 2;
        const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
        this.velocity.lerp(dir.multiplyScalar(this.speed * 0.5), 0.2);
      }
    }

    this.group.position.addScaledVector(this.velocity, dt);

    // Bounce off walls
    if (this.group.position.x < this.bounds.minX + 0.5) {
      this.group.position.x = this.bounds.minX + 0.5;
      this.velocity.x *= -1;
    }
    if (this.group.position.x > this.bounds.maxX - 0.5) {
      this.group.position.x = this.bounds.maxX - 0.5;
      this.velocity.x *= -1;
    }
    if (this.group.position.z < this.bounds.minZ + 0.5) {
      this.group.position.z = this.bounds.minZ + 0.5;
      this.velocity.z *= -1;
    }
    if (this.group.position.z > this.bounds.maxZ - 0.5) {
      this.group.position.z = this.bounds.maxZ - 0.5;
      this.velocity.z *= -1;
    }

    // Face velocity
    if (this.velocity.lengthSq() > 0.01) {
      const angle = Math.atan2(this.velocity.x, this.velocity.z);
      this.group.rotation.y = angle;
    }

    // Little hop
    this.group.position.y = 0.18 + Math.abs(Math.sin(this.age * 15)) * 0.08;
  }

  catch() {
    if (!this.alive) return;
    this.alive = false;
    this.onCatch(this.group.position.clone());
    this.dispose();
  }

  dispose() {
    this.alive = false;
    this.group.traverse((obj) => {
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
      if ((obj as THREE.Mesh).material) {
        const m = (obj as THREE.Mesh).material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m.dispose();
      }
    });
    this.group.parent?.remove(this.group);
  }
}
