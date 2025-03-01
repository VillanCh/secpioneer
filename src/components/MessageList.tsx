import React, { useEffect, useRef } from 'react';
import { Typography, Alert } from 'antd';
import MessageItem from './MessageItem';

const { Text } = Typography;

interface Message {
  id: string;
  content: string;
  isUser: boolean;
}

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 当消息列表更新时，滚动到顶部（因为最新消息在上方）
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [messages]);
  
  // 反转消息顺序，使最新的消息在上面
  const reversedMessages = [...messages].reverse();

  return (
    <div 
      ref={containerRef}
      className="messages-container"
      style={{
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column', // 从上到下排列
      }}
    >
      {/* 消息提示区域 */}
      <div className="message-hint-container">
        <Alert
          message="消息提示"
          description="最新消息显示在顶部，您可以向下滚动查看历史消息。所有对话将被安全加密存储。"
          type="info"
          showIcon
          closable
          className="message-hint"
        />
      </div>
      
      {/* 消息列表 */}
      <div className="message-list">
        {reversedMessages.map(message => (
          <MessageItem key={message.id} message={message} />
        ))}
      </div>
      
      {/* 空消息提示 */}
      {messages.length === 0 && (
        <div className="empty-message-prompt">
          <Text type="secondary" style={{ textAlign: 'center', margin: '40px 0', fontStyle: 'italic' }}>
            请在上方输入您的问题或需求，您可以：
            <ul style={{ textAlign: 'left', marginTop: '10px', paddingLeft: '20px' }}>
              <li>询问安全相关问题或概念</li>
              <li>请求代码审计或安全建议</li>
              <li>要求分析潜在的安全漏洞</li>
              <li>获取最佳安全实践指南</li>
            </ul>
          </Text>
        </div>
      )}
    </div>
  );
};

export default MessageList; 