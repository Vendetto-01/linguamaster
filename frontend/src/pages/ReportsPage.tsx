import React, { useEffect, useState } from 'react';
import apiClient from '../services/apiClient'; // Assuming apiClient is set up
import type { Report } from '../../../backend/src/types/report.types'; // Adjust path as needed
import './ReportsPage.css'; // We'll create this for styling

const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);
        // Assuming your backend has an endpoint like /api/reports
        // You might need to create this endpoint in your backend (e.g., in backend/src/routes/)
        const response = await apiClient.get('/reports');
        setReports(response.data);
      } catch (err) {
        console.error("Error fetching reports:", err);
        setError('Raporlar yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) {
    return <p>Raporlar yükleniyor...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  if (reports.length === 0) {
    return <p>Gösterilecek rapor bulunmamaktadır.</p>;
  }

  return (
    <div className="reports-container">
      <h2>Gelen Raporlar</h2>
      <div className="table-wrapper">
        <table className="reports-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Sözcük ID</th>
              <th>Kullanıcı ID</th>
              <th>Rapor Nedeni</th>
              <th>Detaylar</th>
              <th>Durum</th>
              <th>AI Kontrolü</th>
              <th>Admin Kontrolü</th>
              <th>Oluşturulma</th>
              <th>Admin Notları</th>
              <th>İşlenme Zamanı</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id.toString()}> {/* Ensure key is string if id is bigint */}
                <td>{report.id.toString()}</td>
                <td>{report.word_id.toString()}</td>
                <td>{report.user_id || 'N/A'}</td>
                <td>{report.report_reason}</td>
                <td>{report.report_details || 'Yok'}</td>
                <td>{report.status}</td>
                <td>{report.ai_check ? 'Evet' : 'Hayır'}</td>
                <td>{report.admin_check ? 'Evet' : 'Hayır'}</td>
                <td>{new Date(report.created_at).toLocaleString()}</td>
                <td>{report.admin_notes || 'Yok'}</td>
                <td>{report.processed_at ? new Date(report.processed_at).toLocaleString() : 'İşlenmedi'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportsPage;