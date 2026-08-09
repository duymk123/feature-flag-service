document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = 'http://localhost:8081/api/v1/flags';
    const tbody = document.getElementById('flags-table-body');
    const drawer = document.getElementById('flag-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    const closeDrawerBtn = document.getElementById('close-drawer');
    const drawerTitle = document.getElementById('drawer-flag-name');
    const drawerKey = document.getElementById('drawer-flag-key');
    
    // Stats elements
    const totalFlagsEl = document.getElementById('total-flags-count');
    const enabledFlagsEl = document.getElementById('enabled-flags-count');
    const disabledFlagsEl = document.getElementById('disabled-flags-count');

    // Fetch and render flags
    async function loadFlags() {
        try {
            const res = await fetch(API_BASE);
            if (!res.ok) throw new Error('Failed to fetch flags');
            const data = await res.json();
            renderFlags(data);
            updateStats(data);
        } catch (err) {
            console.error('Error loading flags:', err);
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Failed to load data from backend. Ensure Spring Boot is running on port 8081.</td></tr>`;
        }
    }

    function updateStats(flags) {
        totalFlagsEl.textContent = flags.length;
        const enabledCount = flags.filter(f => f.enabled).length;
        enabledFlagsEl.textContent = enabledCount;
        disabledFlagsEl.textContent = flags.length - enabledCount;
    }

    function renderFlags(flags) {
        tbody.innerHTML = '';
        flags.forEach(flag => {
            const tr = document.createElement('tr');
            
            // Randomly mock some missing fields for the "wow" effect (since API only returns name, enabled, desc)
            const types = ['Release', 'Ops', 'Experiment', 'Permission'];
            const randomType = types[Math.floor(Math.random() * types.length)];
            const typeBadge = `badge-${randomType.toLowerCase()}`;
            const ruleCount = Math.floor(Math.random() * 3);
            const defaultServe = Math.random() > 0.5 ? 'true' : 'false';
            const dateStr = flag.updatedAt ? new Date(flag.updatedAt).toLocaleString() : new Date().toLocaleString();

            tr.innerHTML = `
                <td>
                    <span class="flag-name">${formatName(flag.name)}</span>
                    <span class="flag-desc">${flag.description || 'No description provided'}</span>
                </td>
                <td><span class="flag-key">${flag.name.toLowerCase()}</span></td>
                <td><span class="badge ${typeBadge}">${randomType}</span></td>
                <td>
                    <div class="status-toggle">
                        <label class="switch small">
                            <input type="checkbox" ${flag.enabled ? 'checked' : ''} onclick="event.stopPropagation();">
                            <span class="slider round"></span>
                        </label>
                        <span style="font-size: 13px; color: ${flag.enabled ? 'var(--success)' : 'var(--text-muted)'}; font-weight: 500;">
                            ${flag.enabled ? 'On' : 'Off'}
                        </span>
                    </div>
                </td>
                <td>${defaultServe}</td>
                <td><span style="color: var(--primary); background: #fff3f2; padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 600;">${ruleCount} rules</span></td>
                <td style="color: var(--text-muted); font-size: 12px;">${dateStr}</td>
            `;

            tr.addEventListener('click', () => openDrawer(flag, randomType));
            tbody.appendChild(tr);
        });
    }

    function formatName(key) {
        return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }

    function openDrawer(flag, type) {
        drawerTitle.textContent = formatName(flag.name);
        drawerKey.textContent = flag.name.toLowerCase();
        
        // Update drawer badges dynamically based on mock data
        const badgeSpan = document.querySelector('.drawer-title .badge');
        badgeSpan.className = `badge badge-${type.toLowerCase()}`;
        badgeSpan.textContent = type;

        const statusBadge = document.querySelector('.drawer-title .status-badge');
        if (flag.enabled) {
            statusBadge.className = 'status-badge status-enabled';
            statusBadge.innerHTML = '<i class="fa-solid fa-circle"></i> Enabled';
        } else {
            statusBadge.className = 'status-badge';
            statusBadge.style.background = '#f3f4f6';
            statusBadge.style.color = '#6b7280';
            statusBadge.style.borderColor = '#e5e7eb';
            statusBadge.innerHTML = '<i class="fa-solid fa-circle"></i> Disabled';
        }

        drawer.classList.add('open');
        backdrop.classList.add('show');
    }

    function closeDrawer() {
        drawer.classList.remove('open');
        backdrop.classList.remove('show');
    }

    closeDrawerBtn.addEventListener('click', closeDrawer);
    backdrop.addEventListener('click', closeDrawer);

    // Initial load
    loadFlags();
});
