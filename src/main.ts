import './style.css';
import { Game } from './core/Game';

/**
 * 应用入口
 */
function initApp(): void {
  const container = document.getElementById('game-container');

  if (!container) {
    console.error('Game container not found');
    return;
  }

  // 创建游戏实例
  const game = new Game(container);

  // 启动游戏
  game.start();

  // 全局访问（用于调试）
  (window as any).game = game;
}

// DOM 加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
