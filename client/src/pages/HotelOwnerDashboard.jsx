import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { hotelAPI, roomAPI } from '../services/apiService'

const HotelOwnerDashboard = () => {
  const { currentUser, isHotelOwner } = useAuth()
  const [activeTab, setActiveTab] = useState('applications')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Applications state
  const [applications, setApplications] = useState([])
  const [hotels, setHotels] = useState([])
  const [selectedHotel, setSelectedHotel] = useState(null)
  const [hotelRooms, setHotelRooms] = useState([])

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('') // 'hotel-application', 'room-form'
  const [editingRoom, setEditingRoom] = useState(null)

  // Form state
  const [hotelFormData, setHotelFormData] = useState({
    hotelName: '',
    description: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    },
    contactInfo: {
      phoneNumber: '',
      email: '',
      website: ''
    },
    starRating: 3,
    amenities: [],
    policies: {
      checkIn: '15:00',
      checkOut: '11:00',
      cancellation: 'Free cancellation 24 hours before check-in',
      pets: false,
      smoking: false,
      ageRestriction: 18
    },
    images: [],
    bankingInfo: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      routingNumber: '',
      swiftCode: ''
    }
  })

  const [roomFormData, setRoomFormData] = useState({
    hotelId: '',
    roomNumber: '',
    roomType: 'standard',
    title: '',
    description: '',
    price: '',
    capacity: 2,
    bedType: 'queen',
    bathrooms: 1,
    size: '',
    amenities: [],
    images: [],
    features: [],
    policies: {
      smoking: false,
      pets: false,
      extraBed: false,
      extraBedPrice: 0,
      cancellation: 'Free cancellation 24 hours before check-in',
      checkin: '15:00',
      checkout: '11:00'
    }
  })

  useEffect(() => {
    if (!isHotelOwner()) {
      return
    }
    
    loadDashboardData()
  }, [activeTab])

  const loadDashboardData = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      if (activeTab === 'applications') {
        await loadApplications()
      } else if (activeTab === 'hotels') {
        await loadHotels()
      } else if (activeTab === 'rooms' && selectedHotel) {
        await loadHotelRooms(selectedHotel.id)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const loadApplications = async () => {
    const response = await hotelAPI.getMyHotelApplications()
    setApplications(response.data.applications)
  }

  const loadHotels = async () => {
    const response = await hotelAPI.getMyHotels()
    setHotels(response.data.hotels)
  }

  const loadHotelRooms = async (hotelId) => {
    const response = await hotelAPI.getMyHotelRooms(hotelId)
    setHotelRooms(response.data.rooms)
  }

  const handleHotelFormSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    try {
      await hotelAPI.submitHotelApplication(hotelFormData)
      setSuccess('Hotel application submitted successfully!')
      setShowModal(false)
      await loadApplications()
      
      // Reset form
      setHotelFormData({
        hotelName: '',
        description: '',
        address: { street: '', city: '', state: '', country: '', postalCode: '' },
        contactInfo: { phoneNumber: '', email: '', website: '' },
        starRating: 3,
        amenities: [],
        policies: {
          checkIn: '15:00',
          checkOut: '11:00',
          cancellation: 'Free cancellation 24 hours before check-in',
          pets: false,
          smoking: false,
          ageRestriction: 18
        },
        images: [],
        bankingInfo: {
          accountName: '',
          accountNumber: '',
          bankName: '',
          routingNumber: '',
          swiftCode: ''
        }
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoomFormSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    try {
      if (editingRoom) {
        await roomAPI.updateRoom(editingRoom.id, roomFormData)
        setSuccess('Room updated successfully!')
      } else {
        await roomAPI.createRoom(roomFormData)
        setSuccess('Room created successfully!')
      }
      
      setShowModal(false)
      setEditingRoom(null)
      if (selectedHotel) {
        await loadHotelRooms(selectedHotel.id)
      }
      
      // Reset form
      setRoomFormData({
        hotelId: selectedHotel?.id || '',
        roomNumber: '',
        roomType: 'standard',
        title: '',
        description: '',
        price: '',
        capacity: 2,
        bedType: 'queen',
        bathrooms: 1,
        size: '',
        amenities: [],
        images: [],
        features: [],
        policies: {
          smoking: false,
          pets: false,
          extraBed: false,
          extraBedPrice: 0,
          cancellation: 'Free cancellation 24 hours before check-in',
          checkin: '15:00',
          checkout: '11:00'
        }
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditRoom = (room) => {
    setEditingRoom(room)
    setRoomFormData({
      ...room,
      hotelId: selectedHotel.id
    })
    setModalType('room-form')
    setShowModal(true)
  }

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) {
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      await roomAPI.deleteRoom(roomId)
      setSuccess('Room deleted successfully!')
      if (selectedHotel) {
        await loadHotelRooms(selectedHotel.id)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isHotelOwner()) {
    return (
      <div className="hotel-owner-dashboard">
        <div className="access-denied">
          <h1>Access Denied</h1>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  if (currentUser?.status !== 'active') {
    return (
      <div className="hotel-owner-dashboard">
        <div className="pending-approval">
          <h1>Account Pending Approval</h1>
          <p>Your hotel owner account is currently under review. You will be notified once approved.</p>
          <p><strong>Status:</strong> {currentUser?.status || 'pending-approval'}</p>
        </div>
      </div>
    )
  }

  const renderTabs = () => (
    <div className="dashboard-tabs">
      <button 
        className={`tab ${activeTab === 'applications' ? 'active' : ''}`}
        onClick={() => setActiveTab('applications')}
      >
        Applications ({applications.length})
      </button>
      <button 
        className={`tab ${activeTab === 'hotels' ? 'active' : ''}`}
        onClick={() => setActiveTab('hotels')}
      >
        My Hotels ({hotels.length})
      </button>
      {selectedHotel && (
        <button 
          className={`tab ${activeTab === 'rooms' ? 'active' : ''}`}
          onClick={() => setActiveTab('rooms')}
        >
          Rooms - {selectedHotel.hotelName} ({hotelRooms.length})
        </button>
      )}
    </div>
  )

  const renderApplicationCard = (application) => (
    <div key={application.id} className="application-card">
      <div className="application-info">
        <h3>{application.hotelName}</h3>
        <p className="description">{application.description}</p>
        <p className="address">
          {application.address?.street}, {application.address?.city}, {application.address?.country}
        </p>
        <p className="status">
          Status: <span className={`status-badge ${application.status}`}>{application.status}</span>
        </p>
        <p className="submission-date">
          Submitted: {new Date(application.submittedAt).toLocaleDateString()}
        </p>
        
        {application.rejectionReason && (
          <div className="rejection-reason">
            <h4>Rejection Reason:</h4>
            <p>{application.rejectionReason}</p>
          </div>
        )}
        
        {application.approvalComments && (
          <div className="approval-comments">
            <h4>Comments:</h4>
            <p>{application.approvalComments}</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderHotelCard = (hotel) => (
    <div key={hotel.id} className="hotel-card">
      <div className="hotel-info">
        <h3>{hotel.hotelName}</h3>
        <p className="description">{hotel.description}</p>
        <p className="address">
          {hotel.address?.street}, {hotel.address?.city}, {hotel.address?.country}
        </p>
        <p className="rating">⭐ {hotel.starRating} stars</p>
        <p className="rooms-count">Total Rooms: {hotel.totalRooms}</p>
        <p className="status">
          Status: <span className={`status-badge ${hotel.status}`}>{hotel.status}</span>
        </p>
      </div>
      <div className="hotel-actions">
        <button 
          className="manage-rooms-btn"
          onClick={() => {
            setSelectedHotel(hotel)
            setActiveTab('rooms')
          }}
        >
          Manage Rooms
        </button>
      </div>
    </div>
  )

  const renderRoomCard = (room) => (
    <div key={room.id} className="room-card">
      <div className="room-info">
        <h3>{room.title}</h3>
        <p className="room-number">Room #{room.roomNumber}</p>
        <p className="room-type">{room.roomType} room</p>
        <p className="description">{room.description}</p>
        <p className="price">${room.price}/night</p>
        <p className="capacity">Capacity: {room.capacity} guests</p>
        <p className="status">
          Status: <span className={`status-badge ${room.status}`}>{room.status}</span>
        </p>
      </div>
      <div className="room-actions">
        <button 
          className="edit-btn"
          onClick={() => handleEditRoom(room)}
        >
          Edit
        </button>
        <button 
          className="delete-btn"
          onClick={() => handleDeleteRoom(room.id)}
        >
          Delete
        </button>
      </div>
    </div>
  )

  const renderHotelApplicationModal = () => (
    <div className="modal-overlay" onClick={() => setShowModal(false)}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <h3>Submit Hotel Application</h3>
        <form onSubmit={handleHotelFormSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Hotel Name *</label>
              <input
                type="text"
                value={hotelFormData.hotelName}
                onChange={(e) => setHotelFormData(prev => ({ ...prev, hotelName: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Star Rating</label>
              <select
                value={hotelFormData.starRating}
                onChange={(e) => setHotelFormData(prev => ({ ...prev, starRating: parseInt(e.target.value) }))}
              >
                <option value={1}>1 Star</option>
                <option value={2}>2 Stars</option>
                <option value={3}>3 Stars</option>
                <option value={4}>4 Stars</option>
                <option value={5}>5 Stars</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Description *</label>
            <textarea
              value={hotelFormData.description}
              onChange={(e) => setHotelFormData(prev => ({ ...prev, description: e.target.value }))}
              rows="3"
              required
            />
          </div>
          
          <h4>Address Information</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Street Address *</label>
              <input
                type="text"
                value={hotelFormData.address.street}
                onChange={(e) => setHotelFormData(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, street: e.target.value }
                }))}
                required
              />
            </div>
            <div className="form-group">
              <label>City *</label>
              <input
                type="text"
                value={hotelFormData.address.city}
                onChange={(e) => setHotelFormData(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, city: e.target.value }
                }))}
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>State/Province</label>
              <input
                type="text"
                value={hotelFormData.address.state}
                onChange={(e) => setHotelFormData(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, state: e.target.value }
                }))}
              />
            </div>
            <div className="form-group">
              <label>Country *</label>
              <input
                type="text"
                value={hotelFormData.address.country}
                onChange={(e) => setHotelFormData(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, country: e.target.value }
                }))}
                required
              />
            </div>
          </div>
          
          <h4>Contact Information</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                value={hotelFormData.contactInfo.phoneNumber}
                onChange={(e) => setHotelFormData(prev => ({ 
                  ...prev, 
                  contactInfo: { ...prev.contactInfo, phoneNumber: e.target.value }
                }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={hotelFormData.contactInfo.email}
                onChange={(e) => setHotelFormData(prev => ({ 
                  ...prev, 
                  contactInfo: { ...prev.contactInfo, email: e.target.value }
                }))}
                required
              />
            </div>
          </div>
          
          <h4>Banking Information</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Account Name *</label>
              <input
                type="text"
                value={hotelFormData.bankingInfo.accountName}
                onChange={(e) => setHotelFormData(prev => ({ 
                  ...prev, 
                  bankingInfo: { ...prev.bankingInfo, accountName: e.target.value }
                }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Account Number *</label>
              <input
                type="text"
                value={hotelFormData.bankingInfo.accountNumber}
                onChange={(e) => setHotelFormData(prev => ({ 
                  ...prev, 
                  bankingInfo: { ...prev.bankingInfo, accountNumber: e.target.value }
                }))}
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Bank Name *</label>
              <input
                type="text"
                value={hotelFormData.bankingInfo.bankName}
                onChange={(e) => setHotelFormData(prev => ({ 
                  ...prev, 
                  bankingInfo: { ...prev.bankingInfo, bankName: e.target.value }
                }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Routing Number</label>
              <input
                type="text"
                value={hotelFormData.bankingInfo.routingNumber}
                onChange={(e) => setHotelFormData(prev => ({ 
                  ...prev, 
                  bankingInfo: { ...prev.bankingInfo, routingNumber: e.target.value }
                }))}
              />
            </div>
          </div>
          
          <div className="modal-actions">
            <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  const renderRoomFormModal = () => (
    <div className="modal-overlay" onClick={() => setShowModal(false)}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <h3>{editingRoom ? 'Edit Room' : 'Add New Room'}</h3>
        <form onSubmit={handleRoomFormSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Room Number *</label>
              <input
                type="text"
                value={roomFormData.roomNumber}
                onChange={(e) => setRoomFormData(prev => ({ ...prev, roomNumber: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Room Type</label>
              <select
                value={roomFormData.roomType}
                onChange={(e) => setRoomFormData(prev => ({ ...prev, roomType: e.target.value }))}
              >
                <option value="standard">Standard</option>
                <option value="deluxe">Deluxe</option>
                <option value="suite">Suite</option>
                <option value="executive">Executive</option>
                <option value="presidential">Presidential</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={roomFormData.title}
              onChange={(e) => setRoomFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Description *</label>
            <textarea
              value={roomFormData.description}
              onChange={(e) => setRoomFormData(prev => ({ ...prev, description: e.target.value }))}
              rows="3"
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Price per Night *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={roomFormData.price}
                onChange={(e) => setRoomFormData(prev => ({ ...prev, price: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Capacity *</label>
              <input
                type="number"
                min="1"
                max="10"
                value={roomFormData.capacity}
                onChange={(e) => setRoomFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Bed Type</label>
              <select
                value={roomFormData.bedType}
                onChange={(e) => setRoomFormData(prev => ({ ...prev, bedType: e.target.value }))}
              >
                <option value="single">Single</option>
                <option value="twin">Twin</option>
                <option value="double">Double</option>
                <option value="queen">Queen</option>
                <option value="king">King</option>
              </select>
            </div>
            <div className="form-group">
              <label>Bathrooms</label>
              <input
                type="number"
                min="1"
                max="5"
                value={roomFormData.bathrooms}
                onChange={(e) => setRoomFormData(prev => ({ ...prev, bathrooms: parseInt(e.target.value) }))}
              />
            </div>
          </div>
          
          <div className="modal-actions">
            <button type="button" onClick={() => {
              setShowModal(false)
              setEditingRoom(null)
            }}>
              Cancel
            </button>
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (editingRoom ? 'Update Room' : 'Create Room')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return (
    <div className="hotel-owner-dashboard">
      <div className="dashboard-header">
        <h1>Hotel Owner Dashboard</h1>
        <p>Welcome back, {currentUser?.firstName}! Manage your hotel properties.</p>
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
        {activeTab === 'applications' && (
          <div className="applications-section">
            <div className="section-header">
              <h2>Hotel Applications</h2>
              <button 
                className="primary-btn"
                onClick={() => {
                  setModalType('hotel-application')
                  setShowModal(true)
                }}
              >
                Submit New Application
              </button>
            </div>
            
            {isLoading ? (
              <div className="loading">Loading applications...</div>
            ) : applications.length === 0 ? (
              <div className="empty-state">
                <p>No applications yet. Submit your first hotel application!</p>
              </div>
            ) : (
              <div className="applications-grid">
                {applications.map(renderApplicationCard)}
              </div>
            )}
          </div>
        )}

        {activeTab === 'hotels' && (
          <div className="hotels-section">
            <h2>My Hotels</h2>
            
            {isLoading ? (
              <div className="loading">Loading hotels...</div>
            ) : hotels.length === 0 ? (
              <div className="empty-state">
                <p>No approved hotels yet. Submit a hotel application first!</p>
              </div>
            ) : (
              <div className="hotels-grid">
                {hotels.map(renderHotelCard)}
              </div>
            )}
          </div>
        )}

        {activeTab === 'rooms' && selectedHotel && (
          <div className="rooms-section">
            <div className="section-header">
              <h2>Rooms - {selectedHotel.hotelName}</h2>
              <button 
                className="primary-btn"
                onClick={() => {
                  setModalType('room-form')
                  setRoomFormData(prev => ({ ...prev, hotelId: selectedHotel.id }))
                  setShowModal(true)
                }}
              >
                Add New Room
              </button>
            </div>
            
            {isLoading ? (
              <div className="loading">Loading rooms...</div>
            ) : hotelRooms.length === 0 ? (
              <div className="empty-state">
                <p>No rooms yet. Add your first room!</p>
              </div>
            ) : (
              <div className="rooms-grid">
                {hotelRooms.map(renderRoomCard)}
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && modalType === 'hotel-application' && renderHotelApplicationModal()}
      {showModal && modalType === 'room-form' && renderRoomFormModal()}
    </div>
  )
}

export default HotelOwnerDashboard