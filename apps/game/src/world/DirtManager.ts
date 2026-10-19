import * as THREE from 'three';
import { Dirt } from '../entities/Dirt.js';

export class DirtManager {
  dirts: Dirt[] = [];
  scene: THREE.Scene;
  private onCoin: (position: THREE.Vector3, amount: number) => void;
  private onProgress: (pct: number) => void;

  constructor(
    scene: THREE.Scene,
    onCoin: (position: THREE.Vector3, amount: number) => void,
    onProgress: (pct: number) => void
  ) {
    this.scene = scene;
    this.onCoin = onCoin;
    this.onProgress = onProgress;
  }

  spawnStage(amount = 10) {
    this.clear();
    const positions: THREE.Vector3[] = [
      new THREE.Vector3(-6, 0, -2),
      new THREE.Vector3(-2, 0, 2),
      new THREE.Vector3(1, 0, -1),
      new THREE.Vector3(4, 0, 3),
      new THREE.Vector3(6, 0, -4),
      new THREE.Vector3(-4, 0, 5),
      new THREE.Vector3(0, 0, 5),
      new THREE.Vector3(7, 0, 0),
      new THREE.Vector3(-7, 0, -5),
      new THREE.Vector3(2, 0, -5),
      new THREE.Vector3(-3, 0, -4),
      new THREE.Vector3(5, 0, 5)
    ];

    const count = Math.min(amount, positions.length);
    for (let i = 0; i < count; i++) {
      const pos = positions[i].clone();
      pos.x += (Math.random() - 0.5) * 0.6;
      pos.z += (Math.random() - 0.5) * 0.6;
      const type: 'stain' | 'clump' = i % 3 === 0 ? 'stain' : 'clump';
      this.addDirt(pos, type);
    }
    this.reportProgress();
  }

  addDirt(position: THREE.Vector3, type: 'stain' | 'clump') {
    const dirt = new Dirt(this.scene, position, type, (pos, amount) => {
      this.onCoin(pos, amount);
      this.checkClear();
    });
    this.dirts.push(dirt);
  }

  clear() {
    for (const d of this.dirts) d.dispose();
    this.dirts = [];
  }

  update(dt: number, playerPos: THREE.Vector3, range: number, speed: number) {
    for (const d of this.dirts) {
      d.update(dt, playerPos, range, speed);
    }
  }

  getProgressPct() {
    if (this.dirts.length === 0) return 100;
    const totalMax = this.dirts.reduce((s, d) => s + d.maxHp, 0);
    const totalHp = this.dirts.reduce((s, d) => s + d.hp, 0);
    return ((totalMax - totalHp) / totalMax) * 100;
  }

  isClear() {
    return this.dirts.length === 0 || this.dirts.every((d) => d.hp <= 0);
  }

  private checkClear() {
    this.reportProgress();
  }

  private reportProgress() {
    this.onProgress(this.getProgressPct());
  }
}
