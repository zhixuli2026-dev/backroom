import { KEYS } from '../config/constants';

/**
 * 输入管理器 - 处理键盘和鼠标输入
 */
export class InputManager {
  private keys: Map<string, boolean> = new Map();
  private keysJustPressed: Map<string, boolean> = new Map();
  private mouseMovement = { x: 0, y: 0 };
  private isPointerLocked = false;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // 键盘事件
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));

    // 鼠标事件
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('click', this.onMouseClick.bind(this));

    // 指针锁定事件
    document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this));

    console.log('InputManager initialized');
  }

  private onKeyDown(event: KeyboardEvent): void {
    // 只在第一次按下时设置 justPressed
    if (!this.keys.get(event.code)) {
      this.keysJustPressed.set(event.code, true);
    }
    this.keys.set(event.code, true);
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.keys.set(event.code, false);
    this.keysJustPressed.set(event.code, false);
  }

  private onMouseMove(event: MouseEvent): void {
    if (this.isPointerLocked) {
      this.mouseMovement.x = event.movementX;
      this.mouseMovement.y = event.movementY;
    }
  }

  private onMouseClick(): void {
    if (!this.isPointerLocked) {
      document.body.requestPointerLock();
    }
  }

  private onPointerLockChange(): void {
    this.isPointerLocked = document.pointerLockElement === document.body;
  }

  public isKeyPressed(key: string): boolean {
    return this.keys.get(key) || false;
  }

  public isKeyJustPressed(key: string): boolean {
    return this.keysJustPressed.get(key) || false;
  }

  public getMouseMovement(): { x: number; y: number } {
    const movement = { ...this.mouseMovement };
    this.mouseMovement.x = 0;
    this.mouseMovement.y = 0;
    return movement;
  }

  public isPointerLockedState(): boolean {
    return this.isPointerLocked;
  }

  /**
   * 每帧结束时调用，清除 justPressed 状态
   */
  public update(): void {
    // 清除所有 justPressed 状态
    // 如果按键还在按下，keydown 事件会在下一帧重新设置
    this.keysJustPressed.forEach((value, key) => {
      if (value) {
        this.keysJustPressed.set(key, false);
      }
    });
  }

  public dispose(): void {
    document.removeEventListener('keydown', this.onKeyDown.bind(this));
    document.removeEventListener('keyup', this.onKeyUp.bind(this));
    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
    document.removeEventListener('click', this.onMouseClick.bind(this));
    document.removeEventListener('pointerlockchange', this.onPointerLockChange.bind(this));
  }
}
