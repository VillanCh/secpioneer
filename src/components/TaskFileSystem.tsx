import React from 'react';
import { Typography, Empty, Button } from 'antd';
import { FolderOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

interface TaskFileSystemProps {
  // 预留接口，方便后续扩展
}

const TaskFileSystem: React.FC<TaskFileSystemProps> = () => {
  return (
    <div className="task-file-system">
      <Title level={4} className="task-file-title">
        任务文件系统
      </Title>
      
      <div className="task-file-empty">
        <Empty
          image={<FolderOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />}
          description="暂无任务文件"
        />
        <Paragraph type="secondary" style={{ textAlign: 'center' }}>
          任务文件系统将在未来版本中开放，敬请期待
        </Paragraph>
        <Button type="primary" disabled>创建任务文件</Button>
      </div>
    </div>
  );
};

export default TaskFileSystem; 