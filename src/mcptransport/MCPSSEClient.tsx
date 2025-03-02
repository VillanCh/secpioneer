import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, Typography, Button, Input, Form, Space, 
  Divider, Table, Tag, Collapse, Alert, List, 
  notification, Badge, Empty, Spin, Tabs, Row, Col, Tooltip 
} from 'antd';
import { 
  ApiOutlined, SendOutlined, SyncOutlined, 
  InfoCircleOutlined, CodeOutlined, ToolOutlined, 
  FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined 
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { TabPane } = Tabs;

// JSON-RPC 2.0 消息类型定义
interface JSONRPCRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: any;
}

interface JSONRPCResponse {
  jsonrpc: "2.0";
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

interface JSONRPCNotification {
  jsonrpc: "2.0";
  method: string;
  params?: any;
}

type JSONRPCMessage = JSONRPCRequest | JSONRPCResponse | JSONRPCNotification;

// MCP 资源类型定义
interface MCPPrompt {
  id: string;
  name: string;
  description: string;
  parameters: any[];
}

interface MCPResource {
  id: string;
  path: string;
  type: string;
  size: number;
}

interface MCPTool {
  name: string;
  description: string;
  arguments: any;
  returnType: string;
}

interface MCPSSEClientProps {
  serverUrl: string;
  onStatusChange?: (status: 'connected' | 'disconnected' | 'error', message?: string) => void;
}

/**
 * MCP SSE 客户端组件
 * 基于 Server-Sent Events (SSE) 实现的 Model Context Protocol 客户端
 */
const MCPSSEClient: React.FC<MCPSSEClientProps> = ({ 
  serverUrl, 
  onStatusChange 
}) => {
  // 客户端状态
  const [connected, setConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // 消息相关状态
  const [messages, setMessages] = useState<JSONRPCMessage[]>([]);
  const [requestMethod, setRequestMethod] = useState<string>('getCapabilities');
  const [requestParams, setRequestParams] = useState<string>('{}');
  const [requestId, setRequestId] = useState<number>(1);
  
  // MCP 资源状态
  const [prompts, setPrompts] = useState<MCPPrompt[]>([]);
  const [resources, setResources] = useState<MCPResource[]>([]);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [capabilities, setCapabilities] = useState<any>(null);
  
  // SSE 事件源和请求状态
  const eventSourceRef = useRef<EventSource | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 连接到 SSE 服务器
  const connect = () => {
    if (connected) {
      disconnect();
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 处理 URL 格式化
      let sseUrl = serverUrl;
      // 确保 URL 以 /sse 结尾
      if (!sseUrl.endsWith('/sse')) {
        sseUrl = sseUrl.endsWith('/') ? `${sseUrl}sse` : `${sseUrl}/sse`;
      }
      
      console.log('连接到 SSE 服务器:', sseUrl);
      
      // 创建 SSE 连接
      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;
      
      // 设置事件处理程序
      eventSource.onopen = () => {
        setConnected(true);
        setLoading(false);
        onStatusChange?.('connected');
        notification.success({
          message: 'MCP 客户端已连接',
          description: `成功连接到 ${serverUrl}`
        });
      };
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleIncomingMessage(data);
        } catch (err) {
          console.error('解析消息失败:', err);
        }
      };
      
      eventSource.onerror = (err) => {
        setError('SSE 连接错误');
        setLoading(false);
        setConnected(false);
        onStatusChange?.('error', '连接错误');
        notification.error({
          message: 'MCP 客户端连接错误',
          description: '与服务器建立 SSE 连接时发生错误'
        });
        disconnect();
      };
      
      // 监听特定事件类型
      eventSource.addEventListener('capabilities', (event) => {
        try {
          const data = JSON.parse(event.data);
          setCapabilities(data);
        } catch (err) {
          console.error('解析能力消息失败:', err);
        }
      });
      
    } catch (err) {
      setError(`连接错误: ${err}`);
      setLoading(false);
      setConnected(false);
      onStatusChange?.('error', `${err}`);
    }
  };
  
  // 断开 SSE 连接
  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setConnected(false);
      onStatusChange?.('disconnected');
      notification.info({
        message: 'MCP 客户端已断开连接',
        description: '已关闭与服务器的 SSE 连接'
      });
    }
  };
  
  // 处理接收到的消息
  const handleIncomingMessage = (message: JSONRPCMessage) => {
    setMessages((prev) => [...prev, message]);
    
    // 检查是否为响应消息且包含结果
    if ('result' in message) {
      // 从消息中提取方法名和结果
      // 注意：在实际情况中，服务器响应可能不包含 method 字段
      // 我们需要根据请求 ID 或其他标识符来确定响应对应的请求类型
      const responseMethod = ('method' in message) ? message.method : 
                            requestMethod; // 使用最近的请求方法作为默认值
      
      // 处理不同类型的响应
      if (responseMethod === 'listPrompts') {
        setPrompts(message.result);
      } else if (responseMethod === 'listResources') {
        setResources(message.result);
      } else if (responseMethod === 'listTools') {
        setTools(message.result);
      } else if (responseMethod === 'getCapabilities') {
        setCapabilities(message.result);
      }
    }
    
    // 滚动到消息底部
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // 发送 JSON-RPC 请求
  const sendRequest = async () => {
    if (!connected) {
      notification.warning({
        message: '未连接',
        description: '请先连接到 MCP 服务器'
      });
      return;
    }
    
    try {
      const params = JSON.parse(requestParams);
      const request: JSONRPCRequest = {
        jsonrpc: "2.0",
        id: requestId,
        method: requestMethod,
        params
      };
      
      // 添加到消息列表
      setMessages((prev) => [...prev, request]);
      
      // 构建消息端点 URL
      let messageUrl = serverUrl;
      // 如果 URL 以 /sse 结尾，去掉 /sse 并添加 /messages
      if (messageUrl.endsWith('/sse')) {
        messageUrl = messageUrl.slice(0, -4);
      }
      // 确保以 /messages 结尾
      if (!messageUrl.endsWith('/messages')) {
        messageUrl = messageUrl.endsWith('/') ? `${messageUrl}messages` : `${messageUrl}/messages`;
      }
      
      console.log('发送请求到:', messageUrl);
      
      // 使用 HTTP POST 发送请求
      const response = await fetch(messageUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP 错误: ${response.status}`);
      }
      
      // 增加请求 ID
      setRequestId(prev => prev + 1);
      
    } catch (err) {
      notification.error({
        message: '发送请求失败',
        description: `错误: ${err}`
      });
    }
  };
  
  // 获取常用方法列表
  const commonMethods = [
    { name: 'getCapabilities', description: '获取服务器能力' },
    { name: 'listPrompts', description: '列出可用的提示' },
    { name: 'listResources', description: '列出可用的资源' },
    { name: 'listTools', description: '列出可用的工具' },
    { name: 'getText', description: '获取文本生成' },
    { name: 'getChat', description: '获取聊天响应' }
  ];
  
  // 格式化 JSON 显示
  const formatJSON = (json: any): string => {
    try {
      return JSON.stringify(json, null, 2);
    } catch (err) {
      return String(json);
    }
  };
  
  // 获取消息类型标签
  const getMessageTypeTag = (message: JSONRPCMessage) => {
    if ('method' in message && 'id' in message) {
      return <Tag color="blue">请求</Tag>;
    } else if ('result' in message || 'error' in message) {
      return <Tag color="green">响应</Tag>;
    } else if ('method' in message) {
      return <Tag color="orange">通知</Tag>;
    }
    return <Tag color="default">未知</Tag>;
  };
  
  // 清空消息记录
  const clearMessages = () => {
    setMessages([]);
  };
  
  // 在组件卸载时清理
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <div className="mcp-sse-client">
      <Card 
        title={
          <Space>
            <ApiOutlined />
            <span>MCP SSE 客户端</span>
            <Badge 
              status={connected ? "success" : "default"} 
              text={connected ? "已连接" : "未连接"} 
            />
          </Space>
        }
        extra={
          <Space>
            <Button
              type={connected ? "default" : "primary"}
              icon={connected ? <CloseCircleOutlined /> : <ApiOutlined />}
              onClick={connect}
              loading={loading}
            >
              {connected ? "断开连接" : "连接"}
            </Button>
          </Space>
        }
      >
        {!connected && (
          <Alert
            message="使用提示"
            description="点击右上角「连接」按钮开始与 MCP 服务器建立 SSE 连接。连接成功后，可以在「请求操作」标签页发送 JSON-RPC 请求。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            closable
          />
        )}
        
        <div className="connection-info">
          <Text strong>服务器地址: </Text>
          <Text code>{serverUrl}</Text>
          
          {error && (
            <Alert 
              message="连接错误" 
              description={error} 
              type="error" 
              showIcon 
              style={{ marginTop: 8 }}
            />
          )}
        </div>
        
        <Divider />
        
        <Tabs defaultActiveKey="request">
          <TabPane 
            tab={<span><SendOutlined /> 请求操作</span>} 
            key="request"
          >
            <div className="request-panel">
              {!connected ? (
                <div className="not-connected-message">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <div>
                        <Text type="secondary">请先连接到 MCP 服务器</Text>
                        <br />
                        <Button 
                          type="primary" 
                          icon={<ApiOutlined />} 
                          onClick={connect}
                          style={{ marginTop: 16 }}
                          loading={loading}
                        >
                          连接服务器
                        </Button>
                      </div>
                    }
                  />
                </div>
              ) : (
                <Form layout="vertical">
                  <Form.Item 
                    label={<Text strong>方法名称</Text>}
                    help="选择或输入要调用的 JSON-RPC 方法"
                  >
                    <Input
                      value={requestMethod}
                      onChange={(e) => setRequestMethod(e.target.value)}
                      placeholder="输入 JSON-RPC 方法名"
                      addonBefore={<Text strong>Method</Text>}
                      size="middle"
                      className="method-input"
                    />
                    <div className="common-methods">
                      <Text type="secondary">常用方法：</Text>
                      <div className="method-tags">
                        {commonMethods.map(method => (
                          <Tooltip key={method.name} title={method.description}>
                            <Tag 
                              color="blue"
                              style={{ margin: '4px', cursor: 'pointer' }}
                              onClick={() => setRequestMethod(method.name)}
                            >
                              {method.name}
                            </Tag>
                          </Tooltip>
                        ))}
                      </div>
                    </div>
                  </Form.Item>
                  
                  <Form.Item 
                    label={<Text strong>参数 (JSON 格式)</Text>}
                    help="输入 JSON 格式的请求参数，例如: {}"
                  >
                    <Input.TextArea
                      value={requestParams}
                      onChange={(e) => setRequestParams(e.target.value)}
                      placeholder="输入 JSON 格式的参数，例如: {}"
                      rows={4}
                      className="params-textarea"
                      style={{ fontFamily: 'monospace', backgroundColor: '#f9f9f9' }}
                    />
                  </Form.Item>
                  
                  <Form.Item>
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={sendRequest}
                      disabled={!connected}
                      size="middle"
                      style={{ width: '120px' }}
                    >
                      发送请求
                    </Button>
                  </Form.Item>
                </Form>
              )}
            </div>
          </TabPane>
          
          <TabPane 
            tab={<span><InfoCircleOutlined /> MCP 资源</span>} 
            key="resources"
          >
            <div className="resources-panel">
              {!connected ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="请先连接到 MCP 服务器查看资源信息"
                />
              ) : (
                <Tabs type="card" defaultActiveKey="capabilities">
                  <TabPane 
                    tab={<span><InfoCircleOutlined /> 服务器能力</span>} 
                    key="capabilities"
                  >
                    {capabilities ? (
                      <div className="json-display">
                        <pre>{formatJSON(capabilities)}</pre>
                      </div>
                    ) : (
                      <Empty 
                        description={
                          <div>
                            <Text type="secondary">未获取到服务器能力信息</Text>
                            <div style={{ marginTop: 16 }}>
                              <Button 
                                type="primary" 
                                icon={<SyncOutlined />}
                                onClick={() => {
                                  setRequestMethod('getCapabilities');
                                  setRequestParams('{}');
                                  sendRequest();
                                }}
                              >
                                获取能力信息
                              </Button>
                            </div>
                          </div>
                        } 
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )}
                  </TabPane>
                  
                  <TabPane 
                    tab={<span><CodeOutlined /> 提示词 ({prompts.length})</span>} 
                    key="prompts"
                  >
                    {prompts.length > 0 ? (
                      <List
                        dataSource={prompts}
                        renderItem={prompt => (
                          <List.Item>
                            <Card style={{ width: '100%' }}>
                              <Space direction="vertical" style={{ width: '100%' }}>
                                <Space>
                                  <Text strong>{prompt.name}</Text>
                                  <Tag color="cyan">ID: {prompt.id}</Tag>
                                </Space>
                                <Paragraph>{prompt.description}</Paragraph>
                                <Collapse ghost>
                                  <Panel header="参数列表" key="1">
                                    <List
                                      size="small"
                                      dataSource={prompt.parameters}
                                      renderItem={param => (
                                        <List.Item>
                                          <Space>
                                            <Text code>{param.name}</Text>
                                            <Tag color="blue">{param.type}</Tag>
                                            <Text type="secondary">{param.description}</Text>
                                          </Space>
                                        </List.Item>
                                      )}
                                    />
                                  </Panel>
                                </Collapse>
                              </Space>
                            </Card>
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Empty 
                        description={
                          <div>
                            <Text type="secondary">未获取到提示词信息</Text>
                            <div style={{ marginTop: 16 }}>
                              <Button 
                                type="primary" 
                                icon={<SyncOutlined />}
                                onClick={() => {
                                  setRequestMethod('listPrompts');
                                  setRequestParams('{}');
                                  sendRequest();
                                }}
                              >
                                获取提示词列表
                              </Button>
                            </div>
                          </div>
                        } 
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )}
                  </TabPane>
                  
                  <TabPane 
                    tab={<span><FileTextOutlined /> 资源 ({resources.length})</span>} 
                    key="resources"
                  >
                    {resources.length > 0 ? (
                      <Table 
                        dataSource={resources}
                        columns={[
                          {
                            title: 'ID',
                            dataIndex: 'id',
                            key: 'id',
                            width: 100,
                            render: (text) => <Text code>{text}</Text>
                          },
                          {
                            title: '路径',
                            dataIndex: 'path',
                            key: 'path',
                            ellipsis: true,
                            render: (text) => <Text code>{text}</Text>
                          },
                          {
                            title: '类型',
                            dataIndex: 'type',
                            key: 'type',
                            width: 180,
                            render: (text) => <Tag color="green">{text}</Tag>
                          },
                          {
                            title: '大小',
                            dataIndex: 'size',
                            key: 'size',
                            width: 120,
                            render: (size) => `${size} bytes`
                          }
                        ]}
                        pagination={false}
                        size="small"
                        rowKey="id"
                      />
                    ) : (
                      <Empty 
                        description={
                          <div>
                            <Text type="secondary">未获取到资源信息</Text>
                            <div style={{ marginTop: 16 }}>
                              <Button 
                                type="primary" 
                                icon={<SyncOutlined />}
                                onClick={() => {
                                  setRequestMethod('listResources');
                                  setRequestParams('{}');
                                  sendRequest();
                                }}
                              >
                                获取资源列表
                              </Button>
                            </div>
                          </div>
                        } 
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )}
                  </TabPane>
                  
                  <TabPane 
                    tab={<span><ToolOutlined /> 工具 ({tools.length})</span>} 
                    key="tools"
                  >
                    {tools.length > 0 ? (
                      <div className="tools-grid">
                        {tools.map(tool => (
                          <Card 
                            key={tool.name}
                            title={tool.name}
                            size="small"
                            style={{ marginBottom: 16 }}
                          >
                            <Space direction="vertical" style={{ width: '100%' }}>
                              <Paragraph>{tool.description}</Paragraph>
                              <Divider style={{ margin: '8px 0' }} />
                              <Text strong>参数:</Text>
                              <List
                                size="small"
                                dataSource={Object.entries(tool.arguments)}
                                renderItem={([name, details]: [string, any]) => (
                                  <List.Item>
                                    <Space>
                                      <Text code>{name}</Text>
                                      <Tag color="blue">{details.type}</Tag>
                                      <Text type="secondary">{details.description}</Text>
                                    </Space>
                                  </List.Item>
                                )}
                              />
                              <Text strong>返回类型: <Tag color="orange">{tool.returnType}</Tag></Text>
                            </Space>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Empty 
                        description={
                          <div>
                            <Text type="secondary">未获取到工具信息</Text>
                            <div style={{ marginTop: 16 }}>
                              <Button 
                                type="primary" 
                                icon={<SyncOutlined />}
                                onClick={() => {
                                  setRequestMethod('listTools');
                                  setRequestParams('{}');
                                  sendRequest();
                                }}
                              >
                                获取工具列表
                              </Button>
                            </div>
                          </div>
                        } 
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )}
                  </TabPane>
                </Tabs>
              )}
            </div>
          </TabPane>
          
          <TabPane 
            tab={<span><CodeOutlined /> 消息记录 ({messages.length})</span>} 
            key="messages"
          >
            <div style={{ marginBottom: 16 }}>
              <Button 
                onClick={clearMessages} 
                type="default" 
                size="small"
                disabled={messages.length === 0}
              >
                清空消息
              </Button>
            </div>
            
            <div className="messages-container">
              {messages.length === 0 ? (
                <Empty 
                  description="暂无消息记录，连接后发送请求会在此显示" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <div>
                  {messages.map((message, index) => (
                    <div key={index} className="message-item">
                      <div className="message-header">
                        <Space>
                          {getMessageTypeTag(message)}
                          {'method' in message && (
                            <Tag color="purple">{message.method}</Tag>
                          )}
                          {'id' in message && (
                            <Tag color="cyan">ID: {message.id}</Tag>
                          )}
                        </Space>
                      </div>
                      <div className="message-content">
                        <pre>{formatJSON(message)}</pre>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </TabPane>
        </Tabs>

        <style>{`
          .mcp-sse-client {
            width: 100%;
          }
          
          .connection-info {
            margin-bottom: 16px;
          }
          
          .common-methods {
            margin-top: 12px;
            background-color: #f5f5f5;
            padding: 8px 12px;
            border-radius: 4px;
          }
          
          .method-tags {
            margin-top: 8px;
            display: flex;
            flex-wrap: wrap;
          }
          
          .method-input {
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          }
          
          .params-textarea {
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            border: 1px solid #d9d9d9;
          }
          
          .json-display {
            background: #f5f5f5;
            border: 1px solid #eee;
            border-radius: 4px;
            padding: 16px;
            overflow: auto;
            max-height: 400px;
          }
          
          .json-display pre {
            margin: 0;
            white-space: pre-wrap;
            word-break: break-all;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 13px;
          }
          
          .messages-container {
            height: 400px;
            overflow-y: auto;
            border: 1px solid #eee;
            border-radius: 4px;
            padding: 8px;
            background: #f9f9f9;
          }
          
          .message-item {
            margin-bottom: 12px;
            background: white;
            border-radius: 4px;
            border-left: 3px solid #1890ff;
            overflow: hidden;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          }
          
          .message-header {
            padding: 8px 12px;
            background: #f0f7ff;
            border-bottom: 1px solid #e6f7ff;
          }
          
          .message-content {
            padding: 12px;
            overflow-x: auto;
          }
          
          .message-content pre {
            margin: 0;
            white-space: pre-wrap;
            word-break: break-all;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 13px;
            color: #333;
          }
          
          .tools-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 16px;
          }
          
          .not-connected-message {
            padding: 32px 0;
            text-align: center;
          }
          
          .request-panel, .resources-panel {
            min-height: 300px;
          }
        `}</style>
      </Card>
    </div>
  );
};

export default MCPSSEClient;