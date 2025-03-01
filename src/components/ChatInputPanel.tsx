import React from 'react';
import { Sender } from '@ant-design/x';
import { Card } from 'antd';

interface ChatInputPanelProps {
  onSendMessage: (message: string) => void;
}

const ChatInputPanel: React.FC<ChatInputPanelProps> = ({ onSendMessage }) => {
  return (
    <Card 
      bodyStyle={{ padding: '12px', backgroundColor: '#fff' }}
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
      bordered={false}
    >
      <Sender 
        onSubmit={onSendMessage}
        placeholder="下达命令，Yak Pioneer 将会自动执行" 
      />
    </Card>
  );
};

export default ChatInputPanel; 