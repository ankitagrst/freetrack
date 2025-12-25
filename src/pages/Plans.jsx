import { useState, useEffect } from 'react'
import { plansAPI } from '../services/api'
import { useOrg } from '../context/OrgContext'
import { formatCurrency } from '../utils/formatters'
import { Check, CreditCard, Plus, Edit, Trash2, Calendar, IndianRupee, TrendingUp, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

const Plans = () => {
  const { selectedOrg } = useOrg()
  const orgType = selectedOrg?.type || 'library'
  const isLibrary = orgType === 'library'

  const getMemberLabel = () => {
    return isLibrary || orgType === 'tution' ? 'Student' : 'Member'
  }

  const getPlanLabel = () => {
    return isLibrary || orgType === 'tution' ? 'Student' : 'Membership'
  }

  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [currentPlan, setCurrentPlan] = useState(null)
  const [formData, setFormData] = useState({
    plan_name: '',
    plan_type: 'monthly',
    duration_days: '',
    price: '',
    description: '',
    is_active: 1
  })

  useEffect(() => {
    if (selectedOrg?.id) {
      fetchPlans()
    }
  }, [selectedOrg])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await plansAPI.getAll({ org_id: selectedOrg.id }).catch(() => ({ success: false, data: [] }))
      let plansList = []
      if (response.success && response.data?.plans) {
        plansList = response.data.plans
      } else if (Array.isArray(response.data)) {
        plansList = response.data
      }
      setPlans(plansList)
    } catch (error) {
      setPlans([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (currentPlan) {
        await plansAPI.update(currentPlan.id, formData)
        toast.success('Plan updated successfully')
      } else {
        await plansAPI.create({ ...formData, org_id: selectedOrg.id })
        toast.success('Plan created successfully')
      }
      fetchPlans()
      closeModal()
    } catch (error) {
      toast.error('Failed to save plan')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this plan?')) return
    try {
      await plansAPI.delete(id)
      toast.success('Plan deleted successfully')
      fetchPlans()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete plan')
    }
  }

  const openModal = (plan = null) => {
    if (plan) {
      setCurrentPlan(plan)
      setFormData({
        plan_name: plan.plan_name,
        plan_type: plan.plan_type || 'monthly',
        duration_days: plan.duration_days,
        price: plan.price,
        description: plan.description || '',
        is_active: plan.is_active || 1
      })
    } else {
      setCurrentPlan(null)
      setFormData({
        plan_name: '',
        plan_type: 'monthly',
        duration_days: '',
        price: '',
        description: '',
        is_active: 1
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setCurrentPlan(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-gray-600 mt-1">Create and manage {getPlanLabel().toLowerCase()} plans for your organization</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="btn btn-primary flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          <span>Create Plan</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 mt-4">Loading plans...</p>
          </div>
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <CreditCard className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Plans Available</h3>
          <p className="text-gray-600 mb-6">Get started by creating your first subscription plan</p>
          <button 
            onClick={() => openModal()} 
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Your First Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const isPopular = index === 0 || plan.is_active == 1
            
            return (
              <div 
                key={plan.id} 
                className={`bg-white rounded-xl shadow-md border-2 hover:shadow-xl transition-all duration-300 overflow-hidden ${
                  isPopular ? 'border-primary' : 'border-gray-200 hover:border-primary'
                }`}
              >
                {/* Header */}
                <div className={`${isPopular ? 'bg-primary' : 'bg-gray-800'} p-6 text-white relative`}>
                  {isPopular && (
                    <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Popular
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={() => openModal(plan)}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-2xl font-bold mb-2">{plan.plan_name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold">{formatCurrency(plan.price)}</span>
                      <span className="text-white/80 text-sm">/{plan.duration_days} days</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                        <Calendar className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="font-medium">{plan.duration_days} days validity</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium capitalize">{plan.plan_type?.replace('_', ' ')} plan</span>
                    </div>
                    
                    {plan.description && (
                      <div className="flex items-start gap-3 text-sm text-gray-600 pt-2 border-t">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{plan.description}</span>
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                      plan.is_active == 1 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${plan.is_active == 1 ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                      {plan.is_active == 1 ? 'Active' : 'Inactive'}
                    </span>
                    
                    {plan.member_count !== undefined && (
                      <span className="text-xs text-gray-500 font-medium">
                        {plan.member_count} {plan.member_count === 1 ? getMemberLabel() : `${getMemberLabel()}s`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed top-0 left-0 right-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn md:bottom-0" style={{ bottom: 'var(--bottom-nav-height, 72px)' }}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                {currentPlan ? 'Edit Plan' : 'Create New Plan'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Plan Name *</label>
                <input
                  type="text"
                  value={formData.plan_name}
                  onChange={(e) => setFormData({...formData, plan_name: e.target.value})}
                  className="input text-base"
                  placeholder="e.g., Premium Monthly"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Plan Type</label>
                  <select
                    value={formData.plan_type}
                    onChange={(e) => setFormData({...formData, plan_type: e.target.value})}
                    className="input text-base"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="half_yearly">Half Yearly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (Days) *</label>
                  <input
                    type="number"
                    value={formData.duration_days}
                    onChange={(e) => setFormData({...formData, duration_days: e.target.value})}
                    className="input text-base"
                    placeholder="30"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Price (₹) *</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="input text-base pl-10"
                    placeholder="500.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="input text-base resize-none"
                  rows="3"
                  placeholder="Describe plan features and benefits..."
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active == 1}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked ? 1 : 0})}
                    className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-900 block">Active Plan</span>
                    <span className="text-xs text-gray-600">Allow {getMemberLabel().toLowerCase()}s to subscribe to this plan</span>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="btn btn-secondary flex-1 text-base"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1 text-base shadow-lg hover:shadow-xl"
                >
                  {currentPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Plans
