import React, { useState } from 'react';
import { Typography, Card, List, Tag, Space, Button, Tooltip, Form, Input, Select, Divider, notification, Modal, Tabs, Collapse, Table, Row, Col } from 'antd';
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
  EyeOutlined
} from '@ant-design/icons';

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

interface MCPServerConfigProps {
  // 预留接口，方便后续扩展
}

const MCPServerConfig: React.FC<MCPServerConfigProps> = () => {
  // MCP 服务功能列表
  const mcpFeatures = [
    {
      title: '指令执行引擎',
      description: '能够执行各种安全操作指令，包括代码扫描、漏洞检测等',
      icon: <ThunderboltOutlined style={{ fontSize: '20px', color: '#1890ff' }} />,
      status: 'active'
    },
    {
      title: '实时监控系统',
      description: '监控应用系统状态和安全事件，提供实时告警',
      icon: <SafetyCertificateOutlined style={{ fontSize: '20px', color: '#52c41a' }} />,
      status: 'active'
    },
    {
      title: 'API 集成服务',
      description: '与多种安全工具和平台集成，扩展功能范围',
      icon: <ApiOutlined style={{ fontSize: '20px', color: '#722ed1' }} />,
      status: 'active'
    },
    {
      title: '任务调度系统',
      description: '管理和调度安全任务，保证任务顺序执行和资源分配',
      icon: <CloudServerOutlined style={{ fontSize: '20px', color: '#fa8c16' }} />,
      status: 'pending'
    }
  ];

  // MCP服务器列表状态
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([
    {
      id: '1',
      type: 'Websocket',
      target: 'wss://mcp.secpioneer.local:8443',
      status: 'online',
      lastConnected: '2023-07-15 14:30:22',
      clientConnected: false,
    }
  ]);

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
    
    // 模拟连接和获取接口信息的过程
    try {
      // 模拟通过 SDK 连接 MCP 服务器
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 模拟获取服务器接口信息
      const mockInterfaceInfo: MCPInterfaceInfo = {
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
      
      // 更新服务器状态，添加接口信息
      setMcpServers(prev => 
        prev.map(s => 
          s.id === server.id 
            ? { ...s, interfaceInfo: mockInterfaceInfo, clientConnected: true } 
            : s
        )
      );
      
      // 更新当前选中的服务器
      setCurrentServer({
        ...server,
        interfaceInfo: mockInterfaceInfo,
        clientConnected: true
      });
      
      setDetailModalVisible(true);
      notification.success({
        message: 'MCP 客户端已连接',
        description: `成功连接到 ${server.target} 并获取接口信息`
      });
    } catch (error) {
      notification.error({
        message: 'MCP 客户端连接失败',
        description: `连接 ${server.target} 时发生错误`
      });
    } finally {
      setConnecting(false);
    }
  };

  // 处理添加MCP服务器
  const handleAddServer = (values: any) => {
    const newServer: MCPServer = {
      id: Date.now().toString(),
      type: values.type,
      target: values.target,
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
        return <Tag color="success">在线</Tag>;
      case 'offline':
        return <Tag color="error">离线</Tag>;
      case 'connecting':
        return <Tag color="processing">连接中</Tag>;
      default:
        return <Tag color="default">未知</Tag>;
    }
  };

  // 渲染接口信息详情
  const renderInterfaceDetails = () => {
    if (!currentServer || !currentServer.interfaceInfo) {
      return <div>正在加载接口信息...</div>;
    }

    return (
      <Tabs defaultActiveKey="prompts">
        <TabPane 
          tab={<span><CodeOutlined /> Prompts ({currentServer.interfaceInfo.prompts.length})</span>} 
          key="prompts"
        >
          <List
            itemLayout="horizontal"
            dataSource={currentServer.interfaceInfo.prompts}
            renderItem={prompt => (
              <List.Item>
                <List.Item.Meta
                  avatar={<CodeOutlined style={{ fontSize: '20px', color: '#1890ff' }} />}
                  title={<Space>
                    <Text strong>{prompt.name}</Text>
                    <Text type="secondary">ID: {prompt.id}</Text>
                  </Space>}
                  description={
                    <div>
                      <div>{prompt.description}</div>
                      <Collapse ghost>
                        <Panel header="参数" key="1">
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
                width: 100
              },
              {
                title: '路径',
                dataIndex: 'path',
                key: 'path',
                ellipsis: true
              },
              {
                title: '类型',
                dataIndex: 'type',
                key: 'type',
                width: 150,
                render: (text) => <Tag color="green">{text}</Tag>
              },
              {
                title: '大小',
                dataIndex: 'size',
                key: 'size',
                width: 100,
                render: (size) => `${size} bytes`
              },
              {
                title: '操作',
                key: 'action',
                width: 100,
                render: () => (
                  <Button size="small" type="link">
                    读取
                  </Button>
                )
              }
            ]}
            pagination={false}
            size="small"
            rowKey="id"
          />
        </TabPane>
        <TabPane 
          tab={<span><ToolOutlined /> Tools ({currentServer.interfaceInfo.tools.length})</span>} 
          key="tools"
        >
          {currentServer.interfaceInfo.tools.map(tool => (
            <Card 
              key={tool.name}
              title={<Space>
                <ToolOutlined />
                <Text strong>{tool.name}</Text>
              </Space>}
              size="small"
              style={{ marginBottom: 16 }}
              extra={
                <Button size="small" type="primary" icon={<PlayCircleOutlined />}>
                  调用
                </Button>
              }
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text>{tool.description}</Text>
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
        </TabPane>
      </Tabs>
    );
  };

  // 获取连接状态标签
  const getClientConnectedTag = (server: MCPServer) => {
    if (server.clientConnected) {
      return <Tag color="success">已连接</Tag>;
    }
    return <Tag color="warning">未连接</Tag>;
  };

  return (
    <div className="mcp-server-config">
      <Title level={4} className="mcp-server-title">
        MCP 服务器配置
      </Title>
      
      <Card 
        title="MCP 服务器列表" 
        size="small" 
        className="mcp-server-card"
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            size="small"
            onClick={() => setShowAddForm(true)}
          >
            添加
          </Button>
        }
      >
        {mcpServers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Text type="secondary">暂无 MCP 服务器，请点击添加按钮创建</Text>
          </div>
        ) : (
          <div className="server-list">
            {mcpServers.map(server => (
              <div key={server.id} className="server-item">
                <Row gutter={16} align="middle" style={{ marginBottom: '16px' }}>
                  <Col span={16}>
                    <Row>
                      <Col span={24}>
                        <Space align="center" style={{ marginBottom: '4px' }}>
                          <Tag color={server.type === 'Websocket' ? 'blue' : 'purple'} style={{ margin: 0 }}>
                            {server.type}
                          </Tag>
                          {getStatusTag(server.status)}
                          {getClientConnectedTag(server)}
                        </Space>
                      </Col>
                    </Row>
                    <Row>
                      <Col span={24}>
                        <div style={{ 
                          background: '#f5f5f5', 
                          padding: '8px 12px', 
                          borderRadius: '4px',
                          marginBottom: '8px',
                          fontFamily: 'monospace',
                          fontSize: '14px',
                          color: '#333',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {server.target}
                        </div>
                      </Col>
                    </Row>
                    <Row>
                      <Col span={24}>
                        <Space direction="vertical" size={0} style={{ width: '100%' }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>ID: {server.id}</Text>
                          {server.lastConnected && (
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              上次连接: {server.lastConnected}
                            </Text>
                          )}
                          {server.clientConnected && server.interfaceInfo && (
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              接口: {server.interfaceInfo.prompts.length} Prompts, 
                              {server.interfaceInfo.resources.length} Resources, 
                              {server.interfaceInfo.tools.length} Tools
                            </Text>
                          )}
                        </Space>
                      </Col>
                    </Row>
                  </Col>
                  <Col span={8} style={{ textAlign: 'right' }}>
                    <Space>
                      <Button 
                        type={server.clientConnected ? "default" : "primary"}
                        size="small"
                        icon={server.clientConnected ? <EyeOutlined /> : <SyncOutlined />}
                        onClick={() => connectMCPClient(server)}
                        loading={connecting && currentServer?.id === server.id}
                      >
                        {server.clientConnected ? "查看接口" : "连接客户端"}
                      </Button>
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => handleDeleteServer(server.id)}
                      />
                    </Space>
                  </Col>
                </Row>
                {server !== mcpServers[mcpServers.length - 1] && (
                  <Divider style={{ margin: '0 0 16px 0' }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* 添加MCP服务器表单 */}
        {showAddForm && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            <Form
              form={form}
              layout="vertical"
              onFinish={handleAddServer}
              initialValues={{ type: 'Websocket' }}
            >
              <Form.Item
                name="type"
                label="类型"
                rules={[{ required: true, message: '请选择MCP服务器类型' }]}
              >
                <Select placeholder="选择连接类型">
                  <Option value="Websocket">Websocket</Option>
                  <Option value="SSE">SSE (Server-Sent Events)</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="target"
                label="目标地址"
                rules={[
                  { required: true, message: '请输入MCP服务器地址' },
                  { 
                    pattern: /^(wss?:\/\/|https?:\/\/).+/,
                    message: 'Websocket地址应以ws://或wss://开头，SSE地址应以http://或https://开头'
                  }
                ]}
              >
                <Input placeholder="例如：wss://mcp.example.com:8443" />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    添加服务器
                  </Button>
                  <Button onClick={() => setShowAddForm(false)}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Card>
      
      <Card title="MCP 功能" size="small" className="mcp-server-card" style={{ marginTop: '16px' }}>
        <List
          itemLayout="horizontal"
          dataSource={mcpFeatures}
          renderItem={item => (
            <List.Item className="mcp-feature-item">
              <List.Item.Meta
                avatar={item.icon}
                title={<Space>
                  {item.title}
                  {item.status === 'active' ? 
                    <Tag color="success" style={{ marginLeft: '8px' }}>已启用</Tag> : 
                    <Tag color="warning" style={{ marginLeft: '8px' }}>待激活</Tag>}
                </Space>}
                description={item.description}
              />
            </List.Item>
          )}
        />
      </Card>
      
      <div style={{ marginTop: 'auto', borderTop: '1px solid #f0f0f0', paddingTop: '12px' }}>
        <Paragraph type="secondary" style={{ fontSize: '12px', textAlign: 'center' }}>
          MCP (Model Communication Protocol) 负责AI模型通信协议管理，
          <br />支持Websocket和SSE两种连接方式，确保模型运行服务稳定可靠。
        </Paragraph>
      </div>

      {/* MCP接口详情模态框 */}
      <Modal
        title={
          <Space>
            <LinkOutlined />
            <span>MCP 接口详情 - {currentServer?.target}</span>
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
      >
        {renderInterfaceDetails()}
      </Modal>
    </div>
  );
};

export default MCPServerConfig; 