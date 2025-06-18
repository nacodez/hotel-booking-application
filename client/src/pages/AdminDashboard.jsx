import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { adminAPI } from '../services/apiService'

const AdminDashboard = () => {
  const { currentUser, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('pending-users')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // User management state
  const [pendingUsers, setPendingUsers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [userFilters, setUserFilters] = useState({
    status: '',
    role: '',
    search: '',
    page: 1,
    limit: 20
  })

  // Hotel management state
  const [pendingHotels, setPendingHotels] = useState([])
  const [allHotels, setAllHotels] = useState([])
  const [hotelFilters, setHotelFilters] = useState({
    status: '',
    search: '',
    page: 1,
    limit: 20
  })

  // Action modals state
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionData, setActionData] = useState({
    type: '', // 'approve-user', 'reject-user', 'approve-hotel', 'reject-hotel'
    item: null,
    comments: '',
    reason: ''
  })

  useEffect(() => {
    if (!isAdmin()) {
      return
    }
    
    loadDashboardData()
  }, [activeTab])

  const loadDashboardData = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      if (activeTab === 'pending-users') {
        await loadPendingUsers()
      } else if (activeTab === 'all-users') {
        await loadAllUsers()
      } else if (activeTab === 'pending-hotels') {
        await loadPendingHotels()
      } else if (activeTab === 'all-hotels') {
        await loadAllHotels()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const loadPendingUsers = async () => {
    const response = await adminAPI.getPendingUsers()
    setPendingUsers(response.data.users)
  }

  const loadAllUsers = async () => {
    const response = await adminAPI.getAllUsers(userFilters)
    setAllUsers(response.data.users)
  }

  const loadPendingHotels = async () => {
    const response = await adminAPI.getPendingHotels()
    setPendingHotels(response.data.applications)
  }

  const loadAllHotels = async () => {
    const response = await adminAPI.getAllHotels(hotelFilters)
    setAllHotels(response.data.hotels)
  }

  const handleApproveUser = (user) => {
    setActionData({
      type: 'approve-user',
      item: user,
      comments: '',
      reason: ''
    })
    setShowActionModal(true)
  }

  const handleRejectUser = (user) => {
    setActionData({
      type: 'reject-user',
      item: user,
      comments: '',
      reason: ''
    })
    setShowActionModal(true)
  }

  const handleApproveHotel = (hotel) => {
    setActionData({
      type: 'approve-hotel',
      item: hotel,
      comments: '',
      reason: ''
    })
    setShowActionModal(true)
  }

  const handleRejectHotel = (hotel) => {
    setActionData({
      type: 'reject-hotel',
      item: hotel,
      comments: '',
      reason: ''
    })
    setShowActionModal(true)
  }

  const executeAction = async () => {
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const { type, item, comments, reason } = actionData
      
      if (type === 'approve-user') {
        await adminAPI.approveUser(item.id, { comments })
        setSuccess('User approved successfully')
        setPendingUsers(prev => prev.filter(u => u.id !== item.id))
      } else if (type === 'reject-user') {
        await adminAPI.rejectUser(item.id, { reason, comments })
        setSuccess('User rejected successfully')
        setPendingUsers(prev => prev.filter(u => u.id !== item.id))
      } else if (type === 'approve-hotel') {
        await adminAPI.approveHotel(item.id, { comments })
        setSuccess('Hotel approved successfully')
        setPendingHotels(prev => prev.filter(h => h.id !== item.id))
      } else if (type === 'reject-hotel') {
        await adminAPI.rejectHotel(item.id, { reason, comments })
        setSuccess('Hotel rejected successfully')
        setPendingHotels(prev => prev.filter(h => h.id !== item.id))
      }
      
      setShowActionModal(false)
      setActionData({ type: '', item: null, comments: '', reason: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAdmin()) {
    return (
      <div className="admin-dashboard">
        <div className="access-denied">
          <h1>Access Denied</h1>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  const renderTabs = () => (
    <div className="admin-tabs">
      <button 
        className={`tab ${activeTab === 'pending-users' ? 'active' : ''}`}
        onClick={() => setActiveTab('pending-users')}
      >
        Pending Users ({pendingUsers.length})
      </button>
      <button 
        className={`tab ${activeTab === 'all-users' ? 'active' : ''}`}
        onClick={() => setActiveTab('all-users')}
      >
        All Users
      </button>
      <button 
        className={`tab ${activeTab === 'pending-hotels' ? 'active' : ''}`}
        onClick={() => setActiveTab('pending-hotels')}
      >
        Pending Hotels ({pendingHotels.length})
      </button>
      <button 
        className={`tab ${activeTab === 'all-hotels' ? 'active' : ''}`}
        onClick={() => setActiveTab('all-hotels')}
      >
        All Hotels
      </button>
    </div>
  )

  const renderUserCard = (user, showActions = true) => (
    <div key={user.id} className="user-card">
      <div className="user-info">
        <h3>{user.firstName} {user.lastName}</h3>
        <p className="email">{user.email}</p>
        <p className="role">Role: {user.roles?.join(', ') || 'user'}</p>
        <p className="status">Status: <span className={`status-badge ${user.status}`}>{user.status}</span></p>
        
        {user.businessInfo && (
          <div className="business-info">
            <h4>Business Information</h4>
            <p><strong>Business Name:</strong> {user.businessInfo.businessName}</p>
            <p><strong>Business Type:</strong> {user.businessInfo.businessType}</p>
            <p><strong>Business Phone:</strong> {user.businessInfo.businessPhone}</p>
            <p><strong>Business Email:</strong> {user.businessInfo.businessEmail}</p>
            {user.businessInfo.description && (
              <p><strong>Description:</strong> {user.businessInfo.description}</p>
            )}
          </div>
        )}
        
        <p className="registration-date">
          Registered: {new Date(user.registrationDate || user.createdAt).toLocaleDateString()}
        </p>
      </div>
      
      {showActions && user.status === 'pending-approval' && (
        <div className="user-actions">
          <button 
            className="approve-btn"
            onClick={() => handleApproveUser(user)}
          >
            Approve
          </button>
          <button 
            className="reject-btn"
            onClick={() => handleRejectUser(user)}
          >
            Reject
          </button>
        </div>
      )}
    </div>
  )

  const renderHotelCard = (hotel, showActions = true) => (
    <div key={hotel.id} className="hotel-card">
      <div className="hotel-info">
        <h3>{hotel.hotelName}</h3>
        <p className="owner">Owner: {hotel.ownerName} ({hotel.ownerEmail})</p>
        <p className="description">{hotel.description}</p>
        
        <div className="hotel-details">
          <p><strong>Address:</strong> {hotel.address?.street}, {hotel.address?.city}, {hotel.address?.country}</p>
          <p><strong>Phone:</strong> {hotel.contactInfo?.phoneNumber}</p>
          <p><strong>Email:</strong> {hotel.contactInfo?.email}</p>
          <p><strong>Star Rating:</strong> {hotel.starRating} stars</p>
          
          {hotel.amenities && hotel.amenities.length > 0 && (
            <p><strong>Amenities:</strong> {hotel.amenities.join(', ')}</p>
          )}
        </div>
        
        <p className="submission-date">
          Submitted: {new Date(hotel.submittedAt || hotel.createdAt).toLocaleDateString()}
        </p>
      </div>
      
      {showActions && hotel.status === 'pending-review' && (
        <div className="hotel-actions">
          <button 
            className="approve-btn"
            onClick={() => handleApproveHotel(hotel)}
          >
            Approve
          </button>
          <button 
            className="reject-btn"
            onClick={() => handleRejectHotel(hotel)}
          >
            Reject
          </button>
        </div>
      )}
    </div>
  )

  const renderActionModal = () => {
    if (!showActionModal) return null
    
    const isReject = actionData.type.includes('reject')
    const isUser = actionData.type.includes('user')
    
    return (
      <div className="modal-overlay" onClick={() => setShowActionModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h3>
            {isReject ? 'Reject' : 'Approve'} {isUser ? 'User' : 'Hotel'}
          </h3>
          
          <div className="modal-body">
            <p>
              Are you sure you want to {isReject ? 'reject' : 'approve'}{' '}
              {isUser ? 
                `${actionData.item?.firstName} ${actionData.item?.lastName}` : 
                actionData.item?.hotelName
              }?
            </p>
            
            {isReject && (
              <div className="form-group">
                <label htmlFor="reason">Reason for rejection *</label>
                <input
                  type="text"
                  id="reason"
                  value={actionData.reason}
                  onChange={(e) => setActionData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Please provide a reason..."
                  required
                />
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="comments">Comments (optional)</label>
              <textarea
                id="comments"
                value={actionData.comments}
                onChange={(e) => setActionData(prev => ({ ...prev, comments: e.target.value }))}
                placeholder="Additional comments..."
                rows="3"
              />
            </div>
          </div>
          
          <div className="modal-actions">
            <button 
              className="cancel-btn"
              onClick={() => setShowActionModal(false)}
            >
              Cancel
            </button>
            <button 
              className={isReject ? 'reject-btn' : 'approve-btn'}
              onClick={executeAction}
              disabled={isReject && !actionData.reason.trim()}
            >
              {isReject ? 'Reject' : 'Approve'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back, {currentUser?.firstName}! Manage users and hotel applications.</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {renderTabs()}

      <div className="dashboard-content">
        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        ) : (
          <div className="content-area">
            {activeTab === 'pending-users' && (
              <div className="users-section">
                <h2>Pending User Approvals</h2>
                {pendingUsers.length === 0 ? (
                  <div className="empty-state">
                    <p>No pending user approvals</p>
                  </div>
                ) : (
                  <div className="users-grid">
                    {pendingUsers.map(user => renderUserCard(user))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'pending-hotels' && (
              <div className="hotels-section">
                <h2>Pending Hotel Applications</h2>
                {pendingHotels.length === 0 ? (
                  <div className="empty-state">
                    <p>No pending hotel applications</p>
                  </div>
                ) : (
                  <div className="hotels-grid">
                    {pendingHotels.map(hotel => renderHotelCard(hotel))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'all-users' && (
              <div className="users-section">
                <h2>All Users</h2>
                <div className="filters">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userFilters.search}
                    onChange={(e) => setUserFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                  <select
                    value={userFilters.status}
                    onChange={(e) => setUserFilters(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="pending-approval">Pending Approval</option>
                    <option value="suspended">Suspended</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <select
                    value={userFilters.role}
                    onChange={(e) => setUserFilters(prev => ({ ...prev, role: e.target.value }))}
                  >
                    <option value="">All Roles</option>
                    <option value="user">User</option>
                    <option value="hotel-owner">Hotel Owner</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button onClick={loadAllUsers}>Search</button>
                </div>
                <div className="users-grid">
                  {allUsers.map(user => renderUserCard(user, false))}
                </div>
              </div>
            )}

            {activeTab === 'all-hotels' && (
              <div className="hotels-section">
                <h2>All Hotels</h2>
                <div className="filters">
                  <input
                    type="text"
                    placeholder="Search hotels..."
                    value={hotelFilters.search}
                    onChange={(e) => setHotelFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                  <select
                    value={hotelFilters.status}
                    onChange={(e) => setHotelFilters(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending-verification">Pending Verification</option>
                  </select>
                  <button onClick={loadAllHotels}>Search</button>
                </div>
                <div className="hotels-grid">
                  {allHotels.map(hotel => renderHotelCard(hotel, false))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {renderActionModal()}
    </div>
  )
}

export default AdminDashboard