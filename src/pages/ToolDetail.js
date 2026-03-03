

// frontend/src/pages/ToolDetail.js
import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
// Make sure all necessary API functions are imported
import {
    getToolById,
    borrowTool,
    transferTool,
    getLoans,
    returnToolAPI,
    getTechnicians // Ensure getTechnicians is imported if used in TechnicianSelector
} from '../services/api';
import TechnicianSelector from '../components/TechnicianSelector';

const PLACEHOLDER_IMG = 'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">
      <rect width="100%" height="100%" fill="#e5e7eb"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
            font-family="Arial" font-size="24" fill="#6b7280">
        Sin imagen
      </text>
    </svg>
  `);

// Helper function to get status display properties
const getStatusInfo = (status) => {
    const lowerStatus = status ? status.toLowerCase() : 'unknown';
    switch (lowerStatus) {
      case 'available':
        return { text: 'Available', color: 'bg-green-100 text-green-800' };
      case 'borrowed':
        return { text: 'On Loan', color: 'bg-yellow-100 text-yellow-800' };
      case 'maintenance':
        return { text: 'Maintenance', color: 'bg-orange-100 text-orange-700' };
      case 'damaged':
        return { text: 'Damaged', color: 'bg-red-100 text-red-700' };
      default:
        return { text: 'Unknown', color: 'bg-gray-100 text-gray-600' };
    }
  };

// Helper function to format date strings
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Using locale 'en-US' for consistency, adjust if needed
      return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
};
// Helper function to format time strings
const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
        // Using locale 'en-US' for consistency, adjust if needed
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true // Example: 03:00 PM
      });
    } catch (e) {
      return '';
    }
  };

const ToolDetail = () => {
  const { id: toolId } = useParams(); // Renamed for clarity
  const navigate = useNavigate();
  const [tool, setTool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Borrow Form State
  const [showBorrowForm, setShowBorrowForm] = useState(false);
  const [borrowData, setBorrowData] = useState({
    purpose: '',
    vehicle: '',
    loanDuration: '3d', // Default 3 days
    expectedReturn: '' // For custom date
  });
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [borrowError, setBorrowError] = useState('');
  const [borrowSuccess, setBorrowSuccess] = useState('');

  // Transfer Form State
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferData, setTransferData] = useState({
    targetTechnician: '',
    purpose: '',
    vehicle: '',
    loanDuration: '3d',
    expectedReturn: '',
    notes: ''
  });
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');
  const [activeLoan, setActiveLoan] = useState(null); // Store active loan details

  // Get current user info
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  // Fetch tool and potentially active loan details
  const fetchToolAndLoan = useCallback(async () => {
    setLoading(true);
    setError('');
    setActiveLoan(null);
    setTool(null); // Reset tool state on fetch

    try {
      const toolResponse = await getToolById(toolId);
      const currentTool = toolResponse.data;

      if (!currentTool) {
          throw new Error('Tool not found.');
      }

      setTool(currentTool);

      if (currentTool.status === 'borrowed') {
        try {
          // Fetch loans specifically for this tool and active status
          const loansResponse = await getLoans({ tool: toolId, status: 'active' });
          if (loansResponse.success && loansResponse.data && loansResponse.data.length > 0) {
            setActiveLoan(loansResponse.data[0]);
          } else {
             console.warn(`Tool ${toolId} has status 'borrowed' but no active loan found.`);
             // Optional: Consider logic to automatically change tool status back to 'available' if this happens consistently
          }
        } catch (loanErr) {
          console.error('Error fetching active loan details:', loanErr);
          // Decide if this should be a user-facing error or just logged
          // setError('Could not verify loan details.');
        }
      }
    } catch (err) {
      setError(err.message || 'Error loading tool details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [toolId]); // Depend on toolId

  useEffect(() => {
    fetchToolAndLoan();
  }, [fetchToolAndLoan]); // Run fetch function

  // --- Form Handlers ---

  const handleBorrowChange = (e) => {
    const { name, value } = e.target;
    setBorrowData(prev => ({
      ...prev,
      [name]: value,
      expectedReturn: name === 'loanDuration' && value !== 'custom' ? '' : prev.expectedReturn
    }));
  };

  const handleBorrowSubmit = async (e) => {
    e.preventDefault();
    setBorrowLoading(true);
    setBorrowError('');
    setBorrowSuccess('');

    try {
      const payload = {
        tool: toolId,
        purpose: borrowData.purpose,
        vehicle: borrowData.vehicle || undefined,
      };

      if (borrowData.loanDuration === 'custom') {
         if (!borrowData.expectedReturn) {
             throw new Error("Please select a specific return date.");
         }
         // Validate date is not in the past (basic check)
         if (new Date(borrowData.expectedReturn) < new Date().setHours(0,0,0,0) ) {
             throw new Error("Return date cannot be in the past.");
         }
         payload.expectedReturn = borrowData.expectedReturn;
      } else {
        payload.loanDuration = borrowData.loanDuration;
      }

      const response = await borrowTool(payload);

      setBorrowSuccess('Loan requested successfully');
      setShowBorrowForm(false);
      // Refresh tool data to show updated status and loan info
      fetchToolAndLoan();

      // Optional: Redirect after a delay
      // setTimeout(() => {
      //   navigate('/my-tools');
      // }, 1500);

    } catch (err) {
      console.error('Error requesting loan:', err);
      setBorrowError(err.message || 'Error requesting tool loan');
    } finally {
      setBorrowLoading(false);
    }
  };

  const handleTransferChange = (e) => {
    const { name, value } = e.target;
     setTransferData(prev => ({
      ...prev,
      [name]: value,
      expectedReturn: name === 'loanDuration' && value !== 'custom' ? '' : prev.expectedReturn
    }));
  };

  const handleTechnicianSelect = (technicianId) => {
    setTransferData(prev => ({ ...prev, targetTechnician: technicianId }));
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!activeLoan) {
      setTransferError('No active loan found to transfer.');
      return;
    }
    setTransferLoading(true);
    setTransferError('');
    setTransferSuccess('');

    try {
      if (!transferData.targetTechnician) {
        throw new Error('Please select a target technician.');
      }

      const payload = {
        targetTechnician: transferData.targetTechnician,
        purpose: transferData.purpose, // Purpose is now required for transfer as well
        vehicle: transferData.vehicle || undefined,
        notes: transferData.notes || undefined,
      };

      if (transferData.loanDuration === 'custom') {
         if (!transferData.expectedReturn) {
             throw new Error("Please select a specific return date for the transfer.");
         }
          if (new Date(transferData.expectedReturn) < new Date().setHours(0,0,0,0) ) {
             throw new Error("Return date cannot be in the past.");
         }
         payload.expectedReturn = transferData.expectedReturn;
      } else {
        payload.loanDuration = transferData.loanDuration;
      }

      // Assuming transferTool API handles backend logic (updating loan, notifications etc.)
      await transferTool(activeLoan._id, payload);

      setTransferSuccess('Tool transfer initiated/completed successfully.'); // Adjust message based on backend flow
      setShowTransferForm(false);
      // Refresh tool data
       fetchToolAndLoan();

      // Optional: Redirect
      // setTimeout(() => {
      //   navigate('/catalog');
      // }, 1500);

    } catch (err) {
      console.error('Error transferring tool:', err);
      setTransferError(err.message || 'Error transferring tool.');
    } finally {
      setTransferLoading(false);
    }
  };

   const handleDirectReturn = async () => {
    if (!activeLoan) {
      alert("Error: No active loan found for this tool.");
      return;
    }
    // Use English prompts
    if (window.confirm('Confirm tool return?')) {
      const hasDamage = window.confirm('Does the tool have any damage or issues?');
      let damageDescription = '';
      if (hasDamage) {
        damageDescription = prompt('Please briefly describe the damage:', '');
      }

      const returnPayload = {
        returnCondition: {
          hasDamage: hasDamage,
          // Status could be more nuanced, but 'good'/'damaged' is simple
          status: hasDamage ? 'damaged' : 'good',
          damageDescription: damageDescription || (hasDamage ? 'Damage reported without description' : '')
        }
      };

      // Use a loading state to disable button during processing
      setLoading(true); // Use the main loading state or a dedicated return state
      setError('');
      try {
        await returnToolAPI(activeLoan._id, returnPayload);
        alert('Tool returned successfully.'); // English alert
        // Refresh data
        fetchToolAndLoan();
      } catch (err) {
        console.error('Error returning tool:', err);
        setError('Error returning tool: ' + err.message);
        alert('Error returning tool: ' + err.message); // English alert
      } finally {
        setLoading(false);
      }
    }
  };

  // --- Render Logic ---

  if (loading && !tool) { // Show loading only if tool data isn't available yet
    return <Layout><div className="text-center py-10"><p className="text-gray-500">Loading...</p></div></Layout>;
  }

  if (error || !tool) {
    return (
      <Layout>
         {/* Added consistent padding */}
        <div className="p-4 sm:p-6 md:p-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p>{error || 'Tool could not be found.'}</p>
            </div>
            <button className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700" onClick={() => navigate('/catalog')}>
                Back to Catalog
            </button>
        </div>
      </Layout>
    );
  }

  const currentUserHasTool = activeLoan && activeLoan.technician?._id === user?._id;
  const statusInfo = getStatusInfo(tool.status);

  return (
    <Layout>
       {/* Added consistent padding */}
      <div className="p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="mb-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-blue-600 hover:text-blue-800 text-sm">
             &larr; Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{tool.name}</h1>
        </div>

        {/* Main Content Block - Added consistent styling */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="flex flex-col md:flex-row">

            {/* Left Panel: Image & Actions */}
            <div className="w-full md:w-1/3 p-4 md:p-6 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200">
              <div className="w-full rounded-lg overflow-hidden bg-gray-100 mb-4" style={{ aspectRatio: '16 / 9' }}>
                {tool?.image ? (
                  <img
                    src={tool.image}
                    alt={tool.name || 'Tool image'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }}
                  />
                ) : (
                  <img
                    src={PLACEHOLDER_IMG}
                    alt="Sin imagen"
                    className="w-full h-full object-cover opacity-90"
                    loading="lazy"
                  />
                )}
              </div>


              {/* Status and Loan Info */}
              <div className="mb-4">
                 <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 ${statusInfo.color}`}>
                     {statusInfo.text}
                 </span>

                {tool.status === 'borrowed' && activeLoan && (
                  <div className="text-sm mt-1 border-t border-gray-200 pt-2 space-y-1">
                    <p>Loaned to: <strong className="text-gray-800">{activeLoan.technician?.name || 'Unknown'}</strong></p>
                    <p>Since: {formatDate(activeLoan.borrowedAt)}</p>
                    <p>Expected Return: {formatDate(activeLoan.expectedReturn)}</p>
                    {activeLoan.purpose && <p>Purpose: {activeLoan.purpose}</p>}
                    {activeLoan.vehicle && <p>Vehicle: {activeLoan.vehicle}</p>}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {tool.status === 'available' && (
                  <button
                    onClick={() => setShowBorrowForm(true)}
                    className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
                  >
                    Request Loan
                  </button>
                )}

                {tool.status === 'borrowed' && activeLoan && (
                  currentUserHasTool ? (
                    <button
                      onClick={handleDirectReturn}
                      className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
                      disabled={loading} // Disable if main data is loading
                    >
                      {loading ? 'Processing...' : 'Return Tool'}
                    </button>
                  ) : (
                     // If someone else has it, current user can request transfer
                     <button
                        onClick={() => setShowTransferForm(true)} // Assuming modal handles request vs direct transfer
                        className="w-full bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
                     >
                       Request Transfer
                     </button>
                  )
                )}

                 {/* Show Transfer button if the current user has the tool */}
                 {tool.status === 'borrowed' && currentUserHasTool && (
                    <button
                       onClick={() => setShowTransferForm(true)}
                       className="w-full bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
                     >
                       Transfer to Colleague
                     </button>
                 )}

                 {/* Edit Button (Admin Only) */}
                 {isAdmin && (
                    <Link
                        to={`/admin/tools/${tool._id}/edit`}
                        className="block w-full text-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
                    >
                        Edit Tool
                    </Link>
                 )}
              </div>
            </div>

            {/* Right Panel: Details */}
            <div className="w-full md:w-2/3 p-4 md:p-6">
              <h2 className="text-lg font-semibold mb-3 border-b border-gray-200 pb-2 text-gray-800">Tool Details</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 text-sm"> {/* Increased gap-y */}
                <div className="sm:col-span-1">
                  <dt className="font-medium text-gray-500">Category</dt>
                  <dd className="mt-1 text-gray-900">{tool.category || 'N/A'}</dd> {/* Simple display for now */}
                </div>
                 <div className="sm:col-span-1">
                  <dt className="font-medium text-gray-500">Serial Number</dt>
                  <dd className="mt-1 text-gray-900">{tool.serialNumber || 'N/A'}</dd>
                </div>
                 <div className="sm:col-span-1">
                  <dt className="font-medium text-gray-500">Location</dt>
                  <dd className="mt-1 text-gray-900">{tool.location || 'N/A'}</dd>
                </div>
                {/* Display Cost */}
                 <div className="sm:col-span-1">
                   <dt className="font-medium text-gray-500">Cost / Value</dt>
                   <dd className="mt-1 text-gray-900">
                     {tool.cost && tool.cost > 0 ? `$${tool.cost.toFixed(2)}` : 'Not specified'}
                   </dd>
                 </div>
                {tool.lastMaintenance && (
                  <div className="sm:col-span-1">
                    <dt className="font-medium text-gray-500">Last Maintenance</dt>
                    <dd className="mt-1 text-gray-900">{formatDate(tool.lastMaintenance)}</dd>
                  </div>
                )}
                 <div className="sm:col-span-2">
                  <dt className="font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{tool.description || 'No description provided.'}</dd>
                </div>
                 <div className="sm:col-span-2">
                  <dt className="font-medium text-gray-500">Added On</dt>
                  <dd className="mt-1 text-gray-900">{formatDate(tool.createdAt)}</dd>
                </div>
                 {/* TODO: Display addedBy user name if populated */}
              </dl>

              {/* TODO: Loan History Section could go here */}

            </div>
          </div>
        </div>

        {/* --- Modals --- */}

        {/* Borrow Loan Form Modal */}
        {showBorrowForm && tool && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Request Loan: {tool.name}</h2>
              {borrowError && <p className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">{borrowError}</p>}
              {borrowSuccess && <p className="mb-4 text-sm text-green-600 bg-green-50 p-2 rounded">{borrowSuccess}</p>}

              {/* Cost Information */}
              <p className="text-sm text-gray-600 mb-4 border-t pt-3">
                Note: Replacement cost is approximately {tool.cost && tool.cost > 0 ? `$${tool.cost.toFixed(2)}` : 'not specified'}.
              </p>

              <form onSubmit={handleBorrowSubmit} className="space-y-4">
                 <div>
                   <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">Purpose *</label>
                   <textarea id="purpose" name="purpose" value={borrowData.purpose} onChange={handleBorrowChange} required rows="3" className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"></textarea>
                 </div>
                 <div>
                   <label htmlFor="loanDuration" className="block text-sm font-medium text-gray-700">Duration *</label>
                   <select id="loanDuration" name="loanDuration" value={borrowData.loanDuration} onChange={handleBorrowChange} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                     <option value="1h">1 hour</option>
                     <option value="2h">2 hours</option>
                     <option value="4h">4 hours</option>
                     <option value="8h">8 hours (1 shift)</option>
                     <option value="1d">1 day</option>
                     <option value="2d">2 days</option>
                     <option value="3d">3 days</option>
                     <option value="5d">5 days</option>
                     <option value="7d">1 week</option>
                     <option value="custom">Specific Date</option>
                   </select>
                 </div>
                 {borrowData.loanDuration === 'custom' && (
                   <div>
                     <label htmlFor="expectedReturn" className="block text-sm font-medium text-gray-700">Return Date *</label>
                     <input type="date" id="expectedReturn" name="expectedReturn" value={borrowData.expectedReturn} onChange={handleBorrowChange} required min={new Date().toISOString().split('T')[0]} className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"/>
                   </div>
                 )}
                  <div>
                     <label htmlFor="vehicle" className="block text-sm font-medium text-gray-700">Vehicle (Optional)</label>
                     <input type="text" id="vehicle" name="vehicle" value={borrowData.vehicle} onChange={handleBorrowChange} placeholder="Make, Model, Year, Plate..." className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"/>
                  </div>
                 <div className="flex justify-end gap-3 pt-4">
                   <button type="button" onClick={() => setShowBorrowForm(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">Cancel</button>
                   <button type="submit" disabled={borrowLoading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50">{borrowLoading ? 'Requesting...' : 'Confirm Loan'}</button>
                 </div>
              </form>
            </div>
          </div>
        )}

        {/* Transfer Loan Form Modal */}
        {showTransferForm && tool && activeLoan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
             <div className="bg-white rounded-lg p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
               <h2 className="text-xl font-semibold mb-4">Transfer Tool: {tool.name}</h2>
               {transferError && <p className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">{transferError}</p>}
               {transferSuccess && <p className="mb-4 text-sm text-green-600 bg-green-50 p-2 rounded">{transferSuccess}</p>}
               <p className="mb-4 text-sm text-gray-600">
                 {currentUserHasTool ? `Select technician to transfer to:` : `Requesting transfer from ${activeLoan.technician?.name || 'current holder'}. Select new recipient:`}
               </p>
               <form onSubmit={handleTransferSubmit} className="space-y-4">
                   {/* Technician Selector */}
                   <TechnicianSelector
                     onSelect={handleTechnicianSelect}
                     currentTechnicianId={user._id} // Exclude self
                     label="Transfer To *" // English label
                   />
                   {/* Other Transfer fields */}
                   <div>
                     <label htmlFor="transferPurpose" className="block text-sm font-medium text-gray-700">Purpose *</label>
                     <textarea id="transferPurpose" name="purpose" value={transferData.purpose} onChange={handleTransferChange} required rows="2" className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"></textarea>
                   </div>
                   <div>
                    <label htmlFor="transferLoanDuration" className="block text-sm font-medium text-gray-700">New Duration *</label>
                    <select id="transferLoanDuration" name="loanDuration" value={transferData.loanDuration} onChange={handleTransferChange} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                      <option value="1h">1 hour</option>
                      <option value="2h">2 hours</option>
                      <option value="4h">4 hours</option>
                      <option value="8h">8 hours (1 shift)</option>
                      <option value="1d">1 day</option>
                      <option value="2d">2 days</option>
                      <option value="3d">3 days</option>
                      <option value="5d">5 days</option>
                      <option value="7d">1 week</option>
                      <option value="custom">Specific Date</option>
                    </select>
                  </div>
                  {transferData.loanDuration === 'custom' && (
                    <div>
                      <label htmlFor="transferExpectedReturn" className="block text-sm font-medium text-gray-700">New Return Date *</label>
                      <input type="date" id="transferExpectedReturn" name="expectedReturn" value={transferData.expectedReturn} onChange={handleTransferChange} required min={new Date().toISOString().split('T')[0]} className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"/>
                    </div>
                  )}
                   <div>
                      <label htmlFor="transferVehicle" className="block text-sm font-medium text-gray-700">Vehicle (Optional)</label>
                      <input type="text" id="transferVehicle" name="vehicle" value={transferData.vehicle} onChange={handleTransferChange} placeholder="Make, Model, Year, Plate..." className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"/>
                   </div>
                   <div>
                      <label htmlFor="transferNotes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                      <textarea id="transferNotes" name="notes" value={transferData.notes} onChange={handleTransferChange} rows="2" className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"></textarea>
                   </div>
                 <div className="flex justify-end gap-3 pt-4">
                   <button type="button" onClick={() => setShowTransferForm(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">Cancel</button>
                   <button type="submit" disabled={transferLoading} className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50">{transferLoading ? 'Processing...' : 'Confirm Transfer'}</button>
                 </div>
               </form>
             </div>
          </div>
        )}

      </div> {/* End main padding div */}
    </Layout>
  );
};

export default ToolDetail;
