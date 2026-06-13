import * as THREE from 'three';
import { GAME_CONFIG } from '../config/constants';

/**
 * 场景管理器 - 负责 Three.js 场景的初始化和管理
 */
export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  constructor(container: HTMLElement) {
    // 创建场景
    this.scene = new THREE.Scene();
    // 后室特有的昏暗背景色
    this.scene.background = new THREE.Color(0x1a1712);
    // 添加浓雾效果，增强压抑感
    this.scene.fog = new THREE.FogExp2(0x1a1712, 0.08);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, GAME_CONFIG.PLAYER.HEIGHT, 0);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: GAME_CONFIG.RENDERER.ANTIALIAS,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制最大像素比以提升性能
    this.renderer.shadowMap.enabled = GAME_CONFIG.RENDERER.SHADOW_MAP_ENABLED;
    this.renderer.shadowMap.type = THREE.PCFShadowMap; // 使用 PCFShadowMap 替代已弃用的 PCFSoftShadowMap

    // 色调映射，增强光照效果
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.8;

    container.appendChild(this.renderer.domElement);

    // 添加微弱的环境光（后室的昏暗环境）
    const ambientLight = new THREE.AmbientLight(0xffebb3, 0.15);
    this.scene.add(ambientLight);

    // 添加半球光，模拟天花板反射的光
    const hemisphereLight = new THREE.HemisphereLight(0xffebb3, 0x3d3020, 0.2);
    this.scene.add(hemisphereLight);

    // 窗口大小调整
    window.addEventListener('resize', this.onWindowResize.bind(this));

    console.log('SceneManager initialized');
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    this.renderer.dispose();
  }
}
