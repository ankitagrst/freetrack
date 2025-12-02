import { useState } from 'react'
import { format } from 'date-fns'
import { X, Printer, Download } from 'lucide-react'

const InvoiceGenerator = ({ member, payment, onClose }) => {
  const [printing, setPrinting] = useState(false)

  const handlePrint = () => {
    setPrinting(true)
    window.print()
    setTimeout(() => setPrinting(false), 1000)
  }

  const libraryInfo = {
    name: 'FeeTrack Library',
    address: '123 Library Street, City',
    phone: '+91 1234567890',
    email: 'info@feetrack.com'
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 md:bottom-0" style={{ bottom: 'var(--bottom-nav-height, 72px)' }}>
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[95vh] overflow-y-auto">
        {/* Print Header - Hidden on screen */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-area, .print-area * {
              visibility: visible;
            }
            .print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        {/* Action Buttons - Not printed */}
        <div className="no-print flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">Invoice / Receipt</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn btn-primary flex items-center gap-2"
              disabled={printing}
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Content - This gets printed */}
        <div className="print-area p-8">
          {/* Header */}
          <div className="border-b-2 border-gray-300 pb-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{libraryInfo.name}</h1>
                <p className="text-sm text-gray-600 mt-2">{libraryInfo.address}</p>
                <p className="text-sm text-gray-600">Phone: {libraryInfo.phone}</p>
                <p className="text-sm text-gray-600">Email: {libraryInfo.email}</p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-primary">INVOICE</h2>
                <p className="text-sm text-gray-600 mt-2">
                  Date: {format(new Date(), 'dd MMM, yyyy')}
                </p>
                {payment && (
                  <p className="text-sm text-gray-600">
                    Invoice #: INV-{payment.id || '000'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Bill To:</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-900 text-lg">{member.full_name || member.name}</p>
              <p className="text-sm text-gray-600 mt-1">Member ID: {member.member_code || 'N/A'}</p>
              <p className="text-sm text-gray-600">Email: {member.email}</p>
              <p className="text-sm text-gray-600">Phone: {member.phone}</p>
              {member.address && (
                <p className="text-sm text-gray-600">
                  Address: {member.address}
                  {member.city && `, ${member.city}`}
                  {member.state && `, ${member.state}`}
                  {member.pincode && ` - ${member.pincode}`}
                </p>
              )}
            </div>
          </div>

          {/* Invoice Details Table */}
          <div className="mb-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="border border-gray-900 p-3 text-left">Description</th>
                  <th className="border border-gray-900 p-3 text-center">Plan</th>
                  <th className="border border-gray-900 p-3 text-center">Seat</th>
                  <th className="border border-gray-900 p-3 text-center">Start Date</th>
                  <th className="border border-gray-900 p-3 text-center">End Date</th>
                  <th className="border border-gray-900 p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-3">
                    <span className="font-semibold">
                      {payment?.payment_type === 'renewal' ? 'Membership Renewal' : 'Membership Fee'}
                    </span>
                    <br />
                    <span className="text-xs text-gray-500">
                      {payment?.notes || 'Library membership subscription'}
                    </span>
                  </td>
                  <td className="border border-gray-300 p-3 text-center">
                    {member.plan_name || 'Full Time'}
                  </td>
                  <td className="border border-gray-300 p-3 text-center">
                    {member.seat_number || 'Not Assigned'}
                  </td>
                  <td className="border border-gray-300 p-3 text-center">
                    {member.plan_start_date 
                      ? format(new Date(member.plan_start_date), 'dd MMM, yyyy')
                      : 'N/A'}
                  </td>
                  <td className="border border-gray-300 p-3 text-center">
                    {member.plan_end_date 
                      ? format(new Date(member.plan_end_date), 'dd MMM, yyyy')
                      : 'N/A'}
                  </td>
                  <td className="border border-gray-300 p-3 text-right font-semibold">
                    ₹{(payment?.amount || member.plan_price || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="flex justify-between py-2 border-b border-gray-300">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">
                  ₹{(payment?.amount || member.plan_price || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-300">
                <span className="text-gray-600">Tax (0%):</span>
                <span className="font-semibold">₹0.00</span>
              </div>
              <div className="flex justify-between py-3 bg-gray-900 text-white px-4 rounded mt-2">
                <span className="text-lg font-bold">Total:</span>
                <span className="text-lg font-bold">
                  ₹{(payment?.amount || member.plan_price || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          {payment && (
            <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-bold text-green-900 mb-2">Payment Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="ml-2 font-semibold capitalize">{payment.payment_method || 'Cash'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Payment Date:</span>
                  <span className="ml-2 font-semibold">
                    {payment.payment_date 
                      ? format(new Date(payment.payment_date), 'dd MMM, yyyy')
                      : format(new Date(), 'dd MMM, yyyy')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className="ml-2 font-semibold text-green-600 capitalize">
                    {payment.status || 'Paid'}
                  </span>
                </div>
                {payment.transaction_id && (
                  <div>
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="ml-2 font-semibold">{payment.transaction_id}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t-2 border-gray-300 pt-6 mt-8">
            <p className="text-sm text-gray-600 text-center">
              Thank you for your business! For any queries, please contact us at {libraryInfo.phone}
            </p>
            <p className="text-xs text-gray-500 text-center mt-2">
              This is a computer-generated invoice and does not require a signature.
            </p>
          </div>

          {/* Stamp/Seal Area */}
          <div className="mt-12 flex justify-between items-end">
            <div className="text-center">
              <div className="border-t-2 border-gray-400 pt-2 w-48">
                <p className="text-sm text-gray-600">Authorized Signature</p>
              </div>
            </div>
            <div className="w-32 h-32 border-2 border-gray-300 rounded-full flex items-center justify-center">
              <p className="text-xs text-gray-400 text-center">Library<br/>Seal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvoiceGenerator
