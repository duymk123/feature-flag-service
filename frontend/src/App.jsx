import { useState, useEffect } from 'react'
import './index.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState('flags');
  const [auditLogs, setAuditLogs] = useState([]);

  const [flags, setFlags] = useState([]);
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applying, setApplying] = useState(false);

  // Toast State
  const [toast, setToast] = useState(null);

  const showToast = (title, message, type = 'success') => {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Customers tab state
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ customerCode: '', name: '', ipAddress: '' });
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerFlags, setCustomerFlags] = useState([]);
  const [customerFlagsLoading, setCustomerFlagsLoading] = useState(false);
  const [savingCustomerFlag, setSavingCustomerFlag] = useState(null);

  // Strategy Editor State
  const [editingStrategyId, setEditingStrategyId] = useState('');
  const [editingParams, setEditingParams] = useState('');

  useEffect(() => {
    fetch('http://localhost:8081/api/v1/flags')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch flags');
        return res.json();
      })
      .then(data => {
        setFlags(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load data from backend. Ensure Spring Boot is running on port 8081.');
        setLoading(false);
      });
  }, [isLoggedIn]); // Re-fetch flags if login state changes

  useEffect(() => {
    if (activeTab === 'audit' && isLoggedIn) {
      fetch('http://localhost:8081/api/v1/flags/audit')
        .then(res => res.json())
        .then(data => setAuditLogs(data))
        .catch(err => console.error(err));
    }
    if (activeTab === 'customers' && isLoggedIn) {
      fetchCustomers();
    }
  }, [activeTab, isLoggedIn]);

  const fetchCustomers = () => {
    setCustomersLoading(true);
    fetch('http://localhost:8081/api/v1/flags/customers')
      .then(res => res.json())
      .then(data => { setCustomers(data); setCustomersLoading(false); })
      .catch(err => { console.error(err); setCustomersLoading(false); });
  };

  const handleCreateCustomer = (e) => {
    e.preventDefault();
    setCreatingCustomer(true);
    fetch('http://localhost:8081/api/v1/flags/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCustomer)
    })
    .then(res => res.json())
    .then(() => {
      setNewCustomer({ customerCode: '', name: '', ipAddress: '' });
      fetchCustomers();
      setCreatingCustomer(false);
    })
    .catch(err => { console.error(err); setCreatingCustomer(false); });
  };

  const handleDeleteCustomer = (customerCode) => {
    if (!window.confirm(`Are you sure you want to delete customer ${customerCode}? This will also delete all their feature flag overrides.`)) {
      return;
    }
    
    fetch(`http://localhost:8081/api/v1/flags/customers/${customerCode}`, {
      method: 'DELETE'
    })
    .then(async res => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to delete customer');
      }
      // Remove from local state
      setCustomers(customers.filter(c => c.customerCode !== customerCode));
      showToast('Success', `Customer ${customerCode} deleted successfully.`, 'success');
    })
    .catch(err => {
      console.error(err);
      showToast('Error', 'Error deleting customer: ' + err.message, 'error');
    });
  };

  const openCustomerFlags = (customer) => {
    setSelectedCustomer(customer);
    setCustomerFlagsLoading(true);
    fetch(`http://localhost:8081/api/v1/flags/customers/${customer.customerCode}/features`)
      .then(res => res.json())
      .then(data => { setCustomerFlags(data); setCustomerFlagsLoading(false); })
      .catch(err => { console.error(err); setCustomerFlagsLoading(false); });
  };

  const updateCustomerFlag = (flagName, enabled) => {
    setSavingCustomerFlag(flagName);
    fetch(`http://localhost:8081/api/v1/flags/customers/${selectedCustomer.customerCode}/features/${flagName}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    })
    .then(res => res.json())
    .then(updated => {
      setCustomerFlags(prev => {
        const exists = prev.find(f => f.flagName === updated.flagName);
        if (exists) return prev.map(f => f.flagName === updated.flagName ? updated : f);
        return [...prev, updated];
      });
      setSavingCustomerFlag(null);
    })
    .catch(err => { console.error(err); setSavingCustomerFlag(null); });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === '123456') {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const toggleFlag = (name, currentStatus) => {
    fetch(`http://localhost:8081/api/v1/flags/${name}/toggle?enabled=${!currentStatus}`, {
      method: 'PUT'
    })
    .then(res => res.json())
    .then(updatedFlag => {
      setFlags(flags.map(f => f.name === updatedFlag.name ? { ...f, enabled: updatedFlag.enabled } : f));
      if (selectedFlag?.name === updatedFlag.name) {
        setSelectedFlag({ ...selectedFlag, enabled: updatedFlag.enabled });
      }
    })
    .catch(err => console.error(err));
  };

  const openDrawer = (flag) => {
    setSelectedFlag(flag);
    const stratId = flag.strategyId || '';
    setEditingStrategyId(stratId);
    
    let paramVal = '';
    if (flag.parameters) {
      if (stratId === 'username' && flag.parameters.users) paramVal = flag.parameters.users;
      else if (stratId === 'user-role' && flag.parameters.roles) paramVal = flag.parameters.roles;
      else if (stratId === 'release-date' && flag.parameters.date) paramVal = flag.parameters.date;
      else if (stratId === 'remote-client-ip' && flag.parameters.ips) paramVal = flag.parameters.ips;
      else if (stratId === 'remote-server-name' && flag.parameters.serverNames) paramVal = flag.parameters.serverNames;
      else if (stratId === 'remote-spring-profile' && flag.parameters.profiles) paramVal = flag.parameters.profiles;
      else if (stratId === 'gradual-rollout' && flag.parameters.percentage) paramVal = flag.parameters.percentage;
      else if (stratId === 'remote-system-property' && flag.parameters.property) paramVal = flag.parameters.property + (flag.parameters.value ? '=' + flag.parameters.value : '');
      else paramVal = Object.values(flag.parameters).find(v => v !== null && v !== '') || '';
    }
    setEditingParams(paramVal);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedFlag(null), 300);
  };

  const saveStrategy = () => {
    const paramsMap = {};
    if (editingStrategyId === 'username') {
      paramsMap['users'] = editingParams;
    } else if (editingStrategyId === 'user-role') {
      paramsMap['roles'] = editingParams;
    } else if (editingStrategyId === 'release-date') {
      paramsMap['date'] = editingParams;
    } else if (editingStrategyId === 'remote-client-ip') {
      paramsMap['ips'] = editingParams;
    } else if (editingStrategyId === 'remote-server-name') {
      paramsMap['serverNames'] = editingParams;
    } else if (editingStrategyId === 'remote-spring-profile') {
      paramsMap['profiles'] = editingParams;
    } else if (editingStrategyId === 'gradual-rollout') {
      paramsMap['percentage'] = editingParams;
    } else if (editingStrategyId === 'remote-system-property') {
      const parts = editingParams.split('=');
      paramsMap['property'] = parts[0] ? parts[0].trim() : '';
      paramsMap['value'] = parts[1] ? parts.slice(1).join('=').trim() : '';
    } else if (editingStrategyId) {
      // Custom fallback
      paramsMap['value'] = editingParams;
    }

    fetch(`http://localhost:8081/api/v1/flags/${selectedFlag.name}/strategy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strategyId: editingStrategyId || null, parameters: paramsMap })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi khi lưu strategy');
      return data;
    })
    .then(updatedFlag => {
      setFlags(flags.map(f => f.name === updatedFlag.name ? { 
        ...f, 
        strategyId: updatedFlag.strategyId, 
        parameters: updatedFlag.parameters,
        mockRules: updatedFlag.strategyId ? 1 : 0
      } : f));
      closeDrawer();
    })
    .catch(err => {
      console.error(err);
      showToast('Error', 'Không thể lưu strategy: ' + err.message, 'error');
    });
  };

  const applyChanges = () => {
    setApplying(true);
    fetch('http://localhost:8081/api/v1/flags/apply', {
      method: 'POST'
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to apply feature flags');
      return data;
    })
    .then(data => {
      showToast('Success', `Applied feature flags to tracking-order. Version: ${data.version}`, 'success');
    })
    .catch(err => {
      console.error(err);
      showToast('Error', 'Cannot apply feature flags: ' + err.message, 'error');
    })
    .finally(() => setApplying(false));
  };

  const getParameterDisplay = (flag) => {
    if (!flag.strategyId || !flag.parameters) return null;
    switch (flag.strategyId) {
      case 'username': return flag.parameters.users;
      case 'user-role': return flag.parameters.roles;
      case 'release-date': return flag.parameters.date;
      case 'remote-client-ip': return flag.parameters.ips;
      case 'remote-server-name': return flag.parameters.serverNames;
      case 'remote-spring-profile': return flag.parameters.profiles;
      case 'gradual-rollout': return flag.parameters.percentage;
      case 'remote-system-property': return flag.parameters.property + (flag.parameters.value ? '=' + flag.parameters.value : '');
      default:
        return Object.values(flag.parameters).find(v => v !== null && v !== '');
    }
  };

  const enabledCount = flags.filter(f => f.enabled).length;
  const disabledCount = flags.length - enabledCount;

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-logo">
            <div className="logo-icon">
              <i className="fa-solid fa-flag"></i>
            </div>
            <h2>Viettel <span>Feature Flag</span></h2>
          </div>
          <div className="login-header">
            <h1>Welcome Back</h1>
            <p>Please enter your admin credentials to continue</p>
          </div>
          {loginError && (
            <div className="login-error">
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{loginError}</span>
            </div>
          )}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Enter username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Enter password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-login">Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">
            <i className="fa-solid fa-flag"></i>
          </div>
          <h2>Viettel <span>Feature Flag</span></h2>
        </div>
        <nav className="nav-menu">
          <a href="#" className={`nav-item ${activeTab === 'flags' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('flags'); }}>Feature Flags</a>
          <a href="#" className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('customers'); setSelectedCustomer(null); }}>Customers</a>
          <a href="#" className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('audit'); }}>Audit Logs</a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <div className="header-left">
            <h1 className="page-title">Feature Flags</h1>
            <p className="page-subtitle">Manage feature flags by project, user, role, and rollout percentage without redeploying</p>
          </div>
          <div className="header-right">
            <button className="btn btn-primary" onClick={applyChanges} disabled={applying}>
              {applying ? 'Applying...' : 'Apply'}
            </button>
            <button className="btn btn-icon"><i className="fa-solid fa-globe"></i> EN</button>
            <button className="btn btn-icon"><i className="fa-regular fa-bell"></i></button>
            <div className="user-profile">
              <div className="avatar">A</div>
              <div className="user-info">
                <span className="user-name">admin</span>
                <span className="user-role">Feature Admin</span>
              </div>
            </div>
            <button className="btn btn-icon" onClick={() => {
              setIsLoggedIn(false);
              setUsername('');
              setPassword('');
            }} title="Logout" style={{marginLeft: '8px', color: 'var(--release)'}}>
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
            </button>
          </div>
        </header>

        {activeTab === 'flags' ? (
          <>
            {/* Stats */}
            <div className="stats-bar">
          <div className="stat-card">
            <div className="stat-icon" style={{color: '#6366f1', background: '#e0e7ff'}}><i className="fa-solid fa-flag"></i></div>
            <div className="stat-info">
              <h3><span>{flags.length}</span></h3>
              <p>Total Flags</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{color: '#10b981', background: '#d1fae5'}}><i className="fa-solid fa-check-circle"></i></div>
            <div className="stat-info">
              <h3><span>{enabledCount}</span></h3>
              <p>Enabled</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{color: '#6b7280', background: '#f3f4f6'}}><i className="fa-solid fa-circle-minus"></i></div>
            <div className="stat-info">
              <h3><span>{disabledCount}</span></h3>
              <p>Disabled</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <select className="filter-select"><option>All Projects</option></select>
          <select className="filter-select"><option>All Types</option></select>
          <select className="filter-select"><option>All Statuses</option></select>
          <div className="search-box">
            <i className="fa-solid fa-search"></i>
            <input type="text" placeholder="Search by name or key..." />
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="flags-table">
            <thead>
              <tr>
                <th>FLAG NAME</th>
                <th>KEY</th>
                <th>STRATEGY TYPE</th>
                <th>PARAMETERS</th>
                <th>STATUS</th>
                <th>RULES</th>
                <th>UPDATED</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="7" style={{textAlign: 'center'}}>Loading...</td></tr>}
              {error && <tr><td colSpan="7" style={{textAlign: 'center', color: 'red'}}>{error}</td></tr>}
              {!loading && !error && flags.map(flag => (
                <tr key={flag.id || flag.name} onClick={() => openDrawer(flag)}>
                  <td>
                    <span className="flag-name">{flag.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}</span>
                    <span className="flag-desc">{flag.description || 'No description provided'}</span>
                  </td>
                  <td><span className="flag-key">{flag.name.toLowerCase()}</span></td>
                  <td>
                    {flag.strategyId ? (
                      <span className="badge badge-release" style={{textTransform: 'none'}}>{flag.strategyId}</span>
                    ) : (
                      <span className="badge" style={{background: '#f3f4f6', color: '#6b7280'}}>None</span>
                    )}
                  </td>
                  <td style={{maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                    {getParameterDisplay(flag) ? (
                       <span style={{fontFamily: 'monospace', fontSize: '13px', color: '#4b5563'}} title={getParameterDisplay(flag)}>
                         {getParameterDisplay(flag)}
                       </span>
                    ) : (
                       <span style={{color: '#9ca3af', fontStyle: 'italic', fontSize: '12px'}}>No params</span>
                    )}
                  </td>
                  <td onClick={(e) => { e.stopPropagation(); toggleFlag(flag.name, flag.enabled); }}>
                    <div className="status-toggle">
                      <label className="switch small">
                        <input type="checkbox" checked={flag.enabled} readOnly />
                        <span className="slider round"></span>
                      </label>
                      <span style={{fontSize: '13px', color: flag.enabled ? 'var(--success)' : 'var(--text-muted)', fontWeight: 500, cursor: 'pointer'}}>
                        {flag.enabled ? 'On' : 'Off'}
                      </span>
                    </div>
                  </td>
                  <td><span style={{color: 'var(--primary)', background: '#fff3f2', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 600}}>{flag.strategyId ? '1 rule' : '0 rules'}</span></td>
                  <td style={{color: 'var(--text-muted)', fontSize: '12px'}}>{flag.updatedAt ? new Date(flag.updatedAt).toLocaleString() : new Date().toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          </>
        ) : activeTab === 'customers' ? (
          <div>
            {!selectedCustomer ? (
              <>
                {/* Create customer form */}
                <div className="rule-card" style={{marginBottom: '24px'}}>
                  <div style={{fontWeight: 700, fontSize: '15px', marginBottom: '14px', color: 'var(--text-primary)'}}>➕ Add New Customer</div>
                  <form onSubmit={handleCreateCustomer} style={{display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end'}}>
                    <div className="form-group" style={{margin: 0, flex: '1 1 150px'}}>
                      <label style={{fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)'}}>Customer Code</label>
                      <input className="form-input" placeholder="e.g. CUST_001" value={newCustomer.customerCode} onChange={e => setNewCustomer({...newCustomer, customerCode: e.target.value})} required />
                    </div>
                    <div className="form-group" style={{margin: 0, flex: '1 1 150px'}}>
                      <label style={{fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)'}}>Full Name</label>
                      <input className="form-input" placeholder="e.g. Nguyen Van A" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} required />
                    </div>
                    <div className="form-group" style={{margin: 0, flex: '1 1 150px'}}>
                      <label style={{fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)'}}>IP Address</label>
                      <input className="form-input" placeholder="e.g. 192.168.1.10" value={newCustomer.ipAddress} onChange={e => setNewCustomer({...newCustomer, ipAddress: e.target.value})} required />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={creatingCustomer} style={{height: '38px'}}>{creatingCustomer ? 'Saving...' : 'Add Customer'}</button>
                  </form>
                </div>
                {/* Customers list */}
                <div className="table-container">
                  <table className="flags-table">
                    <thead><tr><th>CODE</th><th>NAME</th><th>IP ADDRESS</th><th>ACTIONS</th></tr></thead>
                    <tbody>
                      {customersLoading && <tr><td colSpan="4" style={{textAlign: 'center'}}>Loading...</td></tr>}
                      {!customersLoading && customers.map(c => (
                        <tr key={c.id} style={{cursor: 'default'}}>
                          <td><span className="flag-key">{c.customerCode}</span></td>
                          <td><span className="flag-name">{c.name}</span></td>
                          <td><span style={{fontFamily: 'monospace', fontSize: '13px'}}>{c.ipAddress}</span></td>
                          <td>
                            <div style={{display: 'flex', gap: '8px'}}>
                              <button className="btn btn-outline" style={{fontSize: '12px', padding: '4px 12px'}} onClick={() => openCustomerFlags(c)}>
                                <i className="fa-solid fa-sliders" style={{marginRight: '6px'}}></i>Manage Flags
                              </button>
                              <button className="btn btn-outline" style={{fontSize: '12px', padding: '4px 12px', color: 'var(--danger)', borderColor: 'var(--danger)'}} onClick={() => handleDeleteCustomer(c.customerCode)}>
                                <i className="fa-solid fa-trash" style={{marginRight: '6px'}}></i>Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!customersLoading && customers.length === 0 && <tr><td colSpan="4" style={{textAlign: 'center', padding: '32px', color: 'var(--text-muted)'}}>No customers yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <>
                <button className="btn btn-outline" style={{marginBottom: '20px'}} onClick={() => setSelectedCustomer(null)}>
                  <i className="fa-solid fa-arrow-left" style={{marginRight: '6px'}}></i>Back to Customers
                </button>
                <div className="rule-card" style={{marginBottom: '20px'}}>
                  <div style={{fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)'}}>{selectedCustomer.name}</div>
                  <div style={{fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px'}}>
                    <span className="flag-key" style={{marginRight: '12px'}}>{selectedCustomer.customerCode}</span>
                    <span style={{fontFamily: 'monospace'}}>{selectedCustomer.ipAddress}</span>
                  </div>
                </div>
                <div style={{fontWeight: 700, fontSize: '14px', marginBottom: '12px', color: 'var(--text-primary)'}}>Feature Flag Overrides for this Customer</div>
                <div className="table-container">
                  <table className="flags-table">
                    <thead><tr><th>FLAG</th><th>STATUS FOR THIS CUSTOMER</th><th>SAVE</th></tr></thead>
                    <tbody>
                      {customerFlagsLoading && <tr><td colSpan="3" style={{textAlign: 'center'}}>Loading...</td></tr>}
                      {!customerFlagsLoading && flags.map(flag => {
                        const cflag = customerFlags.find(cf => cf.flagName === flag.name);
                        const isEnabled = cflag ? Boolean(cflag.enabled) : false;
                        return (
                          <tr key={flag.name} style={{cursor: 'default'}}>
                            <td><span className="flag-name">{flag.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}</span></td>
                            <td>
                              <div className="status-toggle">
                                <label className="switch small">
                                  <input type="checkbox" checked={isEnabled} onChange={e => updateCustomerFlag(flag.name, e.target.checked)} disabled={savingCustomerFlag === flag.name} />
                                  <span className="slider round"></span>
                                </label>
                                <span style={{fontSize: '13px', color: isEnabled ? 'var(--success)' : 'var(--text-muted)', fontWeight: 500}}>
                                  {isEnabled ? 'Enabled for this customer' : 'Disabled for this customer'}
                                </span>
                              </div>
                            </td>
                            <td>{savingCustomerFlag === flag.name ? <span style={{color: 'var(--text-muted)', fontSize: '13px'}}>Saving...</span> : <span style={{color: 'var(--success)', fontSize: '13px'}}>✓</span>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{marginTop: '16px', padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '13px', color: '#92400e'}}>
                  <i className="fa-solid fa-circle-info" style={{marginRight: '8px'}}></i>
                  After configuring all customer flags, go back and click <strong>Apply</strong> to push the snapshot to tracking-order.
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="flags-table">
              <thead>
                <tr>
                  <th>TIME</th>
                  <th>FLAG NAME</th>
                  <th>ACTION</th>
                  <th>USER</th>
                  <th>DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id} style={{cursor: 'default'}}>
                    <td style={{color: 'var(--text-muted)', fontSize: '13px'}}>{new Date(log.timestamp).toLocaleString()}</td>
                    <td><span className="flag-name">{log.flagName}</span></td>
                    <td><span className={`badge ${log.action.includes('ON') ? 'badge-permission' : log.action.includes('OFF') ? 'badge-release' : 'badge-experiment'}`} style={{textTransform: 'none'}}>{log.action}</span></td>
                    <td><span style={{fontWeight: 500}}>{log.performedBy}</span></td>
                    <td style={{fontSize: '13px', color: '#4b5563'}}>{log.details}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && <tr><td colSpan="5" style={{textAlign: 'center', padding: '32px', color: 'var(--text-muted)'}}>No audit logs found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Drawer */}
      <aside className={`drawer ${drawerOpen ? 'open' : ''}`}>
        {selectedFlag && (
          <>
            <div className="drawer-header">
              <div className="drawer-title">
                {selectedFlag.strategyId ? (
                  <span className="badge badge-release" style={{textTransform: 'none'}}>{selectedFlag.strategyId}</span>
                ) : (
                  <span className="badge" style={{background: '#f3f4f6', color: '#6b7280'}}>No Strategy</span>
                )}
                {selectedFlag.enabled ? (
                   <span className="status-badge status-enabled"><i className="fa-solid fa-circle"></i> Enabled</span>
                ) : (
                   <span className="status-badge" style={{background: '#f3f4f6', color: '#6b7280', borderColor: '#e5e7eb'}}><i className="fa-solid fa-circle"></i> Disabled</span>
                )}
              </div>
              <button className="btn-close" onClick={closeDrawer}><i className="fa-solid fa-xmark"></i></button>
            </div>
            
            <div className="drawer-content">
              <h2>{selectedFlag.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}</h2>
              <p className="drawer-flag-key">{selectedFlag.name.toLowerCase()}</p>

              <div className="section-title">
                  <h4>ACTIVATION STRATEGY</h4>
              </div>

              <div className="rule-card">
                  <div className="rule-body" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                      <label style={{fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px'}}>Strategy Type</label>
                      <select 
                        className="select-serve" 
                        style={{width: '100%', marginBottom: '16px'}}
                        value={editingStrategyId}
                        onChange={(e) => {
                          setEditingStrategyId(e.target.value);
                          setEditingParams('');
                        }}
                      >
                          <option value="">(None)</option>
                          <option value="user-role">User Role</option>
                          <option value="username">Users by name</option>
                          <option value="release-date">Release Date</option>
                          <option value="remote-client-ip">Remote Client IP</option>
                          <option value="remote-server-name">Remote Server Name</option>
                          <option value="remote-spring-profile">Remote Spring Profile</option>
                          <option value="remote-system-property">Remote System Property</option>
                          <option value="gradual-rollout">Gradual Rollout (%)</option>
                      </select>

                      {editingStrategyId && (
                        <>
                          <label style={{fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px'}}>
                            {editingStrategyId === 'username' ? 'Users (comma separated)' :
                             editingStrategyId === 'user-role' ? 'Roles (comma separated)' :
                             editingStrategyId === 'release-date' ? 'Date (YYYY-MM-DD) or (YYYY-MM-DD HH:mm:ss)' :
                             editingStrategyId === 'remote-client-ip' ? 'IP Addresses (comma separated)' :
                             editingStrategyId === 'remote-server-name' ? 'Server Names (comma separated)' :
                             editingStrategyId === 'remote-spring-profile' ? 'Spring Profiles (comma separated)' :
                             editingStrategyId === 'remote-system-property' ? 'Property=Value (e.g. os.name=windows)' :
                             editingStrategyId === 'gradual-rollout' ? 'Percentage (0-100)' :
                             'Parameter Value'}
                          </label>
                          <textarea 
                            style={{width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', fontFamily: 'monospace', minHeight: '60px', outline: 'none'}}
                            placeholder="Enter value here..."
                            value={editingParams}
                            onChange={(e) => setEditingParams(e.target.value)}
                          ></textarea>
                        </>
                      )}
                  </div>
              </div>


            </div>
            
            <div className="drawer-footer">
                <button className="btn btn-outline" onClick={() => {
                  setEditingStrategyId('');
                  setEditingParams('');
                }}>Clear</button>
                <div className="drawer-actions">
                    <button className="btn btn-outline" onClick={closeDrawer}>Discard</button>
                    <button className="btn btn-primary" onClick={saveStrategy}>Save Changes</button>
                </div>
            </div>
          </>
        )}
      </aside>
      
      {/* Backdrop */}
      <div className={`drawer-backdrop ${drawerOpen ? 'show' : ''}`} onClick={closeDrawer}></div>

      {/* Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            <div className="toast-icon">
              {toast.type === 'success' ? (
                <i className="fa-solid fa-circle-check"></i>
              ) : (
                <i className="fa-solid fa-circle-exclamation"></i>
              )}
            </div>
            <div className="toast-content">
              <div className="toast-title">{toast.title}</div>
              <div className="toast-message">{toast.message}</div>
            </div>
            <button className="toast-close" onClick={() => setToast(null)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
