import React, { useState, useRef, useEffect } from 'react';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

interface ResizableSplitterProps {
  onResize: (leftWidth: number) => void;
  onToggleCollapse: () => void;
  isLeftCollapsed: boolean;
  minWidth?: number;
  maxWidth?: number;
  onDragEnd?: () => void;
  autoCollapseThreshold?: number;
}

const ResizableSplitter: React.FC<ResizableSplitterProps> = ({
  onResize,
  onToggleCollapse,
  isLeftCollapsed,
  minWidth = 100,
  maxWidth = 800,
  onDragEnd,
  autoCollapseThreshold = 50,
}) => {
  const splitterRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const [isDraggingUI, setIsDraggingUI] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isNearCollapse, setIsNearCollapse] = useState(false);
  
  // 添加一个防抖标志，防止快速连续点击
  const isTogglingRef = useRef(false);
  // 记录上一次鼠标位置，用于计算拖拽速度
  const lastMousePosRef = useRef(0);
  // 记录拖拽帧的请求ID
  const animationFrameRef = useRef<number | null>(null);
  // 记录当前宽度，避免频繁触发状态更新
  const currentWidthRef = useRef(0);
  // 记录自动折叠的状态
  const autoCollapseTriggeredRef = useRef(false);
  // 记录是否在自动折叠区域内
  const isInCollapseZoneRef = useRef(false);
  
  // 添加对文档的类管理
  const addDraggingClass = () => {
    document.body.classList.add('dragging');
  };
  
  const removeDraggingClass = () => {
    document.body.classList.remove('dragging');
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    // 如果是点击了收起按钮区域，不要开始拖拽
    if ((e.target as HTMLElement).closest('.collapse-button')) {
      return;
    }
    
    // 更新拖拽状态
    isDraggingRef.current = true;
    setIsDraggingUI(true);
    
    // 添加拖拽中的类
    addDraggingClass();
    
    // 记录初始鼠标位置
    lastMousePosRef.current = e.clientX;
    
    // 添加事件监听
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // 如果面板是折叠状态，在开始拖拽时自动展开
    if (isLeftCollapsed) {
      onToggleCollapse();
    }
    
    // 重置自动折叠触发状态
    autoCollapseTriggeredRef.current = false;
    isInCollapseZoneRef.current = false;
    
    e.preventDefault(); // 防止文本选择
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    
    // 取消之前的动画帧请求
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // 使用 requestAnimationFrame 优化性能，减少重绘
    animationFrameRef.current = requestAnimationFrame(() => {
      const container = splitterRef.current?.parentElement;
      if (!container) return;
      
      // 获取原始新宽度
      let rawNewWidth = e.clientX;
      
      // 判断是否进入了自动折叠区域
      const inCollapseZone = rawNewWidth <= autoCollapseThreshold * 1.5;
      
      // 限制拖拽范围，但在自动折叠区域内不受 minWidth 限制
      let newWidth;
      if (inCollapseZone) {
        // 在自动折叠区域时，仅限制最大宽度，不限制最小宽度
        newWidth = Math.min(rawNewWidth, container.offsetWidth - minWidth, maxWidth);
        // 标记进入自动折叠区域
        isInCollapseZoneRef.current = true;
      } else {
        // 正常范围内，应用最小和最大宽度限制
        newWidth = Math.max(minWidth, Math.min(rawNewWidth, container.offsetWidth - minWidth, maxWidth));
        isInCollapseZoneRef.current = false;
      }

      // 检查是否接近自动折叠阈值（阈值的1.5倍范围内）
      const isNear = rawNewWidth <= autoCollapseThreshold * 1.5;
      if (isNear !== isNearCollapse) {
        setIsNearCollapse(isNear);
      }
      
      // 检查是否应自动折叠：当拖拽到阈值以下，且向左拖动，且尚未触发自动折叠
      if (!autoCollapseTriggeredRef.current && 
          rawNewWidth <= autoCollapseThreshold && 
          e.clientX < lastMousePosRef.current) {
        
        // 标记已触发自动折叠
        autoCollapseTriggeredRef.current = true;
        
        // 停止拖拽
        isDraggingRef.current = false;
        
        // 执行折叠操作（延迟执行，让用户感知到拖拽已到达极限）
        setTimeout(() => {
          onToggleCollapse();
          
          // 重置UI状态
          setIsDraggingUI(false);
          removeDraggingClass();
          
          // 移除事件监听
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          
          // 触发拖拽结束回调
          if (onDragEnd) {
            onDragEnd();
          }
        }, 100);
        
        return;
      }
      
      // 更新当前宽度引用
      currentWidthRef.current = newWidth;
      
      // 调用宽度更新函数
      onResize(newWidth);
      
      // 更新上一次鼠标位置
      lastMousePosRef.current = e.clientX;
    });
  };

  const handleMouseUp = () => {
    // 重置拖拽状态
    isDraggingRef.current = false;
    setIsDraggingUI(false);
    setIsNearCollapse(false);
    
    // 移除拖拽中的类
    removeDraggingClass();
    
    // 取消动画帧请求
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // 检查是否需要在释放鼠标时自动折叠
    if (!isLeftCollapsed && isInCollapseZoneRef.current && !autoCollapseTriggeredRef.current) {
      onToggleCollapse();
    } else if (!isLeftCollapsed && currentWidthRef.current < minWidth) {
      // 如果低于最小宽度但不在自动折叠区域，恢复到最小宽度
      onResize(minWidth);
    }
    
    // 触发拖拽结束回调
    if (onDragEnd) {
      onDragEnd();
    }
    
    // 移除事件监听
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // 重置自动折叠触发状态
    autoCollapseTriggeredRef.current = false;
    isInCollapseZoneRef.current = false;
  };
  
  // 优化后的收起/展开处理函数
  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止事件冒泡
    e.preventDefault(); // 防止默认行为
    
    // 防抖处理，避免快速连续点击
    if (isTogglingRef.current) return;
    
    isTogglingRef.current = true;
    onToggleCollapse();
    
    // 300ms 后重置防抖标志，这个时间应与动画时间匹配
    setTimeout(() => {
      isTogglingRef.current = false;
    }, 300);
  };

  useEffect(() => {
    return () => {
      // 组件卸载时清理
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      removeDraggingClass();
      
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={splitterRef}
      className={`resizable-splitter ${isNearCollapse ? 'near-collapse' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        width: '8px',
        backgroundColor: isDraggingUI 
          ? (isNearCollapse ? '#ff4d4f' : '#1890ff') 
          : (isHovering ? '#d9d9d9' : '#f0f0f0'),
        cursor: 'col-resize',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        transition: isDraggingUI ? 'none' : 'background-color 0.2s ease',
        touchAction: 'none',  // 禁止触摸事件的默认行为
      }}
    >
      <div 
        className="collapse-button"
        onClick={handleToggleCollapse}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{
          position: 'absolute',
          width: '24px',
          height: '50px',
          backgroundColor: isNearCollapse 
            ? '#fff2f0' 
            : (isHovering ? '#e6f7ff' : '#f0f0f0'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '0 4px 4px 0',
          cursor: 'pointer',
          boxShadow: isHovering ? '0 3px 6px rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.1)',
          left: 0,
          transform: 'translateX(-50%)',
          zIndex: 11,
          transition: isNearCollapse ? 'all 0.1s ease' : 'all 0.2s ease',
          border: isNearCollapse 
            ? '1px solid #ffccc7' 
            : (isHovering ? '1px solid #91d5ff' : '1px solid #d9d9d9'),
          // 防止按钮被浏览器计算为可点击区域的一部分，避免跳动
          pointerEvents: 'auto',
          willChange: 'transform', // 优化渲染性能
          animation: isNearCollapse ? 'pulse 1s infinite' : 'none',
        }}
      >
        {isLeftCollapsed ? 
          <RightOutlined style={{ 
            fontSize: isHovering ? '16px' : '14px', 
            color: isNearCollapse 
              ? '#ff4d4f' 
              : (isHovering ? '#1890ff' : '#8c8c8c'),
            transition: 'all 0.2s ease',
          }} /> : 
          <LeftOutlined style={{ 
            fontSize: isHovering ? '16px' : '14px', 
            color: isNearCollapse 
              ? '#ff4d4f' 
              : (isHovering ? '#1890ff' : '#8c8c8c'),
            transition: 'all 0.2s ease',
          }} />
        }
      </div>
    </div>
  );
};

export default ResizableSplitter;