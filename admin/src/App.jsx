import React from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { RouterProvider } from 'react-router-dom';
import router from './router';

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#165DFF',
          borderRadius: 8,
          colorBgLayout: '#F2F4F7',
          colorBorderSecondary: '#E5E6EB',
        },
        components: {
          Layout: {
            bodyBg: '#F2F4F7',
            headerBg: '#FFFFFF',
            siderBg: '#FFFFFF',
          },
          Menu: {
            itemSelectedBg: '#E8F3FF',
            itemSelectedColor: '#165DFF',
            itemHoverColor: '#165DFF',
          },
          Card: {
            borderRadiusLG: 8,
          },
          Table: {
            headerBg: '#FAFBFC',
          },
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}
