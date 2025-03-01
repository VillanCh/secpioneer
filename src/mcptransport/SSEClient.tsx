import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, List, Typography, Button, Space, Tag, Tooltip, Input, Alert, Spin, Empty } from 'antd';
import { 
  ApiOutlined, 
  LinkOutlined, 
  DisconnectOutlined, 
  SendOutlined,
  InfoCircleOutlined,
  CheckCircleTwoTone,
  ExclamationCircleTwoTone,
  ClockCircleOutlined,
  ReloadOutlined,
  ClearOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

// SSE 消息类型
interface SSEMessage {
  id: string;
  event: string;
  data: string;
  timestamp: string;
  parsed?: any;
}

// SSE 客户端属性
interface SSEClientProps {
  serverUrl: string;
  onMessage?: (message: SSEMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  events?: string[]; // 可选的事件列表
  autoConnect?: boolean;
}

// SSE 连接状态
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * SSE 客户端组件
 * 用于建立与服务器的 Server-Sent Events 连接
 */
const SSEClient: React.FC<SSEClientProps> = ({
  serverUrl,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
  events = ['message'],
  autoConnect = false
}) => {
  // 状态管理
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [messages, setMessages] = useState<SSEMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [customEvent, setCustomEvent] = useState<string>('');
  const [filterEvent, setFilterEvent] = useState<string>('');
  
  // ref用于存储EventSource实例
  const eventSourceRef = useRef<EventSource | null>(null);
  
  // 消息列表底部的引用，用于自动滚动
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 连接到SSE服务器
  const connect = useCallback(() => {
    // 如果已经连接，先断开
    if (eventSourceRef.current) {
      disconnect();
    }
    
    try {
      setStatus('connecting');
      setError(null);
      
      // 创建新的EventSource实例
      const source = new EventSource(serverUrl);
      eventSourceRef.current = source;
      setEventSource(source);
      
      // 连接打开时的处理
      source.onopen = () => {
        setStatus('connected');
        if (onConnect) onConnect();
      };
      
      // 出错时的处理
      source.onerror = (err: Event) => {
        setStatus('error');
        const errorMessage = `连接错误: ${err}`;
        setError(errorMessage);
        if (onError) onError(err);
      };
      
      // 默认消息处理
      source.onmessage = (event: MessageEvent) => {
        const newMessage: SSEMessage = {
          id: event.lastEventId || `msg-${Date.now()}`,
          event: 'message',
          data: event.data,
          timestamp: new Date().toISOString(),
        };
        
        // 尝试解析JSON数据
        try {
          newMessage.parsed = JSON.parse(event.data);
        } catch (e) {
          // 如果不是JSON格式，保持原样
        }
        
        // 更新消息列表
        setMessages(prev => [...prev, newMessage]);
        if (onMessage) onMessage(newMessage);
      };
      
      // 注册自定义事件监听器
      events.forEach(eventName => {
        if (eventName === 'message') return; // 默认事件已处理
        
        source.addEventListener(eventName, (event: any) => {
          const newMessage: SSEMessage = {
            id: event.lastEventId || `${eventName}-${Date.now()}`,
            event: eventName,
            data: event.data,
            timestamp: new Date().toISOString(),
          };
          
          // 尝试解析JSON数据
          try {
            newMessage.parsed = JSON.parse(event.data);
          } catch (e) {
            // 如果不是JSON格式，保持原样
          }
          
          // 更新消息列表
          setMessages(prev => [...prev, newMessage]);
          if (onMessage) onMessage(newMessage);
        });
      });
      
    } catch (err) {
      setStatus('error');
      const errorMessage = `创建连接失败: ${err}`;
      setError(errorMessage);
      if (onError) onError(err);
    }
  }, [serverUrl, events, onConnect, onError, onMessage]);
  
  // 断开SSE连接
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setEventSource(null);
      setStatus('disconnected');
      if (onDisconnect) onDisconnect();
    }
  }, [onDisconnect]);
  
  // 监听自定义事件
  const addCustomEventListener = useCallback(() => {
    if (!customEvent.trim() || !eventSourceRef.current || status !== 'connected') {
      return;
    }
    
    const eventName = customEvent.trim();
    
    // 如果已存在该事件监听器，先返回
    if (events.includes(eventName)) {
      return;
    }
    
    // 添加自定义事件监听器
    eventSourceRef.current.addEventListener(eventName, (event: any) => {
      const newMessage: SSEMessage = {
        id: event.lastEventId || `${eventName}-${Date.now()}`,
        event: eventName,
        data: event.data,
        timestamp: new Date().toISOString(),
      };
      
      // 尝试解析JSON数据
      try {
        newMessage.parsed = JSON.parse(event.data);
      } catch (e) {
        // 如果不是JSON格式，保持原样
      }
      
      // 更新消息列表
      setMessages(prev => [...prev, newMessage]);
      if (onMessage) onMessage(newMessage);
    });
    
    // 更新事件列表
    events.push(eventName);
    
    // 清空输入框
    setCustomEvent('');
  }, [customEvent, events, status, onMessage]);
  
  // 清空消息列表
  const clearMessages = () => {
    setMessages([]);
  };
  
  // 自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // 自动连接（如果启用）
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    
    // 组件卸载时断开连接
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [autoConnect, connect]);
  
  // 格式化时间
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString();
  };
  
  // 获取连接状态标签
  const getStatusTag = () => {
    switch (status) {
      case 'connected':
        return <Tag icon={<CheckCircleTwoTone twoToneColor="#52c41a" />} color="success">已连接</Tag>;
      case 'connecting':
        return <Tag icon={<ClockCircleOutlined />} color="processing">连接中</Tag>;
      case 'error':
        return <Tag icon={<ExclamationCircleTwoTone twoToneColor="#f5222d" />} color="error">连接错误</Tag>;
      case 'disconnected':
      default:
        return <Tag icon={<DisconnectOutlined />} color="default">已断开</Tag>;
    }
  };
  
  // 筛选消息
  const filteredMessages = filterEvent 
    ? messages.filter(msg => msg.event.includes(filterEvent))
    : messages;
  
  return (
    <div className="sse-client">
      <Card
        title={
          <Space>
            <ApiOutlined />
            <span>SSE 客户端</span>
            {getStatusTag()}
          </Space>
        }
        extra={
          <Space>
            {status === 'disconnected' || status === 'error' ? (
              <Tooltip title="连接到服务器">
                <Button 
                  type="primary" 
                  icon={<LinkOutlined />} 
                  onClick={connect}
                >
                  连接
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="断开连接">
                <Button 
                  danger 
                  icon={<DisconnectOutlined />} 
                  onClick={disconnect}
                >
                  断开
                </Button>
              </Tooltip>
            )}
            <Tooltip title="清空消息">
              <Button 
                icon={<ClearOutlined />} 
                onClick={clearMessages}
              >
                清空
              </Button>
            </Tooltip>
          </Space>
        }
      >
        <div className="server-info">
          <Paragraph>
            <Text strong>服务器地址: </Text>
            <Text code>{serverUrl}</Text>
          </Paragraph>
          
          <Paragraph>
            <Text strong>监听事件: </Text>
            <Space wrap>
              {events.map(event => (
                <Tag key={event} color="blue">{event}</Tag>
              ))}
            </Space>
          </Paragraph>
        </div>
        
        {error && (
          <Alert 
            message="连接错误" 
            description={error} 
            type="error" 
            showIcon 
            closable 
            style={{ marginBottom: 16 }}
          />
        )}
        
        <div className="actions">
          <Space style={{ marginBottom: 16 }}>
            <Input 
              placeholder="添加自定义事件监听器" 
              value={customEvent} 
              onChange={e => setCustomEvent(e.target.value)}
              onPressEnter={addCustomEventListener}
              disabled={status !== 'connected'}
              prefix={<InfoCircleOutlined />}
            />
            <Button 
              type="primary"
              icon={<SendOutlined />} 
              onClick={addCustomEventListener}
              disabled={status !== 'connected'}
            >
              添加
            </Button>
          </Space>
          
          <Input 
            placeholder="筛选事件类型" 
            value={filterEvent} 
            onChange={e => setFilterEvent(e.target.value)}
            style={{ marginBottom: 16 }}
            allowClear
          />
        </div>
        
        <div className="message-list">
          <Card
            className="messages-card"
            size="small"
            title={
              <Space>
                <span>接收的消息</span>
                <Tag color="blue">{filteredMessages.length} 条</Tag>
              </Space>
            }
            extra={
              <Button 
                icon={<ReloadOutlined />} 
                size="small" 
                onClick={clearMessages}
              >
                清空
              </Button>
            }
          >
            {status === 'connecting' ? (
              <div className="message-loading">
                <Spin tip="正在连接服务器..." />
              </div>
            ) : filteredMessages.length === 0 ? (
              <Empty description="暂无消息" />
            ) : (
              <List
                className="messages"
                itemLayout="vertical"
                dataSource={filteredMessages}
                renderItem={msg => (
                  <List.Item key={msg.id} className="message-item">
                    <div className="message-header">
                      <Space size="small">
                        <Tag color={msg.event === 'message' ? 'green' : 'purple'}>
                          {msg.event}
                        </Tag>
                        <Text type="secondary">{formatTime(msg.timestamp)}</Text>
                        <Text code className="message-id">ID: {msg.id}</Text>
                      </Space>
                    </div>
                    <div className="message-content">
                      {msg.parsed ? (
                        <div className="message-json">
                          <pre>{JSON.stringify(msg.parsed, null, 2)}</pre>
                        </div>
                      ) : (
                        <div className="message-text">
                          {msg.data}
                        </div>
                      )}
                    </div>
                  </List.Item>
                )}
              />
            )}
            <div ref={messagesEndRef} />
          </Card>
        </div>
      </Card>
      
      <style>{`
        .sse-client {
          margin: 0 auto;
          max-width: 100%;
        }
        
        .server-info {
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px dashed #f0f0f0;
        }
        
        .message-list {
          border-radius: 4px;
          overflow: hidden;
        }
        
        .messages-card {
          height: 100%;
        }
        
        .messages {
          max-height: 400px;
          overflow-y: auto;
          padding: 0 8px;
        }
        
        .message-item {
          border-bottom: 1px solid #f0f0f0;
          padding: 12px 8px;
        }
        
        .message-item:last-child {
          border-bottom: none;
        }
        
        .message-header {
          margin-bottom: 8px;
        }
        
        .message-id {
          font-size: 12px;
        }
        
        .message-content {
          margin-top: 8px;
        }
        
        .message-json {
          background: #f9f9f9;
          border-radius: 4px;
          padding: 8px;
          overflow-x: auto;
        }
        
        .message-json pre {
          margin: 0;
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          font-size: 12px;
        }
        
        .message-text {
          padding: 8px;
          word-break: break-word;
          white-space: pre-wrap;
        }
        
        .message-loading {
          padding: 40px 0;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default SSEClient; 