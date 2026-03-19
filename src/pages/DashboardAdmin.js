// frontend/src/pages/DashboardAdmin.js
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { getTools, getLoans } from '../services/api';
import {
  HiOutlineWrench,
  HiOutlineCheckCircle,
  HiOutlineArrowPath,
  HiOutlineWrenchScrewdriver,
  HiOutlineExclamationCircle,
  HiOutlineExclamationTriangle,
  HiOutlineUser,
  HiArrowTopRightOnSquare,
} from 'react-icons/hi2';

const DashboardAdmin = () => {
  const [tools, setTools] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState('');
  const [attentionLoans, setAttentionLoans] = useState([]);
  const [loadingAttention, setLoadingAttention] = useState(true);
  const [errorAttention, setErrorAttention] = useState('');
  const ADMIN_ESCALATION_DAYS = 2;

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoadingStats(true);
      setLoadingAttention(true);
      setErrorStats('');
      setErrorAttention('');
      try {
        const results = await Promise.allSettled([
          getTools(),
          getLoans({ status: 'active', severelyOverdueDays: ADMIN_ESCALATION_DAYS }),
        ]);

        if (results[0].status === 'fulfilled' && results[0].value.success) {
          setTools(results[0].value.data || []);
        } else {
          const reason = results[0].status === 'rejected' ? results[0].reason : 'Unknown error';
          setErrorStats(reason?.message || 'Error loading tool statistics.');
        }

        if (results[1].status === 'fulfilled' && results[1].value.success) {
          setAttentionLoans(results[1].value.data || []);
        } else {
          const reason = results[1].status === 'rejected' ? results[1].reason : 'Unknown error';
          setErrorAttention(reason?.message || 'Error loading loans requiring attention.');
        }
      } catch (err) {
        console.error('General error loading dashboard data:', err);
        setErrorStats('General error loading data.');
        setErrorAttention('General error loading data.');
      } finally {
        setLoadingStats(false);
        setLoadingAttention(false);
      }
    };
    fetchDashboardData();
  }, []);

  const total       = tools.length;
  const available   = tools.filter(t => t.status === 'available').length;
  const onLoan      = tools.filter(t => t.status === 'borrowed').length;
  const maintenance = tools.filter(t => t.status === 'maintenance').length;
  const damaged     = tools.filter(t => t.status === 'damaged').length;

  const statCards = [
    {
      label:   'Total Tools',
      value:   total,
      icon:    HiOutlineWrench,
      color:   'bg-slate-700',
      iconBg:  'bg-slate-600',
      to:      null,
    },
    {
      label:   'Available',
      value:   available,
      icon:    HiOutlineCheckCircle,
      color:   'bg-emerald-600',
      iconBg:  'bg-emerald-500',
      to:      '/catalog?status=available',
    },
    {
      label:   'On Loan',
      value:   onLoan,
      icon:    HiOutlineArrowPath,
      color:   'bg-primary-600',
      iconBg:  'bg-primary-500',
      to:      '/admin/borrowed-tools',
    },
    {
      label:   'Maintenance',
      value:   maintenance,
      icon:    HiOutlineWrenchScrewdriver,
      color:   'bg-violet-600',
      iconBg:  'bg-violet-500',
      to:      '/admin/maintenance',
    },
    {
      label:   'Damaged',
      value:   damaged,
      icon:    HiOutlineExclamationCircle,
      color:   'bg-rose-600',
      iconBg:  'bg-rose-500',
      to:      '/admin/maintenance?status=damaged',
    },
  ];

  return (
    <Layout>
      <div className="p-4 sm:p-6 md:p-8">

        {/* ── Page Header ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
          <p className="text-sm text-slate-500">{formattedDate}</p>
        </div>

        {/* Stats error */}
        {errorStats && !loadingStats && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {errorStats}
          </div>
        )}

        {/* ── KPI Cards ── */}
        {loadingStats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-24 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {statCards.map((card) => {
              const Icon = card.icon;
              const CardWrapper = card.to ? Link : 'div';
              const wrapperProps = card.to ? { to: card.to } : {};
              return (
                <CardWrapper
                  key={card.label}
                  {...wrapperProps}
                  className={`
                    ${card.color} text-white rounded-2xl p-5 shadow-md
                    ${card.to ? 'hover:opacity-90 transition-opacity cursor-pointer' : ''}
                  `}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium opacity-90">{card.label}</p>
                    <div className={`${card.iconBg} p-2 rounded-xl`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <p className="text-4xl font-bold">{card.value}</p>
                </CardWrapper>
              );
            })}
          </div>
        )}

        {/* ── Loans Requiring Follow-up ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <HiOutlineExclamationTriangle className="w-5 h-5 text-red-500" />
              Follow-up Required
            </h2>
            {!loadingAttention && attentionLoans.length > 0 && (
              <span className="text-xs font-semibold text-red-700 bg-red-100 border border-red-200 px-2.5 py-1 rounded-full">
                {attentionLoans.length} loan{attentionLoans.length !== 1 ? 's' : ''} {ADMIN_ESCALATION_DAYS}+ days overdue
              </span>
            )}
          </div>

          <div className="p-4">
            {errorAttention && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl mb-3">
                {errorAttention}
              </p>
            )}

            {loadingAttention ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : attentionLoans.length === 0 ? (
              <div className="text-center py-10">
                <HiOutlineCheckCircle className="w-12 h-12 text-green-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No loans require immediate follow-up.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {attentionLoans.map((loan) => {
                  const daysOverdue = Math.max(
                    0,
                    Math.ceil((new Date() - new Date(loan.expectedReturn)) / (1000 * 60 * 60 * 24))
                  );
                  return (
                    <div
                      key={`attention-${loan._id}`}
                      className="flex items-start justify-between gap-3 bg-red-50 border border-red-100 rounded-xl p-4"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <HiOutlineUser className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/tools/${loan.tool?._id}`}
                            className="text-sm font-semibold text-slate-800 hover:text-primary-600 hover:underline"
                          >
                            {loan.tool?.name || 'Deleted Tool'}
                          </Link>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Technician: <span className="font-medium">{loan.technician?.name || 'Unknown'}</span>
                          </p>
                          <p className="text-xs text-red-600 mt-0.5">
                            Due: {formatDate(loan.expectedReturn)}
                            {' · '}
                            <span className="font-semibold">
                              {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue
                            </span>
                          </p>
                        </div>
                      </div>
                      <Link
                        to={`/admin/users/${loan.technician?._id}/edit`}
                        className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex-shrink-0 transition-colors"
                      >
                        <HiArrowTopRightOnSquare className="w-3 h-3" />
                        View Tech
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default DashboardAdmin;
