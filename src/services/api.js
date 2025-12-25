import apiClient from '../lib/axios'

// Auth APIs
export const authAPI = {
  login: async (email, password, rememberMe) => {
    const response = await apiClient.post('/auth.php', {
      action: 'login',
      email,
      password,
      rememberMe
    })
    return response.data
  },
  
  register: async (data) => {
    const response = await apiClient.post('/register.php', data)
    return response.data
  },
  
  logout: async () => {
    try {
      await apiClient.post('/auth.php', { action: 'logout' })
    } catch (error) {
      console.error('Logout error:', error)
    }
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  }
}

// Members APIs
export const membersAPI = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/members.php', { params })
    return response.data
  },
  
  getStats: async (params = {}) => {
    const response = await apiClient.get('/members.php?action=stats', { params })
    return response.data
  },

  getOrgInfo: async (params = {}) => {
    const response = await apiClient.get('/members.php?action=organization_info', { params })
    return response.data
  },
  
  getById: async (id) => {
    const response = await apiClient.get('/members.php', { params: { id } })
    return response.data
  },
  
  create: async (data) => {
    const response = await apiClient.post('/members.php', data)
    return response.data
  },
  
  update: async (id, data) => {
    const response = await apiClient.put(`/members.php?id=${id}`, data)
    return response.data
  },
  
  renewMembership: async (memberId, planId, options = {}) => {
    const response = await apiClient.post('/members.php', {
      action: 'renew',
      member_id: memberId,
      plan_id: planId,
      ...options
    })
    return response.data
  },
  
  delete: async (id) => {
    const response = await apiClient.delete('/members.php', { data: { id } })
    return response.data
  }
}

// Payments APIs
export const paymentsAPI = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/payments.php', { params })
    return response.data
  },
  
  getStats: async (params = {}) => {
    const response = await apiClient.get('/payments.php?action=stats', { params })
    return response.data
  },
  
  getMonthlyStats: async (params = {}) => {
    const response = await apiClient.get('/payments.php?action=monthly_stats', { params })
    return response.data
  },
  
  create: async (data) => {
    const response = await apiClient.post('/payments.php', data)
    return response.data
  },
  
  update: async (id, data) => {
    const response = await apiClient.put(`/payments.php?id=${id}`, data)
    return response.data
  },
  
  delete: async (id) => {
    const response = await apiClient.delete(`/payments.php?id=${id}`)
    return response.data
  }
}

// Attendance APIs
export const attendanceAPI = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/attendance.php', { params })
    return response.data
  },
  
  getToday: async () => {
    const response = await apiClient.get('/attendance.php?action=today')
    return response.data
  },
  
  getStats: async (params = {}) => {
    const response = await apiClient.get('/attendance.php?action=stats', { params })
    return response.data
  },
  
  getMemberAttendance: async (memberId, params = {}) => {
    const response = await apiClient.get(`/attendance.php?member_id=${memberId}`, { params })
    return response.data
  },
  
  mark: async (data) => {
    const response = await apiClient.post('/attendance.php', { action: 'mark', ...data })
    return response.data
  },
  
  update: async (id, data) => {
    const response = await apiClient.put(`/attendance.php?id=${id}`, data)
    return response.data
  },
  
  delete: async (id) => {
    const response = await apiClient.delete(`/attendance.php?id=${id}`)
    return response.data
  }
}

// Expenses APIs
export const expensesAPI = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/expenses.php', { params })
    return response.data
  },
  
  getStats: async (params = {}) => {
    const response = await apiClient.get('/expenses.php?action=stats', { params })
    return response.data
  },
  
  create: async (data) => {
    const response = await apiClient.post('/expenses.php', data)
    return response.data
  },
  
  update: async (id, data) => {
    const response = await apiClient.put(`/expenses.php?id=${id}`, data)
    return response.data
  },
  
  delete: async (id) => {
    const response = await apiClient.delete(`/expenses.php?id=${id}`)
    return response.data
  }
}

// SMS APIs
export const smsAPI = {
  getHistory: async (params = {}) => {
    const response = await apiClient.get('/sms.php?action=history', { params })
    return response.data
  },
  
  send: async (data) => {
    const response = await apiClient.post('/sms.php', data)
    return response.data
  },
  
  sendBulk: async (data) => {
    const response = await apiClient.post('/sms.php?action=bulk', data)
    return response.data
  },
  
  getTemplates: async () => {
    const response = await apiClient.get('/sms.php?action=templates')
    return response.data
  },
  
  createTemplate: async (data) => {
    const response = await apiClient.post('/sms.php?action=templates', data)
    return response.data
  }
}

// Notices APIs
export const noticesAPI = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/notices.php', { params })
    return response.data
  },
  
  create: async (data) => {
    const response = await apiClient.post('/notices.php', data)
    return response.data
  },
  
  update: async (id, data) => {
    const response = await apiClient.put('/notices.php', { ...data, id })
    return response.data
  },
  
  delete: async (id) => {
    const response = await apiClient.delete(`/notices.php?id=${id}`)
    return response.data
  }
}

// Enquiries APIs
export const enquiriesAPI = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/enquiries.php', { params })
    return response.data
  },
  
  getStats: async (params = {}) => {
    const response = await apiClient.get('/enquiries.php?action=stats', { params })
    return response.data
  },
  
  create: async (data) => {
    const response = await apiClient.post('/enquiries.php', data)
    return response.data
  },
  
  update: async (id, data) => {
    const response = await apiClient.put('/enquiries.php', { id, ...data })
    return response.data
  },
  
  delete: async (id) => {
    const response = await apiClient.delete('/enquiries.php', { data: { id } })
    return response.data
  },
  
  reply: async (id, data) => {
    const response = await apiClient.put(`/enquiries.php?id=${id}`, data)
    return response.data
  }
}

// Seats APIs
export const seatsAPI = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/seats.php', { params })
    return response.data
  },
  
  getStats: async (params = {}) => {
    const response = await apiClient.get('/seats.php?action=stats', { params })
    return response.data
  },
  
  create: async (data) => {
    // Backend expects: floor, seat_prefix, start_number, number_of_seats
    const response = await apiClient.post('/seats.php', {
      floor: data.floor || 'Ground Floor',
      seat_prefix: data.prefix || 'S',
      start_number: data.start || 1,
      number_of_seats: data.count || 1
    })
    return response.data
  },
  
  allocate: async (seatId, data) => {
    // Allocation happens by updating the member's seat_id
    // We need to update the member record with the seat_id
    const response = await apiClient.put('/members.php', { 
      id: data.member_id,
      seat_id: seatId
    })
    return response.data
  },
  
  deallocate: async (seatId) => {
    const response = await apiClient.delete(`/seats.php?seatId=${seatId}`)
    return response.data
  },
  
  delete: async (seatId) => {
    // Use proper DELETE method with id in query parameter
    const response = await apiClient.delete(`/seats.php?id=${seatId}`)
    return response.data
  },

  deleteBulk: async (seatIds) => {
    const response = await apiClient.delete('/seats.php', { data: { ids: seatIds } })
    return response.data
  }
}

// Reports APIs
export const reportsAPI = {
  getPayments: async (params = {}) => {
    const response = await apiClient.get('/reports.php?type=payments', { params })
    return response.data
  },
  
  getMembers: async (params = {}) => {
    const response = await apiClient.get('/reports.php?type=members', { params })
    return response.data
  },
  
  getAttendance: async (params = {}) => {
    const response = await apiClient.get('/reports.php?type=attendance', { params })
    return response.data
  },
  
  getRevenue: async (params = {}) => {
    const response = await apiClient.get('/reports.php?type=revenue', { params })
    return response.data
  }
}

// Settings APIs
export const settingsAPI = {
  get: async (params = {}) => {
    const response = await apiClient.get('/settings.php', { params })
    return response.data
  },
  
  update: async (data) => {
    const response = await apiClient.put('/settings.php', data)
    return response.data
  },
  
  updateSMS: async (data) => {
    const response = await apiClient.put('/settings.php?type=sms', data)
    return response.data
  },
  
  updateEmail: async (data) => {
    const response = await apiClient.put('/settings.php?type=email', data)
    return response.data
  }
}

// Plans APIs
export const plansAPI = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/plans.php', { params })
    return response.data
  },
  
  getStats: async (params = {}) => {
    const response = await apiClient.get('/plans.php?action=stats', { params })
    return response.data
  },
  
  create: async (data) => {
    const response = await apiClient.post('/plans.php', data)
    return response.data
  },
  
  update: async (id, data) => {
    const response = await apiClient.put('/plans.php', { id, ...data })
    return response.data
  },
  
  delete: async (id) => {
    const response = await apiClient.delete('/plans.php', { data: { id } })
    return response.data
  },
  
  getPublic: async () => {
    const response = await apiClient.get('/public-plans.php')
    return response.data
  }
}

// Admin APIs
export const adminAPI = {
  getStats: async () => {
    const response = await apiClient.get('/admin.php?action=stats')
    return response.data
  },

  getOrganizations: async (params = {}) => {
    const response = await apiClient.get('/admin.php?action=organizations', { params })
    return response.data
  },

  getOrganizationById: async (id) => {
    const response = await apiClient.get(`/admin.php?id=${id}`)
    return response.data
  },

  createOrganization: async (data) => {
    const response = await apiClient.post('/admin.php?action=create-organization', data)
    return response.data
  },

  updateOrganization: async (data) => {
    const response = await apiClient.put('/admin.php?action=update-organization', data)
    return response.data
  },

  updateSubscription: async (data) => {
    const response = await apiClient.put('/admin.php?action=update-subscription', data)
    return response.data
  },

  updateStatus: async (data) => {
    const response = await apiClient.put('/admin.php?action=update-status', data)
    return response.data
  },

  deleteOrganization: async (id) => {
    const response = await apiClient.delete(`/admin.php?id=${id}`)
    return response.data
  },

  getExpiringOrganizations: async () => {
    const response = await apiClient.get('/admin.php?action=expiring-organizations')
    return response.data
  }
}

// Subscription Plans APIs (System Admin)
export const subscriptionPlansAPI = {
  getAll: async () => {
    const response = await apiClient.get('/subscription_plans.php')
    return response.data
  },

  create: async (data) => {
    const response = await apiClient.post('/subscription_plans.php', data)
    return response.data
  },

  update: async (id, data) => {
    const response = await apiClient.put('/subscription_plans.php', { id, ...data })
    return response.data
  },

  delete: async (id) => {
    const response = await apiClient.delete('/subscription_plans.php', { data: { id } })
    return response.data
  }
}

// Waiting List APIs
export const waitingListAPI = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/waiting_list.php', { params })
    return response.data
  },

  getById: async (id) => {
    const response = await apiClient.get(`/waiting_list.php?id=${id}`)
    return response.data
  },

  create: async (data) => {
    const response = await apiClient.post('/waiting_list.php', data)
    return response.data
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/waiting_list.php?id=${id}`, data)
    return response.data
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/waiting_list.php?id=${id}`)
    return response.data
  }
}

// Organizations APIs
export const orgsAPI = {
  getAll: async () => {
    const response = await apiClient.get('/organizations.php')
    return response.data
  },
  
  getById: async (id) => {
    const response = await apiClient.get(`/organizations.php?id=${id}`)
    return response.data
  },
  
  create: async (data) => {
    const response = await apiClient.post('/organizations.php', data)
    return response.data
  },
  
  update: async (id, data) => {
    const response = await apiClient.put(`/organizations.php?id=${id}`, data)
    return response.data
  },
  
  delete: async (id) => {
    const response = await apiClient.delete(`/organizations.php?id=${id}`)
    return response.data
  }
}
