import React, { useState, useEffect, useRef } from 'react';
import { Card, Typography, Button, Input, List, Tag, Space, Empty, Alert } from 'antd';
import { ApiOutlined, SendOutlined, ClearOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

interface SimpleSSEDemoProps {
  serverUrl?: string;
}

/**
 * 简化版的SSE演示组件
 * 用于在MCP测试工具中展示SSE通信的基本功能
 */
const SimpleSSEDemo: React.FC<SimpleSSEDemoProps> = ({ serverUrl = 'http://localhost:11432/sse' }) => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<{ data: string; event: string; time: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  
  // 连接到SSE服务器
  const connect = () => {
    if (connected) {
      disconnect();
      return;
    }
    
    try {
      const eventSource = new EventSource(serverUrl);
      eventSourceRef.current = eventSource;
      
      eventSource.onopen = () => {
        setConnected(true);
        setError(null);
        addMessage('系统', '已连接到SSE服务器');
      };
      
      eventSource.onmessage = (event) => {
        addMessage('message', event.data);
      };
      
      eventSource.onerror = () => {
        setError('连接错误，请检查服务器地址和状态');
        disconnect();
      };
      
      // 添加一些常用的事件监听器
      const commonEvents = ['update', 'notification', 'error'];
      commonEvents.forEach(eventType => {
        eventSource.addEventListener(eventType, (event) => {
          addMessage(eventType, (event as MessageEvent).data);
        });
      });
      
    } catch (error) {
      setError(`连接错误: ${error}`);
    }
  };
  
  // 断开SSE连接
  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setConnected(false);
      addMessage('系统', '已断开连接');
    }
  };
  
  // 添加消息到列表
  const addMessage = (event: string, data: string) => {
    const now = new Date().toLocaleTimeString();
    setMessages(prevMessages => [
      ...prevMessages,
      { event, data, time: now }
    ]);
  };
  
  // 清空消息列表
  const clearMessages = () => {
    setMessages([]);
  };
  
  // 在组件卸载时断开连接
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);
  
  // 获取事件标签的颜色
  const getEventColor = (event: string) => {
    switch (event) {
      case 'message': return 'blue';
      case 'error': return 'red';
      case 'update': return 'green';
      case 'notification': return 'orange';
      case '系统': return 'purple';
      default: return 'default';
    }
  };
  
  return (
    <div className="simple-sse-demo">
      <Card
        title={
          <Space>
            <ApiOutlined />
            <span>SSE通信演示</span>
            {connected ? 
              <Tag color="success">已连接</Tag> : 
              <Tag color="default">未连接</Tag>
            }
          </Space>
        }
        extra={
          <Space>
            <Button
              type={connected ? "default" : "primary"}
              onClick={connect}
              icon={connected ? <ApiOutlined rotate={45} /> : <ApiOutlined />}
            >
              {connected ? "断开连接" : "连接"}
            </Button>
            <Button
              onClick={clearMessages}
              disabled={messages.length === 0}
              icon={<ClearOutlined />}
            >
              清空
            </Button>
          </Space>
        }
        size="small"
        className="sse-demo-card"
      >
        {error && (
          <Alert 
            message="连接错误" 
            description={error} 
            type="error" 
            showIcon 
            style={{ marginBottom: 16 }}
            closable 
            onClose={() => setError(null)}
          />
        )}
        
        <Paragraph type="secondary">
          服务器地址: <Text code>{serverUrl}</Text>
        </Paragraph>
        
        <div className="messages-container">
          {messages.length === 0 ? (
            <Empty 
              description="暂无消息记录" 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <List
              dataSource={messages}
              renderItem={(message, index) => (
                <List.Item key={index} className="message-item">
                  <Space>
                    <Tag color={getEventColor(message.event)}>{message.event}</Tag>
                    <Text type="secondary">{message.time}</Text>
                  </Space>
                  <div className="message-content">
                    <Text code style={{ wordBreak: 'break-all' }}>{message.data}</Text>
                  </div>
                </List.Item>
              )}
            />
          )}
        </div>
        
        <style>{`
          .simple-sse-demo {
            margin-bottom: 16px;
            width: 100%;
            display: flex;
            flex-direction: column;
          }
          
          .sse-demo-card {
            width: 100%;
            display: flex;
            flex-direction: column;
          }
          
          .sse-demo-card .ant-card-head {
            flex-shrink: 0;
          }
          
          .sse-demo-card .ant-card-body {
            padding: 12px;
            flex: 1;
            display: flex;
            flex-direction: column;
          }
          
          .messages-container {
            height: 220px;
            max-height: 220px;
            overflow-y: auto;
            margin-top: 16px;
            border: 1px solid #f0f0f0;
            border-radius: 4px;
            padding: 8px;
            background-color: #fafafa;
            flex: 1;
          }
          
          .message-item {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding: 8px;
            margin-bottom: 8px;
            background: #fff;
            border-radius: 4px;
            border-left: 3px solid #1890ff;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          }
          
          .message-content {
            margin-top: 8px;
            width: 100%;
            word-break: break-all;
          }
        `}</style>
      </Card>
    </div>
  );
};

export default SimpleSSEDemo; 