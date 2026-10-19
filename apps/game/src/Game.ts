import * as THREE from 'three';
import { InputManager } from './core/InputManager.js';
import { UIManager } from './core/UIManager.js';
import { Room } from './world/Room.js';
import { DirtManager } from './world/DirtManager.js';
import { Player } from './entities/Player.js';
import { Roach } from './entities/Roach.js';
import { Shop } from './shop/Shop.js';

export class Game {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private input: InputManager;
  private ui: UIManager;
  private room: Room;
  private player: Player;
  private dirtManager: DirtManager;
  private shop: Shop;
  private roaches: Roach[] = [];
  private activeDirt: { dirt: any; startTime: number } | null = null;
  private roachSpawnedAt30 = false;
  private roachSpawnedAt70 = false;
  private coinsEarnedThisRun = 0;
  private clearShown = false;
  private cameraAngle = Math.PI / 4;
  private cameraHeight = 12;
  private cameraRadius = 16;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xfff9e6);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    this.updateCameraPosition();
    this.camera.lookAt(0, 0, 0);

    // Lighting
    const hemi = new THREE.HemisphereLight(0xffffff, 0xffeedd, 0.7);
    this.scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 1.1);
    dir.position.set(8, 14, 6);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.left = -14;
    dir.shadow.camera.right = 14;
    dir.shadow.camera.top = 14;
    dir.shadow.camera.bottom = -14;
    this.scene.add(dir);

    // World
    this.room = new Room(this.scene);

    // Shop
    this.shop = new Shop();

    // Player
    this.player = new Player(this.scene);

    // UI
    const uiRoot = document.getElementById('ui-root') as HTMLElement;
    this.ui = new UIManager(uiRoot, this.shop, () => this.restartStage());

    // Dirt
    this.dirtManager = new DirtManager(
      this.scene,
      (pos, amount) => this.onCoinSpawn(pos, amount),
      (pct) => this.onProgress(pct)
    );
    this.dirtManager.spawnStage(10);

    // Input
    this.input = new InputManager(
      canvas,
      (target) => this.handleInteract(target),
      (dx, dy) => this.handleDrag(dx, dy)
    );
    this.input.setContext(this.camera, this.scene, this.room.floor);

    // Apply initial upgrades
    this.applyShopValues();
    this.shop.onValuesChanged = (vals) => this.applyValues(vals);

    window.addEventListener('resize', () => this.onResize());
  }

  start() {
    this.clock.start();
    this.renderer.setAnimationLoop(() => this.tick());
  }

  private tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05);

    this.player.update(dt, this.room.bounds);
    this.dirtManager.update(dt, this.player.position, this.player.cleaningRange, this.player.cleanSpeed);

    for (const r of this.roaches) r.update(dt, this.player.position);
    this.roaches = this.roaches.filter((r) => r.alive);

    this.trySpawnRoach();
    this.checkClear();

    this.renderer.render(this.scene, this.camera);
  }

  private updateCameraPosition() {
    this.camera.position.set(
      Math.cos(this.cameraAngle) * this.cameraRadius,
      this.cameraHeight,
      Math.sin(this.cameraAngle) * this.cameraRadius
    );
    this.camera.lookAt(0, 0, 0);
  }

  private handleDrag(dx: number, dy: number) {
    this.cameraAngle -= dx * 0.005;
    this.cameraHeight = Math.max(6, Math.min(18, this.cameraHeight + dy * 0.02));
    this.updateCameraPosition();
  }

  private handleInteract(target: import('./core/InputManager.js').ClickTarget) {
    if (target.type === 'floor') {
      this.player.setTarget(target.point);
      this.activeDirt = null;
    } else if (target.type === 'dirt' && target.dirt) {
      this.activeDirt = { dirt: target.dirt, startTime: performance.now() };
      const p = target.dirt.group.position.clone();
      p.y = 0;
      this.player.setTarget(p);
    } else if (target.type === 'roach' && target.roach) {
      target.roach.catch();
      this.onRoachCaught();
    }
  }

  private trySpawnRoach() {
    const pct = this.dirtManager.getProgressPct();
    if (!this.roachSpawnedAt30 && pct >= 30) {
      this.roachSpawnedAt30 = true;
      this.spawnRoach();
    }
    if (!this.roachSpawnedAt70 && pct >= 70) {
      this.roachSpawnedAt70 = true;
      this.spawnRoach();
    }
  }

  private spawnRoach() {
    const x = (Math.random() - 0.5) * 14;
    const z = (Math.random() - 0.5) * 10;
    const roach = new Roach(this.scene, new THREE.Vector3(x, 0, z), this.room.bounds, (pos) => {
      // visual pop handled by onRoachCaught
    });
    this.roaches.push(roach);
  }

  private onRoachCaught() {
    const bonus = Math.round(5 * this.player.coinMultiplier);
    this.shop.addCoins(bonus);
    this.coinsEarnedThisRun += bonus;
    this.ui.spawnFloatingText(`+${bonus}`, window.innerWidth / 2, window.innerHeight / 2);
    this.spawnStarEffect(this.player.position);
  }

  private onCoinSpawn(position: THREE.Vector3, baseAmount: number) {
    const amount = Math.round(baseAmount * this.player.coinMultiplier);
    this.shop.addCoins(amount);
    this.coinsEarnedThisRun += amount;

    // Visual coin
    const coin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.04, 12),
      new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.6, roughness: 0.3 })
    );
    coin.rotation.z = Math.PI / 2;
    coin.position.copy(position);
    this.scene.add(coin);

    const screen = this.worldToScreen(position);
    this.ui.spawnFloatingText(`+${amount}`, screen.x, screen.y);

    const startY = position.y;
    let t = 0;
    const anim = () => {
      t += 0.04;
      coin.position.y = startY + Math.sin(t * Math.PI) * 1.2;
      coin.rotation.x += 0.2;
      if (t < 1) requestAnimationFrame(anim);
      else {
        coin.geometry.dispose();
        (coin.material as THREE.Material).dispose();
        this.scene.remove(coin);
      }
    };
    anim();
  }

  private spawnStarEffect(position: THREE.Vector3) {
    for (let i = 0; i < 6; i++) {
      const star = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xffeb3b })
      );
      star.position.copy(position).add(new THREE.Vector3(0, 0.8, 0));
      this.scene.add(star);
      const angle = (i / 6) * Math.PI * 2;
      const dir = new THREE.Vector3(Math.cos(angle), 1, Math.sin(angle)).multiplyScalar(1.5);
      let t = 0;
      const anim = () => {
        t += 0.03;
        star.position.addScaledVector(dir, 0.03);
        star.scale.setScalar(1 - t);
        if (t < 1) requestAnimationFrame(anim);
        else {
          star.geometry.dispose();
          (star.material as THREE.Material).dispose();
          this.scene.remove(star);
        }
      };
      anim();
    }
  }

  private onProgress(pct: number) {
    this.ui.setProgress(pct);
    this.ui.setCoins(this.shop.coins);
  }

  private checkClear() {
    if (!this.clearShown && this.dirtManager.isClear()) {
      this.clearShown = true;
      this.ui.showClearOverlay(this.coinsEarnedThisRun);
    }
  }

  private restartStage() {
    this.dirtManager.spawnStage(10);
    this.roaches.forEach((r) => r.dispose());
    this.roaches = [];
    this.roachSpawnedAt30 = false;
    this.roachSpawnedAt70 = false;
    this.coinsEarnedThisRun = 0;
    this.clearShown = false;
    this.player.position.set(0, 0, 0);
    this.player.target = null;
    this.player.isMoving = false;
    this.ui.setProgress(0);
    this.ui.setCoins(this.shop.coins);
  }

  private applyShopValues() {
    this.applyValues(this.shop.getValues());
  }

  private applyValues(vals: { cleanSpeed: number; cleanRange: number; coinMultiplier: number }) {
    this.player.cleanSpeed = vals.cleanSpeed;
    this.player.cleaningRange = vals.cleanRange;
    this.player.coinMultiplier = vals.coinMultiplier;
  }

  private worldToScreen(pos: THREE.Vector3) {
    const v = pos.clone();
    v.project(this.camera);
    return {
      x: ((v.x + 1) / 2) * window.innerWidth,
      y: ((-v.y + 1) / 2) * window.innerHeight
    };
  }

  private onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
