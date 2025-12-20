import React from "react";
import PatientNavbar from '../../patientComponent/PatientNavbar';
import { Link } from "react-router-dom";

const sampleChats = [
  { id:1, doctor: "Dr. Asha Rao", last: "Please take rest and monitor BP", time: "2h ago" },
  { id:2, doctor: "Dr. Vikram Singh", last: "Schedule blood tests", time: "1d ago" }
];

export default function PatientChats(){
  return (
    <div className="min-h-screen bg-gray-50">
      <PatientNavbar />
      <main className="lg:pl-64 p-6">
        <h1 className="text-xl font-semibold mb-4">Chats</h1>
        <div className="space-y-3">
          {sampleChats.map(c => (
            <Link key={c.id} to={`/patient/chats/${c.id}`} className="block bg-white p-3 rounded shadow hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.doctor}</div>
                  <div className="text-sm text-gray-500">{c.last}</div>
                </div>
                <div className="text-xs text-gray-400">{c.time}</div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
