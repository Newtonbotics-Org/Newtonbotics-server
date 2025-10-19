# Admin Dashboard Integration Guide

## Overview
This guide explains how to integrate the new subrole management system into your admin dashboard frontend.

## API Integration Examples

### 1. Get All Subroles for Management Interface

```javascript
// Fetch all subroles for admin dashboard
async function fetchSubroles() {
  try {
    const response = await fetch('/api/subroles?limit=100', {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return data.data.subroles;
  } catch (error) {
    console.error('Error fetching subroles:', error);
    throw error;
  }
}
```

### 2. Create New Subrole

```javascript
// Create a new subrole
async function createSubrole(subroleData) {
  try {
    const response = await fetch('/api/subroles', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subroleData)
    });
    
    const data = await response.json();
    return data.data.subrole;
  } catch (error) {
    console.error('Error creating subrole:', error);
    throw error;
  }
}

// Example usage
const newSubrole = await createSubrole({
  name: 'club_president',
  displayName: 'Club President',
  description: 'Overall club leadership',
  category: 'management_leadership',
  permissions: ['manage:projects', 'manage:system'],
  priority: 100
});
```

### 3. Update Subrole

```javascript
// Update existing subrole
async function updateSubrole(subroleId, updateData) {
  try {
    const response = await fetch(`/api/subroles/${subroleId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    const data = await response.json();
    return data.data.subrole;
  } catch (error) {
    console.error('Error updating subrole:', error);
    throw error;
  }
}
```

### 4. Assign Subroles to User

```javascript
// Assign subroles to a user
async function assignSubrolesToUser(userId, subroles) {
  try {
    const response = await fetch(`/api/users/${userId}/subroles`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ subroles })
    });
    
    const data = await response.json();
    return data.data.user;
  } catch (error) {
    console.error('Error assigning subroles:', error);
    throw error;
  }
}
```

### 5. Get Users with Specific Subrole

```javascript
// Get all users assigned to a specific subrole
async function getUsersWithSubrole(subroleId) {
  try {
    const response = await fetch(`/api/subroles/${subroleId}/users`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return data.data.users;
  } catch (error) {
    console.error('Error fetching users with subrole:', error);
    throw error;
  }
}
```

## React Component Examples

### 1. Subrole Management Component

```jsx
import React, { useState, useEffect } from 'react';

const SubroleManagement = () => {
  const [subroles, setSubroles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSubroles();
  }, []);

  const fetchSubroles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/subroles?limit=100', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setSubroles(data.data.subroles);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubrole = async (subroleData) => {
    try {
      const response = await fetch('/api/subroles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subroleData)
      });
      
      if (response.ok) {
        await fetchSubroles(); // Refresh the list
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateSubrole = async (subroleId, updateData) => {
    try {
      const response = await fetch(`/api/subroles/${subroleId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        await fetchSubroles(); // Refresh the list
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeactivateSubrole = async (subroleId) => {
    try {
      const response = await fetch(`/api/subroles/${subroleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        await fetchSubroles(); // Refresh the list
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading subroles...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="subrole-management">
      <h2>Subrole Management</h2>
      
      {/* Subrole List */}
      <div className="subrole-list">
        {subroles.map(subrole => (
          <div key={subrole._id} className="subrole-card">
            <h3>{subrole.displayName}</h3>
            <p>{subrole.description}</p>
            <p><strong>Category:</strong> {subrole.categoryDisplayName}</p>
            <p><strong>Priority:</strong> {subrole.priority}</p>
            <p><strong>Status:</strong> {subrole.isActive ? 'Active' : 'Inactive'}</p>
            
            <div className="subrole-actions">
              <button onClick={() => handleUpdateSubrole(subrole._id, { priority: subrole.priority + 1 })}>
                Increase Priority
              </button>
              {subrole.isActive ? (
                <button onClick={() => handleDeactivateSubrole(subrole._id)}>
                  Deactivate
                </button>
              ) : (
                <button onClick={() => handleUpdateSubrole(subrole._id, { isActive: true })}>
                  Reactivate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubroleManagement;
```

### 2. User Subrole Assignment Component

```jsx
import React, { useState, useEffect } from 'react';

const UserSubroleAssignment = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [availableSubroles, setAvailableSubroles] = useState([]);
  const [selectedSubroles, setSelectedSubroles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserAndSubroles();
  }, [userId]);

  const fetchUserAndSubroles = async () => {
    try {
      setLoading(true);
      
      // Fetch user data
      const userResponse = await fetch(`/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });
      const userData = await userResponse.json();
      setUser(userData.data.user);
      setSelectedSubroles(userData.data.user.subroles || []);
      
      // Fetch available subroles
      const subrolesResponse = await fetch('/api/subroles/active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });
      const subrolesData = await subrolesResponse.json();
      setAvailableSubroles(subrolesData.data.subroles);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubroleToggle = (subroleName) => {
    setSelectedSubroles(prev => {
      if (prev.includes(subroleName)) {
        return prev.filter(name => name !== subroleName);
      } else {
        return [...prev, subroleName];
      }
    });
  };

  const handleSaveSubroles = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/subroles`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ subroles: selectedSubroles })
      });
      
      if (response.ok) {
        alert('Subroles updated successfully!');
        await fetchUserAndSubroles(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating subroles:', error);
      alert('Error updating subroles');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="user-subrole-assignment">
      <h3>Assign Subroles to {user?.firstName} {user?.lastName}</h3>
      
      <div className="subrole-selection">
        {availableSubroles.map(subrole => (
          <label key={subrole.name} className="subrole-checkbox">
            <input
              type="checkbox"
              checked={selectedSubroles.includes(subrole.name)}
              onChange={() => handleSubroleToggle(subrole.name)}
            />
            <span>
              <strong>{subrole.displayName}</strong>
              <br />
              <small>{subrole.description}</small>
              <br />
              <small>Category: {subrole.categoryDisplayName}</small>
            </span>
          </label>
        ))}
      </div>
      
      <button onClick={handleSaveSubroles} className="save-button">
        Save Subroles
      </button>
    </div>
  );
};

export default UserSubroleAssignment;
```

## Vue.js Component Examples

### 1. Subrole Management Vue Component

```vue
<template>
  <div class="subrole-management">
    <h2>Subrole Management</h2>
    
    <div v-if="loading">Loading subroles...</div>
    <div v-else-if="error" class="error">Error: {{ error }}</div>
    <div v-else>
      <div class="subrole-list">
        <div v-for="subrole in subroles" :key="subrole._id" class="subrole-card">
          <h3>{{ subrole.displayName }}</h3>
          <p>{{ subrole.description }}</p>
          <p><strong>Category:</strong> {{ subrole.categoryDisplayName }}</p>
          <p><strong>Priority:</strong> {{ subrole.priority }}</p>
          <p><strong>Status:</strong> {{ subrole.isActive ? 'Active' : 'Inactive' }}</p>
          
          <div class="subrole-actions">
            <button @click="updateSubrole(subrole._id, { priority: subrole.priority + 1 })">
              Increase Priority
            </button>
            <button v-if="subrole.isActive" @click="deactivateSubrole(subrole._id)">
              Deactivate
            </button>
            <button v-else @click="reactivateSubrole(subrole._id)">
              Reactivate
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SubroleManagement',
  data() {
    return {
      subroles: [],
      loading: true,
      error: null
    };
  },
  async mounted() {
    await this.fetchSubroles();
  },
  methods: {
    async fetchSubroles() {
      try {
        this.loading = true;
        const response = await fetch('/api/subroles?limit=100', {
          headers: {
            'Authorization': `Bearer ${this.$store.state.adminToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        this.subroles = data.data.subroles;
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    
    async updateSubrole(subroleId, updateData) {
      try {
        const response = await fetch(`/api/subroles/${subroleId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.$store.state.adminToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
          await this.fetchSubroles();
        }
      } catch (err) {
        this.error = err.message;
      }
    },
    
    async deactivateSubrole(subroleId) {
      try {
        const response = await fetch(`/api/subroles/${subroleId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.$store.state.adminToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          await this.fetchSubroles();
        }
      } catch (err) {
        this.error = err.message;
      }
    },
    
    async reactivateSubrole(subroleId) {
      try {
        const response = await fetch(`/api/subroles/${subroleId}/reactivate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.$store.state.adminToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          await this.fetchSubroles();
        }
      } catch (err) {
        this.error = err.message;
      }
    }
  }
};
</script>
```

## Error Handling

### Common Error Scenarios

```javascript
// Handle API errors
const handleApiError = (error, response) => {
  if (response?.status === 401) {
    // Unauthorized - redirect to login
    window.location.href = '/login';
  } else if (response?.status === 403) {
    // Forbidden - show permission error
    alert('You do not have permission to perform this action');
  } else if (response?.status === 409) {
    // Conflict - subrole name already exists
    alert('A subrole with this name already exists');
  } else if (response?.status === 400) {
    // Bad request - validation error
    const errorData = response.json();
    alert(`Validation error: ${errorData.message}`);
  } else {
    // Generic error
    alert('An error occurred. Please try again.');
  }
};
```

## Best Practices

### 1. Token Management
```javascript
// Store admin token securely
const adminToken = localStorage.getItem('adminToken');

// Check token validity before API calls
const isTokenValid = () => {
  const token = localStorage.getItem('adminToken');
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
};
```

### 2. Loading States
```javascript
// Always show loading states for better UX
const [loading, setLoading] = useState(false);

const performAction = async () => {
  setLoading(true);
  try {
    await apiCall();
  } finally {
    setLoading(false);
  }
};
```

### 3. Error Boundaries
```jsx
// Wrap components in error boundaries
class SubroleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong with subrole management.</h1>;
    }

    return this.props.children;
  }
}
```

This integration guide provides everything needed to implement subrole management in your admin dashboard frontend.
