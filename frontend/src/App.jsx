import { useState, useEffect, useRef } from 'react'
import './index.css'

// ===== MultiSelectParam Component =====
const MultiSelectParam = ({ strategyType, selectedValues, onChange, placeholder, options, loading }) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = (options || []).filter(opt =>
    opt.value.toLowerCase().includes(search.toLowerCase()) ||
    (opt.label && opt.label.toLowerCase().includes(search.toLowerCase()))
  );

  const isSelected = (val) => selectedValues.includes(val);

  const toggleOption = (val) => {
    if (isSelected(val)) {
      onChange(selectedValues.filter(v => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const removeTag = (val) => {
    onChange(selectedValues.filter(v => v !== val));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      e.preventDefault();
      const trimmed = search.trim();
      if (!isSelected(trimmed)) {
        onChange([...selectedValues, trimmed]);
      }
      setSearch('');
    }
    // Backspace to remove last tag
    if (e.key === 'Backspace' && !search && selectedValues.length > 0) {
      onChange(selectedValues.slice(0, -1));
    }
  };

  const handleAddCustomClick = () => {
    if (!search.trim()) return;
    const trimmed = search.trim();
    if (!isSelected(trimmed)) {
      onChange([...selectedValues, trimmed]);
    }
    setSearch('');
  };

  const showAddNew = search.trim() && !(options || []).some(o => o.value.toLowerCase() === search.trim().toLowerCase());

  return (
    <div className="multi-select-container" ref={containerRef}>
      <div className="multi-select-trigger" onClick={() => setIsOpen(!isOpen)}>
        <span className="trigger-text">
          {selectedValues.length === 0 ? "Please choose..." : selectedValues.join(', ')}
        </span>
        <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'}`} style={{ color: 'var(--text-muted)' }}></i>
      </div>

      {isOpen && (
        <div className="multi-select-dropdown">
          <div className="multi-select-search-container">
            <input
              className="multi-select-search"
              type="text"
              placeholder="Tìm kiếm hoặc thêm mới..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>
          {loading ? (
            <div className="multi-select-loading">
              <i className="fa-solid fa-spinner"></i> Đang tải...
            </div>
          ) : (
            <>
              {filteredOptions.length === 0 && !showAddNew && (
                <div className="multi-select-empty">
                  {search ? 'Không tìm thấy kết quả' : 'Chưa lấy được dữ liệu từ API. Bạn có thể gõ và nhấn Enter để thêm.'}
                </div>
              )}
              {filteredOptions.length > 0 && (
                <div
                  className="multi-select-option"
                  onClick={() => {
                    const allSelected = filteredOptions.every(o => isSelected(o.value));
                    if (allSelected) {
                      // Deselect all filtered
                      const filteredVals = filteredOptions.map(o => o.value);
                      onChange(selectedValues.filter(v => !filteredVals.includes(v)));
                    } else {
                      // Select all filtered
                      const filteredVals = filteredOptions.map(o => o.value);
                      onChange([...new Set([...selectedValues, ...filteredVals])]);
                    }
                  }}
                  style={{ borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}
                >
                  <div className="option-check">
                    {filteredOptions.length > 0 && filteredOptions.every(o => isSelected(o.value)) && <i className="fa-solid fa-check"></i>}
                  </div>
                  <span className="option-label" style={{ fontWeight: 600 }}>Select All</span>
                </div>
              )}
              {filteredOptions.map(opt => (
                <div
                  key={opt.id || opt.value}
                  className={`multi-select-option ${isSelected(opt.value) ? 'selected' : ''}`}
                  onClick={() => toggleOption(opt.value)}
                >
                  <div className="option-check">
                    {isSelected(opt.value) && <i className="fa-solid fa-check"></i>}
                  </div>
                  <span className="option-label">{opt.value}</span>
                  {opt.label && opt.label !== opt.value && (
                    <span className="option-sublabel">{opt.label}</span>
                  )}
                </div>
              ))}
              {showAddNew && (
                <div className="multi-select-add-new" onClick={handleAddCustomClick}>
                  <i className="fa-solid fa-plus-circle"></i>
                  Thêm "<strong>{search.trim()}</strong>" (nhấn Enter)
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ===== DatePickerParam Component =====
const DatePickerParam = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const parseInitialDate = () => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
      const parts = value.trim().split('-');
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    return new Date();
  };

  const [viewDate, setViewDate] = useState(parseInitialDate);

  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
      const parts = value.trim().split('-');
      setViewDate(new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatISO = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const selectDate = (d) => {
    onChange(formatISO(d));
    setIsOpen(false);
  };

  const applyPreset = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    onChange(formatISO(d));
    setViewDate(d);
    setIsOpen(false);
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDay = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = lastDayOfMonth.getDate();
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  const calendarDays = [];

  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDay - i);
    calendarDays.push({ date: d, isCurrentMonth: false });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    calendarDays.push({ date: d, isCurrentMonth: true });
  }

  const remaining = (7 - (calendarDays.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    calendarDays.push({ date: d, isCurrentMonth: false });
  }

  const todayStr = formatISO(new Date());
  const selectedStr = value ? value.trim() : '';
  const isFuture = selectedStr && selectedStr > todayStr;
  const isPastOrToday = selectedStr && selectedStr <= todayStr;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="datepicker-container" ref={containerRef}>
      <div className={`datepicker-trigger ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        <span className={`datepicker-value ${!selectedStr ? 'placeholder' : ''}`}>
          <i className="fa-regular fa-calendar-days" style={{ color: '#10b981' }}></i>
          {selectedStr || 'Chọn ngày phát hành (YYYY-MM-DD)'}
        </span>
        <div className="datepicker-icons">
          {selectedStr && (
            <button
              type="button"
              className="datepicker-clear-btn"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              title="Xóa ngày"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
          <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'}`} style={{ fontSize: '11px' }}></i>
        </div>
      </div>

      {isOpen && (
        <div className="datepicker-popover">
          <div className="datepicker-header">
            <button type="button" className="datepicker-nav-btn" onClick={handlePrevMonth}>
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <span className="datepicker-title">
              {monthNames[month]} {year}
            </span>
            <button type="button" className="datepicker-nav-btn" onClick={handleNextMonth}>
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>

          <div className="datepicker-grid-days">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
              <div key={d} className="datepicker-day-name">{d}</div>
            ))}
          </div>

          <div className="datepicker-grid-dates">
            {calendarDays.map((item, idx) => {
              const dStr = formatISO(item.date);
              const isSelected = selectedStr === dStr;
              const isToday = todayStr === dStr;
              return (
                <div
                  key={idx}
                  className={`datepicker-date-cell ${
                    !item.isCurrentMonth ? 'outside-month' : ''
                  } ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => selectDate(item.date)}
                >
                  {item.date.getDate()}
                </div>
              );
            })}
          </div>

          <div className="datepicker-presets">
            <button type="button" className="datepicker-preset-chip" onClick={() => applyPreset(0)}>Hôm nay</button>
            <button type="button" className="datepicker-preset-chip" onClick={() => applyPreset(1)}>Ngày mai</button>
            <button type="button" className="datepicker-preset-chip" onClick={() => applyPreset(7)}>+7 Ngày</button>
            <button type="button" className="datepicker-preset-chip" onClick={() => applyPreset(30)}>+30 Ngày</button>
          </div>
        </div>
      )}

      {selectedStr && (
        <div className={`datepicker-status-badge ${isFuture ? 'future' : 'past'}`}>
          <i className={`fa-solid ${isFuture ? 'fa-lock' : 'fa-circle-check'}`}></i>
          <span>
            {isFuture
              ? `🔒 Ngày tương lai (${selectedStr}): Chưa đến hạn, chiến lược trả về FALSE (Bị chặn). Thích hợp test logic AND!`
              : `✅ Ngày hiện tại/quá khứ (${selectedStr}): Đã qua hạn, chiến lược trả về TRUE.`}
          </span>
        </div>
      )}
    </div>
  );
};

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
  const [newCustomer, setNewCustomer] = useState({ customerCode: '', name: '', ipAddress: '', serviceUrl: '' });
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerFlags, setCustomerFlags] = useState([]);
  const [customerFlagsLoading, setCustomerFlagsLoading] = useState(false);
  const [savingCustomerFlag, setSavingCustomerFlag] = useState(null);
  const [applyingCustomer, setApplyingCustomer] = useState(false);

  // Multi-Strategy Editor State
  // Each strategy: { strategyId: string, params: { key: value } }
  const [editingStrategies, setEditingStrategies] = useState([]);
  const [editingStrategyLogic, setEditingStrategyLogic] = useState('OR');

  // Strategy options from DB (cache per type)
  const [strategyOptionsCache, setStrategyOptionsCache] = useState({});
  const [loadingOptions, setLoadingOptions] = useState({});

  // Available strategy options
  const strategyOptions = [
    { value: 'user-role', label: 'User Role', paramKey: 'roles', paramLabel: 'Roles', placeholder: 'Tìm hoặc thêm role...', multiSelect: true },
    { value: 'username', label: 'Users by name', paramKey: 'users', paramLabel: 'Users', placeholder: 'Tìm hoặc thêm user...', multiSelect: true },
    { value: 'release-date', label: 'Release Date', paramKey: 'date', paramLabel: 'Date (YYYY-MM-DD)', placeholder: '2026-09-01', multiSelect: false },
    { value: 'remote-client-ip', label: 'Remote Client IP', paramKey: 'ips', paramLabel: 'IP Addresses', placeholder: 'Tìm hoặc thêm IP...', multiSelect: true },
    { value: 'remote-server-name', label: 'Remote Server Name', paramKey: 'serverNames', paramLabel: 'Server Names', placeholder: 'Tìm hoặc thêm server...', multiSelect: true },
    { value: 'remote-spring-profile', label: 'Remote Spring Profile', paramKey: 'profiles', paramLabel: 'Spring Profiles', placeholder: 'Tìm hoặc thêm profile...', multiSelect: true },
    { value: 'gradual-rollout', label: 'Gradual Rollout (%)', paramKey: 'percentage', paramLabel: 'Percentage (0-100)', placeholder: '50', multiSelect: false },
    { value: 'remote-system-property', label: 'Remote System Property', paramKey: 'property', paramLabel: 'Property=Value', placeholder: 'os.name=windows', multiSelect: false },
  ];

  // Fetch strategy options from backend
  const fetchStrategyOptions = (strategyType, customerCode = null) => {
    // Cache key gồm cả customerCode để tránh dùng nhầm data của customer khác
    const cacheKey = customerCode ? `${strategyType}__${customerCode}` : strategyType;
    if (strategyOptionsCache[cacheKey] || loadingOptions[cacheKey]) return;
    setLoadingOptions(prev => ({ ...prev, [cacheKey]: true }));
    const url = customerCode
      ? `http://localhost:8081/api/v1/flags/strategy-options/${strategyType}?customerCode=${encodeURIComponent(customerCode)}`
      : `http://localhost:8081/api/v1/flags/strategy-options/${strategyType}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setStrategyOptionsCache(prev => ({ ...prev, [cacheKey]: data }));
        setLoadingOptions(prev => ({ ...prev, [cacheKey]: false }));
      })
      .catch(err => {
        console.error('Failed to fetch strategy options:', err);
        setLoadingOptions(prev => ({ ...prev, [cacheKey]: false }));
      });
  };

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
  }, [isLoggedIn]);

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
    const method = isEditingCustomer ? 'PUT' : 'POST';
    const url = isEditingCustomer 
      ? `http://localhost:8081/api/v1/flags/customers/${newCustomer.customerCode}`
      : 'http://localhost:8081/api/v1/flags/customers';

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCustomer)
    })
    .then(async res => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to save customer');
      }
      return res.json();
    })
    .then(() => {
      setNewCustomer({ customerCode: '', name: '', ipAddress: '', serviceUrl: '' });
      setIsEditingCustomer(false);
      fetchCustomers();
      setCreatingCustomer(false);
      showToast('Success', `Customer ${isEditingCustomer ? 'updated' : 'created'} successfully.`, 'success');
    })
    .catch(err => { 
      console.error(err); 
      setCreatingCustomer(false); 
      showToast('Error', err.message, 'error');
    });
  };

  const handleEditCustomerClick = (c) => {
    setNewCustomer({
      customerCode: c.customerCode,
      name: c.name,
      ipAddress: c.ipAddress,
      serviceUrl: c.serviceUrl || ''
    });
    setIsEditingCustomer(true);
  };

  const handleCancelEdit = () => {
    setNewCustomer({ customerCode: '', name: '', ipAddress: '', serviceUrl: '' });
    setIsEditingCustomer(false);
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
      .then(data => {
        setCustomerFlags(data);
        setCustomerFlagsLoading(false);
      })
      .catch(err => { console.error(err); setCustomerFlagsLoading(false); });
  };

  const toggleCustomerFlagStatus = (flagName, currentStatus) => {
    const cflag = customerFlags.find(cf => cf.flagName === flagName);
    const strategies = cflag ? cflag.strategies : [];
    const newStatus = !currentStatus;

    fetch(`http://localhost:8081/api/v1/flags/customers/${selectedCustomer.customerCode}/features/${flagName}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: newStatus, strategies })
    })
    .then(res => res.json())
    .then(updated => {
      setCustomerFlags(prev => {
        const exists = prev.find(f => f.flagName === updated.flagName);
        if (exists) return prev.map(f => f.flagName === updated.flagName ? updated : f);
        return [...prev, updated];
      });
      if (selectedFlag?.name === updated.flagName) {
        setSelectedFlag(prev => ({ ...prev, enabled: newStatus }));
      }
    })
    .catch(err => console.error(err));
  };

  const applyToCustomer = () => {
    setApplyingCustomer(true);
    fetch(`http://localhost:8081/api/v1/flags/apply/${selectedCustomer.customerCode}`, {
      method: 'POST'
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to apply');
      return data;
    })
    .then(data => {
      showToast('Applied!', `Snapshot v${data.version ? data.version.substring(0,19) : ''} pushed to ${selectedCustomer.name}`, 'success');
    })
    .catch(err => {
      showToast('Error', 'Cannot apply: ' + err.message, 'error');
    })
    .finally(() => setApplyingCustomer(false));
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

  // ===== Multi-Strategy Helpers =====

  const getStrategyLabel = (strategyId) => {
    const opt = strategyOptions.find(o => o.value === strategyId);
    return opt ? opt.label : strategyId || 'Unknown';
  };

  const getStrategyParamDisplay = (strategy) => {
    if (!strategy || !strategy.params) return '';
    const opt = strategyOptions.find(o => o.value === strategy.strategyId);
    if (!opt) return Object.values(strategy.params).join(', ');
    
    if (strategy.strategyId === 'remote-system-property') {
      return (strategy.params.property || '') + (strategy.params.value ? '=' + strategy.params.value : '');
    }
    return strategy.params[opt.paramKey] || Object.values(strategy.params).join(', ');
  };

  const getStrategiesSummary = (strategies) => {
    if (!strategies || strategies.length === 0) return null;
    return strategies.map(s => getStrategyLabel(s.strategyId)).join(', ');
  };

  const getStrategiesParamsSummary = (strategies) => {
    if (!strategies || strategies.length === 0) return null;
    return strategies.map(s => getStrategyParamDisplay(s)).filter(Boolean).join(' | ');
  };

  // Convert strategy params from flat string to proper map based on strategyId
  const buildParamsMap = (strategyId, paramsRaw) => {
    const paramsMap = {};
    if (strategyId === 'username') paramsMap['users'] = paramsRaw;
    else if (strategyId === 'user-role') paramsMap['roles'] = paramsRaw;
    else if (strategyId === 'release-date') paramsMap['date'] = paramsRaw;
    else if (strategyId === 'remote-client-ip') paramsMap['ips'] = paramsRaw;
    else if (strategyId === 'remote-server-name') paramsMap['serverNames'] = paramsRaw;
    else if (strategyId === 'remote-spring-profile') paramsMap['profiles'] = paramsRaw;
    else if (strategyId === 'gradual-rollout') paramsMap['percentage'] = paramsRaw;
    else if (strategyId === 'remote-system-property') {
      const parts = paramsRaw.split('=');
      paramsMap['property'] = parts[0] ? parts[0].trim() : '';
      paramsMap['value'] = parts[1] ? parts.slice(1).join('=').trim() : '';
    } else if (strategyId) {
      paramsMap['value'] = paramsRaw;
    }
    return paramsMap;
  };

  // Convert strategy params map back to flat display string
  const paramsMapToDisplay = (strategyId, params) => {
    if (!params) return '';
    if (strategyId === 'username') return params.users || '';
    if (strategyId === 'user-role') return params.roles || '';
    if (strategyId === 'release-date') return params.date || '';
    if (strategyId === 'remote-client-ip') return params.ips || '';
    if (strategyId === 'remote-server-name') return params.serverNames || '';
    if (strategyId === 'remote-spring-profile') return params.profiles || '';
    if (strategyId === 'gradual-rollout') return params.percentage || '';
    if (strategyId === 'remote-system-property') return (params.property || '') + (params.value ? '=' + params.value : '');
    return Object.values(params).find(v => v !== null && v !== '') || '';
  };

  // ===== Drawer Open/Close =====

  const openDrawer = (flag) => {
    setSelectedFlag(flag);
    // Convert strategies from API format to editing format
    const strategies = (flag.strategies || []).map(s => ({
      strategyId: s.strategyId || '',
      paramsRaw: paramsMapToDisplay(s.strategyId, s.params)
    }));
    setEditingStrategies(strategies);
    setEditingStrategyLogic(flag.strategyLogic || 'OR');
    // Pre-fetch options for existing strategies that use multi-select
    strategies.forEach(s => {
      const opt = strategyOptions.find(o => o.value === s.strategyId);
      if (opt && opt.multiSelect) {
        fetchStrategyOptions(s.strategyId, null);
      }
    });
    setDrawerOpen(true);
  };

  const openCustomerDrawer = (flag, cflag) => {
    const isEnabled = cflag ? Boolean(cflag.enabled) : false;
    const strategies = cflag && cflag.strategies ? cflag.strategies : [];
    
    setSelectedFlag({
      ...flag,
      enabled: isEnabled,
      strategies: strategies
    });
    
    const editStrategies = strategies.map(s => ({
      strategyId: s.strategyId || '',
      paramsRaw: paramsMapToDisplay(s.strategyId, s.params)
    }));
    setEditingStrategies(editStrategies);
    setEditingStrategyLogic((cflag && cflag.strategyLogic) || 'OR');
    // Pre-fetch options for existing strategies that use multi-select
    editStrategies.forEach(s => {
      const opt = strategyOptions.find(o => o.value === s.strategyId);
      if (opt && opt.multiSelect) {
        fetchStrategyOptions(s.strategyId, selectedCustomer ? selectedCustomer.customerCode : null);
      }
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedFlag(null), 300);
  };

  // ===== Strategy editing helpers =====

  const addStrategy = () => {
    setEditingStrategies([...editingStrategies, { strategyId: '', paramsRaw: '' }]);
  };

  const removeStrategy = (index) => {
    setEditingStrategies(editingStrategies.filter((_, i) => i !== index));
  };

  const updateStrategy = (index, field, value) => {
    setEditingStrategies(editingStrategies.map((s, i) => {
      if (i !== index) return s;
      if (field === 'strategyId') {
        // When strategy type changes, fetch options for the new type
        const opt = strategyOptions.find(o => o.value === value);
        if (opt && opt.multiSelect) {
          const customerCode = activeTab === 'customers' && selectedCustomer ? selectedCustomer.customerCode : null;
          fetchStrategyOptions(value, customerCode);
        }
        return { ...s, strategyId: value, paramsRaw: '' };
      }
      return { ...s, [field]: value };
    }));
  };

  // ===== Save functions =====

  const saveGlobalStrategy = () => {
    // Convert editing format to API format
    const strategies = editingStrategies
      .filter(s => s.strategyId) // Remove empty strategies
      .map(s => ({
        strategyId: s.strategyId,
        params: buildParamsMap(s.strategyId, s.paramsRaw)
      }));

    fetch(`http://localhost:8081/api/v1/flags/${selectedFlag.name}/strategy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strategies, strategyLogic: editingStrategyLogic })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi khi lưu strategy');
      return data;
    })
    .then(updatedFlag => {
      setFlags(flags.map(f => f.name === updatedFlag.name ? { 
        ...f, 
        strategies: updatedFlag.strategies
      } : f));
      closeDrawer();
      showToast('Saved', 'Strategies updated successfully', 'success');
    })
    .catch(err => {
      console.error(err);
      showToast('Error', 'Không thể lưu strategy: ' + err.message, 'error');
    });
  };

  const saveCustomerStrategy = () => {
    const strategies = editingStrategies
      .filter(s => s.strategyId)
      .map(s => ({
        strategyId: s.strategyId,
        params: buildParamsMap(s.strategyId, s.paramsRaw)
      }));

    fetch(`http://localhost:8081/api/v1/flags/customers/${selectedCustomer.customerCode}/features/${selectedFlag.name}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        enabled: selectedFlag.enabled, 
        strategies: strategies.length > 0 ? strategies : [],
        strategyLogic: editingStrategyLogic
      })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save strategy');
      return data;
    })
    .then(updated => {
      setCustomerFlags(prev => {
        const exists = prev.find(f => f.flagName === updated.flagName);
        if (exists) return prev.map(f => f.flagName === updated.flagName ? updated : f);
        return [...prev, updated];
      });
      closeDrawer();
      showToast('Saved', `Strategies updated for ${selectedCustomer.name}`, 'success');
    })
    .catch(err => {
      console.error(err);
      showToast('Error', 'Failed to save strategy: ' + err.message, 'error');
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
            {activeTab === 'flags' && (
              <button className="btn btn-primary" onClick={applyChanges} disabled={applying}>
                {applying ? 'Applying...' : 'Apply'}
              </button>
            )}
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
                <th>STRATEGIES</th>
                <th>PARAMETERS</th>
                <th>STATUS</th>
                <th>RULES</th>
                <th>UPDATED</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="8" style={{textAlign: 'center'}}>Loading...</td></tr>}
              {error && <tr><td colSpan="8" style={{textAlign: 'center', color: 'red'}}>{error}</td></tr>}
              {!loading && !error && flags.map(flag => (
                <tr key={flag.id || flag.name} onClick={() => openDrawer(flag)}>
                  <td>
                    <span className="flag-name">{flag.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}</span>
                    <span className="flag-desc">{flag.description || 'No description provided'}</span>
                  </td>
                  <td><span className="flag-key">{flag.name.toLowerCase()}</span></td>
                  <td>
                    {flag.strategies && flag.strategies.length > 0 ? (
                      <div style={{display: 'flex', flexWrap: 'wrap', gap: '4px'}}>
                        {flag.strategies.map((s, i) => (
                          <span key={i} className="badge badge-release" style={{textTransform: 'none', fontSize: '11px'}}>{getStrategyLabel(s.strategyId)}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="badge" style={{background: '#f3f4f6', color: '#6b7280'}}>None</span>
                    )}
                  </td>
                  <td style={{maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                    {getStrategiesParamsSummary(flag.strategies) ? (
                       <span style={{fontFamily: 'monospace', fontSize: '13px', color: '#4b5563'}} title={getStrategiesParamsSummary(flag.strategies)}>
                         {getStrategiesParamsSummary(flag.strategies)}
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
                  <td><span style={{color: 'var(--primary)', background: '#fff3f2', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 600}}>{flag.strategies && flag.strategies.length > 0 ? `${flag.strategies.length} rule${flag.strategies.length > 1 ? 's' : ''}` : '0 rules'}</span></td>
                  <td style={{color: 'var(--text-muted)', fontSize: '12px'}}>{flag.updatedAt ? new Date(flag.updatedAt).toLocaleString() : new Date().toLocaleString()}</td>
                  <td>
                    <button className="btn btn-outline" style={{padding: '4px 8px', fontSize: '12px'}} onClick={(e) => { e.stopPropagation(); openDrawer(flag); }}>
                      <i className="fa-solid fa-pen" style={{marginRight: '4px'}}></i>Edit
                    </button>
                  </td>
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
                {/* Create/Edit customer form */}
                <div className="rule-card" style={{marginBottom: '24px'}}>
                  <div style={{fontWeight: 700, fontSize: '15px', marginBottom: '14px', color: 'var(--text-primary)'}}>
                    {isEditingCustomer ? '✏️ Edit Customer' : '➕ Add New Customer'}
                  </div>
                  <form onSubmit={handleCreateCustomer} style={{display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end'}}>
                    <div className="form-group" style={{margin: 0, flex: '1 1 150px'}}>
                      <label style={{fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)'}}>Customer Code</label>
                      <input className="form-input" placeholder="e.g. CUST_001" value={newCustomer.customerCode} onChange={e => setNewCustomer({...newCustomer, customerCode: e.target.value})} required disabled={isEditingCustomer} />
                    </div>
                    <div className="form-group" style={{margin: 0, flex: '1 1 150px'}}>
                      <label style={{fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)'}}>Full Name</label>
                      <input className="form-input" placeholder="e.g. Nguyen Van A" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} required />
                    </div>
                    <div className="form-group" style={{margin: 0, flex: '1 1 150px'}}>
                      <label style={{fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)'}}>IP Address</label>
                      <input className="form-input" placeholder="e.g. 192.168.1.10" value={newCustomer.ipAddress} onChange={e => setNewCustomer({...newCustomer, ipAddress: e.target.value})} required />
                    </div>
                    <div className="form-group" style={{margin: 0, flex: '1 1 150px'}}>
                      <label style={{fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)'}}>Service URL (Docker)</label>
                      <input className="form-input" placeholder="http://tracking-order-a:8080" value={newCustomer.serviceUrl} onChange={e => setNewCustomer({...newCustomer, serviceUrl: e.target.value})} required />
                    </div>
                    <div style={{display: 'flex', gap: '8px'}}>
                      <button type="submit" className="btn btn-primary" disabled={creatingCustomer} style={{height: '38px'}}>
                        {creatingCustomer ? 'Saving...' : (isEditingCustomer ? 'Save Changes' : 'Add Customer')}
                      </button>
                      {isEditingCustomer && (
                        <button type="button" className="btn btn-outline" onClick={handleCancelEdit} style={{height: '38px'}}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>
                {/* Customers list */}
                <div className="table-container">
                  <table className="flags-table">
                    <thead><tr><th>CODE</th><th>NAME</th><th>IP ADDRESS</th><th>SERVICE URL</th><th>ACTIONS</th></tr></thead>
                    <tbody>
                      {customersLoading && <tr><td colSpan="4" style={{textAlign: 'center'}}>Loading...</td></tr>}
                      {!customersLoading && customers.map(c => (
                        <tr key={c.id} style={{cursor: 'default'}}>
                          <td><span className="flag-key">{c.customerCode}</span></td>
                          <td><span className="flag-name">{c.name}</span></td>
                          <td><span style={{fontFamily: 'monospace', fontSize: '13px'}}>{c.ipAddress}</span></td>
                          <td><span style={{fontFamily: 'monospace', fontSize: '13px', color: '#3b82f6'}}>{c.serviceUrl || '-'}</span></td>
                          <td>
                            <div style={{display: 'flex', gap: '8px'}}>
                              <button className="btn btn-outline" style={{fontSize: '12px', padding: '4px 12px', color: '#10b981', borderColor: '#10b981'}} onClick={() => handleEditCustomerClick(c)}>
                                <i className="fa-solid fa-pen" style={{marginRight: '6px'}}></i>Edit
                              </button>
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
                      {!customersLoading && customers.length === 0 && <tr><td colSpan="5" style={{textAlign: 'center', padding: '32px', color: 'var(--text-muted)'}}>No customers yet.</td></tr>}
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
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                  <div style={{fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)'}}>Feature Flag Overrides for this Customer</div>
                  <button className="btn btn-primary" onClick={applyToCustomer} disabled={applyingCustomer} style={{fontSize: '13px', padding: '6px 16px'}}>
                    <i className="fa-solid fa-paper-plane" style={{marginRight: '6px'}}></i>
                    {applyingCustomer ? 'Applying...' : `Apply to ${selectedCustomer.name}`}
                  </button>
                </div>
                <div className="table-container">
                  <table className="flags-table">
                    <thead>
                      <tr>
                        <th>FLAG NAME</th>
                        <th>KEY</th>
                        <th>STRATEGIES</th>
                        <th>PARAMETERS</th>
                        <th>STATUS</th>
                        <th>RULES</th>
                        <th>UPDATED</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerFlagsLoading && <tr><td colSpan="8" style={{textAlign: 'center'}}>Loading...</td></tr>}
                      {!customerFlagsLoading && flags.map(flag => {
                        const cflag = customerFlags.find(cf => cf.flagName === flag.name);
                        const isEnabled = cflag ? Boolean(cflag.enabled) : false;
                        const strategies = cflag ? cflag.strategies : [];

                        return (
                          <tr key={flag.name} onClick={() => openCustomerDrawer(flag, cflag)}>
                            <td>
                              <span className="flag-name">{flag.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}</span>
                              <span className="flag-desc">{flag.description || 'No description provided'}</span>
                            </td>
                            <td><span className="flag-key">{flag.name.toLowerCase()}</span></td>
                            <td>
                              {strategies && strategies.length > 0 ? (
                                <div style={{display: 'flex', flexWrap: 'wrap', gap: '4px'}}>
                                  {strategies.map((s, i) => (
                                    <span key={i} className="badge badge-release" style={{textTransform: 'none', fontSize: '11px'}}>{getStrategyLabel(s.strategyId)}</span>
                                  ))}
                                </div>
                              ) : (
                                <span className="badge" style={{background: '#f3f4f6', color: '#6b7280'}}>None</span>
                              )}
                            </td>
                            <td style={{maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                              {getStrategiesParamsSummary(strategies) ? (
                                 <span style={{fontFamily: 'monospace', fontSize: '13px', color: '#4b5563'}} title={getStrategiesParamsSummary(strategies)}>
                                   {getStrategiesParamsSummary(strategies)}
                                 </span>
                              ) : (
                                 <span style={{color: '#9ca3af', fontStyle: 'italic', fontSize: '12px'}}>No params</span>
                              )}
                            </td>
                            <td onClick={(e) => { e.stopPropagation(); toggleCustomerFlagStatus(flag.name, isEnabled); }}>
                              <div className="status-toggle">
                                <label className="switch small">
                                  <input type="checkbox" checked={isEnabled} readOnly />
                                  <span className="slider round"></span>
                                </label>
                                <span style={{fontSize: '13px', color: isEnabled ? 'var(--success)' : 'var(--text-muted)', fontWeight: 500, cursor: 'pointer'}}>
                                  {isEnabled ? 'On' : 'Off'}
                                </span>
                              </div>
                            </td>
                            <td><span style={{color: 'var(--primary)', background: '#fff3f2', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 600}}>{strategies && strategies.length > 0 ? `${strategies.length} rule${strategies.length > 1 ? 's' : ''}` : '0 rules'}</span></td>
                            <td style={{color: 'var(--text-muted)', fontSize: '12px'}}>{cflag?.updatedAt ? new Date(cflag.updatedAt).toLocaleString() : '-'}</td>
                            <td>
                              <button className="btn btn-outline" style={{padding: '4px 8px', fontSize: '12px'}} onClick={(e) => { e.stopPropagation(); openCustomerDrawer(flag, cflag); }}>
                                <i className="fa-solid fa-pen" style={{marginRight: '4px'}}></i>Edit
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{marginTop: '16px', padding: '12px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '13px', color: '#1e40af'}}>
                  <i className="fa-solid fa-circle-info" style={{marginRight: '8px'}}></i>
                  Configure flags and strategies, then click <strong>Apply to {selectedCustomer.name}</strong> to push the snapshot to that company's tracking-order instance.
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

      {/* Drawer — Multi-Strategy Editor */}
      <aside className={`drawer ${drawerOpen ? 'open' : ''}`}>
        {selectedFlag && (
          <>
            <div className="drawer-header">
              <div className="drawer-title">
                {selectedFlag.strategies && selectedFlag.strategies.length > 0 ? (
                  <span className="badge badge-release" style={{textTransform: 'none'}}>{selectedFlag.strategies.length} strateg{selectedFlag.strategies.length > 1 ? 'ies' : 'y'}</span>
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

              <div className="section-title" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <h4>ACTIVATION STRATEGIES</h4>
                  <button className="btn btn-outline" style={{fontSize: '12px', padding: '4px 12px'}} onClick={addStrategy}>
                    <i className="fa-solid fa-plus" style={{marginRight: '4px'}}></i> Add Strategy
                  </button>
              </div>

              <div style={{fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', padding: '8px 12px', background: editingStrategyLogic === 'AND' ? '#fef3c7' : '#f0fdf4', border: `1px solid ${editingStrategyLogic === 'AND' ? '#fde68a' : '#bbf7d0'}`, borderRadius: '6px', transition: 'all 0.3s ease'}}>
                <i className="fa-solid fa-circle-info" style={{marginRight: '6px', color: editingStrategyLogic === 'AND' ? '#d97706' : '#16a34a'}}></i>
                {editingStrategyLogic === 'AND' 
                  ? <>Flag active nếu user thỏa mãn <strong>tất cả</strong> strategies bên dưới.</>
                  : <>Flag active nếu user thỏa mãn <strong>ít nhất 1</strong> strategy bên dưới.</>
                }
              </div>

              <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
                <span style={{fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginRight: '4px'}}>Logic:</span>
                <button 
                  onClick={() => setEditingStrategyLogic('OR')}
                  style={{
                    padding: '4px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                    border: editingStrategyLogic === 'OR' ? '2px solid #16a34a' : '1px solid var(--border-color)',
                    background: editingStrategyLogic === 'OR' ? '#dcfce7' : '#fff',
                    color: editingStrategyLogic === 'OR' ? '#16a34a' : 'var(--text-muted)',
                    transition: 'all 0.2s ease'
                  }}
                >OR</button>
                <button 
                  onClick={() => setEditingStrategyLogic('AND')}
                  style={{
                    padding: '4px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                    border: editingStrategyLogic === 'AND' ? '2px solid #d97706' : '1px solid var(--border-color)',
                    background: editingStrategyLogic === 'AND' ? '#fef3c7' : '#fff',
                    color: editingStrategyLogic === 'AND' ? '#d97706' : 'var(--text-muted)',
                    transition: 'all 0.2s ease'
                  }}
                >AND</button>
                <span style={{fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px'}}>
                  {editingStrategyLogic === 'AND' ? 'User phải thỏa tất cả điều kiện' : 'User chỉ cần thỏa 1 điều kiện'}
                </span>
              </div>

              {editingStrategies.length === 0 && (
                <div className="rule-card" style={{textAlign: 'center', padding: '24px', color: 'var(--text-muted)'}}>
                  <i className="fa-solid fa-layer-group" style={{fontSize: '24px', marginBottom: '8px', display: 'block', opacity: 0.5}}></i>
                  <p style={{fontSize: '13px', margin: 0}}>No strategies configured. Click "Add Strategy" to add one.</p>
                </div>
              )}

              {editingStrategies.map((strategy, index) => {
                const opt = strategyOptions.find(o => o.value === strategy.strategyId);
                return (
                  <div key={index} className="rule-card" style={{marginBottom: '12px', position: 'relative'}}>
                    <button 
                      onClick={() => removeStrategy(index)} 
                      style={{
                        position: 'absolute', top: '8px', right: '8px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--danger)', fontSize: '14px', padding: '4px',
                        borderRadius: '4px', lineHeight: 1
                      }}
                      title="Remove this strategy"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                    <div className="rule-body" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                      <label style={{fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px'}}>
                        Strategy #{index + 1}
                      </label>
                      <select 
                        className="select-serve" 
                        style={{width: '100%', marginBottom: '12px'}}
                        value={strategy.strategyId}
                        onChange={(e) => updateStrategy(index, 'strategyId', e.target.value)}
                      >
                        <option value="">(Select a strategy)</option>
                        {strategyOptions.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>

                      {strategy.strategyId && (
                        <>
                          <label style={{fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px'}}>
                            {opt ? opt.paramLabel : 'Parameter Value'}
                          </label>
                          {strategy.strategyId === 'release-date' ? (
                            <DatePickerParam
                              value={strategy.paramsRaw || ''}
                              onChange={(newDate) => updateStrategy(index, 'paramsRaw', newDate)}
                            />
                          ) : opt && opt.multiSelect ? (
                            (() => {
                              const customerCode = activeTab === 'customers' && selectedCustomer ? selectedCustomer.customerCode : null;
                              const cacheKey = customerCode ? `${strategy.strategyId}__${customerCode}` : strategy.strategyId;
                              const values = strategy.paramsRaw ? strategy.paramsRaw.split(',').map(v => v.trim()).filter(Boolean) : [];
                              return (
                                <MultiSelectParam
                                  strategyType={strategy.strategyId}
                                  selectedValues={values}
                                  onChange={(newVals) => updateStrategy(index, 'paramsRaw', newVals.join(', '))}
                                  placeholder={opt.placeholder}
                                  options={strategyOptionsCache[cacheKey] || []}
                                  loading={loadingOptions[cacheKey] || false}
                                />
                              );
                            })()
                          ) : (
                            <textarea 
                              style={{width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', fontFamily: 'monospace', minHeight: '50px', outline: 'none', resize: 'vertical'}}
                              placeholder={opt ? opt.placeholder : 'Enter value here...'}
                              value={strategy.paramsRaw}
                              onChange={(e) => updateStrategy(index, 'paramsRaw', e.target.value)}
                            ></textarea>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="drawer-footer">
                <button className="btn btn-outline" onClick={() => setEditingStrategies([])}>Clear All</button>
                <div className="drawer-actions">
                    <button className="btn btn-outline" onClick={closeDrawer}>Discard</button>
                    <button className="btn btn-primary" onClick={activeTab === 'customers' ? saveCustomerStrategy : saveGlobalStrategy}>Save Changes</button>
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
