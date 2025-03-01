import React from 'react';
import './App.css';
import { XProvider } from "@ant-design/x";
import Workspace from './pages/Workspace';

function App() {
  return (
    <XProvider theme={{
      token: {
        colorPrimary: '#006400',
      },
    }}>
      <Workspace />
    </XProvider>
  );
}

export default App;
