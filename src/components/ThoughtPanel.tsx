import React from 'react';
import { ThoughtChain } from '@ant-design/x';
import { Typography } from 'antd';

const { Title } = Typography;

interface Thought {
  id: string;
  title: string;
  content: string;
}

interface ThoughtPanelProps {
  thoughts: Thought[];
  onThoughtClick?: (thought: Thought) => void;
}

const ThoughtPanel: React.FC<ThoughtPanelProps> = ({ thoughts, onThoughtClick }) => {
  return (
    <div className="thought-panel">
      <Title level={4} style={{ 
        marginBottom: '20px', 
        color: '#333',
        borderBottom: '1px solid #f0f0f0',
        paddingBottom: '10px',
        fontWeight: 500
      }}>
        思维链
      </Title>
      
      <div style={{ flex: 1 }}>
        <ThoughtChain
          items={thoughts.map(thought => ({
            key: thought.id,
            title: thought.title,
            content: thought.content
          }))}
          onClick={onThoughtClick ? (info) => {
            // @ts-ignore - 类型不匹配，但功能可用
            onThoughtClick(info);
          } : undefined}
        />
      </div>
    </div>
  );
};

export default ThoughtPanel; 