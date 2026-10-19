import * as THREE from 'three';
import type { Dirt } from '../entities/Dirt.js';
import type { Roach } from '../entities/Roach.js';

export interface ClickTarget {
  type: 'floor' | 'dirt' | 'roach';
  point: THREE.Vector3;
  dirt?: Dirt;
  roach?: Roach;
}

export class InputManager {
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private isDown = false;
  private dragStart = new THREE.Vector2();
  private isDragging = false;
  private camera!: THREE.Camera;
  private scene!: THREE.Scene;
  private floor!: THREE.Mesh;
  private onInteract: (target: ClickTarget) => void;
  private onDrag: (deltaX: number, deltaY: number) => void;

  constructor(
    canvas: HTMLCanvasElement,
    onInteract: (target: ClickTarget) => void,
    onDrag: (deltaX: number, deltaY: number) => void
  ) {
    this.onInteract = onInteract;
    this.onDrag = onDrag;

    canvas.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
    canvas.addEventListener('pointermove', (e) => this.handlePointerMove(e));
    canvas.addEventListener('pointerup', (e) => this.handlePointerUp(e));
    canvas.addEventListener('pointerleave', () => this.handlePointerUp());
  }

  setContext(camera: THREE.Camera, scene: THREE.Scene, floor: THREE.Mesh) {
    this.camera = camera;
    this.scene = scene;
    this.floor = floor;
  }

  private updatePointer(e: PointerEvent) {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private handlePointerDown(e: PointerEvent) {
    this.isDown = true;
    this.isDragging = false;
    this.dragStart.set(e.clientX, e.clientY);
    this.updatePointer(e);
  }

  private handlePointerMove(e: PointerEvent) {
    this.updatePointer(e);
    if (!this.isDown) return;
    const dx = e.clientX - this.dragStart.x;
    const dy = e.clientY - this.dragStart.y;
    if (Math.hypot(dx, dy) > 6) {
      this.isDragging = true;
      this.onDrag(dx, dy);
      this.dragStart.set(e.clientX, e.clientY);
    }
    if (this.isDragging) {
      this.raycastFloor();
    }
  }

  private handlePointerUp(e?: PointerEvent) {
    if (!this.isDown) return;
    this.isDown = false;
    if (!this.isDragging && e) {
      this.updatePointer(e);
      this.handleClick();
    }
    this.isDragging = false;
  }

  private handleClick() {
    const target = this.raycast();
    if (target) this.onInteract(target);
  }

  private raycast(): ClickTarget | null {
    if (!this.camera || !this.scene) return null;
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const interactables: THREE.Object3D[] = [];
    this.scene.traverse((obj) => {
      if ((obj as any).userData?.dirt || (obj as any).userData?.roach) {
        interactables.push(obj);
      }
    });

    const hit = this.raycaster.intersectObjects(interactables, true)[0];
    if (hit) {
      const dirt = (hit.object as any).userData?.dirt as Dirt | undefined;
      if (dirt) {
        return { type: 'dirt', point: hit.point, dirt };
      }
      const roach = (hit.object as any).userData?.roach as Roach | undefined;
      if (roach) {
        return { type: 'roach', point: hit.point, roach };
      }
    }

    const floorHit = this.raycaster.intersectObject(this.floor)[0];
    if (floorHit) {
      return { type: 'floor', point: floorHit.point };
    }
    return null;
  }

  private raycastFloor(): ClickTarget | null {
    if (!this.camera || !this.floor) return null;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const floorHit = this.raycaster.intersectObject(this.floor)[0];
    if (floorHit) {
      const target: ClickTarget = { type: 'floor', point: floorHit.point };
      this.onInteract(target);
      return target;
    }
    return null;
  }
}
