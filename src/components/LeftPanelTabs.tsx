import React from 'react';
import { Tabs } from 'antd';
import { 
  ExperimentOutlined, 
  CloudServerOutlined, 
  FolderOutlined 
} from '@ant-design/icons';
import ThoughtPanel from './ThoughtPanel';
import MCPServerConfig from './MCPServerConfig';
import TaskFileSystem from './TaskFileSystem';

// 标签页类型
export type TabKey = 'thoughts' | 'mcpConfig' | 'fileSystem';

// 本地存储的键名
export const STORAGE_KEY = {
  ACTIVE_TAB: 'secpioneer_active_tab'
};

interface LeftPanelTabsProps {
  activeTab: TabKey;
  onTabChange: (key: TabKey) => void;
  thoughts: any[]; // 使用适当的类型
  onThoughtClick: (thought: any) => void; // 使用适当的类型
}

const LeftPanelTabs: React.FC<LeftPanelTabsProps> = ({ 
  activeTab, 
  onTabChange, 
  thoughts, 
  onThoughtClick 
}) => {
  // 标签页项配置
  const tabItems = [
    {
      key: 'thoughts',
      label: (
        <div className="tab-label">
          <ExperimentOutlined className="tab-icon" />
          <span className="tab-text">思维</span>
        </div>
      ),
      children: <ThoughtPanel thoughts={thoughts} onThoughtClick={onThoughtClick} />
    },
    {
      key: 'mcpConfig',
      label: (
        <div className="tab-label">
          <CloudServerOutlined className="tab-icon" />
          <span className="tab-text">MCP</span>
        </div>
      ),
      children: <MCPServerConfig />
    },
    {
      key: 'fileSystem',
      label: (
        <div className="tab-label">
          <FolderOutlined className="tab-icon" />
          <span className="tab-text">文件</span>
        </div>
      ),
      children: <TaskFileSystem />
    }
  ];

  return (
    <Tabs
      activeKey={activeTab}
      onChange={onTabChange as (key: string) => void}
      style={{ height: '100%' }}
      items={tabItems}
      tabPosition="left"
      className="left-panel-tabs"
      destroyInactiveTabPane={false}
      size="small"
    />
  );
};

export default LeftPanelTabs; 