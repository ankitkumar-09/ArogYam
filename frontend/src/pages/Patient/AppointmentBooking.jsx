import React, { useState, useMemo } from "react";
import PatientNavbar from '../../patientComponent/PatientNavbar';
import { useNavigate, useLocation } from "react-router-dom";

const sampleDoctors = [
  { id: 1, name: "Dr. Asha Rao", specialty: "Cardiologist", types: ["in-person","video"], rating: 4.7 },
  { id: 2, name: "Dr. Vikram Singh", specialty: "General Physician", types: ["in-person","video"], rating: 4.5 },
  { id: 3, name: "Dr. Priya Mehta", specialty: "Dermatologist", types: ["video"], rating: 4.2 },
];

const categories = ["General Physician", "Cardiologist", "Dermatologist", "Psychiatrist", "Pediatrician"];

export default function AppointmentBooking() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const preType = params.get('type') || '';

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [apptType, setApptType] = useState(preType || "in-person");

  const results = useMemo(() => {
    return sampleDoctors.filter(d => {
      if (category && d.specialty !== category) return false;
      if (apptType && !d.types.includes(apptType)) return false;
      if (query && !(`${d.name} ${d.specialty}`).toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [query, category, apptType]);

  const book = (doc) => {
    // simple mock: navigate to confirmation or back to dashboard
    alert(`Booked ${apptType} appointment with ${doc.name}`);
    navigate("/patient/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PatientNavbar />
      <main className="lg:pl-64 p-6">
        <h1 className="text-xl font-semibold mb-4">Book Appointment</h1>

        <div className="bg-white p-4 rounded shadow mb-4">
          <div className="flex gap-3 flex-col md:flex-row">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search doctor or problem" className="flex-1 px-3 py-2 border rounded" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 border rounded">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={apptType} onChange={(e) => setApptType(e.target.value)} className="px-3 py-2 border rounded">
              <option value="in-person">In-Person</option>
              <option value="video">Video Call</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4">
          {results.length === 0 && <div className="bg-white p-4 rounded shadow text-gray-500">No doctors match your filters.</div>}
          {results.map(doc => (
            <div key={doc.id} className="bg-white p-4 rounded shadow flex items-center justify-between">
              <div>
                <div className="font-medium">{doc.name} <span className="text-sm text-gray-500">({doc.specialty})</span></div>
                <div className="text-sm text-gray-500">Rating: {doc.rating}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => book(doc)} className="px-3 py-2 bg-blue-600 text-white rounded">Book {apptType === 'video' ? 'Video' : 'In-Person'}</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
