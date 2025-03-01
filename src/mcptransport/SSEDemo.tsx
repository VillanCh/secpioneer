import React, { useState } from 'react';
import { Typography, Input, Button, Space, Form, Alert, Divider } from 'antd';
import { ApiOutlined, SendOutlined } from '@ant-design/icons';
import SSEClient from './SSEClient';

const { Text, Paragraph } = Typography;

/**
 * SSE 演示组件
 * 用于展示和测试 SSE 客户端的功能
 */
const SSEDemo: React.FC = () => {
  const [serverUrl, setServerUrl] = useState<string>('http://localhost:11432');
  const [message, setMessage] = useState<string>('');
  const [showClient, setShowClient] = useState<boolean>(false);
  const [customEvents, setCustomEvents] = useState<string[]>(['message']);

  const handleConnect = () => {
    if (!serverUrl) {
      return;
    }
    setShowClient(true);
  };

  const handleAddCustomEvent = (value: string) => {
    if (!value || customEvents.includes(value)) {
      return;
    }
    setCustomEvents([...customEvents, value]);
  };

  return (
    <div className="sse-demo">
      <div className="connection-form">
        <Form layout="horizontal" labelCol={{ span: 4 }} wrapperCol={{ span: 20 }}>
          <Form.Item label="服务器地址" required>
            <Input
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="例如: http://localhost:11432"
              allowClear
              addonBefore="SSE"
            />
          </Form.Item>
          
          <Form.Item label="自定义事件">
            <Space>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="添加自定义事件名称"
                onPressEnter={() => {
                  handleAddCustomEvent(message);
                  setMessage('');
                }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => {
                  handleAddCustomEvent(message);
                  setMessage('');
                }}
              >
                添加
              </Button>
            </Space>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">
                当前事件: {customEvents.join(', ')}
              </Text>
            </div>
          </Form.Item>
          
          <Form.Item wrapperCol={{ offset: 4, span: 20 }}>
            <Button type="primary" onClick={handleConnect}>
              {showClient ? "重新连接" : "连接"}
            </Button>
            {showClient && (
              <Button 
                style={{ marginLeft: 8 }} 
                onClick={() => setShowClient(false)}
              >
                关闭客户端
              </Button>
            )}
          </Form.Item>
        </Form>
      </div>

      {showClient && (
        <div style={{ marginTop: 16 }}>
          <SSEClient
            serverUrl={serverUrl}
            events={customEvents}
            onConnect={() => console.log('SSE 连接已建立')}
            onDisconnect={() => console.log('SSE 连接已断开')}
            onError={(err) => console.error('SSE 连接错误:', err)}
            onMessage={(msg) => console.log('收到消息:', msg)}
          />
        </div>
      )}

      <style>{`
        .sse-demo {
          width: 100%;
        }
        
        .connection-form {
          background: #f9f9f9;
          border-radius: 4px;
          padding: 16px;
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
};

export default SSEDemo; 