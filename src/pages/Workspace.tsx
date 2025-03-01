import React, { useState, useEffect, useRef, useCallback } from 'react';
import ThoughtPanel from '../components/ThoughtPanel';
import ChatPanel from '../components/ChatPanel';
import ResizableSplitter from '../components/ResizableSplitter';

// 本地存储的键名
const STORAGE_KEY = {
  LEFT_PANEL_WIDTH: 'secpioneer_left_panel_width',
  LEFT_PANEL_COLLAPSED: 'secpioneer_left_panel_collapsed'
};

// 从 localStorage 读取值，如果不存在则返回默认值
const getStoredValue = <T,>(key: string, defaultValue: T): T => {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue !== null ? JSON.parse(storedValue) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

// 保存值到 localStorage
const storeValue = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (process.env.NODE_ENV !== 'production') {
      console.log(`保存状态: ${key} = `, value);
    }
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
};

interface Thought {
  id: string;
  title: string;
  content: string;
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
}

const Workspace: React.FC = () => {
  // 初始状态从 localStorage 读取，如果不存在则使用默认值
  const defaultWidth = window.innerWidth * 0.3;
  const [thoughts, setThoughts] = useState<Thought[]>([
    { id: '1', title: '想法 1', content: '这是第一个想法的内容' },
    { id: '2', title: '想法 2', content: '这是第二个想法的内容' },
  ]);

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', content: '欢迎使用聊天系统', isUser: false },
  ]);

  // 使用 localStorage 中存储的值初始化状态
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    const isCollapsed = getStoredValue(STORAGE_KEY.LEFT_PANEL_COLLAPSED, false);
    return isCollapsed ? 0 : getStoredValue(STORAGE_KEY.LEFT_PANEL_WIDTH, defaultWidth);
  });
  
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(() => 
    getStoredValue(STORAGE_KEY.LEFT_PANEL_COLLAPSED, false)
  );
  
  const [prevLeftWidth, setPrevLeftWidth] = useState(() => {
    // 如果当前是折叠状态，则使用保存的展开宽度
    const isCollapsed = getStoredValue(STORAGE_KEY.LEFT_PANEL_COLLAPSED, false);
    if (isCollapsed) {
      return getStoredValue('secpioneer_left_panel_expanded_width', defaultWidth);
    }
    // 否则使用当前宽度
    return getStoredValue(STORAGE_KEY.LEFT_PANEL_WIDTH, defaultWidth);
  });
  
  // 跟踪是否正在拖拽中
  const isDraggingRef = useRef(false);
  // 跟踪是否正在进行收起/展开过渡
  const isTransitioningRef = useRef(false);
  // 记录上一次的宽度，用于避免重复更新
  const lastWidthRef = useRef(getStoredValue(STORAGE_KEY.LEFT_PANEL_WIDTH, defaultWidth));

  // 使用 useCallback 优化拖拽处理函数，避免重复创建
  const handleResize = useCallback((newWidth: number) => {
    // 标记正在拖拽中
    isDraggingRef.current = true;
    
    // 如果宽度变化不大，不触发更新（优化性能）
    if (Math.abs(newWidth - lastWidthRef.current) < 1) {
      return;
    }
    
    // 更新最后的宽度记录
    lastWidthRef.current = newWidth;
    
    // 如果当前是折叠状态，则自动展开
    if (isLeftCollapsed && newWidth > 0) {
      setIsLeftCollapsed(false);
      // 保存折叠状态到 localStorage
      storeValue(STORAGE_KEY.LEFT_PANEL_COLLAPSED, false);
    }
    
    // 直接更新DOM以获得最流畅的拖拽效果
    const leftPanel = document.querySelector('.left-panel') as HTMLElement;
    if (leftPanel) {
      leftPanel.style.width = `${newWidth}px`;
    }
    
    // 使用 requestAnimationFrame 延迟状态更新，减少渲染负担
    requestAnimationFrame(() => {
      setLeftPanelWidth(newWidth);
    });
  }, [isLeftCollapsed]);
  
  // 拖拽结束处理
  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    
    // 确保最终状态是同步的
    setLeftPanelWidth(lastWidthRef.current);
    
    // 计算并保存宽度比例
    const ratio = lastWidthRef.current / window.innerWidth;
    
    // 保存当前宽度和比例到 localStorage
    storeValue(STORAGE_KEY.LEFT_PANEL_WIDTH, lastWidthRef.current);
    storeValue('secpioneer_left_panel_width_ratio', ratio);
    
    // 如果宽度不为0，也保存为展开宽度
    if (lastWidthRef.current > 0) {
      storeValue('secpioneer_left_panel_expanded_width', lastWidthRef.current);
    }
    
    // 强制重绘以确保UI是最新的
    requestAnimationFrame(() => {
      const leftPanel = document.querySelector('.left-panel') as HTMLElement;
      if (leftPanel) {
        leftPanel.style.width = `${lastWidthRef.current}px`;
      }
    });
  }, []);

  // 响应窗口大小变化
  useEffect(() => {
    const handleWindowResize = () => {
      if (!isLeftCollapsed && !isTransitioningRef.current && !isDraggingRef.current) {
        // 如果左侧面板没有折叠，则保持比例
        setLeftPanelWidth(prev => {
          // 获取存储的宽度比例，如果没有则计算当前比例
          let ratio = getStoredValue('secpioneer_left_panel_width_ratio', prev / window.innerWidth);
          
          // 确保比例在合理范围内
          ratio = Math.max(0.1, Math.min(ratio, 0.7));
          
          const newWidth = Math.round(window.innerWidth * ratio);
          // 确保宽度在合理范围内
          const finalWidth = Math.max(100, Math.min(newWidth, window.innerWidth * 0.7));
          
          lastWidthRef.current = finalWidth;
          
          // 保存新宽度和比例到 localStorage
          storeValue(STORAGE_KEY.LEFT_PANEL_WIDTH, finalWidth);
          storeValue('secpioneer_left_panel_width_ratio', ratio);
          
          return finalWidth;
        });
      }
    };

    // 初始化时保存当前宽度比例
    if (!isLeftCollapsed) {
      const ratio = leftPanelWidth / window.innerWidth;
      storeValue('secpioneer_left_panel_width_ratio', ratio);
    }

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [isLeftCollapsed]);

  const handleSendMessage = (value: string) => {
    if (value.trim()) {
      const newMessage = { id: Date.now().toString(), content: value, isUser: true };
      setMessages([...messages, newMessage]);
    }
  };

  const handleThoughtClick = (thought: Thought) => {
    console.log('点击了想法:', thought);
  };

  const handleToggleCollapse = useCallback(() => {
    // 如果正在过渡中，忽略点击
    if (isTransitioningRef.current) return;
    
    // 设置正在过渡中
    isTransitioningRef.current = true;
    
    if (isLeftCollapsed) {
      // 展开
      setIsLeftCollapsed(false);
      setLeftPanelWidth(prevLeftWidth);
      lastWidthRef.current = prevLeftWidth;
      
      // 保存状态到 localStorage
      storeValue(STORAGE_KEY.LEFT_PANEL_COLLAPSED, false);
      storeValue(STORAGE_KEY.LEFT_PANEL_WIDTH, prevLeftWidth);
    } else {
      // 折叠
      setPrevLeftWidth(leftPanelWidth);
      lastWidthRef.current = 0;
      setIsLeftCollapsed(true);
      setLeftPanelWidth(0);
      
      // 保存状态到 localStorage
      storeValue(STORAGE_KEY.LEFT_PANEL_COLLAPSED, true);
      storeValue(STORAGE_KEY.LEFT_PANEL_WIDTH, 0);
      // 同时保存展开时的宽度
      storeValue('secpioneer_left_panel_expanded_width', leftPanelWidth);
    }
    
    // 过渡完成后重置标志
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 300); // 与 CSS 过渡时间保持一致
  }, [isLeftCollapsed, leftPanelWidth, prevLeftWidth]);

  // 组件初始化时，根据保存的状态设置面板
  useEffect(() => {
    // 如果折叠状态初始化为 true，则确保宽度为 0
    if (isLeftCollapsed) {
      setLeftPanelWidth(0);
      
      // 尝试恢复展开时的宽度
      const expandedWidth = getStoredValue('secpioneer_left_panel_expanded_width', defaultWidth);
      if (expandedWidth > 0) {
        setPrevLeftWidth(expandedWidth);
      }
    }

    // 在组件卸载时保存当前状态
    return () => {
      storeValue(STORAGE_KEY.LEFT_PANEL_WIDTH, isLeftCollapsed ? 0 : leftPanelWidth);
      storeValue(STORAGE_KEY.LEFT_PANEL_COLLAPSED, isLeftCollapsed);
      if (!isLeftCollapsed) {
        storeValue('secpioneer_left_panel_expanded_width', leftPanelWidth);
      }
    };
  }, []);

  return (
    <div className="workspace-container" style={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
    }}>
      <div style={{ 
        display: 'flex', 
        flex: 1,
        overflow: 'hidden',
      }}>
        {/* 左侧思维面板 */}
        <div 
          className="left-panel"
          style={{ 
            width: `${leftPanelWidth}px`, 
            maxWidth: `${leftPanelWidth}px`,
            overflow: 'hidden',
            transition: isTransitioningRef.current ? 'width 0.3s ease-in-out' : 'none',
            backgroundColor: '#fafafa',
            borderRight: '1px solid #f0f0f0',
            display: leftPanelWidth === 0 ? 'none' : 'block',
          }}
        >
          <ThoughtPanel 
            thoughts={thoughts} 
            onThoughtClick={handleThoughtClick} 
          />
        </div>

        {/* 分隔条 */}
        <ResizableSplitter 
          onResize={handleResize}
          onDragEnd={handleDragEnd}
          onToggleCollapse={handleToggleCollapse}
          isLeftCollapsed={isLeftCollapsed}
          minWidth={80}
          maxWidth={window.innerWidth * 0.7}
          autoCollapseThreshold={60}
        />
        
        {/* 右侧聊天区域 */}
        <div style={{ 
          flex: 1,
          minWidth: '300px',
          backgroundColor: '#fff',
        }}>
          <ChatPanel 
            messages={messages} 
            onSendMessage={handleSendMessage} 
          />
        </div>
      </div>
    </div>
  );
};

export default Workspace;