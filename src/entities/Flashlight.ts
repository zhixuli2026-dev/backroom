import * as THREE from 'three';

/**
 * 手电筒模式
 */
export enum FlashlightMode {
  OFF = 'off',           // 关闭
  CONSTANT = 'constant', // 常亮
  FLICKER = 'flicker',   // 闪烁模式（省电）
  BURST = 'burst',       // 爆闪模式（击退潜伏者）
}

/**
 * 手电筒系统
 */
export class Flashlight {
  private spotLight: THREE.SpotLight;
  private lightHelper?: THREE.SpotLightHelper;

  // 电量系统
  public maxBattery: number = 100;
  public currentBattery: number = 100;
  private drainRates = {
    [FlashlightMode.OFF]: 0,
    [FlashlightMode.CONSTANT]: 2,    // 每秒消耗2%
    [FlashlightMode.FLICKER]: 0.5,   // 每秒消耗0.5%
    [FlashlightMode.BURST]: 10,      // 每秒消耗10%
  };

  // 模式
  public currentMode: FlashlightMode = FlashlightMode.OFF;

  // 闪烁效果
  private flickerTimer: number = 0;
  private flickerInterval: number = 0.3; // 闪烁间隔
  private isFlickerOn: boolean = true;

  // 爆闪效果
  private burstTimer: number = 0;
  private burstDuration: number = 0.1; // 爆闪持续0.1秒

  // 低电量闪烁
  private lowBatteryFlickerTimer: number = 0;

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    // 创建聚光灯
    this.spotLight = new THREE.SpotLight(0xffffee, 0, 20, Math.PI / 6, 0.5, 2);
    this.spotLight.castShadow = true;
    this.spotLight.shadow.mapSize.width = 1024;
    this.spotLight.shadow.mapSize.height = 1024;
    this.spotLight.shadow.camera.near = 0.5;
    this.spotLight.shadow.camera.far = 20;

    // 将聚光灯添加到相机
    camera.add(this.spotLight);
    this.spotLight.position.set(0, -0.2, 0);
    this.spotLight.target.position.set(0, -0.2, -1);
    camera.add(this.spotLight.target);

    // 默认关闭
    this.spotLight.intensity = 0;
  }

  /**
   * 更新手电筒
   */
  public update(deltaTime: number): void {
    // 消耗电量
    this.drainBattery(deltaTime);

    // 更新光照效果
    this.updateLight(deltaTime);

    // 低电量闪烁效果
    this.updateLowBatteryFlicker(deltaTime);
  }

  /**
   * 消耗电量
   */
  private drainBattery(deltaTime: number): void {
    const drainRate = this.drainRates[this.currentMode];
    this.currentBattery -= drainRate * deltaTime;
    this.currentBattery = Math.max(0, this.currentBattery);

    // 电量耗尽自动关闭
    if (this.currentBattery <= 0 && this.currentMode !== FlashlightMode.OFF) {
      this.setMode(FlashlightMode.OFF);
      console.log('Flashlight battery depleted!');
    }
  }

  /**
   * 更新光照效果
   */
  private updateLight(deltaTime: number): void {
    switch (this.currentMode) {
      case FlashlightMode.OFF:
        this.spotLight.intensity = 0;
        break;

      case FlashlightMode.CONSTANT:
        this.spotLight.intensity = this.getIntensityByBattery();
        break;

      case FlashlightMode.FLICKER:
        this.updateFlickerMode(deltaTime);
        break;

      case FlashlightMode.BURST:
        this.updateBurstMode(deltaTime);
        break;
    }

    // 根据电量调整光照距离
    this.spotLight.distance = this.getDistanceByBattery();
  }

  /**
   * 更新闪烁模式
   */
  private updateFlickerMode(deltaTime: number): void {
    this.flickerTimer += deltaTime;

    if (this.flickerTimer >= this.flickerInterval) {
      this.isFlickerOn = !this.isFlickerOn;
      this.flickerTimer = 0;
    }

    this.spotLight.intensity = this.isFlickerOn ? this.getIntensityByBattery() : 0;
  }

  /**
   * 更新爆闪模式
   */
  private updateBurstMode(deltaTime: number): void {
    this.burstTimer += deltaTime;

    // 快速闪烁
    const burstFlicker = Math.sin(this.burstTimer * 50) > 0;
    this.spotLight.intensity = burstFlicker ? this.getIntensityByBattery() * 2 : 0;
  }

  /**
   * 低电量闪烁效果
   */
  private updateLowBatteryFlicker(deltaTime: number): void {
    if (this.currentBattery <= 20 && this.currentBattery > 0) {
      this.lowBatteryFlickerTimer += deltaTime;

      // 随机闪烁
      if (Math.random() < 0.02) {
        this.spotLight.intensity *= Math.random() * 0.5 + 0.5;
      }
    }
  }

  /**
   * 根据电量获取光照强度
   */
  private getIntensityByBattery(): number {
    if (this.currentBattery > 50) {
      return 1.5; // 强光
    } else if (this.currentBattery > 20) {
      return 1.0; // 中等光
    } else {
      return 0.5; // 弱光
    }
  }

  /**
   * 根据电量获取照射距离
   */
  private getDistanceByBattery(): number {
    if (this.currentBattery > 50) {
      return 20; // 20米
    } else if (this.currentBattery > 20) {
      return 12; // 12米
    } else {
      return 6; // 6米
    }
  }

  /**
   * 设置模式
   */
  public setMode(mode: FlashlightMode): void {
    // 检查电量
    if (mode !== FlashlightMode.OFF && this.currentBattery <= 0) {
      console.log('Cannot turn on flashlight: battery depleted');
      return;
    }

    this.currentMode = mode;
    this.flickerTimer = 0;
    this.burstTimer = 0;
    this.isFlickerOn = true;

    console.log(`Flashlight mode: ${mode}`);
  }

  /**
   * 切换模式（循环）
   */
  public toggleMode(): void {
    const modes = [
      FlashlightMode.OFF,
      FlashlightMode.CONSTANT,
      FlashlightMode.FLICKER,
    ];

    const currentIndex = modes.indexOf(this.currentMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    this.setMode(modes[nextIndex]);
  }

  /**
   * 使用爆闪（临时切换到爆闪模式）
   */
  public useBurst(): boolean {
    if (this.currentBattery < 10) {
      console.log('Not enough battery for burst mode');
      return false;
    }

    const previousMode = this.currentMode;
    this.setMode(FlashlightMode.BURST);

    // 0.5秒后恢复之前的模式
    setTimeout(() => {
      if (this.currentMode === FlashlightMode.BURST) {
        this.setMode(previousMode);
      }
    }, 500);

    return true;
  }

  /**
   * 充电
   */
  public recharge(amount: number): void {
    this.currentBattery += amount;
    this.currentBattery = Math.min(this.maxBattery, this.currentBattery);
    console.log(`Flashlight recharged by ${amount}%. Battery: ${this.currentBattery}%`);
  }

  /**
   * 获取电量百分比
   */
  public getBatteryPercentage(): number {
    return this.currentBattery / this.maxBattery;
  }

  /**
   * 检查是否开启
   */
  public isOn(): boolean {
    return this.currentMode !== FlashlightMode.OFF && this.currentBattery > 0;
  }

  /**
   * 获取光照强度（用于暴露玩家位置）
   */
  public getVisibilityFactor(): number {
    if (!this.isOn()) return 0;

    switch (this.currentMode) {
      case FlashlightMode.CONSTANT:
        return 1.0;
      case FlashlightMode.FLICKER:
        return this.isFlickerOn ? 0.8 : 0;
      case FlashlightMode.BURST:
        return 1.5;
      default:
        return 0;
    }
  }

  /**
   * 重置手电筒
   */
  public reset(): void {
    this.currentBattery = this.maxBattery;
    this.setMode(FlashlightMode.OFF);
  }

  /**
   * 销毁
   */
  public dispose(): void {
    if (this.spotLight.parent) {
      this.spotLight.parent.remove(this.spotLight);
      this.spotLight.parent.remove(this.spotLight.target);
    }
  }
}
