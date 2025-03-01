import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Space, Switch } from 'antd';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';
import Editor, { loader } from '@monaco-editor/react';

// 预加载Monaco Editor的配置
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.39.0/min/vs'
  },
});

interface CodeInputPanelProps {
  onSendCode: (code: string, language: string) => void;
}

const CodeInputPanel: React.FC<CodeInputPanelProps> = ({ onSendCode }) => {
  const [codeContent, setCodeContent] = useState('');
  const [editorLanguage, setEditorLanguage] = useState('javascript');
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  // 配置 Monaco Editor
  const handleEditorWillMount = (monaco: any) => {
    // 保存monaco实例以便后续使用
    monacoRef.current = monaco;
    
    // 注册自动完成提供者
    registerCompletionProviders(monaco);
    
    // 设置初始主题
    monaco.editor.defineTheme('customLightTheme', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#fafafa',
        'editor.lineHighlightBackground': '#f0f0f0',
        'editorLineNumber.foreground': '#999999',
        'editor.selectionBackground': '#e6f7ff',
      }
    });
    
    monaco.editor.defineTheme('customDarkTheme', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.lineHighlightBackground': '#282828',
        'editorLineNumber.foreground': '#6e6e6e',
        'editor.selectionBackground': '#264f78',
      }
    });
    
    return isDarkTheme ? 'customDarkTheme' : 'customLightTheme';
  };

  // 注册自动完成提供者
  const registerCompletionProviders = (monaco: any) => {
    // JavaScript/TypeScript 自动完成
    const jsProvider = {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };
        
        // 基本的JavaScript关键字和函数
        const suggestions = [
          {
            label: 'console.log',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'console.log(${1:value});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '打印信息到控制台',
            range
          },
          {
            label: 'function',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'function ${1:name}(${2:params}) {\n\t${3}\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '定义一个函数',
            range
          },
          {
            label: 'setTimeout',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'setTimeout(() => {\n\t${1}\n}, ${2:1000});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '设置一个定时器',
            range
          },
          {
            label: 'const',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'const ${1:name} = ${2:value};',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '声明一个常量',
            range
          },
          {
            label: 'let',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'let ${1:name} = ${2:value};',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '声明一个变量',
            range
          },
          {
            label: 'import',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'import { ${1:module} } from "${2:package}";',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '导入模块',
            range
          }
        ];
        
        return { suggestions };
      }
    };
    
    monaco.languages.registerCompletionItemProvider('javascript', jsProvider);
    monaco.languages.registerCompletionItemProvider('typescript', jsProvider);
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // 添加额外的编辑器配置
    editor.addAction({
      id: 'format-code',
      label: '格式化代码',
      keybindings: [
        monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF
      ],
      run: () => {
        editor.getAction('editor.action.formatDocument').run();
      }
    });
    
    // 聚焦编辑器
    editor.focus();
  };

  // 监听主题变化
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(isDarkTheme ? 'customDarkTheme' : 'customLightTheme');
    }
  }, [isDarkTheme]);

  const handleEditorChange = (value: string | undefined) => {
    setCodeContent(value || '');
  };

  const handleSendCode = () => {
    if (codeContent.trim()) {
      onSendCode(codeContent, editorLanguage);
      setCodeContent('');
    }
  };

  // 渲染代码编辑器
  const renderCodeEditor = () => {
    return (
      <div className="code-editor-container">
        <Editor
          height="200px"
          defaultLanguage="javascript"
          language={editorLanguage}
          value={codeContent}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          beforeMount={handleEditorWillMount}
          theme={isDarkTheme ? 'customDarkTheme' : 'customLightTheme'}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            contextmenu: true,
            quickSuggestions: true,
            formatOnPaste: true,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
          }}
        />
      </div>
    );
  };

  return (
    <Card 
      bodyStyle={{ 
        padding: '12px', 
        backgroundColor: isDarkTheme ? '#1e1e1e' : '#fff'
      }} 
      style={{ 
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        transition: 'background-color 0.3s ease'
      }}
      bordered={false}
    >
      <div style={{ 
        borderRadius: '4px', 
        overflow: 'hidden',
        height: '200px',
        border: `1px solid ${isDarkTheme ? '#333' : '#d9d9d9'}`
      }}>
        {renderCodeEditor()}
      </div>
      <Space style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <select 
            value={editorLanguage} 
            onChange={(e) => setEditorLanguage(e.target.value)}
            className="language-selector"
            style={{ 
              backgroundColor: isDarkTheme ? '#2d2d2d' : '#fff',
              color: isDarkTheme ? '#e0e0e0' : '#333',
              borderColor: isDarkTheme ? '#444' : '#d9d9d9'
            }}
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="csharp">C#</option>
            <option value="cpp">C++</option>
            <option value="php">PHP</option>
            <option value="ruby">Ruby</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
            <option value="sql">SQL</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="json">JSON</option>
            <option value="markdown">Markdown</option>
            <option value="yaml">YAML</option>
            <option value="shell">Shell</option>
          </select>
          <Space align="center">
            <Switch 
              size="small" 
              checked={isDarkTheme} 
              onChange={setIsDarkTheme}
              checkedChildren={<BulbFilled />}
              unCheckedChildren={<BulbOutlined />}
            />
            <span style={{ fontSize: '12px', color: isDarkTheme ? '#e0e0e0' : '#666' }}>
              {isDarkTheme ? '暗色' : '亮色'}
            </span>
          </Space>
        </Space>
        <Button type="primary" onClick={handleSendCode}>
          发送代码
        </Button>
      </Space>
    </Card>
  );
};

export default CodeInputPanel; 