// Employee History Section
// This module handles the display of employee request history (leave and WFH requests)

let currentHistoryMonth = new Date().getMonth() + 1; // Current month (1-12)
let currentHistoryYear = new Date().getFullYear(); // Current year

// Initialize Employee History section
function loadEmployeeHistory() {
  const mainContent = document.getElementById('mainContent');
  if (!mainContent) return;

  mainContent.innerHTML = `
    <div class="employee-history-card">
      <div class="card-header">
        <h2><i class="fas fa-history"></i> Employee History</h2>
        <p>View your submitted requests history</p>
      </div>
      
      <div class="history-filters">
        <div class="filter-group">
          <label for="historyMonth">Month:</label>
          <select id="historyMonth" class="form-control">
            <option value="1">January</option>
            <option value="2">February</option>
            <option value="3">March</option>
            <option value="4">April</option>
            <option value="5">May</option>
            <option value="6">June</option>
            <option value="7">July</option>
            <option value="8">August</option>
            <option value="9">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="historyYear">Year:</label>
          <select id="historyYear" class="form-control">
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="requestTypeFilter">Request Type:</label>
          <select id="requestTypeFilter" class="form-control">
            <option value="all">All Requests</option>
            <option value="leave">Leave Request</option>
            <option value="wfh">WFH Request</option>
          </select>
        </div>
        
        <button id="refreshHistory" class="btn btn-primary">
          <i class="fas fa-sync-alt"></i> Refresh
        </button>
      </div>
      
      <div class="history-table-container">
        <div class="table-responsive">
          <table class="table table-striped history-table">
            <thead>
              <tr>
                <th>Request Type</th>
                <th>Submit Date</th>
                <th>From Date</th>
                <th>To Date</th>
                <th>Duration</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="historyTableBody">
              <tr>
                <td colspan="8" class="text-center">
                  <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i> Loading history...
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="history-stats">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-calendar-check"></i>
          </div>
          <div class="stat-content">
            <h3 id="totalRequests">0</h3>
            <p>Total Requests</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon approved">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="stat-content">
            <h3 id="approvedRequests">0</h3>
            <p>Approved</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon pending">
            <i class="fas fa-clock"></i>
          </div>
          <div class="stat-content">
            <h3 id="pendingRequests">0</h3>
            <p>Pending</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon rejected">
            <i class="fas fa-times-circle"></i>
          </div>
          <div class="stat-content">
            <h3 id="rejectedRequests">0</h3>
            <p>Rejected</p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Set current month and year
  document.getElementById('historyMonth').value = currentHistoryMonth;
  document.getElementById('historyYear').value = currentHistoryYear;

  // Add event listeners
  attachHistoryEventListeners();
  
  // Load initial data
  loadHistoryData();
}

// Attach event listeners for history section
function attachHistoryEventListeners() {
  const monthSelect = document.getElementById('historyMonth');
  const yearSelect = document.getElementById('historyYear');
  const typeFilter = document.getElementById('requestTypeFilter');
  const refreshBtn = document.getElementById('refreshHistory');

  if (monthSelect) {
    monthSelect.addEventListener('change', (e) => {
      currentHistoryMonth = parseInt(e.target.value);
      loadHistoryData();
    });
  }

  if (yearSelect) {
    yearSelect.addEventListener('change', (e) => {
      currentHistoryYear = parseInt(e.target.value);
      loadHistoryData();
    });
  }

  if (typeFilter) {
    typeFilter.addEventListener('change', () => {
      loadHistoryData();
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadHistoryData();
    });
  }
}

// Load history data from backend
async function loadHistoryData() {
  try {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    const requestType = document.getElementById('requestTypeFilter')?.value || 'all';
    
    // Show loading state
    const tbody = document.getElementById('historyTableBody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center">
            <div class="loading-spinner">
              <i class="fas fa-spinner fa-spin"></i> Loading history...
            </div>
          </td>
        </tr>
      `;
    }

    // Fetch leave requests
    let leaveRequests = [];
    if (requestType === 'all' || requestType === 'leave') {
      const leaveResponse = await fetch(`/api/leave-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (leaveResponse.ok) {
        const leaveData = await leaveResponse.json();
        leaveRequests = leaveData.success && Array.isArray(leaveData.leaveRequests) ? leaveData.leaveRequests : [];
      } else {
        console.error('Failed to fetch leave requests:', leaveResponse.status, leaveResponse.statusText);
      }
    }

    // Fetch WFH requests
    let wfhRequests = [];
    if (requestType === 'all' || requestType === 'wfh') {
      const wfhResponse = await fetch(`/api/my-wfh-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (wfhResponse.ok) {
        const wfhData = await wfhResponse.json();
        wfhRequests = wfhData.success && Array.isArray(wfhData.wfhRequests) ? wfhData.wfhRequests : [];
      } else {
        console.error('Failed to fetch WFH requests:', wfhResponse.status, wfhResponse.statusText);
      }
    }

    // Combine and filter requests by month/year
    const allRequests = [...leaveRequests, ...wfhRequests]
      .filter(request => {
        const requestDate = new Date(request.submitDate || request.createdAt);
        const requestMonth = requestDate.getMonth() + 1; // getMonth() returns 0-11
        const requestYear = requestDate.getFullYear();
        return requestMonth === currentHistoryMonth && requestYear === currentHistoryYear;
      })
      .sort((a, b) => new Date(b.submitDate || b.createdAt) - new Date(a.submitDate || a.createdAt));

    // Display requests
    displayHistoryRequests(allRequests);
    
    // Update statistics
    updateHistoryStats(allRequests);

  } catch (error) {
    console.error('Error loading history data:', error);
    const tbody = document.getElementById('historyTableBody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-danger">
            <i class="fas fa-exclamation-triangle"></i> Error loading history data
          </td>
        </tr>
      `;
    }
  }
}

// Display history requests in table
function displayHistoryRequests(requests) {
  const tbody = document.getElementById('historyTableBody');
  if (!tbody) return;

  if (requests.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted">
          <i class="fas fa-inbox"></i> No requests found for the selected period
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = requests.map(request => {
    const isLeaveRequest = request.hasOwnProperty('leaveCount');
    const requestType = isLeaveRequest ? 'Leave Request' : 'WFH Request';
    const duration = isLeaveRequest ? request.leaveCount : request.wfhCount;
    const submitDate = request.submitDate || request.createdAt;
    const fromDate = request.fromDate;
    const toDate = request.toDate;
    const reason = request.reason || 'N/A';
    const status = request.status || 'Pending';
    
    // Format dates
    const formatDate = (dateStr) => {
      if (!dateStr) return 'N/A';
      try {
        return new Date(dateStr).toLocaleDateString('en-GB');
      } catch {
        return dateStr;
      }
    };

    // Status badge styling
    const getStatusBadge = (status) => {
      const statusClass = status.toLowerCase();
      return `<span class="status-badge ${statusClass}">${status}</span>`;
    };

    // Request type icon
    const getRequestTypeIcon = (type) => {
      return type === 'Leave Request' ? 'fas fa-calendar-times' : 'fas fa-home';
    };

    return `
      <tr>
        <td>
          <div class="request-type">
            <i class="${getRequestTypeIcon(requestType)}"></i>
            ${requestType}
          </div>
        </td>
        <td>${formatDate(submitDate)}</td>
        <td>${formatDate(fromDate)}</td>
        <td>${formatDate(toDate)}</td>
        <td>
          <span class="duration-badge">
            ${duration} ${duration === 1 ? 'day' : 'days'}
          </span>
        </td>
        <td>
          <div class="reason-text" title="${reason}">
            ${reason.length > 30 ? reason.substring(0, 30) + '...' : reason}
          </div>
        </td>
        <td>${getStatusBadge(status)}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-outline-primary view-details" 
                    onclick="viewRequestDetails('${request._id}', '${isLeaveRequest ? 'leave' : 'wfh'}')"
                    title="View Details">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Update history statistics
function updateHistoryStats(requests) {
  const total = requests.length;
  const approved = requests.filter(r => r.status === 'Approved').length;
  const pending = requests.filter(r => r.status === 'Pending').length;
  const rejected = requests.filter(r => r.status === 'Rejected').length;

  const totalEl = document.getElementById('totalRequests');
  const approvedEl = document.getElementById('approvedRequests');
  const pendingEl = document.getElementById('pendingRequests');
  const rejectedEl = document.getElementById('rejectedRequests');

  if (totalEl) totalEl.textContent = total;
  if (approvedEl) approvedEl.textContent = approved;
  if (pendingEl) pendingEl.textContent = pending;
  if (rejectedEl) rejectedEl.textContent = rejected;
}

// View request details
function viewRequestDetails(requestId, requestType) {
  // This could open a modal or navigate to a details page
  console.log(`Viewing ${requestType} request:`, requestId);
  // For now, just show an alert with the request ID
  alert(`Viewing ${requestType} request details for ID: ${requestId}`);
}

// Note: Cancel functionality removed as backend doesn't support it yet

// Add CSS styles for the employee history section
function addHistoryStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .employee-history-card {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 15px;
      padding: 25px;
      margin: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .card-header h2 {
      color: #6c5ce7;
      margin-bottom: 8px;
      font-weight: 700;
    }

    .card-header p {
      color: #636e72;
      margin-bottom: 25px;
    }

    .history-filters {
      display: flex;
      gap: 15px;
      margin-bottom: 25px;
      flex-wrap: wrap;
      align-items: end;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      min-width: 120px;
    }

    .filter-group label {
      font-weight: 600;
      color: #2d3436;
      margin-bottom: 5px;
      font-size: 14px;
    }

    .form-control {
      padding: 8px 12px;
      border: 2px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.3s ease;
    }

    .form-control:focus {
      border-color: #6c5ce7;
      outline: none;
      box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.1);
    }

    .btn-primary {
      background: linear-gradient(135deg, #6c5ce7, #a29bfe);
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(108, 92, 231, 0.3);
    }

    .history-table-container {
      margin-bottom: 25px;
    }

    .table-responsive {
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .history-table {
      margin-bottom: 0;
      background: white;
    }

    .history-table thead th {
      background: linear-gradient(135deg, #6c5ce7, #a29bfe);
      color: white;
      font-weight: 600;
      padding: 15px 12px;
      border: none;
      text-align: center;
    }

    .history-table tbody td {
      padding: 12px;
      vertical-align: middle;
      border-color: #f1f2f6;
      color: #764ba2;
    }

    .history-table tbody tr:hover {
      background-color: #f8f9fa;
    }

    .request-type {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #2d3436;
    }

    .request-type i {
      color: #6c5ce7;
    }

    .duration-badge {
      background: linear-gradient(135deg, #00b894, #00cec9);
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .status-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge.approved {
      background: linear-gradient(135deg, #00b894, #00cec9);
      color: white;
    }

    .status-badge.pending {
      background: linear-gradient(135deg, #fdcb6e, #e17055);
      color: white;
    }

    .status-badge.rejected {
      background: linear-gradient(135deg, #e84393, #fd79a8);
      color: white;
    }

    .reason-text {
      max-width: 200px;
      word-wrap: break-word;
    }

    .action-buttons {
      display: flex;
      gap: 5px;
    }

    .btn-sm {
      padding: 4px 8px;
      font-size: 12px;
      border-radius: 6px;
    }

    .btn-outline-primary {
      border-color: #6c5ce7;
      color: #6c5ce7;
    }

    .btn-outline-primary:hover {
      background-color: #6c5ce7;
      color: white;
    }

    .btn-outline-warning {
      border-color: #fdcb6e;
      color: #fdcb6e;
    }

    .btn-outline-warning:hover {
      background-color: #fdcb6e;
      color: white;
    }

    .history-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 25px;
    }

    .stat-card {
      background: linear-gradient(135deg, #f8f9fa, #e9ecef);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 15px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
    }

    .stat-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: white;
    }

    .stat-icon {
      background: linear-gradient(135deg, #6c5ce7, #a29bfe);
    }

    .stat-icon.approved {
      background: linear-gradient(135deg, #00b894, #00cec9);
    }

    .stat-icon.pending {
      background: linear-gradient(135deg, #fdcb6e, #e17055);
    }

    .stat-icon.rejected {
      background: linear-gradient(135deg, #e84393, #fd79a8);
    }

    .stat-content h3 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      color: #2d3436;
    }

    .stat-content p {
      margin: 0;
      color: #636e72;
      font-size: 14px;
    }

    .loading-spinner {
      padding: 20px;
      color: #6c5ce7;
    }

    .text-center {
      text-align: center;
    }

    .text-muted {
      color: #636e72;
    }

    .text-danger {
      color: #e84393;
    }

    @media (max-width: 768px) {
      .history-filters {
        flex-direction: column;
        align-items: stretch;
      }
      
      .filter-group {
        min-width: auto;
      }
      
      .history-stats {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .table-responsive {
        font-size: 14px;
      }
      
      .history-table thead th,
      .history-table tbody td {
        padding: 8px 6px;
      }
    }
  `;
  
  document.head.appendChild(style);
}

// Initialize styles when the module loads
addHistoryStyles();
