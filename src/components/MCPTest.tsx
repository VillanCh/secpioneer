import React, { useState } from 'react';
import { Card, Typography, Input, Form, Button, Space, Alert, Tooltip, Divider, Tabs } from 'antd';
import { ApiOutlined, InfoCircleOutlined, ExperimentOutlined, CodeOutlined } from '@ant-design/icons';
import { MCPSSEClient, SimpleSSEDemo } from '../mcptransport';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

/**
 * MCP测试工具组件
 * 提供独立的MCP服务器测试功能，不依赖MCP配置
 */
const MCPTest: React.FC = () => {
  const [serverUrl, setServerUrl] = useState<string>('http://localhost:11432');
  const [connected, setConnected] = useState<boolean>(false);
  const [showClient, setShowClient] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('mcpClient');

  // 处理连接按钮点击
  const handleConnect = () => {
    if (!serverUrl) {
      return;
    }
    
    setShowClient(true);
  };

  return (
    <div className="mcp-test">
      <Card 
        title={
          <Space>
            <ApiOutlined />
            <span>MCP测试工具</span>
            <Tooltip title="独立测试MCP服务器功能">
              <InfoCircleOutlined />
            </Tooltip>
          </Space>
        }
        className="mcp-test-card"
        bodyStyle={{ padding: '16px 8px' }}
      >
        <Alert
          message="使用说明"
          description={
            <div>
              <Paragraph>
                MCP测试工具允许您直接连接到MCP服务器并测试其功能，无需先配置服务器。
                只需输入服务器地址并点击连接按钮即可开始测试。
              </Paragraph>
              <Paragraph>
                支持的功能：
                <ul>
                  <li>发送JSON-RPC请求并接收响应</li>
                  <li>查看服务器能力、提示词、资源和工具</li>
                  <li>测试模型生成和聊天功能</li>
                  <li>记录完整的通信历史</li>
                </ul>
              </Paragraph>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form layout="vertical" style={{ padding: '0 8px' }}>
          <Form.Item 
            label="MCP服务器地址" 
            help="输入MCP服务器的URL地址，例如：http://localhost:11432"
          >
            <Input
              placeholder="例如：http://localhost:11432"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              suffix={
                <Button 
                  type="primary" 
                  onClick={handleConnect}
                >
                  连接
                </Button>
              }
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>

        <Divider style={{ margin: '16px 0' }} />

        <div className="tabs-container">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            className="mcp-test-tabs"
            type="card"
          >
            <TabPane 
              tab={<span><ApiOutlined /> MCP客户端</span>} 
              key="mcpClient"
            >
              <div className="tab-content-wrapper">
                {showClient ? (
                  <div className="mcp-client-container">
                    <MCPSSEClient 
                      serverUrl={serverUrl}
                      onStatusChange={(status, message) => {
                        if (status === 'connected') {
                          setConnected(true);
                        } else if (status === 'disconnected' || status === 'error') {
                          setConnected(false);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="empty-client-container">
                    <Alert
                      message="请先连接到MCP服务器"
                      description="在上方输入MCP服务器地址并点击连接按钮来启动MCP客户端"
                      type="info"
                      showIcon
                    />
                  </div>
                )}
              </div>
            </TabPane>
            <TabPane 
              tab={<span><ExperimentOutlined /> SSE演示</span>} 
              key="sseDemo"
            >
              <div className="tab-content-wrapper">
                <div className="sse-demo-container">
                  <SimpleSSEDemo serverUrl={`${serverUrl}${serverUrl.endsWith('/') ? 'sse' : '/sse'}`} />
                  <div className="sse-demo-info">
                    <Alert
                      message="SSE通信演示"
                      description={
                        <div>
                          <Paragraph>
                            此演示展示了使用Server-Sent Events（SSE）进行服务器推送的基本功能。
                            点击连接按钮建立SSE连接，然后可以接收服务器推送的实时消息。
                          </Paragraph>
                          <Paragraph>
                            与WebSocket不同，SSE是单向通信（服务器到客户端），适合需要服务器主动推送数据的场景。
                          </Paragraph>
                        </div>
                      }
                      type="info"
                      showIcon
                    />
                  </div>
                </div>
              </div>
            </TabPane>
            <TabPane 
              tab={<span><CodeOutlined /> 代码示例</span>} 
              key="codeExamples"
            >
              <div className="tab-content-wrapper">
                <div className="code-examples-container">
                  <Alert
                    message="MCP客户端代码示例"
                    description={
                      <div>
                        <Paragraph>
                          以下是使用JavaScript/TypeScript创建MCP客户端的简单示例：
                        </Paragraph>
                        <pre className="code-block">
{`// 创建MCP客户端连接
const connectMCP = (serverUrl) => {
  // 创建SSE连接
  const eventSource = new EventSource(\`\${serverUrl}/sse\`);
  
  // 设置事件处理
  eventSource.onopen = () => console.log('已连接到MCP服务器');
  eventSource.onmessage = (event) => console.log('收到消息:', event.data);
  eventSource.onerror = () => console.error('连接错误');
  
  // 发送MCP请求
  const sendRequest = async (method, params) => {
    const request = {
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params
    };
    
    const response = await fetch(\`\${serverUrl}/messages\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    
    return response.json();
  };
  
  return {
    eventSource,
    sendRequest,
    close: () => eventSource.close()
  };
};`}
                        </pre>
                        <Paragraph style={{ marginTop: 16 }}>
                          使用示例：
                        </Paragraph>
                        <pre className="code-block">
{`const client = connectMCP('http://localhost:11432');

// 获取服务器能力
client.sendRequest('getCapabilities', {})
  .then(response => console.log('服务器能力:', response))
  .catch(error => console.error('请求失败:', error));

// 关闭连接
// client.close();`}
                        </pre>
                      </div>
                    }
                    type="info"
                    showIcon
                  />
                </div>
              </div>
            </TabPane>
          </Tabs>
        </div>

        <style>{`
          .mcp-test {
            height: 100%;
            overflow-y: auto;
            padding: 0;
            background-color: #fff;
            display: flex;
            flex-direction: column;
          }
          
          .mcp-test-card {
            border: none;
            height: 100%;
            background-color: #fff;
            display: flex;
            flex-direction: column;
            flex: 1;
          }
          
          .mcp-test-card .ant-card-head {
            padding-left: 16px;
            background-color: #f5f5f5;
            border-bottom: 1px solid #f0f0f0;
            flex-shrink: 0;
          }
          
          .mcp-test-card .ant-card-body {
            height: auto;
            flex: 1;
            overflow-y: auto;
            position: relative;
            background-color: #fff;
            display: flex;
            flex-direction: column;
          }
          
          .tabs-container {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 300px;
            position: relative;
            margin: 0 -8px;
          }
          
          .mcp-test-tabs {
            height: 100%;
            display: flex;
            flex-direction: column;
            flex: 1;
          }
          
          .mcp-test-tabs .ant-tabs-content {
            flex: 1;
            overflow-y: auto;
            background-color: #fff;
            border: 1px solid #eee;
            border-top: none;
            padding: 16px;
            border-radius: 0 0 4px 4px;
            min-height: 250px;
          }
          
          .mcp-test-tabs .ant-tabs-nav {
            margin-bottom: 0;
            flex-shrink: 0;
          }
          
          .mcp-test-tabs .ant-tabs-nav-list {
            margin-left: 8px;
          }
          
          .mcp-test-tabs .ant-tabs-tab {
            background-color: #f5f5f5;
            border: 1px solid #eee;
            border-bottom: none;
            margin-right: 2px;
            padding: 8px 16px;
          }
          
          .mcp-test-tabs .ant-tabs-tab-active {
            background-color: #fff;
            border-color: #eee;
            border-bottom: 1px solid #fff;
            padding-bottom: 9px;
            margin-bottom: -1px;
            z-index: 2;
          }
          
          .tab-content-wrapper {
            padding: 8px;
            height: 100%;
            min-height: 200px;
            display: flex;
            flex-direction: column;
          }
          
          .empty-client-container {
            padding: 32px 0;
            text-align: center;
          }
          
          .sse-demo-info {
            margin-top: 16px;
          }
          
          .code-block {
            background-color: #f5f5f5;
            padding: 12px;
            border-radius: 4px;
            overflow-x: auto;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 13px;
            line-height: 1.5;
          }
        `}</style>
      </Card>
    </div>
  );
};

export default MCPTest; 