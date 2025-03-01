import React from 'react';
import { Avatar, Space, Tag, Tooltip, Typography } from 'antd';
import { UserOutlined, RobotOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Message {
  id: string;
  content: string;
  isUser: boolean;
}

interface MessageItemProps {
  message: Message;
}

// 随机头像颜色数组
const avatarColors = [
  '#1890ff', '#13c2c2', '#52c41a', '#faad14', '#722ed1', 
  '#eb2f96', '#fa8c16', '#a0d911', '#1890ff', '#2f54eb'
];

// 随机获取头像背景色
const getRandomAvatarColor = (userId: string) => {
  // 使用消息ID的哈希值来确保同一用户始终获得相同颜色
  const hashCode = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const index = Math.abs(hashCode) % avatarColors.length;
  return avatarColors[index];
};

// 获取消息时间（简化处理，这里使用固定格式）
const getMessageTime = () => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const { id, content, isUser } = message;
  
  return (
    <div className={`message-item ${isUser ? 'message-item-user' : 'message-item-assistant'}`}>
      {/* 消息头部 */}
      <div className={isUser ? "message-user-header" : "message-assistant-header"}>
        <Space align="center">
          <Avatar 
            icon={isUser ? <UserOutlined /> : <RobotOutlined />} 
            size="small"
            style={{ 
              backgroundColor: isUser ? getRandomAvatarColor(id) : '#52c41a',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }} 
          />
          <Text strong style={{ fontSize: '13px' }}>
            {isUser ? '我' : 'AI 助手'}
          </Text>
          <Text type="secondary" className="message-timestamp">
            <ClockCircleOutlined style={{ marginRight: '3px', fontSize: '10px' }} />
            {getMessageTime()}
          </Text>
          {!isUser && (
            <Tag color="green" style={{ marginLeft: '4px', fontSize: '10px', lineHeight: '14px', height: '18px' }}>
              安全专家
            </Tag>
          )}
        </Space>
      </div>
      
      {/* 消息内容 */}
      <div className="message-content">
        {content}
      </div>
      
      {/* 消息底部操作按钮（仅AI助手消息显示） */}
      {!isUser && (
        <div className="message-footer">
          <Space size={[4, 0]} style={{ marginTop: '6px', justifyContent: 'flex-end' }}>
            <Tooltip title="复制回复">
              <span className="message-action-button">复制</span>
            </Tooltip>
            <Tooltip title="保存为笔记">
              <span className="message-action-button">保存</span>
            </Tooltip>
          </Space>
        </div>
      )}
    </div>
  );
};

export default MessageItem; 