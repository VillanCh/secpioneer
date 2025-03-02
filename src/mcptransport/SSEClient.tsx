import React, { useState, useEffect, useRef } from 'react';
import { Alert, Button, Card, Space, Typography, Badge, List, Tag, Divider } from 'antd';
import { ApiOutlined, SyncOutlined, CloseCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

interface SSEClientProps {
  serverUrl: string;
  events?: string[];
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (message: any) => void;
}

/**
 * SSE客户端组件
 * 用于建立和管理与服务器的SSE连接，显示接收到的消息
 */
const SSEClient: React.FC<SSEClientProps> = ({
  serverUrl,
  events = ['message'],
  onConnect,
  onDisconnect,
  onError,
  onMessage
}) => {
  const [connected, setConnected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{
    id: string;
    event: string;
    data: any;
    time: Date;
  }>>([]);
  const [filteredEvent, setFilteredEvent] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 连接到SSE服务器
    const connectToSSE = () => {
      try {
        setConnectionError(null);
        
        // 创建EventSource
        const eventSource = new EventSource(serverUrl);
        eventSourceRef.current = eventSource;
        
        // 连接建立事件
        eventSource.onopen = () => {
          setConnected(true);
          onConnect?.();
        };
        
        // 默认消息事件
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const newMessage = {
              id: Math.random().toString(36).substring(2, 9),
              event: 'message',
              data,
              time: new Date()
            };
            
            setMessages(prev => [...prev, newMessage]);
            onMessage?.(data);
          } catch (err) {
            // 如果不是JSON，直接显示字符串
            const newMessage = {
              id: Math.random().toString(36).substring(2, 9),
              event: 'message',
              data: event.data,
              time: new Date()
            };
            setMessages(prev => [...prev, newMessage]);
            onMessage?.(event.data);
          }
        };
        
        // 错误处理
        eventSource.onerror = (err) => {
          setConnectionError('连接错误：服务器可能不支持SSE或连接被拒绝');
          setConnected(false);
          onError?.(err);
        };
        
        // 注册自定义事件
        events.forEach(eventType => {
          if (eventType !== 'message') {
            eventSource.addEventListener(eventType, (event) => {
              try {
                const data = JSON.parse(event.data);
                const newMessage = {
                  id: Math.random().toString(36).substring(2, 9),
                  event: eventType,
                  data,
                  time: new Date()
                };
                setMessages(prev => [...prev, newMessage]);
                onMessage?.(data);
              } catch (err) {
                const newMessage = {
                  id: Math.random().toString(36).substring(2, 9),
                  event: eventType,
                  data: event.data,
                  time: new Date()
                };
                setMessages(prev => [...prev, newMessage]);
                onMessage?.(event.data);
              }
            });
          }
        });
      } catch (err) {
        setConnectionError(`初始化连接错误: ${err}`);
        setConnected(false);
      }
    };
    
    connectToSSE();
    
    // 在组件卸载时，关闭SSE连接
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setConnected(false);
        onDisconnect?.();
      }
    };
  }, [serverUrl, events, onConnect, onDisconnect, onError, onMessage]);
  
  // 断开SSE连接
  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setConnected(false);
      onDisconnect?.();
    }
  };
  
  // 在新消息添加后，滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // 计算事件类型及其消息数量
  const eventCounts = events.reduce((acc, event) => {
    acc[event] = messages.filter(msg => msg.event === event).length;
    return acc;
  }, {} as Record<string, number>);
  
  // 格式化消息显示
  const formatMessage = (data: any): string => {
    if (typeof data === 'object') {
      return JSON.stringify(data, null, 2);
    }
    return String(data);
  };
  
  // 格式化时间显示
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString();
  };
  
  // 过滤消息
  const filteredMessages = filteredEvent 
    ? messages.filter(msg => msg.event === filteredEvent) 
    : messages;
  
  return (
    <div className="sse-client">
      <Card
        title={
          <Space>
            <ApiOutlined />
            <span>SSE 客户端</span>
            <Badge 
              status={connected ? "success" : "error"} 
              text={connected ? "已连接" : "未连接"} 
            />
          </Space>
        }
        extra={
          <Button
            type="primary"
            danger
            icon={<CloseCircleOutlined />}
            onClick={disconnect}
            disabled={!connected}
          >
            断开连接
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div className="connection-info">
            <Text strong>服务器地址: </Text>
            <Text code>{serverUrl}</Text>
          </div>
          
          {connectionError && (
            <Alert
              message="连接错误"
              description={connectionError}
              type="error"
              showIcon
            />
          )}
          
          <div className="event-filter">
            <Space wrap>
              <Text strong>事件过滤: </Text>
              <Tag 
                color={filteredEvent === null ? "blue" : "default"} 
                style={{ cursor: 'pointer' }}
                onClick={() => setFilteredEvent(null)}
              >
                全部 ({messages.length})
              </Tag>
              {events.map(event => (
                <Tag 
                  key={event}
                  color={filteredEvent === event ? "blue" : "default"}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setFilteredEvent(event)}
                >
                  {event} ({eventCounts[event] || 0})
                </Tag>
              ))}
            </Space>
          </div>
          
          <Divider style={{ margin: '8px 0' }} />
          
          <div className="message-list">
            {filteredMessages.length === 0 ? (
              <div className="empty-messages">
                <Text type="secondary">
                  {connected ? '等待接收消息...' : '未连接，无法接收消息'}
                </Text>
              </div>
            ) : (
              <List
                size="small"
                dataSource={filteredMessages}
                renderItem={message => (
                  <List.Item className="message-item">
                    <div style={{ width: '100%' }}>
                      <div className="message-header">
                        <Space>
                          <Tag color="blue">{message.event}</Tag>
                          <Text type="secondary">{formatTime(message.time)}</Text>
                        </Space>
                      </div>
                      <div className="message-content">
                        <pre>{formatMessage(message.data)}</pre>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        </Space>
      </Card>
      
      <style>{`
        .sse-client {
          width: 100%;
        }
        
        .connection-info {
          margin-bottom: 8px;
        }
        
        .event-filter {
          margin: 8px 0;
        }
        
        .message-list {
          height: 300px;
          overflow-y: auto;
          border: 1px solid #eee;
          border-radius: 4px;
          padding: 8px;
          background: #fafafa;
        }
        
        .message-item {
          margin-bottom: 8px;
          background: white;
          border-radius: 4px;
          border-left: 3px solid #1890ff;
          overflow: hidden;
        }
        
        .message-header {
          padding: 4px 8px;
          background: #f0f7ff;
          border-bottom: 1px solid #e6f7ff;
        }
        
        .message-content {
          padding: 8px;
          overflow-x: auto;
        }
        
        .message-content pre {
          margin: 0;
          white-space: pre-wrap;
          word-break: break-all;
        }
        
        .empty-messages {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100px;
        }
      `}</style>
    </div>
  );
};

export default SSEClient; 