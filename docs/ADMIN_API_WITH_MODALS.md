# Admin APIs with React Modal Examples

Base URL: `http://localhost:3005/api`

Authentication header for all admin-only endpoints:
`Authorization: Bearer <admin-token>`

---

## Users (Admin)

- GET `/users` — list users (query: q, role, department, skills[], limit, skip)
- GET `/users/:id` — get user
- PUT `/users/:id` — update user
- PUT `/users/:id/subroles` — update user subroles `{ subroles: string[] }`
- DELETE `/users/:id` — deactivate user
- POST `/users/:id/reactivate` — reactivate user

### Modal: Edit User (with Subroles)

```jsx
import React, { useEffect, useState } from 'react';

export default function EditUserModal({ user, onClose, onSaved }) {
  const token = localStorage.getItem('adminToken');
  const [form, setForm] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    studentId: user.studentId || '',
    phone: user.phone || '',
    role: user.role || 'student',
    department: user.department || '',
    yearOfStudy: user.yearOfStudy || 1,
    bio: user.bio || '',
    skills: (user.skills || []).join(', '),
  });
  const [availableSubroles, setAvailableSubroles] = useState([]);
  const [selectedSubroles, setSelectedSubroles] = useState(user.subroles || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3005/api/subroles/active', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => setAvailableSubroles(d?.data?.subroles || []))
      .catch(() => setAvailableSubroles([]));
  }, [token]);

  const change = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const toggleSubrole = name => setSelectedSubroles(p => p.includes(name) ? p.filter(s => s !== name) : [...p, name]);

  const save = async () => {
    setSaving(true);
    try {
      // Update core fields
      const coreRes = await fetch(`http://localhost:3005/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          studentId: form.studentId,
          phone: form.phone,
          role: form.role,
          department: form.department,
          yearOfStudy: Number(form.yearOfStudy),
          bio: form.bio,
          skills: form.skills.split(',').map(s => s.trim()).filter(Boolean)
        })
      });
      if (!coreRes.ok) throw new Error('Failed to update user');

      // Update subroles
      const srRes = await fetch(`http://localhost:3005/api/users/${user.id}/subroles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subroles: selectedSubroles })
      });
      if (!srRes.ok) throw new Error('Failed to update subroles');

      onSaved?.();
    } catch (e) {
      alert(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal">
      {/* existing user fields ... */}

      <div className="field">
        <label>Subroles</label>
        <div style={{ display: 'grid', gap: 8 }}>
          {availableSubroles.map(sr => (
            <label key={sr.name} style={{ display: 'flex', gap: 8 }}>
              <input type="checkbox" checked={selectedSubroles.includes(sr.name)} onChange={() => toggleSubrole(sr.name)} />
              <div>
                <div style={{ fontWeight: 600 }}>{sr.displayName}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{sr.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="actions">
        <button onClick={onClose}>Cancel</button>
        <button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
      </div>
    </div>
  );
}
```

### Modal: Confirm Deactivate / Reactivate User

```jsx
function ConfirmUserStatusModal({ user, action, onClose, onDone }) {
  const token = localStorage.getItem('adminToken');
  const run = async () => {
    const endpoint = action === 'deactivate'
      ? `http://localhost:3005/api/users/${user.id}`
      : `http://localhost:3005/api/users/${user.id}/reactivate`;
    const method = action === 'deactivate' ? 'DELETE' : 'POST';
    const res = await fetch(endpoint, { method, headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return alert('Operation failed');
    onDone?.();
  };
  return (
    <div className="modal">
      <p>Are you sure you want to {action} {user.firstName} {user.lastName}?</p>
      <div className="actions">
        <button onClick={onClose}>Cancel</button>
        <button onClick={run}>{action === 'deactivate' ? 'Deactivate' : 'Reactivate'}</button>
      </div>
    </div>
  );
}
```

---

## Subroles (Admin)

- GET `/subroles` — list all (admin)
- GET `/subroles/:id` — get one (admin)
- POST `/subroles` — create
- PUT `/subroles/:id` — update
- DELETE `/subroles/:id` — soft delete (sets `isActive=false`)
- POST `/subroles/:id/reactivate` — reactivate
- GET `/subroles/:id/users` — users assigned to this subrole
- GET `/subroles/active` — active subroles (any authenticated)
- GET `/subroles/categories` — categories (any authenticated)
- POST `/subroles/seed` — seed defaults (admin)

### Payload Rules (update/create)

- `name` (create only): lowercase, underscores, 2–100
- `displayName`: 2–100
- `description`: ≤500
- `category`: one of
  `management_leadership`, `financial_administrative`, `technical_specializations`, `lab_operations`, `communication_outreach`, `event_workshop_management`, `research_publication`, `industry_partnerships`, `student_support`, `special_designations`
- `permissions`: array of allowed permission strings
- `priority`: integer ≥ 0
- `isActive`: boolean

### Modal: Create Subrole

```jsx
function CreateSubroleModal({ onClose, onCreated }) {
  const token = localStorage.getItem('adminToken');
  const [form, setForm] = useState({
    name: '', displayName: '', description: '', category: 'management_leadership', permissions: [], priority: 0
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('http://localhost:3005/api/subroles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || data?.message || 'Create failed');
      onCreated?.(data.data.subrole);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };
  // render inputs for name/displayName/description/category/permissions/priority
  return (
    <div className="modal">
      {/* inputs ... */}
      <div className="actions">
        <button onClick={onClose}>Cancel</button>
        <button onClick={save} disabled={saving}>{saving ? 'Creating...' : 'Create Subrole'}</button>
      </div>
    </div>
  );
}
```

### Modal: Edit Subrole

```jsx
function EditSubroleModal({ subrole, onClose, onSaved }) {
  const token = localStorage.getItem('adminToken');
  const [form, setForm] = useState({
    displayName: subrole.displayName || '',
    description: subrole.description || '',
    category: subrole.category || 'management_leadership',
    permissions: subrole.permissions || [],
    priority: subrole.priority ?? 0,
    isActive: subrole.isActive ?? true
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:3005/api/subroles/${subrole._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || data?.message || 'Update failed');
      onSaved?.(data.data.subrole);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="modal">
      {/* inputs for displayName/description/category/permissions/priority/isActive */}
      <div className="actions">
        <button onClick={onClose}>Cancel</button>
        <button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
      </div>
    </div>
  );
}
```

### Modal: Confirm Deactivate / Reactivate Subrole

```jsx
function ConfirmSubroleStatusModal({ subrole, action, onClose, onDone }) {
  const token = localStorage.getItem('adminToken');
  const run = async () => {
    const endpoint = action === 'deactivate'
      ? `http://localhost:3005/api/subroles/${subrole._id}`
      : `http://localhost:3005/api/subroles/${subrole._id}/reactivate`;
    const method = action === 'deactivate' ? 'DELETE' : 'POST';
    const res = await fetch(endpoint, { method, headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return alert('Operation failed');
    onDone?.();
  };
  return (
    <div className="modal">
      <p>Are you sure you want to {action} “{subrole.displayName}”?</p>
      <div className="actions">
        <button onClick={onClose}>Cancel</button>
        <button onClick={run}>{action === 'deactivate' ? 'Deactivate' : 'Reactivate'}</button>
      </div>
    </div>
  );
}
```

---

## Common Fetch Helper

```js
export const api = (path, options = {}) => {
  const token = localStorage.getItem('adminToken');
  return fetch(`http://localhost:3005/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
};
```

Use these snippets directly in your dashboard to manage users and subroles via modals.


