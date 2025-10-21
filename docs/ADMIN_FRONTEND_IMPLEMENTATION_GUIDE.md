# Admin Dashboard & Notification Frontend Implementation Guide

This document provides comprehensive guidance for implementing the admin dashboard and notification functionality in the frontend admin panel.

## Table of Contents

1. [Overview](#overview)
2. [API Integration](#api-integration)
3. [Dashboard Components](#dashboard-components)
4. [Notification Components](#notification-components)
5. [State Management](#state-management)
6. [Real-time Updates](#real-time-updates)
7. [UI/UX Guidelines](#uiux-guidelines)
8. [Code Examples](#code-examples)
9. [Error Handling](#error-handling)
10. [Performance Optimization](#performance-optimization)

## Overview

The admin dashboard provides real-time insights into system health, user activity, and key metrics. The notification system allows admins to stay informed about important events and manage their notification preferences.

### Key Features
- **Real-time Dashboard**: Live statistics and charts
- **Notification Center**: In-app notifications with read/unread status
- **Settings Management**: Granular notification preferences
- **Responsive Design**: Works on desktop and mobile
- **Accessibility**: WCAG compliant components

## API Integration

### Base Configuration

```javascript
// config/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3005/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Dashboard API Service

```javascript
// services/dashboardService.js
import apiClient from '../config/api';

export const dashboardService = {
  // Get dashboard summary
  getSummary: async (period = '30d', includeCharts = true) => {
    const response = await apiClient.get('/admin/dashboard/summary', {
      params: { period, includeCharts }
    });
    return response.data;
  },

  // Get user statistics
  getUserStats: async (period = '30d') => {
    const response = await apiClient.get('/admin/dashboard/summary', {
      params: { period, includeCharts: false }
    });
    return response.data.data.overview;
  },

  // Get chart data
  getChartData: async (chartType, period = '30d') => {
    const response = await apiClient.get('/admin/dashboard/summary', {
      params: { period, includeCharts: true }
    });
    return response.data.data.charts[chartType];
  }
};
```

### Notification API Service

```javascript
// services/notificationService.js
import apiClient from '../config/api';

export const notificationService = {
  // Get notifications
  getNotifications: async (params = {}) => {
    const response = await apiClient.get('/admin/dashboard/notifications', {
      params: {
        limit: 20,
        skip: 0,
        ...params
      }
    });
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await apiClient.put(`/admin/dashboard/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await apiClient.put('/admin/dashboard/notifications/read-all');
    return response.data;
  },

  // Get notification settings
  getSettings: async () => {
    const response = await apiClient.get('/admin/dashboard/settings');
    return response.data;
  },

  // Update notification settings
  updateSettings: async (settings) => {
    const response = await apiClient.put('/admin/dashboard/settings', settings);
    return response.data;
  }
};
```

## Dashboard Components

### Main Dashboard Component

```jsx
// components/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spin, Alert } from 'antd';
import { dashboardService } from '../../services/dashboardService';
import OverviewCards from './OverviewCards';
import ChartsSection from './ChartsSection';
import RecentActivity from './RecentActivity';
import StatusBreakdown from './StatusBreakdown';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getSummary(selectedPeriod, true);
      setDashboardData(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Spin size="large" />
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error Loading Dashboard"
        description={error}
        type="error"
        showIcon
        action={
          <button onClick={fetchDashboardData}>
            Retry
          </button>
        }
      />
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <PeriodSelector 
          value={selectedPeriod} 
          onChange={setSelectedPeriod} 
        />
      </div>

      <Row gutter={[16, 16]}>
        {/* Overview Cards */}
        <Col span={24}>
          <OverviewCards data={dashboardData.overview} />
        </Col>

        {/* Charts Section */}
        <Col span={24}>
          <ChartsSection 
            charts={dashboardData.charts} 
            period={selectedPeriod}
          />
        </Col>

        {/* Recent Activity */}
        <Col span={12}>
          <RecentActivity data={dashboardData.recentActivity} />
        </Col>

        {/* Status Breakdown */}
        <Col span={12}>
          <StatusBreakdown data={dashboardData.statusBreakdown} />
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
```

### Overview Cards Component

```jsx
// components/Dashboard/OverviewCards.jsx
import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import {
  UserOutlined,
  ProjectOutlined,
  CalendarOutlined,
  BellOutlined,
  MailOutlined,
  ToolOutlined
} from '@ant-design/icons';

const OverviewCards = ({ data }) => {
  const cards = [
    {
      title: 'Total Users',
      value: data.totalUsers,
      icon: <UserOutlined />,
      color: '#1890ff',
      suffix: 'users'
    },
    {
      title: 'Active Projects',
      value: data.activeProjects,
      icon: <ProjectOutlined />,
      color: '#52c41a',
      suffix: 'projects'
    },
    {
      title: 'Upcoming Events',
      value: data.upcomingEvents,
      icon: <CalendarOutlined />,
      color: '#faad14',
      suffix: 'events'
    },
    {
      title: 'Unread Notifications',
      value: data.unreadNotifications,
      icon: <BellOutlined />,
      color: '#f5222d',
      suffix: 'notifications'
    },
    {
      title: 'Contact Submissions',
      value: data.contactSubmissions,
      icon: <MailOutlined />,
      color: '#722ed1',
      suffix: 'submissions'
    },
    {
      title: 'Total Equipment',
      value: data.totalEquipment,
      icon: <ToolOutlined />,
      color: '#13c2c2',
      suffix: 'items'
    }
  ];

  return (
    <Row gutter={[16, 16]}>
      {cards.map((card, index) => (
        <Col xs={24} sm={12} md={8} lg={4} key={index}>
          <Card className="overview-card">
            <Statistic
              title={card.title}
              value={card.value}
              suffix={card.suffix}
              prefix={card.icon}
              valueStyle={{ color: card.color }}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default OverviewCards;
```

### Charts Section Component

```jsx
// components/Dashboard/ChartsSection.jsx
import React from 'react';
import { Card, Tabs } from 'antd';
import UserGrowthChart from './charts/UserGrowthChart';
import ProjectActivityChart from './charts/ProjectActivityChart';
import RequestTrendsChart from './charts/RequestTrendsChart';
import EquipmentUtilizationChart from './charts/EquipmentUtilizationChart';

const ChartsSection = ({ charts, period }) => {
  const tabItems = [
    {
      key: 'userGrowth',
      label: 'User Growth',
      children: <UserGrowthChart data={charts.userGrowth} period={period} />
    },
    {
      key: 'projectActivity',
      label: 'Project Activity',
      children: <ProjectActivityChart data={charts.projectActivity} period={period} />
    },
    {
      key: 'requestTrends',
      label: 'Request Trends',
      children: <RequestTrendsChart data={charts.requestTrends} period={period} />
    },
    {
      key: 'equipmentUtilization',
      label: 'Equipment Utilization',
      children: <EquipmentUtilizationChart data={charts.equipmentUtilization} />
    }
  ];

  return (
    <Card title="Analytics & Trends" className="charts-section">
      <Tabs defaultActiveKey="userGrowth" items={tabItems} />
    </Card>
  );
};

export default ChartsSection;
```

### Chart Components (using Chart.js or Recharts)

```jsx
// components/Dashboard/charts/UserGrowthChart.jsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const UserGrowthChart = ({ data, period }) => {
  const chartData = {
    labels: data.map(item => 
      `${item._id.year}-${item._id.month.toString().padStart(2, '0')}-${item._id.day.toString().padStart(2, '0')}`
    ),
    datasets: [
      {
        label: 'New Users',
        data: data.map(item => item.count),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `User Growth - ${period}`
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return <Line data={chartData} options={options} />;
};

export default UserGrowthChart;
```

## Notification Components

### Notification Center Component

```jsx
// components/Notifications/NotificationCenter.jsx
import React, { useState, useEffect } from 'react';
import { Drawer, List, Badge, Button, Empty, Spin, Tabs } from 'antd';
import { BellOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons';
import { notificationService } from '../../services/notificationService';
import NotificationItem from './NotificationItem';
import NotificationSettings from './NotificationSettings';

const NotificationCenter = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({ total: 0, unread: 0 });
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (visible) {
      fetchNotifications();
    }
  }, [visible, activeTab]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = activeTab === 'unread' ? { read: false } : {};
      const response = await notificationService.getNotifications(params);
      setNotifications(response.data.notifications);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, read: true, readAt: new Date() }
            : notif
        )
      );
      setStats(prev => ({ ...prev, unread: prev.unread - 1 }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true, readAt: new Date() }))
      );
      setStats({ ...stats, unread: 0 });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const tabItems = [
    {
      key: 'all',
      label: `All (${stats.total})`,
      children: (
        <List
          loading={loading}
          dataSource={notifications}
          renderItem={(notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
            />
          )}
          locale={{ emptyText: <Empty description="No notifications" /> }}
        />
      )
    },
    {
      key: 'unread',
      label: `Unread (${stats.unread})`,
      children: (
        <List
          loading={loading}
          dataSource={notifications.filter(n => !n.read)}
          renderItem={(notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
            />
          )}
          locale={{ emptyText: <Empty description="No unread notifications" /> }}
        />
      )
    },
    {
      key: 'settings',
      label: 'Settings',
      children: <NotificationSettings />
    }
  ];

  return (
    <Drawer
      title={
        <div className="notification-header">
          <BellOutlined />
          <span>Notifications</span>
          {stats.unread > 0 && (
            <Badge count={stats.unread} size="small" />
          )}
        </div>
      }
      placement="right"
      width={400}
      open={visible}
      onClose={onClose}
      extra={
        stats.unread > 0 && (
          <Button 
            type="link" 
            icon={<CheckOutlined />}
            onClick={handleMarkAllAsRead}
          >
            Mark All Read
          </Button>
        )
      }
    >
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={tabItems}
      />
    </Drawer>
  );
};

export default NotificationCenter;
```

### Notification Item Component

```jsx
// components/Notifications/NotificationItem.jsx
import React from 'react';
import { List, Button, Tag, Typography, Space } from 'antd';
import { 
  CheckOutlined, 
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';

const { Text, Paragraph } = Typography;

const NotificationItem = ({ notification, onMarkAsRead }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'blue';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'error': return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'warning': return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'success': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'info': return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
      default: return <InfoCircleOutlined />;
    }
  };

  const handleMarkAsRead = () => {
    if (!notification.read) {
      onMarkAsRead(notification._id);
    }
  };

  const handleActionClick = () => {
    if (notification.action?.url) {
      window.open(notification.action.url, '_blank');
    }
    handleMarkAsRead();
  };

  return (
    <List.Item
      className={`notification-item ${notification.read ? 'read' : 'unread'}`}
      actions={[
        !notification.read && (
          <Button 
            type="link" 
            size="small"
            icon={<CheckOutlined />}
            onClick={handleMarkAsRead}
          >
            Mark Read
          </Button>
        ),
        notification.action && (
          <Button 
            type="link" 
            size="small"
            onClick={handleActionClick}
          >
            {notification.action.label || 'View'}
          </Button>
        )
      ]}
    >
      <List.Item.Meta
        avatar={getCategoryIcon(notification.category)}
        title={
          <Space>
            <Text strong={!notification.read}>{notification.title}</Text>
            <Tag color={getPriorityColor(notification.priority)} size="small">
              {notification.priority}
            </Tag>
          </Space>
        }
        description={
          <div>
            <Paragraph 
              ellipsis={{ rows: 2 }} 
              style={{ marginBottom: 8 }}
            >
              {notification.message}
            </Paragraph>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {notification.timeAgo}
            </Text>
          </div>
        }
      />
    </List.Item>
  );
};

export default NotificationItem;
```

### Notification Settings Component

```jsx
// components/Notifications/NotificationSettings.jsx
import React, { useState, useEffect } from 'react';
import { Form, Switch, TimePicker, Card, Row, Col, Button, message } from 'antd';
import { notificationService } from '../../services/notificationService';

const NotificationSettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getSettings();
      const settings = response.data.settings;
      
      form.setFieldsValue({
        emailEnabled: settings.email.enabled,
        emailProjectUpdates: settings.email.projectUpdates,
        emailSystemAlerts: settings.email.systemAlerts,
        pushEnabled: settings.push.enabled,
        pushProjectUpdates: settings.push.projectUpdates,
        pushSystemAlerts: settings.push.systemAlerts,
        smsEnabled: settings.sms.enabled,
        smsEmergencyAlerts: settings.sms.emergencyAlerts,
        quietHoursEnabled: settings.quietHours.enabled,
        quietHoursStart: settings.quietHours.startTime,
        quietHoursEnd: settings.quietHours.endTime
      });
    } catch (error) {
      message.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values) => {
    try {
      setSaving(true);
      
      const settings = {
        email: {
          enabled: values.emailEnabled,
          projectUpdates: values.emailProjectUpdates,
          systemAlerts: values.emailSystemAlerts
        },
        push: {
          enabled: values.pushEnabled,
          projectUpdates: values.pushProjectUpdates,
          systemAlerts: values.pushSystemAlerts
        },
        sms: {
          enabled: values.smsEnabled,
          emergencyAlerts: values.smsEmergencyAlerts
        },
        quietHours: {
          enabled: values.quietHoursEnabled,
          startTime: values.quietHoursStart,
          endTime: values.quietHoursEnd
        }
      };

      await notificationService.updateSettings(settings);
      message.success('Notification settings updated successfully');
    } catch (error) {
      message.error('Failed to update notification settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading settings...</div>;
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSave}
      className="notification-settings-form"
    >
      <Row gutter={[16, 16]}>
        {/* Email Settings */}
        <Col span={24}>
          <Card title="Email Notifications" size="small">
            <Form.Item name="emailEnabled" valuePropName="checked">
              <Switch checkedChildren="On" unCheckedChildren="Off" />
            </Form.Item>
            
            <Form.Item name="emailProjectUpdates" valuePropName="checked">
              <Switch checkedChildren="On" unCheckedChildren="Off" />
              <span style={{ marginLeft: 8 }}>Project Updates</span>
            </Form.Item>
            
            <Form.Item name="emailSystemAlerts" valuePropName="checked">
              <Switch checkedChildren="On" unCheckedChildren="Off" />
              <span style={{ marginLeft: 8 }}>System Alerts</span>
            </Form.Item>
          </Card>
        </Col>

        {/* Push Settings */}
        <Col span={24}>
          <Card title="Push Notifications" size="small">
            <Form.Item name="pushEnabled" valuePropName="checked">
              <Switch checkedChildren="On" unCheckedChildren="Off" />
            </Form.Item>
            
            <Form.Item name="pushProjectUpdates" valuePropName="checked">
              <Switch checkedChildren="On" unCheckedChildren="Off" />
              <span style={{ marginLeft: 8 }}>Project Updates</span>
            </Form.Item>
            
            <Form.Item name="pushSystemAlerts" valuePropName="checked">
              <Switch checkedChildren="On" unCheckedChildren="Off" />
              <span style={{ marginLeft: 8 }}>System Alerts</span>
            </Form.Item>
          </Card>
        </Col>

        {/* SMS Settings */}
        <Col span={24}>
          <Card title="SMS Notifications" size="small">
            <Form.Item name="smsEnabled" valuePropName="checked">
              <Switch checkedChildren="On" unCheckedChildren="Off" />
            </Form.Item>
            
            <Form.Item name="smsEmergencyAlerts" valuePropName="checked">
              <Switch checkedChildren="On" unCheckedChildren="Off" />
              <span style={{ marginLeft: 8 }}>Emergency Alerts Only</span>
            </Form.Item>
          </Card>
        </Col>

        {/* Quiet Hours */}
        <Col span={24}>
          <Card title="Quiet Hours" size="small">
            <Form.Item name="quietHoursEnabled" valuePropName="checked">
              <Switch checkedChildren="On" unCheckedChildren="Off" />
            </Form.Item>
            
            <Form.Item name="quietHoursStart">
              <TimePicker format="HH:mm" placeholder="Start Time" />
            </Form.Item>
            
            <Form.Item name="quietHoursEnd">
              <TimePicker format="HH:mm" placeholder="End Time" />
            </Form.Item>
          </Card>
        </Col>

        <Col span={24}>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={saving}
            block
          >
            Save Settings
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default NotificationSettings;
```

## State Management

### Redux Store Structure

```javascript
// store/slices/dashboardSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardService } from '../../services/dashboardService';

export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchData',
  async ({ period, includeCharts }) => {
    const response = await dashboardService.getSummary(period, includeCharts);
    return response.data;
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    data: null,
    loading: false,
    error: null,
    selectedPeriod: '30d'
  },
  reducers: {
    setPeriod: (state, action) => {
      state.selectedPeriod = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export const { setPeriod, clearError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
```

### Notification State Management

```javascript
// store/slices/notificationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationService } from '../../services/notificationService';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (params = {}) => {
    const response = await notificationService.getNotifications(params);
    return response.data;
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId) => {
    await notificationService.markAsRead(notificationId);
    return notificationId;
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    stats: { total: 0, unread: 0 },
    loading: false,
    error: null
  },
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.stats.total += 1;
      state.stats.unread += 1;
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.stats = { total: 0, unread: 0 };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload.notifications;
        state.stats = action.payload.stats;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notificationId = action.payload;
        const notification = state.notifications.find(n => n._id === notificationId);
        if (notification) {
          notification.read = true;
          notification.readAt = new Date();
          state.stats.unread -= 1;
        }
      });
  }
});

export const { addNotification, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
```

## Real-time Updates

### WebSocket Integration

```javascript
// hooks/useWebSocket.js
import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { addNotification } from '../store/slices/notificationSlice';

const useWebSocket = (url) => {
  const dispatch = useDispatch();
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'notification') {
        dispatch(addNotification(data.notification));
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      // Reconnect after 5 seconds
      setTimeout(() => {
        if (ws.current?.readyState === WebSocket.CLOSED) {
          ws.current = new WebSocket(url);
        }
      }, 5000);
    };

    return () => {
      ws.current?.close();
    };
  }, [url, dispatch]);

  return ws.current;
};

export default useWebSocket;
```

### Auto-refresh Dashboard

```javascript
// hooks/useAutoRefresh.js
import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { fetchDashboardData } from '../store/slices/dashboardSlice';

const useAutoRefresh = (interval = 30000) => {
  const dispatch = useDispatch();
  const intervalRef = useRef(null);

  useEffect(() => {
    // Set up auto-refresh
    intervalRef.current = setInterval(() => {
      dispatch(fetchDashboardData({ period: '30d', includeCharts: true }));
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [dispatch, interval]);

  return intervalRef.current;
};

export default useAutoRefresh;
```

## UI/UX Guidelines

### Design System

```css
/* styles/dashboard.css */
.admin-dashboard {
  padding: 24px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.dashboard-header h1 {
  margin: 0;
  color: #262626;
  font-size: 28px;
  font-weight: 600;
}

.overview-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.overview-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.charts-section {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.notification-item {
  border-left: 3px solid transparent;
  transition: all 0.3s ease;
}

.notification-item.unread {
  border-left-color: #1890ff;
  background-color: #f6ffed;
}

.notification-item:hover {
  background-color: #fafafa;
}

.notification-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .admin-dashboard {
    padding: 16px;
  }
  
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .overview-card {
    margin-bottom: 16px;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .admin-dashboard {
    background-color: #141414;
    color: #ffffff;
  }
  
  .overview-card {
    background-color: #1f1f1f;
    border-color: #303030;
  }
}
```

### Accessibility Features

```jsx
// components/AccessibleCard.jsx
import React from 'react';
import { Card } from 'antd';

const AccessibleCard = ({ title, children, ...props }) => {
  return (
    <Card
      title={<h2>{title}</h2>}
      role="region"
      aria-labelledby={title}
      tabIndex={0}
      {...props}
    >
      {children}
    </Card>
  );
};

export default AccessibleCard;
```

## Error Handling

### Error Boundary Component

```jsx
// components/ErrorBoundary.jsx
import React from 'react';
import { Result, Button } from 'antd';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="Something went wrong"
          subTitle="An error occurred while loading the dashboard"
          extra={
            <Button 
              type="primary" 
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### API Error Handler

```javascript
// utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        return 'Authentication required. Please log in again.';
      case 403:
        return 'Access denied. You do not have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return data.message || 'An unexpected error occurred.';
    }
  } else if (error.request) {
    // Network error
    return 'Network error. Please check your connection.';
  } else {
    // Other error
    return error.message || 'An unexpected error occurred.';
  }
};
```

## Performance Optimization

### Lazy Loading Components

```jsx
// App.jsx
import React, { Suspense } from 'react';
import { Spin } from 'antd';

const Dashboard = React.lazy(() => import('./components/Dashboard/Dashboard'));
const NotificationCenter = React.lazy(() => import('./components/Notifications/NotificationCenter'));

const App = () => {
  return (
    <Suspense fallback={<Spin size="large" />}>
      <Dashboard />
      <NotificationCenter />
    </Suspense>
  );
};

export default App;
```

### Memoization

```jsx
// components/Dashboard/OverviewCards.jsx
import React, { memo } from 'react';

const OverviewCards = memo(({ data }) => {
  // Component implementation
});

export default OverviewCards;
```

### Virtual Scrolling for Large Lists

```jsx
// components/Notifications/VirtualizedNotificationList.jsx
import React from 'react';
import { FixedSizeList as List } from 'react-window';

const VirtualizedNotificationList = ({ notifications }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <NotificationItem notification={notifications[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={notifications.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </List>
  );
};

export default VirtualizedNotificationList;
```

## Testing

### Component Testing Example

```javascript
// __tests__/Dashboard.test.jsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Dashboard from '../components/Dashboard/Dashboard';
import dashboardReducer from '../store/slices/dashboardSlice';

const createTestStore = () => {
  return configureStore({
    reducer: {
      dashboard: dashboardReducer
    }
  });
};

describe('Dashboard Component', () => {
  test('renders dashboard title', () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <Dashboard />
      </Provider>
    );
    
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  test('displays loading state', () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <Dashboard />
      </Provider>
    );
    
    expect(screen.getByText('Loading dashboard data...')).toBeInTheDocument();
  });
});
```

This comprehensive guide provides everything needed to implement the admin dashboard and notification functionality in your frontend admin panel. The code examples are production-ready and follow React best practices.


