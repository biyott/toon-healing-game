import * as THREE from 'three';

export class Dirt {
  group: THREE.Group;
  hp: number;
  maxHp: number;
  type: 'stain' | 'clump';
  private onCleaned: (position: THREE.Vector3, amount: number) => void;
  private cleaned = false;
  private cleaningTimer = 0;
  private progressSprite?: THREE.Sprite;

  constructor(
    scene: THREE.Scene,
    position: THREE.Vector3,
    type: 'stain' | 'clump',
    onCleaned: (position: THREE.Vector3, amount: number) => void
  ) {
    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.type = type;
    this.onCleaned = onCleaned;
    this.maxHp = type === 'stain' ? 80 : 120;
    this.hp = this.maxHp;

    if (type === 'stain') {
      const geo = new THREE.CylinderGeometry(0.5, 0.6, 0.04, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x6d4c41,
        roughness: 1,
        transparent: true,
        opacity: 0.9
      });
      const stain = new THREE.Mesh(geo, mat);
      stain.position.y = 0.02;
      stain.receiveShadow = true;
      stain.userData = { dirt: this };
      this.group.add(stain);
    } else {
      const mat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 1 });
      for (let i = 0; i < 5; i++) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(0.18 + Math.random() * 0.1, 10, 10), mat);
        s.position.set((Math.random() - 0.5) * 0.6, 0.12, (Math.random() - 0.5) * 0.6);
        s.castShadow = true;
        s.userData = { dirt: this };
        this.group.add(s);
      }
    }

    this.progressSprite = this.createProgressSprite();
    this.group.add(this.progressSprite);
    scene.add(this.group);
  }

  private createProgressSprite(): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 24;
    const ctx = canvas.getContext('2d')!;
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.2, 0.22, 1);
    sprite.position.y = 0.7;
    (sprite as any).__ctx = ctx;
    (sprite as any).__tex = tex;
    return sprite;
  }

  update(dt: number, playerPos: THREE.Vector3, range: number, speed: number) {
    if (this.cleaned) return;

    // Progress bar follows camera
    const pct = this.hp / this.maxHp;
    const ctx = (this.progressSprite as any).__ctx as CanvasRenderingContext2D;
    const tex = (this.progressSprite as any).__tex as THREE.CanvasTexture;
    ctx.clearRect(0, 0, 128, 24);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, 128, 24);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(2, 2, 124 * (1 - pct), 20);
    tex.needsUpdate = true;
    this.progressSprite!.material.visible = this.hp < this.maxHp;

    const dist = new THREE.Vector2(this.group.position.x, this.group.position.z).distanceTo(
      new THREE.Vector2(playerPos.x, playerPos.z)
    );
    if (dist <= range) {
      this.cleaningTimer += dt;
      if (this.cleaningTimer >= 0.12) {
        this.cleaningTimer = 0;
        this.hp -= speed;
        this.scaleDown();
        if (this.hp <= 0) {
          this.hp = 0;
          this.clean();
        }
      }
    }
  }

  private scaleDown() {
    const s = 0.6 + 0.4 * (this.hp / this.maxHp);
    this.group.scale.setScalar(Math.max(0.1, s));
  }

  private clean() {
    if (this.cleaned) return;
    this.cleaned = true;
    this.onCleaned(this.group.position.clone().add(new THREE.Vector3(0, 0.5, 0)), 1);
    this.dispose();
  }

  dispose() {
    if (this.progressSprite) {
      this.progressSprite.material.map?.dispose();
      this.progressSprite.material.dispose();
    }
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
