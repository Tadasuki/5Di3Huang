import { useEffect, useRef } from 'react';
import * as maptilersdk from '@maptiler/sdk';
// 必须引入 CSS 文件，否则地图排版会乱掉
import '@maptiler/sdk/dist/maptiler-sdk.css';

// 引入配置文件中的 Key (路径从 components 返回上一级进入 config)
import { MAPTILER_KEY, hasMapKey } from '../config/maptiler';

export default function MyMapComponent() {
  // 使用 ref 来获取真实的 DOM 节点，避免使用字符串 ID
  const mapContainer = useRef(null);
  // 使用 ref 来保存地图实例，防止 React 重新渲染时重复创建地图
  const map = useRef(null);

  useEffect(() => {
    // 1. 防止重复初始化
    if (map.current) return;
    
    // 2. 检查是否有 Key
    if (!hasMapKey()) {
      console.error('缺少 MapTiler API Key');
      return;
    }

    // 3. 配置 Key
    maptilersdk.config.apiKey = MAPTILER_KEY;

    // 4. 初始化地图
    map.current = new maptilersdk.Map({
      container: mapContainer.current, // 传入 useRef 获取的 DOM 节点
      style: '019d83fe-7203-719e-a8f2-6eb1e53f8751', // 使用你的古典样式 ID
      center: [116.39, 39.91],
      zoom: 4,
    });

  }, []); // 空依赖数组表示只在组件挂载时执行一次

  return (
    // 外层容器，必须要有明确的宽度和高度，否则地图出不来
    <div style={{ width: '100%', height: '500px' }}>
      <div 
        ref={mapContainer} 
        style={{ width: '100%', height: '100%' }} 
      />
    </div>
  );
}