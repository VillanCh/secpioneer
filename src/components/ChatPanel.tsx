import React, { useState, useRef } from 'react';
import { Typography, Button, Tooltip, Checkbox, Space } from 'antd';
import { CodeOutlined, MessageOutlined, InfoCircleOutlined, InfoCircleFilled, WarningOutlined } from '@ant-design/icons';
import ChatInputPanel from './ChatInputPanel';
import CodeInputPanel from './CodeInputPanel';
import MessageList from './MessageList';
import WelcomePanel from './WelcomePanel';

const { Title } = Typography;

interface Message {
  id: string;
  content: string;
  isUser: boolean;
}

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
}

type InputMode = 'chat' | 'code';

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage }) => {
  const [inputMode, setInputMode] = useState<InputMode>('chat');
  const [showWelcome, setShowWelcome] = useState(true);
  // 使用 ref 追踪是否已经发送过消息
  const hasSentMessageRef = useRef(false);
  // YOLO模式状态
  const [yoloMode, setYoloMode] = useState(false);

  // 处理代码发送
  const handleSendCode = (code: string, language: string) => {
    if (code.trim()) {
      // 发送带语言标记的代码
      handleSendWithWelcomeCheck(`\`\`\`${language}\n${code}\n\`\`\``);
    }
  };

  // 处理消息发送并检查是否需要隐藏欢迎面板
  const handleSendWithWelcomeCheck = (message: string) => {
    // 如果是第一次发送消息且欢迎面板正在显示，则隐藏欢迎面板
    if (!hasSentMessageRef.current && showWelcome) {
      setShowWelcome(false);
      hasSentMessageRef.current = true;
    }
    
    // 调用原来的消息发送函数
    onSendMessage(message);
  };

  // 切换YOLO模式
  const toggleYoloMode = (checked: boolean) => {
    setYoloMode(checked);
    
    // 将YOLO模式状态添加到或移除body类
    if (checked) {
      document.body.classList.add('yolo-mode');
    } else {
      document.body.classList.remove('yolo-mode');
    }
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
    }}
    className={yoloMode ? 'yolo-mode-container' : ''}
    >
      {/* 标题栏 */}
      <div style={{ 
        borderBottom: '1px solid #f0f0f0', 
        padding: '12px 20px', 
        backgroundColor: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Title level={4} style={{ 
          margin: 0,
          color: '#333',
          fontWeight: 500
        }}>
          Security AI Copilot
        </Title>
        <Space size={12}>
          <Space size={4}>
            <Tooltip title={showWelcome ? "隐藏功能介绍" : "显示功能介绍"}>
              <Button 
                type="text"
                icon={showWelcome ? <InfoCircleFilled style={{ color: '#1890ff' }} /> : <InfoCircleOutlined />}
                onClick={() => setShowWelcome(!showWelcome)}
                size="middle"
                className="control-button"
                style={{ display: 'flex', alignItems: 'center', height: '32px' }}
              />
            </Tooltip>
            
            <Tooltip title={yoloMode ? "关闭危险模式" : "开启YOLO模式（命令将不经确认直接执行）"}>
              <Checkbox 
                checked={yoloMode}
                onChange={(e) => toggleYoloMode(e.target.checked)}
                className={`yolo-checkbox ${yoloMode ? 'yolo-active' : ''}`}
              >
                <Space>
                  <span style={{ color: yoloMode ? '#ff4d4f' : undefined, fontWeight: yoloMode ? 'bold' : 'normal' }}>
                    YOLO
                  </span>
                </Space>
              </Checkbox>
            </Tooltip>
          </Space>

          <Button.Group>
            <Button 
              type={inputMode === 'chat' ? 'primary' : 'default'} 
              icon={<MessageOutlined />}
              onClick={() => setInputMode('chat')}
              className="input-mode-toggle"
            >
              任务模式
            </Button>
            <Button 
              type={inputMode === 'code' ? 'primary' : 'default'} 
              icon={<CodeOutlined />}
              onClick={() => setInputMode('code')}
              className="input-mode-toggle"
            >
              代码模式
            </Button>
          </Button.Group>
        </Space>
      </div>
      
      {/* YOLO模式警告 */}
      {yoloMode && (
        <div className="yolo-warning">
          危险模式(YOLO)已开启：命令将不经询问直接执行！
        </div>
      )}
      
      {/* 欢迎面板 */}
      <WelcomePanel visible={showWelcome} />
      
      {/* 输入组件 - 根据模式显示不同的输入面板，移到消息列表上方 */}
      <div 
        className={`input-area ${yoloMode ? 'input-area-yolo' : ''}`}
        style={{ 
          borderBottom: '1px solid #f0f0f0', 
          padding: '16px 20px',
          backgroundColor: '#fafafa',
          zIndex: 1,
        }}
      >
        {inputMode === 'chat' ? (
          <ChatInputPanel onSendMessage={handleSendWithWelcomeCheck} />
        ) : (
          <CodeInputPanel onSendCode={handleSendCode} />
        )}
      </div>
      
      {/* 消息列表 */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <MessageList messages={messages} />
      </div>
    </div>
  );
};

export default ChatPanel; 