import React from 'react'
import { usePatientContext } from '../../contexts/PatientContext';
import PatientNavbar from '../../patientComponent/PatientNavbar';
import { Link } from 'react-router-dom';

const PatientDashboard = () => {
  const { patient, loading, logout } = usePatientContext();

  if (loading) return <div>Loading...</div>;

  if (!patient) return <div>No patient data available.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <PatientNavbar />
      <main className="lg:pl-64 p-6">
        <div className="flex items-center gap-4">
          {patient.profileImage ? <img src={patient.profileImage} alt="profile" className="w-20 h-20 rounded-full object-cover" /> : <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">P</div>}
          <div>
            <h1 className="text-2xl font-bold">{patient.name}</h1>
            <p className="text-sm text-gray-600">{patient.email}</p>
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={logout} className="px-3 py-1 bg-red-500 text-white rounded">Logout</button>
          </div>
        </div>

        <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold mb-2">Profile</h2>
            <ul className="text-sm text-gray-700 space-y-1">
              <li><strong>Phone:</strong> {patient.phone || '—'}</li>
              <li><strong>Age:</strong> {patient.age ?? '—'}</li>
              <li><strong>Gender:</strong> {patient.gender || '—'}</li>
              <li><strong>Blood Group:</strong> {patient.bloodGroup || '—'}</li>
            </ul>

            <div className="mt-4 space-y-2">
              <Link to="/patient/appointments?type=emergency" className="block text-center px-3 py-2 bg-red-500 text-white rounded">Book Emergency Appointment</Link>
              <div className="flex gap-2 mt-2">
                <Link to="/patient/appointments?type=video" className="flex-1 text-center px-3 py-2 bg-blue-600 text-white rounded">Book Video Call</Link>
                <Link to="/patient/appointments?type=in-person" className="flex-1 text-center px-3 py-2 bg-green-600 text-white rounded">Book In-Person</Link>
              </div>
              <div className="flex gap-2 mt-2">
                <Link to="/patient/chats" className="flex-1 text-center px-3 py-2 border rounded">Chats</Link>
                <Link to="/patient/reviews" className="flex-1 text-center px-3 py-2 border rounded">Reviews</Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white p-4 rounded shadow">
            <h2 className="font-semibold mb-4">Recent Ideas from Doctors</h2>
            <div className="space-y-4">
              {(patient.recentIdeas || []).length === 0 && (
                <div className="text-sm text-gray-500">No recent posts yet. Doctors' shared ideas will appear here.</div>
              )}
              {(patient.recentIdeas || []).map((post, idx) => (
                <div key={idx} className="border rounded p-3">
                  <div className="flex items-start gap-3">
                    <img src={post.doctor?.profileImage || '/assets/noProfile.webp'} alt="doc" className="w-10 h-10 rounded-full object-cover" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{post.doctor?.name || 'Dr. Anonymous'}</div>
                          <div className="text-xs text-gray-500">{post.createdAt ? new Date(post.createdAt).toLocaleString() : 'Recently'}</div>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-700">{post.content}</div>
                      {post.tags?.length > 0 && <div className="mt-2 text-xs text-gray-500">Tags: {post.tags.join(', ')}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default PatientDashboard;