// frontend/src/pages/AdminReports.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getLateReturnsReport, getDamagedReturnsReport } from '../services/api';
import { Link } from 'react-router-dom'; // For potential links

const AdminReports = () => {
  // State for Late Returns Report
  const [lateReturnData, setLateReturnData] = useState([]);
  const [loadingLateReport, setLoadingLateReport] = useState(true);
  const [errorLateReport, setErrorLateReport] = useState('');

  // State for Damaged Returns Report
  const [damageReportData, setDamageReportData] = useState([]);
  const [loadingDamageReport, setLoadingDamageReport] = useState(true);
  const [errorDamageReport, setErrorDamageReport] = useState('');

  // Fetch data on component mount
  useEffect(() => {
    const fetchReports = async () => {
      // Reset states
      setLoadingLateReport(true);
      setErrorLateReport('');
      setLoadingDamageReport(true);
      setErrorDamageReport('');

      try {
        // Fetch both reports concurrently
        const [lateRes, damageRes] = await Promise.allSettled([
          getLateReturnsReport(),
          getDamagedReturnsReport()
        ]);

        // Process Late Returns result
        if (lateRes.status === 'fulfilled' && lateRes.value.success) {
          setLateReturnData(lateRes.value.data || []);
        } else {
          setErrorLateReport(lateRes.reason?.message || 'Error loading late returns report');
          console.error("Error loading late returns:", lateRes.reason);
        }

        // Process Damaged Returns result
        if (damageRes.status === 'fulfilled' && damageRes.value.success) {
          setDamageReportData(damageRes.value.data || []);
        } else {
          setErrorDamageReport(damageRes.reason?.message || 'Error loading damaged returns report');
           console.error("Error loading damaged returns:", damageRes.reason);
        }

      } catch (error) {
        // Catch errors not caught by Promise.allSettled (less likely)
        console.error("General error fetching reports:", error);
        setErrorLateReport("Failed to load reports.");
        setErrorDamageReport("Failed to load reports.");
      } finally {
        setLoadingLateReport(false);
        setLoadingDamageReport(false);
      }
    };

    fetchReports();
  }, []); // Empty dependency array means run once on mount

  // Helper function to render a report table
  const renderReportTable = (title, data, loading, error, countField, countLabel) => {
    return (
      <div className="bg-white rounded-xl shadow p-4 md:p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
        {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
        {loading ? (
           <p className="text-gray-500 italic">Loading report...</p>
        ) : data.length === 0 ? (
          <p className="text-gray-500 italic">No data available for this report.</p>
        ) : (
          <div className="overflow-x-auto max-h-96"> {/* Scrollable table */}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Technician</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{countLabel}</th>
                  {/* Future columns could go here */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item) => (
                  <tr key={item.technicianId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.technicianName}
                       {/* Link to user edit page */}
                       <Link to={`/admin/users/${item.technicianId}/edit`} className="text-blue-500 hover:text-blue-700 ml-2 text-xs">(Edit)</Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item[countField]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };


  return (
    <Layout>
      <div className="p-4 sm:p-6 md:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Reports</h1>

        {/* Late Returns Report Table */}
        {renderReportTable(
          'Late Returns by Technician',
          lateReturnData,
          loadingLateReport,
          errorLateReport,
          'lateCount', // Field name from backend aggregation
          '# Late Returns' // Table header label
        )}

        {/* Damaged Returns Report Table */}
        {renderReportTable(
          'Damaged Returns by Technician',
          damageReportData,
          loadingDamageReport,
          errorDamageReport,
          'damagedCount', // Field name from backend aggregation
          '# Damaged Returns' // Table header label
        )}

      </div>
    </Layout>
  );
};

export default AdminReports;