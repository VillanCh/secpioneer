import React, { useState, useEffect } from 'react';
import { Typography, Card, List, Tag, Space, Button, Tooltip, Form, Input, Select, Divider, notification, Modal, Tabs, Collapse, Table, Row, Col, Empty, Badge } from 'antd';
import { 
  ApiOutlined, 
  CloudServerOutlined, 
  SafetyCertificateOutlined, 
  ThunderboltOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  LinkOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  CodeOutlined,
  FileTextOutlined,
  ToolOutlined,
  SyncOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  ExperimentOutlined
} from '@ant-design/icons';
import { Client as MCPClient } from "@modelcontextprotocol/sdk/client/index.js";

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Panel } = Collapse;

// MCP接口信息类型定义
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

interface MCPInterfaceInfo {
  prompts: MCPPrompt[];
  resources: MCPResource[];
  tools: MCPTool[];
}

// MCP服务器类型定义
interface MCPServer {
  id: string;
  type: 'Websocket' | 'SSE';
  target: string;
  status: 'online' | 'offline' | 'connecting';
  lastConnected?: string;
  interfaceInfo?: MCPInterfaceInfo;
  clientConnected?: boolean;
}

// MCP 客户端配置类型
interface MCPClientConfig {
  name: string;
  version: string;
  transport: {
    type: string;
    url: string;
  };
}

// 创建一个 mock 类代替实际的 SDK，因为导入存在问题
class MCPClientMock {
  private config: MCPClientConfig;
  
  constructor(config: MCPClientConfig) {
    this.config = config;
    console.log('MCP Client initialized with:', config);
  }
  
  async connect(): Promise<void> {
    console.log('Connecting to MCP server...');
    return new Promise<void>(resolve => setTimeout(resolve, 500));
  }
  
  async request(method: string, params: any): Promise<any[]> {
    console.log(`MCP Request: ${method}`, params);
    return [];
  }
}

interface MCPServerConfigProps {
  // 预留接口，方便后续扩展
}

const MCPServerConfig: React.FC<MCPServerConfigProps> = () => {
  // MCP 服务功能列表
  const mcpFeatures = [
    {
      title: '指令执行引擎',
      description: '能够执行各种安全操作指令，包括代码扫描、漏洞检测等',
      icon: <ThunderboltOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
      status: 'active'
    },
    {
      title: '实时监控系统',
      description: '监控应用系统状态和安全事件，提供实时告警',
      icon: <SafetyCertificateOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
      status: 'active'
    },
    {
      title: 'API 集成服务',
      description: '与多种安全工具和平台集成，扩展功能范围',
      icon: <ApiOutlined style={{ fontSize: '24px', color: '#722ed1' }} />,
      status: 'active'
    },
    {
      title: '任务调度系统',
      description: '管理和调度安全任务，保证任务顺序执行和资源分配',
      icon: <CloudServerOutlined style={{ fontSize: '24px', color: '#fa8c16' }} />,
      status: 'pending'
    }
  ];

  // MCP服务器列表状态
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([
    {
      id: '1',
      type: 'SSE',
      target: 'http://localhost:11432',
      status: 'online',
      lastConnected: '2023-07-15 14:30:22',
      clientConnected: false,
    }
  ]);

  // SDK 客户端实例
  const [mcpClient, setMcpClient] = useState<MCPClientMock | null>(null);

  // 表单状态
  const [form] = Form.useForm();
  const [showAddForm, setShowAddForm] = useState(false);
  
  // 详情模态框状态
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentServer, setCurrentServer] = useState<MCPServer | null>(null);
  const [connecting, setConnecting] = useState(false);

  // 模拟 MCP 客户端连接
  const connectMCPClient = async (server: MCPServer) => {
    if (server.clientConnected) {
      // 如果已连接，直接展示详情
      setCurrentServer(server);
      setDetailModalVisible(true);
      return;
    }

    setConnecting(true);
    setCurrentServer(server);
    
    try {
      // 使用 MCP SDK 创建客户端并连接
      const client = new MCPClientMock({
        name: "SecPioneer MCP Client",
        version: "1.0.0",
        transport: {
          type: server.type.toLowerCase(),
          url: server.target
        }
      });
      
      await client.connect();
      setMcpClient(client);
      
      // 获取服务器接口信息
      let interfaceInfo: MCPInterfaceInfo;
      
      try {
        // 调整API调用以匹配我们的Mock类
        const prompts: MCPPrompt[] = [];
        const resources: MCPResource[] = [];
        const tools: MCPTool[] = [];
        
        // 尝试获取所有可用提示
        try {
          const promptList = await client.request('listPrompts', {});
          if (Array.isArray(promptList)) {
            // 转换为 MCPPrompt 类型
            promptList.forEach(p => prompts.push({
              id: p.id || '',
              name: p.name || '',
              description: p.description || '',
              parameters: p.parameters || []
            }));
          }
        } catch (e) {
          console.warn('Failed to get prompts:', e);
        }
        
        // 尝试获取所有可用资源
        try {
          const resourceList = await client.request('listResources', {});
          if (Array.isArray(resourceList)) {
            // 转换为 MCPResource 类型
            resourceList.forEach(r => resources.push({
              id: r.id || '',
              path: r.path || '',
              type: r.type || '',
              size: r.size || 0
            }));
          }
        } catch (e) {
          console.warn('Failed to get resources:', e);
        }
        
        // 尝试获取所有可用工具
        try {
          const toolList = await client.request('listTools', {});
          if (Array.isArray(toolList)) {
            // 转换为 MCPTool 类型
            toolList.forEach(t => tools.push({
              name: t.name || '',
              description: t.description || '',
              arguments: t.arguments || {},
              returnType: t.returnType || ''
            }));
          }
        } catch (e) {
          console.warn('Failed to get tools:', e);
        }
        
        interfaceInfo = {
          prompts,
          resources,
          tools
        };
      } catch (e) {
        console.error('Failed to get real interface info, using mock data', e);
        // 如果获取失败，使用模拟数据
        interfaceInfo = {
          prompts: [
            {
              id: 'p1',
              name: 'security-code-review',
              description: '代码安全审计提示词',
              parameters: [
                { name: 'language', type: 'string', description: '编程语言' },
                { name: 'codeSnippet', type: 'string', description: '代码片段' }
              ]
            },
            {
              id: 'p2',
              name: 'vulnerability-analysis',
              description: '漏洞分析提示词',
              parameters: [
                { name: 'cveId', type: 'string', description: 'CVE编号' },
                { name: 'targetSystem', type: 'string', description: '目标系统' }
              ]
            }
          ],
          resources: [
            {
              id: 'r1',
              path: 'file:///security-rules.json',
              type: 'application/json',
              size: 1024
            },
            {
              id: 'r2',
              path: 'file:///cve-database.db',
              type: 'application/octet-stream',
              size: 5120
            }
          ],
          tools: [
            {
              name: 'code-scanner',
              description: '代码安全扫描工具',
              arguments: {
                source: { type: 'string', description: '源代码路径' },
                ruleSet: { type: 'string', description: '规则集' }
              },
              returnType: 'array'
            },
            {
              name: 'dependency-checker',
              description: '依赖检查工具',
              arguments: {
                projectPath: { type: 'string', description: '项目路径' }
              },
              returnType: 'object'
            },
            {
              name: 'network-analyzer',
              description: '网络流量分析工具',
              arguments: {
                capture: { type: 'string', description: '捕获文件' },
                filter: { type: 'string', description: '过滤条件' }
              },
              returnType: 'object'
            }
          ]
        };
      }
      
      // 更新服务器状态，添加接口信息
      setMcpServers(prev => 
        prev.map(s => 
          s.id === server.id 
            ? { ...s, interfaceInfo, clientConnected: true } 
            : s
        )
      );
      
      // 更新当前选中的服务器
      setCurrentServer({
        ...server,
        interfaceInfo,
        clientConnected: true
      });
      
      setDetailModalVisible(true);
      notification.success({
        message: 'MCP 客户端已连接',
        description: `成功连接到 ${server.target} 并获取接口信息`
      });
    } catch (error) {
      console.error('MCP 客户端连接失败', error);
      notification.error({
        message: 'MCP 客户端连接失败',
        description: `连接 ${server.target} 时发生错误: ${(error as Error).message}`
      });
    } finally {
      setConnecting(false);
    }
  };

  // 处理添加MCP服务器
  const handleAddServer = (values: any) => {
    // 如果用户没有指定端口，默认使用 11432
    let target = values.target;
    if (values.type === 'Websocket' && target === 'localhost') {
      target = 'ws://localhost:11432';
    } else if (values.type === 'SSE' && target === 'localhost') {
      target = 'http://localhost:11432';
    }
    
    const newServer: MCPServer = {
      id: Date.now().toString(),
      type: values.type,
      target,
      status: 'connecting',
      clientConnected: false
    };
    
    setMcpServers([...mcpServers, newServer]);
    form.resetFields();
    setShowAddForm(false);
    
    // 模拟连接成功
    setTimeout(() => {
      setMcpServers(prev => 
        prev.map(server => 
          server.id === newServer.id 
            ? {...server, status: 'online', lastConnected: new Date().toLocaleString()} 
            : server
        )
      );
      notification.success({
        message: 'MCP服务器已连接',
        description: `成功连接到 ${values.target}`
      });
    }, 1500);
  };

  // 处理删除MCP服务器
  const handleDeleteServer = (id: string) => {
    setMcpServers(mcpServers.filter(server => server.id !== id));
    notification.info({
      message: 'MCP服务器已移除',
      description: '服务器连接已成功断开并从列表中移除'
    });
  };

  // 获取状态标签
  const getStatusTag = (status: string) => {
    switch(status) {
      case 'online':
        return <Badge status="success" text="在线" />;
      case 'offline':
        return <Badge status="error" text="离线" />;
      case 'connecting':
        return <Badge status="processing" text="连接中" />;
      default:
        return <Badge status="default" text="未知" />;
    }
  };

  // 渲染接口信息详情
  const renderInterfaceDetails = () => {
    if (!currentServer || !currentServer.interfaceInfo) {
      return (
        <div className="empty-interface-info">
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
            description="正在加载接口信息..."
          />
        </div>
      );
    }

    return (
      <Tabs defaultActiveKey="prompts" type="card">
        <TabPane 
          tab={<span><CodeOutlined /> Prompts ({currentServer.interfaceInfo.prompts.length})</span>} 
          key="prompts"
        >
          <List
            itemLayout="horizontal"
            dataSource={currentServer.interfaceInfo.prompts}
            renderItem={prompt => (
              <List.Item>
                <Card className="prompt-card" style={{ width: '100%' }}>
                  <List.Item.Meta
                    avatar={<CodeOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                    title={<Space>
                      <Text strong>{prompt.name}</Text>
                      <Tag color="cyan">ID: {prompt.id}</Tag>
                    </Space>}
                    description={
                      <div>
                        <Paragraph>{prompt.description}</Paragraph>
                        <Collapse ghost>
                          <Panel header={<Text strong>参数列表</Text>} key="1">
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
                      </div>
                    }
                  />
                </Card>
              </List.Item>
            )}
          />
        </TabPane>
        <TabPane 
          tab={<span><FileTextOutlined /> Resources ({currentServer.interfaceInfo.resources.length})</span>} 
          key="resources"
        >
          <Table 
            dataSource={currentServer.interfaceInfo.resources}
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
              },
              {
                title: '操作',
                key: 'action',
                width: 100,
                render: () => (
                  <Button size="small" type="primary" icon={<FileTextOutlined />}>
                    读取
                  </Button>
                )
              }
            ]}
            pagination={false}
            size="small"
            rowKey="id"
            className="resources-table"
          />
        </TabPane>
        <TabPane 
          tab={<span><ToolOutlined /> Tools ({currentServer.interfaceInfo.tools.length})</span>} 
          key="tools"
        >
          <div className="tools-grid">
            {currentServer.interfaceInfo.tools.map(tool => (
              <Card 
                key={tool.name}
                title={<Space>
                  <ExperimentOutlined style={{ color: '#1890ff' }} />
                  <Text strong>{tool.name}</Text>
                </Space>}
                size="small"
                className="tool-card"
                extra={
                  <Button type="primary" icon={<PlayCircleOutlined />} size="small">
                    调用
                  </Button>
                }
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
        </TabPane>
      </Tabs>
    );
  };

  // 获取连接状态标签
  const getClientConnectedTag = (server: MCPServer) => {
    if (server.clientConnected) {
      return <Badge status="success" text="客户端已连接" />;
    }
    return <Badge status="warning" text="客户端未连接" />;
  };

  // 获取协议类型标签
  const getProtocolTag = (type: string) => {
    if (type === 'Websocket') {
      return <Tag color="blue" className="protocol-tag"><ApiOutlined /> WebSocket</Tag>;
    }
    return <Tag color="purple" className="protocol-tag"><ApiOutlined /> SSE</Tag>;
  };

  return (
    <div className="mcp-server-config">
      <div className="header-section">
        <Title level={4} className="mcp-server-title">
          <Space>
            <ApiOutlined />
            MCP 服务器配置
          </Space>
        </Title>
        <Paragraph className="mcp-description">
          Model Context Protocol (MCP) 提供了标准化的 AI 模型上下文通信协议，支持 SSE 和 WebSocket 连接方式
        </Paragraph>
      </div>
      
      <Card 
        size="small"  
        title={
          <Space>
            <CloudServerOutlined />
            <span>服务器列表</span>
          </Space>
        }
        className="server-list-card"
        extra={
          <Button 
            type="primary" size="small"
            icon={<PlusOutlined />}
            onClick={() => setShowAddForm(true)}
          >
            添加服务器
          </Button>
        }
      >
        {mcpServers.length === 0 ? (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无 MCP 服务器，请点击添加按钮创建"
          />
        ) : (
          <div className="server-list-container">
            {mcpServers.map(server => (
              <div key={server.id} className="server-item">
                <div className="server-header">
                  <div className="server-type-badge">
                    {server.type === 'Websocket' ? 
                      <Tag color="blue" icon={<ApiOutlined />} className="server-type-tag">WebSocket</Tag> : 
                      <Tag color="purple" icon={<ApiOutlined />} className="server-type-tag">SSE</Tag>
                    }
                  </div>
                  <div className="server-status">
                    <Space size={8}>
                      {getStatusTag(server.status)}
                      {getClientConnectedTag(server)}
                    </Space>
                  </div>
                </div>

                <div className="server-content">
                  <Row align="middle" gutter={8} className="server-info-row">
                    {/* <Col span={4} className="server-info-label">
                      <Text type="secondary">ID:</Text>
                    </Col>
                    <Col span={4}>
                      <Text code>{server.id}</Text>
                    </Col> */}
                    {server.lastConnected && (
                      <>
                        <Col span={8} className="server-info-label">
                          <Text type="secondary">上次连接:</Text>
                        </Col>
                        <Col span={16}>
                          <Text>{server.lastConnected}</Text>
                        </Col>
                      </>
                    )}
                  </Row>

                  <div className="server-address">
                    <Input 
                      readOnly
                      value={server.target}
                      prefix={<LinkOutlined />}
                      className="server-address-input"
                      addonBefore="地址"
                    />
                  </div>

                  <div className="server-actions">
                    <Space>
                      <Button 
                        type={server.clientConnected ? "default" : "primary"}
                        icon={server.clientConnected ? <EyeOutlined /> : <LinkOutlined />}
                        onClick={() => connectMCPClient(server)}
                        loading={connecting && currentServer?.id === server.id}
                        size="middle"
                      >
                        {server.clientConnected ? "查看接口" : "连接客户端"}
                      </Button>
                      <Button 
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteServer(server.id)}
                        size="middle"
                      />
                    </Space>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 添加MCP服务器表单 */}
        {showAddForm && (
          <div className="add-server-form">
            <Divider orientation="left">添加新服务器</Divider>
            <Form
              form={form}
              layout="horizontal"
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 20 }}
              onFinish={handleAddServer}
              initialValues={{ type: 'SSE', target: 'http://localhost:11432' }}
              className="server-form"
            >
              <Form.Item
                name="type"
                label="协议"
                rules={[{ required: true, message: '请选择MCP服务器协议类型' }]}
              >
                <Select>
                  <Option value="SSE">
                    <Space>
                      <ApiOutlined />
                      SSE (Server-Sent Events)
                    </Space>
                  </Option>
                  <Option value="Websocket">
                    <Space>
                      <ApiOutlined />
                      WebSocket
                    </Space>
                  </Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="target"
                label="地址"
                rules={[
                  { required: true, message: '请输入MCP服务器地址' },
                  { 
                    pattern: /^(wss?:\/\/|https?:\/\/).+/,
                    message: 'WebSocket地址应以ws://或wss://开头，SSE地址应以http://或https://开头'
                  }
                ]}
                extra="默认连接本地11432端口的SSE服务"
              >
                <Input placeholder="例如：http://localhost:11432" />
              </Form.Item>

              <Form.Item wrapperCol={{ offset: 4, span: 20 }}>
                <Space size="middle">
                  <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                    添加服务器
                  </Button>
                  <Button onClick={() => setShowAddForm(false)}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Card>
      
      {/* MCP 功能卡片 */}
      <Card 
        title={
          <Space>
            <ExperimentOutlined />
            <span>MCP 功能</span>
          </Space>
        }
        className="features-card"
        style={{ marginTop: '16px' }}
      >
        <Row gutter={[16, 16]} className="features-grid">
          {mcpFeatures.map((item, index) => (
            <Col xs={24} sm={12} md={12} lg={6} xl={6} key={index}>
              <Card 
                bordered={false} 
                className="feature-card"
                hoverable
              >
                <div className="feature-icon-wrapper">
                  <div className="feature-icon">{item.icon}</div>
                </div>
                <div className="feature-content">
                  <Title level={5} className="feature-title">{item.title}</Title>
                  <div className="feature-status">
                    {item.status === 'active' ? 
                      <Badge status="success" text="已启用" /> : 
                      <Badge status="warning" text="待激活" />}
                  </div>
                  <Paragraph className="feature-description" ellipsis={{ rows: 2, expandable: true }}>
                    {item.description}
                  </Paragraph>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
      
      {/* MCP接口详情模态框 */}
      <Modal
        title={
          <Space>
            <LinkOutlined />
            <span>MCP 接口详情</span>
            {currentServer && (
              <Tag color={currentServer.type === 'Websocket' ? 'blue' : 'purple'}>
                {currentServer.target}
              </Tag>
            )}
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={800}
        className="interface-modal"
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
      >
        {renderInterfaceDetails()}
      </Modal>

      <style>
        {`
        .mcp-server-config {
          margin: 0 auto;
        }
        
        .mcp-server-title {
          margin-bottom: 8px;
        }
        
        .header-section {
          margin-bottom: 16px;
        }
        
        .mcp-description {
          color: rgba(0, 0, 0, 0.65);
        }
        
        /* 服务器列表样式 */
        .server-list-container {
          margin-top: 16px;
        }
        
        .server-item {
          background-color: #fafafa;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          border: 1px solid #f0f0f0;
          transition: all 0.3s ease;
        }
        
        .server-item:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
        }
        
        .server-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px dashed #f0f0f0;
        }
        
        .server-type-tag {
          padding: 4px 8px;
          font-weight: 500;
          border-radius: 4px;
          min-width: 80px;
          text-align: center;
        }
        
        .server-content {
          padding: 0 8px;
        }
        
        .server-info-row {
          margin-bottom: 12px;
        }
        
        .server-info-label {
          text-align: right;
        }
        
        .server-address {
          margin: 12px 0;
        }
        
        .server-address-input {
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          background-color: #f5f5f5;
        }
        
        .server-actions {
          margin-top: 16px;
          display: flex;
          justify-content: flex-end;
        }
        
        /* 功能卡片样式 */
        .feature-card {
          height: 100%;
          transition: all 0.3s;
        }
        
        .feature-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .feature-icon-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 16px;
        }
        
        .feature-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: rgba(24, 144, 255, 0.1);
          border-radius: 50%;
        }
        
        .feature-title {
          margin: 0 0 8px 0;
          text-align: center;
        }
        
        .feature-status {
          text-align: center;
          margin-bottom: 8px;
        }
        
        .feature-description {
          color: rgba(0, 0, 0, 0.45);
          text-align: center;
          margin-bottom: 0;
        }
        
        /* 添加服务器表单样式 */
        .add-server-form {
          background: #f9f9f9;
          border-radius: 4px;
          padding: 16px;
          margin-top: 16px;
        }
        
        /* 详情模态框样式 */
        .interface-modal .ant-modal-content {
          border-radius: 8px;
        }
        
        .tools-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        }
        
        .tool-card, .prompt-card {
          height: 100%;
          border-radius: 4px;
        }
        `}
      </style>
    </div>
  );
};

export default MCPServerConfig; 