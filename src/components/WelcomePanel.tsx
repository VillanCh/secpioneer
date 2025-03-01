import React, { useEffect, useRef } from 'react';
import { Card, Typography, Space, Row, Col } from 'antd';
import { CodeOutlined, MessageOutlined, RobotOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

interface WelcomePanelProps {
  visible: boolean;
}

const WelcomePanel: React.FC<WelcomePanelProps> = ({ visible }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 确保动画效果在组件可见性变化时触发
    if (panelRef.current) {
      if (visible) {
        panelRef.current.classList.remove('welcome-panel-hidden');
        panelRef.current.classList.add('welcome-panel-visible');
      } else {
        panelRef.current.classList.remove('welcome-panel-visible');
        panelRef.current.classList.add('welcome-panel-hidden');
      }
    }
  }, [visible]);

  return (
    <div 
      ref={panelRef} 
      className={visible ? 'welcome-panel-visible' : 'welcome-panel-hidden'}
      style={{ 
        padding: '16px', 
        backgroundColor: '#fff', 
        overflow: 'hidden',
        maxHeight: '300px'
      }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <Title level={4} style={{ color: '#1890ff', margin: '0 0 4px 0' }}>
            <RobotOutlined /> 安全先锋 AI 助手
          </Title>
          <Paragraph type="secondary" style={{ fontSize: '13px', marginBottom: '0' }}>
            专注于安全编码与漏洞分析的智能助手
          </Paragraph>
        </div>

        <Row gutter={16}>
          <Col span={12}>
            <Card 
              title={<><MessageOutlined /> 任务命令模式</>} 
              className="welcome-card mode-card"
              style={{ borderRadius: '8px' }}
              size="small"
              bodyStyle={{ padding: '12px' }}
            >
              <Paragraph style={{ fontSize: '13px', marginBottom: '0' }}>
                在人的合理授权下，使用 MCP Tools 完成安全任务，包括代码审计、漏洞分析与修复建议。
              </Paragraph>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card 
              title={<><CodeOutlined /> 代码模式</>} 
              className="welcome-card mode-card"
              style={{ borderRadius: '8px' }}
              size="small"
              bodyStyle={{ padding: '12px' }}
            >
              <Paragraph style={{ fontSize: '13px', marginBottom: '0' }}>
                AI 可以辅助完成编码过程，或执行代码完成任务，提供安全优化和漏洞修复实现。
              </Paragraph>
            </Card>
          </Col>
        </Row>

        <Paragraph style={{ 
          fontSize: '12px', 
          marginTop: '8px',
          marginBottom: '0',
          textAlign: 'center',
          fontStyle: 'italic',
          color: '#8c8c8c'
        }}>
          选择合适的模式，在下方输入您的需求或代码，AI 将为您提供专业安全支持
        </Paragraph>
      </Space>
    </div>
  );
};

export default WelcomePanel; 